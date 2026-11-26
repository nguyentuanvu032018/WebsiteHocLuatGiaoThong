const chatbotService = require('../services/chatbot.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Lớp Điều khiển Chatbot AI (Chatbot Controller Class)
 * Tiếp nhận HTTP Request hỏi đáp, gọi ChatbotService và trả về phản hồi chuẩn hóa
 */
class ChatbotController {
  /**
   * Gửi tin nhắn hỏi đáp với AI
   * POST /api/v1/chatbot/send
   * Body: { message: string, sessionId: string }
   */
  sendMessage = async (req, res, next) => {
    try {
      const { message, sessionId } = req.body;

      if (!sessionId) {
        return errorResponse(res, 'Thiếu sessionId. Vui lòng tải lại trang.', 400);
      }

      const result = await chatbotService.chat(sessionId, message);
      return successResponse(res, result, 'Phản hồi từ AI thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Xóa lịch sử hội thoại (bắt đầu cuộc trò chuyện mới)
   * POST /api/v1/chatbot/clear
   * Body: { sessionId: string }
   */
  clearHistory = async (req, res, next) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) {
        return errorResponse(res, 'Thiếu sessionId.', 400);
      }
      chatbotService.clearSession(sessionId);
      return successResponse(res, null, 'Đã xóa lịch sử hội thoại');
    } catch (error) {
      next(error);
    }
  };
}

// Xuất ra một instance duy nhất (Singleton Pattern)
module.exports = new ChatbotController();

