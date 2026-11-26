const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbot.controller');
const { chatbotLimiter } = require('../middlewares/rateLimit.middleware');

// --- Cụm API Chatbot AI Hỏi Đáp Luật Giao Thông ---
// POST /api/v1/chatbot/send - Gửi tin nhắn hỏi đáp
router.post('/send', chatbotLimiter, chatbotController.sendMessage);
// POST /api/v1/chatbot/clear - Xóa lịch sử hội thoại
router.post('/clear', chatbotController.clearHistory);

module.exports = router;

