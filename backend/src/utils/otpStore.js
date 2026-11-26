/**
 * OTP Store — Lưu trữ mã xác nhận trong bộ nhớ (In-Memory)
 * Mỗi OTP gồm: mã 6 chữ số, thời điểm hết hạn (3 phút), số lần nhập sai (tối đa 5 lần).
 * Tự động dọn dẹp các OTP hết hạn mỗi 5 phút để tránh rò rỉ bộ nhớ.
 */

const { deleteAvatarFile } = require('./fileCleanup');

const OTP_EXPIRE_MS = 3 * 60 * 1000; // 3 phút
const MAX_OTP_ATTEMPTS = 5; // Tối đa 5 lần nhập sai cho mỗi mã OTP

const store = new Map(); // Map<email, { code, expiresAt, failedAttempts }>
const registerStore = new Map(); // Map<email, { code, expiresAt, failedAttempts, userData }>

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/**
 * Hàm xác minh OTP dùng chung cho cả Quên mật khẩu và Đăng ký tài khoản
 * @param {Map} targetMap
 * @param {string} email
 * @param {string} code
 * @returns {{ valid: boolean, reason?: string, userData?: Object }}
 */
function verifyEntry(targetMap, email, code) {
  const key = String(email || '').trim().toLowerCase();
  const entry = targetMap.get(key);
  if (!entry) {
    return { valid: false, reason: 'Mã xác nhận không tồn tại hoặc chưa được gửi' };
  }
  if (Date.now() > entry.expiresAt) {
    if (entry.userData?.avatar) {
      deleteAvatarFile(entry.userData.avatar);
    }
    targetMap.delete(key);
    return { valid: false, reason: 'Mã xác nhận đã hết hạn. Vui lòng yêu cầu gửi lại mã mới' };
  }
  if (entry.code !== String(code || '').trim()) {
    entry.failedAttempts = (entry.failedAttempts || 0) + 1;
    if (entry.failedAttempts >= MAX_OTP_ATTEMPTS) {
      if (entry.userData?.avatar) {
        deleteAvatarFile(entry.userData.avatar);
      }
      targetMap.delete(key);
      return {
        valid: false,
        reason: `Bạn đã nhập sai mã xác nhận quá ${MAX_OTP_ATTEMPTS} lần. Mã OTP đã bị hủy, vui lòng yêu cầu gửi lại mã mới.`
      };
    }
    const remaining = MAX_OTP_ATTEMPTS - entry.failedAttempts;
    return {
      valid: false,
      reason: `Mã xác nhận không chính xác (Còn ${remaining} lần thử)`
    };
  }
  return { valid: true, userData: entry.userData };
}

/**
 * Tạo và lưu OTP 6 chữ số cho email (Quên mật khẩu)
 * @param {string} email 
 * @returns {string} code
 */
function createOtp(email) {
  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_EXPIRE_MS;
  store.set(email.toLowerCase(), { code, expiresAt, failedAttempts: 0 });
  return code;
}

/**
 * Xác minh mã OTP Quên mật khẩu — tối đa 5 lần sai
 * @param {string} email 
 * @param {string} code 
 * @returns {{ valid: boolean, reason?: string }}
 */
function verifyOtp(email, code) {
  const result = verifyEntry(store, email, code);
  return result.valid ? { valid: true } : { valid: false, reason: result.reason };
}

/**
 * Xóa OTP sau khi đã dùng (sau khi đặt lại mật khẩu thành công)
 * @param {string} email 
 */
function deleteOtp(email) {
  store.delete(email.toLowerCase());
}

/**
 * Tạo và lưu OTP 6 chữ số cho Đăng ký tài khoản (kèm thông tin học viên tạm thời)
 * @param {string} email 
 * @param {Object} userData - { fullName, email, passwordHash, phone, avatar }
 * @returns {string} code
 */
function createRegisterOtp(email, userData) {
  const key = String(email || '').trim().toLowerCase();
  const prev = registerStore.get(key);
  if (prev?.userData?.avatar && prev.userData.avatar !== userData?.avatar) {
    deleteAvatarFile(prev.userData.avatar);
  }
  const code = generateOtpCode();
  const expiresAt = Date.now() + OTP_EXPIRE_MS;
  registerStore.set(key, { code, expiresAt, failedAttempts: 0, userData });
  return code;
}

/**
 * Xác minh mã OTP Đăng ký — tối đa 5 lần sai
 * @param {string} email 
 * @param {string} code 
 * @returns {{ valid: boolean, reason?: string, userData?: Object }}
 */
function verifyRegisterOtp(email, code) {
  return verifyEntry(registerStore, email, code);
}

/**
 * Xóa OTP Đăng ký sau khi hoàn tất tạo tài khoản hoặc bị hủy
 * @param {string} email 
 * @param {{ keepAvatar?: boolean }} options
 */
function deleteRegisterOtp(email, { keepAvatar = false } = {}) {
  const key = String(email || '').trim().toLowerCase();
  const entry = registerStore.get(key);
  if (!keepAvatar && entry?.userData?.avatar) {
    deleteAvatarFile(entry.userData.avatar);
  }
  registerStore.delete(key);
}

/**
 * Dọn dẹp định kỳ các OTP hết hạn (mỗi 5 phút)
 */
const cleanupTimer = setInterval(() => {
  const now = Date.now();
  for (const [email, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(email);
    }
  }
  for (const [email, entry] of registerStore.entries()) {
    if (now > entry.expiresAt) {
      if (entry.userData?.avatar) {
        deleteAvatarFile(entry.userData.avatar);
      }
      registerStore.delete(email);
    }
  }
}, 5 * 60 * 1000);
if (typeof cleanupTimer.unref === 'function') cleanupTimer.unref();

module.exports = { 
  MAX_OTP_ATTEMPTS,
  createOtp, 
  verifyOtp, 
  deleteOtp,
  createRegisterOtp,
  verifyRegisterOtp,
  deleteRegisterOtp
};
