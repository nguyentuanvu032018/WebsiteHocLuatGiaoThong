const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { 
  createOtp, 
  verifyOtp, 
  deleteOtp,
  createRegisterOtp,
  verifyRegisterOtp,
  deleteRegisterOtp
} = require('../utils/otpStore');
const { sendOtpEmail, sendRegisterOtpEmail } = require('../utils/email.service');
const {
  checkLoginLock,
  recordFailedAttempt,
  clearFailedAttempts
} = require('../utils/loginAttemptStore');
const { getJwtSecret, JWT_EXPIRES_IN } = require('../config/jwt.config');
const { deleteAvatarFile } = require('../utils/fileCleanup');

/**
 * Lớp Dịch vụ Xác thực & Người dùng (Auth Service Class)
 * Chịu trách nhiệm xử lý toàn bộ logic nghiệp vụ về tài khoản, mã hóa và token
 */
class AuthService {
  /**
   * Sinh mã JWT Token cho đối tượng người dùng
   * @param {Object} user 
   * @returns {string} token
   */
  generateToken(user) {
    return jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        tokenVersion: user.tokenVersion ?? 1
      },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );
  }

  /**
   * Bước 1: Gửi mã OTP xác nhận đăng ký tài khoản tới email
   * @param {Object} param0 
   * @returns {Promise<{ message: string }>}
   */
  async sendRegisterOtp({ fullName, email, password, phone, avatar = null }) {
    // 1. Kiểm tra dữ liệu đầu vào bắt buộc
    if (!fullName || !fullName.trim()) {
      throw { statusCode: 400, message: 'Vui lòng nhập họ và tên của bạn' };
    }
    if (!email || !email.trim()) {
      throw { statusCode: 400, message: 'Vui lòng cung cấp địa chỉ email' };
    }
    if (!password) {
      throw { statusCode: 400, message: 'Vui lòng nhập mật khẩu' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 2. Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      throw { statusCode: 400, message: 'Định dạng email không hợp lệ' };
    }

    // 3. Kiểm tra độ dài mật khẩu tối thiểu
    if (password.length < 6) {
      throw { statusCode: 400, message: 'Mật khẩu phải chứa ít nhất 6 ký tự' };
    }

    // 4. Kiểm tra email đã tồn tại hay chưa thông qua UserModel
    const isExisted = await UserModel.existsByEmail(normalizedEmail);
    if (isExisted) {
      throw { statusCode: 409, message: 'Email này đã được đăng ký trong hệ thống. Vui lòng đăng nhập hoặc sử dụng email khác.' };
    }

    // 5. Băm mật khẩu bằng bcrypt trước khi lưu tạm
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // 6. Tạo OTP 6 chữ số và lưu tạm thông tin đăng ký (hiệu lực 3 phút)
    const otp = createRegisterOtp(normalizedEmail, {
      fullName: fullName.trim(),
      email: email.trim(),
      passwordHash,
      phone: phone ? phone.trim() : null,
      avatar: avatar || null
    });

    // 7. Gửi email chứa OTP (non-blocking / fire-and-forget an toàn)
    sendRegisterOtpEmail(normalizedEmail, otp, fullName.trim()).catch((smtpError) => {
      deleteRegisterOtp(normalizedEmail);
      console.error('[AuthService] Lỗi gửi email OTP đăng ký:', smtpError.message || smtpError);
    });

    return { 
      message: 'Mã xác nhận 6 chữ số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).' 
    };
  }

  /**
   * Bước 2: Xác minh OTP đăng ký và tạo tài khoản học viên chính thức
   * @param {Object} param0 
   * @returns {Promise<{ user: Object, token: string, message: string }>}
   */
  async verifyRegisterOtp({ email, otp }) {
    if (!email || !otp) {
      throw { statusCode: 400, message: 'Vui lòng cung cấp email và mã xác nhận' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // 1. Xác minh mã OTP trong registerStore
    const result = verifyRegisterOtp(normalizedEmail, String(otp).trim());
    if (!result.valid) {
      throw { statusCode: 400, message: result.reason };
    }

    const { userData } = result;
    if (!userData) {
      throw { statusCode: 400, message: 'Không tìm thấy dữ liệu đăng ký. Vui lòng thử lại.' };
    }

    // 2. Kiểm tra lại lần nữa email đã tồn tại hay chưa (phòng trường hợp race condition)
    const isExisted = await UserModel.existsByEmail(normalizedEmail);
    if (isExisted) {
      deleteRegisterOtp(normalizedEmail);
      throw { statusCode: 409, message: 'Email này đã được đăng ký trong hệ thống' };
    }

    // 3. Tạo học viên mới vào CSDL MySQL
    const newUser = await UserModel.create({
      fullName: userData.fullName,
      email: userData.email,
      passwordHash: userData.passwordHash,
      phone: userData.phone,
      avatar: userData.avatar || null,
      role: 'student'
    });

    // 4. Xóa OTP đăng ký đã dùng (giữ lại file avatar vừa gắn cho tài khoản mới)
    deleteRegisterOtp(normalizedEmail, { keepAvatar: true });

    // 5. Cấp phát JWT Token
    const token = this.generateToken(newUser);

    return {
      user: newUser.toJSON(),
      token,
      message: 'Đăng ký tài khoản học viên thành công!'
    };
  }

  /**
   * Xử lý tăng bộ đếm nhập sai và ném lỗi chuẩn (401 hoặc 429 khi đủ 5 lần)
   * @param {string} email
   */
  handleFailedLoginAttempt(email) {
    const failStatus = recordFailedAttempt(email);
    if (failStatus.locked) {
      throw {
        statusCode: 429,
        message: `Bạn đã nhập sai mật khẩu 5 lần liên tiếp. Vui lòng đợi ${failStatus.remainingSeconds} giây trước khi thử lại.`,
        errors: { retryAfter: failStatus.remainingSeconds }
      };
    }
    throw {
      statusCode: 401,
      message: `Email hoặc mật khẩu không chính xác (Còn ${failStatus.remainingAttempts} lần thử)`,
      errors: { remainingAttempts: failStatus.remainingAttempts }
    };
  }

  /**
   * Đăng nhập hệ thống
   * @param {Object} param0 
   * @returns {Promise<{user: Object, token: string}>}
   */
  async loginUser({ email, password }) {
    if (!email || !password) {
      throw { statusCode: 400, message: 'Vui lòng nhập email và mật khẩu' };
    }

    const trimmedEmail = email.trim();

    // 0. Kiểm tra tài khoản có đang bị tạm khóa do nhập sai quá 5 lần không
    const lockStatus = checkLoginLock(trimmedEmail);
    if (lockStatus.locked) {
      throw {
        statusCode: 429,
        message: `Bạn đã nhập sai mật khẩu quá 5 lần. Vui lòng đợi ${lockStatus.remainingSeconds} giây trước khi thử lại.`,
        errors: { retryAfter: lockStatus.remainingSeconds }
      };
    }

    // 1. Tìm người dùng bằng email với cơ chế phân biệt chính xác chữ hoa và chữ thường (caseSensitive = true)
    const user = await UserModel.findByEmail(trimmedEmail, true);
    if (!user || user.email !== trimmedEmail) {
      this.handleFailedLoginAttempt(trimmedEmail);
    }

    // 2. Kiểm tra trạng thái hoạt động của tài khoản
    if (!user.isActive) {
      throw { statusCode: 403, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' };
    }

    // 3. So khớp mật khẩu với mã băm bcrypt (bcrypt phân biệt chính xác chữ hoa và chữ thường)
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      this.handleFailedLoginAttempt(trimmedEmail);
    }

    // 4. Đăng nhập thành công -> xóa bộ đếm sai
    clearFailedAttempts(trimmedEmail);

    // 5. Cấp phát JWT Token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  /**
   * Lấy thông tin người dùng theo ID
   * @param {number} userId 
   * @returns {Promise<Object>}
   */
  async getUserById(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy thông tin người dùng' };
    }
    return user.toJSON();
  }

  /**
   * Cập nhật thông tin cá nhân (Họ và tên, SĐT, Avatar)
   * Tuyệt đối không cho phép đổi email hoặc mật khẩu qua hàm này
   */
  async updateProfile(userId, { fullName, phone, avatar }) {
    if (!fullName || !fullName.trim()) {
      throw { statusCode: 400, message: 'Họ và tên không được để trống' };
    }

    const user = await UserModel.findById(userId);
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy thông tin người dùng' };
    }

    const trimmedPhone = phone ? String(phone).trim() : null;
    if (trimmedPhone && !/^[0-9+() -]{8,15}$/.test(trimmedPhone)) {
      throw { statusCode: 400, message: 'Số điện thoại không hợp lệ (từ 8-15 ký tự số)' };
    }

    const previousAvatar = user.avatar;
    const updatedUser = await UserModel.updateProfile(userId, {
      fullName: fullName.trim(),
      phone: trimmedPhone,
      avatar
    });

    if (avatar !== undefined && previousAvatar && previousAvatar !== avatar) {
      deleteAvatarFile(previousAvatar);
    }

    return updatedUser.toJSON();
  }

  /**
   * Bước 1: Gửi mã OTP 6 số về email để đặt lại mật khẩu
   * POST /api/v1/auth/forgot-password
   * @param {string} email 
   */
  async sendPasswordResetOtp(email) {
    if (!email || !email.trim()) {
      throw { statusCode: 400, message: 'Vui lòng cung cấp địa chỉ email' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Kiểm tra email có tồn tại trong hệ thống
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      throw { statusCode: 404, message: 'Địa chỉ email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.' };
    }

    // Kiểm tra tài khoản có bị khóa không
    if (!user.isActive) {
      throw { statusCode: 403, message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.' };
    }

    // Tạo OTP 6 chữ số, lưu vào store (hết hạn sau 3 phút)
    const otp = createOtp(normalizedEmail);

    // Gửi email chứa OTP — chạy nền (non-blocking) để tránh timeout HTTP
    // Nếu gửi thất bại, OTP sẽ tự hết hạn sau 3 phút
    sendOtpEmail(normalizedEmail, otp, user.fullName).catch((smtpError) => {
      // Xóa OTP vừa tạo vì email không gửi được
      deleteOtp(normalizedEmail);
      console.error('[AuthService] Lỗi gửi email OTP:', smtpError.message || smtpError);
    });

    return { message: 'Mã xác nhận đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư (kể cả thư mục Spam).' };
  }

  /**
   * Bước 2: Xác minh mã OTP người dùng nhập
   * POST /api/v1/auth/verify-otp
   * @param {string} email 
   * @param {string} otp 
   */
  async verifyPasswordResetOtp(email, otp) {
    if (!email || !otp) {
      throw { statusCode: 400, message: 'Vui lòng cung cấp email và mã xác nhận' };
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = verifyOtp(normalizedEmail, String(otp).trim());

    if (!result.valid) {
      throw { statusCode: 400, message: result.reason };
    }

    return { message: 'Mã xác nhận hợp lệ. Bạn có thể đặt lại mật khẩu.' };
  }

  /**
   * Bước 3: Đặt lại mật khẩu mới sau khi OTP hợp lệ
   * POST /api/v1/auth/reset-password
   * @param {string} email 
   * @param {string} otp 
   * @param {string} newPassword 
   */
  async resetPassword(email, otp, newPassword) {
    if (!email || !otp || !newPassword) {
      throw { statusCode: 400, message: 'Vui lòng cung cấp đầy đủ email, mã xác nhận và mật khẩu mới' };
    }

    if (newPassword.length < 6) {
      throw { statusCode: 400, message: 'Mật khẩu mới phải chứa ít nhất 6 ký tự' };
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Xác minh lại OTP lần cuối trước khi đổi mật khẩu
    const result = verifyOtp(normalizedEmail, String(otp).trim());
    if (!result.valid) {
      throw { statusCode: 400, message: result.reason };
    }

    // Tìm người dùng
    const user = await UserModel.findByEmail(normalizedEmail);
    if (!user) {
      throw { statusCode: 404, message: 'Không tìm thấy tài khoản với email này' };
    }

    // Băm mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Cập nhật mật khẩu vào CSDL
    await UserModel.updatePassword(user.id, passwordHash);

    // Xóa OTP đã dùng
    deleteOtp(normalizedEmail);

    return { message: 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.' };
  }
}

// Xuất ra một instance duy nhất (Singleton Pattern)
module.exports = new AuthService();
