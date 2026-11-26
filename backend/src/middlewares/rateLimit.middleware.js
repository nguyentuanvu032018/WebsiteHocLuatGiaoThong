const rateLimit = require('express-rate-limit');
const { errorResponse } = require('../utils/apiResponse');

/**
 * Factory tạo middleware giới hạn tần suất request (Rate Limiter)
 * Chuẩn hóa phản hồi lỗi theo apiResponse (HTTP 429)
 */
function createRateLimiter({ windowMs, max, message }) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      return errorResponse(res, message, 429, {
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
}

// Giới hạn gửi email OTP (Đăng ký / Quên mật khẩu): tối đa 5 lần / 5 phút / IP
const otpSendLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: 'Bạn đã yêu cầu gửi mã xác nhận quá nhiều lần. Vui lòng đợi 5 phút trước khi thử lại.'
});

// Giới hạn xác minh OTP & đặt lại mật khẩu: tối đa 15 lần / 5 phút / IP
const otpVerifyLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: 'Bạn đã thực hiện quá nhiều yêu cầu xác minh. Vui lòng đợi ít phút trước khi thử lại.'
});

// Giới hạn gửi tin nhắn Chatbot AI: tối đa 20 tin nhắn / phút / IP
const chatbotLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 20,
  message: 'Bạn đang gửi tin nhắn quá nhanh. Vui lòng đợi 1 phút trước khi tiếp tục.'
});

// Giới hạn nhận diện biển báo AI (ResNet50): tối đa 15 lượt / phút / IP
const aiRecognitionLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 15,
  message: 'Bạn đang gửi yêu cầu nhận diện quá nhanh. Vui lòng đợi 1 phút trước khi thử lại.'
});

module.exports = {
  createRateLimiter,
  otpSendLimiter,
  otpVerifyLimiter,
  chatbotLimiter,
  aiRecognitionLimiter
};
