const authService = require('../services/auth.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const { deleteAvatarFile } = require('../utils/fileCleanup');

/**
 * Lớp Điều khiển Xác thực (Auth Controller Class)
 * Tiếp nhận HTTP Request, gọi AuthService và trả về phản hồi chuẩn hóa
 */
class AuthController {
  /**
   * Bước 1 Đăng ký: Gửi mã OTP xác nhận tới email học viên
   * POST /api/v1/auth/send-register-otp
   */
  sendRegisterOtp = async (req, res, next) => {
    try {
      const { fullName, email, password, phone } = req.body;
      let avatar = null;
      if (req.file) {
        avatar = `/uploads/avatars/${req.file.filename}`;
      }
      const result = await authService.sendRegisterOtp({ fullName, email, password, phone, avatar });
      return successResponse(res, null, result.message);
    } catch (error) {
      if (req.file) {
        deleteAvatarFile(`/uploads/avatars/${req.file.filename}`);
      }
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Bước 2 Đăng ký: Xác minh OTP và tạo tài khoản chính thức
   * POST /api/v1/auth/verify-register-otp
   */
  verifyRegisterOtp = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyRegisterOtp({ email, otp });
      return successResponse(res, { user: result.user, token: result.token }, result.message, 201);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Xử lý Đăng nhập hệ thống
   * POST /api/v1/auth/login
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.loginUser({ email, password });
      return successResponse(res, result, 'Đăng nhập thành công!');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Lấy thông tin tài khoản đang đăng nhập
   * GET /api/v1/auth/me
   */
  getMe = async (req, res, next) => {
    try {
      const user = await authService.getUserById(req.user.id);
      return successResponse(res, { user }, 'Lấy thông tin người dùng thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar)
   * Không cho phép cập nhật email hoặc mật khẩu qua route này
   * PUT /api/v1/auth/profile
   */
  updateProfile = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { fullName, phone, removeAvatar } = req.body;

      let avatar = undefined;
      if (req.file) {
        avatar = `/uploads/avatars/${req.file.filename}`;
      } else if (removeAvatar === 'true' || removeAvatar === true) {
        avatar = null;
      }

      const user = await authService.updateProfile(userId, {
        fullName,
        phone,
        avatar
      });

      return successResponse(res, { user }, 'Cập nhật thông tin cá nhân thành công!');
    } catch (error) {
      if (req.file) {
        deleteAvatarFile(`/uploads/avatars/${req.file.filename}`);
      }
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Bước 1: Gửi mã OTP 6 số tới email để đặt lại mật khẩu
   * POST /api/v1/auth/forgot-password
   */
  forgotPassword = async (req, res, next) => {
    try {
      const { email } = req.body;
      const result = await authService.sendPasswordResetOtp(email);
      return successResponse(res, null, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Bước 2: Xác minh mã OTP người dùng nhập
   * POST /api/v1/auth/verify-otp
   */
  verifyOtp = async (req, res, next) => {
    try {
      const { email, otp } = req.body;
      const result = await authService.verifyPasswordResetOtp(email, otp);
      return successResponse(res, null, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };

  /**
   * Bước 3: Đặt lại mật khẩu mới sau khi OTP hợp lệ
   * POST /api/v1/auth/reset-password
   */
  resetPassword = async (req, res, next) => {
    try {
      const { email, otp, newPassword } = req.body;
      const result = await authService.resetPassword(email, otp, newPassword);
      return successResponse(res, null, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode, error.errors || null);
      }
      next(error);
    }
  };
}

// Xuất ra một instance duy nhất (Singleton Pattern)
module.exports = new AuthController();
