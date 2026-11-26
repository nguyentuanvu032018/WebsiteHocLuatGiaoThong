const dotenv = require('dotenv');

dotenv.config();

/**
 * Lấy khóa bí mật JWT từ biến môi trường.
 * Bắt buộc phải có JWT_SECRET; không sử dụng chuỗi fallback hardcode.
 * @returns {string}
 */
function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret || !secret.trim()) {
    throw new Error('Lỗi cấu hình bảo mật: Thiếu biến môi trường JWT_SECRET trong file .env.');
  }
  return secret;
}

// Kiểm tra ngay khi khởi động (fail-fast)
getJwtSecret();

module.exports = {
  getJwtSecret,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d'
};
