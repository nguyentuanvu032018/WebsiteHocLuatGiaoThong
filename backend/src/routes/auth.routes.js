const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { uploadAvatarImage } = require('../middlewares/upload.middleware');
const { otpSendLimiter, otpVerifyLimiter } = require('../middlewares/rateLimit.middleware');

// Public routes (Đăng ký bắt buộc qua xác thực OTP Email)
router.post('/send-register-otp', otpSendLimiter, uploadAvatarImage.single('avatar'), authController.sendRegisterOtp);
router.post('/verify-register-otp', otpVerifyLimiter, authController.verifyRegisterOtp);
router.post('/login', authController.login);

// Password Reset (OTP qua email) — Public routes
router.post('/forgot-password', otpSendLimiter, authController.forgotPassword);
router.post('/verify-otp', otpVerifyLimiter, authController.verifyOtp);
router.post('/reset-password', otpVerifyLimiter, authController.resetPassword);

// Protected routes (Cần Bearer Token)
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, uploadAvatarImage.single('avatar'), authController.updateProfile);

module.exports = router;
