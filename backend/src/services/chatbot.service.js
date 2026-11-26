/**
 * Lớp Dịch vụ Chatbot AI (Chatbot Service Class)
 * Sử dụng Groq API để trả lời câu hỏi về luật giao thông đường bộ Việt Nam
 */
class ChatbotService {
  constructor() {
    this.apiKey = process.env.GROQ_API_KEY;
    if (!this.apiKey) {
      console.warn('[ChatbotService] GROQ_API_KEY chưa được cấu hình trong .env');
    }
    this.model = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';
    this.fallbackModel = 'qwen/qwen3.8-27b';

    // System instruction — thiết lập nhân cách & phạm vi kiến thức cho Chatbot
    this.systemInstruction = `Bạn là "Trợ lý Luật Giao Thông" — một chuyên gia AI hỗ trợ học viên ôn thi sát hạch Giấy phép lái xe (GPLX) tại Việt Nam.

PHẠM VI KIẾN THỨC:
- Luật Giao thông đường bộ Việt Nam (Luật số 23/2008/QH12 và sửa đổi)
- Nghị định 100/2019/NĐ-CP và Nghị định 123/2021/NĐ-CP về xử phạt vi phạm hành chính trong lĩnh vực giao thông đường bộ
- QCVN 41:2019/BGTVT — Quy chuẩn kỹ thuật quốc gia về báo hiệu đường bộ (biển báo, vạch kẻ đường, đèn tín hiệu)
- Quy trình sát hạch lái xe các hạng A1, A2, B1, B2, C, D, E, F
- 600 câu hỏi thi lý thuyết sát hạch GPLX theo bộ đề của Bộ GTVT
- Kỹ năng lái xe an toàn, xử lý tình huống giao thông
- Cấu tạo và bảo dưỡng phương tiện cơ bản

QUY TẮC TRẢ LỜI:
1. Chỉ trả lời các câu hỏi liên quan đến giao thông, luật giao thông, biển báo, mức phạt, thi GPLX.
2. Nếu câu hỏi KHÔNG liên quan đến giao thông → từ chối lịch sự và gợi ý hỏi về chủ đề giao thông.
3. Trả lời bằng tiếng Việt, ngắn gọn, dễ hiểu, chính xác.
4. Khi trích dẫn điều luật hoặc nghị định, ghi rõ số hiệu văn bản.
5. Khi giải thích biển báo, mô tả hình dạng, màu sắc và ý nghĩa rõ ràng.
6. Nếu không chắc chắn về thông tin, hãy nói rõ và khuyên người dùng tra cứu thêm.
7. Sử dụng emoji phù hợp để làm câu trả lời sinh động hơn (🚗 🛵 ⚠️ 🚦 📋).
8. Format câu trả lời bằng Markdown khi cần (in đậm, danh sách, tiêu đề).`;

    // Lưu trữ lịch sử hội thoại theo session (key = sessionId)
    this.sessions = new Map();

    // Tự động xóa session cũ sau 30 phút không hoạt động
    setInterval(() => {
      const now = Date.now();
      for (const [key, session] of this.sessions) {
        if (now - session.lastActive > 30 * 60 * 1000) {
          this.sessions.delete(key);
        }
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Lấy hoặc tạo session hội thoại
   * @param {string} sessionId
   * @returns {Object} session data { history, lastActive }
   */
  getSession(sessionId) {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, {
        history: [],
        lastActive: Date.now()
      });
    }
    const session = this.sessions.get(sessionId);
    session.lastActive = Date.now();
    return session;
  }

  /**
   * Gửi tin nhắn đến xAI và nhận phản hồi
   * Có cơ chế retry tự động (tối đa 3 lần) với exponential backoff khi dịch vụ bị quá tải
   * @param {string} sessionId - ID phiên hội thoại (unique per user/tab)
   * @param {string} userMessage - Tin nhắn của người dùng
   * @returns {Promise<{ reply: string }>}
   */
  async chat(sessionId, userMessage) {
    if (!userMessage || !userMessage.trim()) {
      throw { statusCode: 400, message: 'Vui lòng nhập câu hỏi của bạn' };
    }

    const trimmedMessage = userMessage.trim();

    // Giới hạn độ dài tin nhắn (tránh lạm dụng)
    if (trimmedMessage.length > 2000) {
      throw { statusCode: 400, message: 'Câu hỏi quá dài. Vui lòng rút gọn dưới 2000 ký tự.' };
    }

    if (!this.apiKey) {
      throw { statusCode: 503, message: 'API Key AI chưa được cấu hình. Vui lòng liên hệ quản trị viên.' };
    }

    const session = this.getSession(sessionId);

    const messages = [{ role: 'system', content: this.systemInstruction }];
    const recentHistory = session.history.slice(-20);
    for (const turn of recentHistory) {
      messages.push({ role: 'user', content: turn.user });
      messages.push({ role: 'assistant', content: turn.assistant });
    }
    messages.push({ role: 'user', content: trimmedMessage });

    // Retry tự động tối đa 3 lần với exponential backoff khi dịch vụ quá tải
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [500, 1500, 3000];

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature: 0.6,
            max_completion_tokens: 1024
          })
        });

        const responseBody = await response.text();
        let data = {};
        try {
          data = responseBody ? JSON.parse(responseBody) : {};
        } catch {
          data = {};
        }

        if (!response.ok) {
          const providerMessage = data.error?.message || data.error || data.message || data.detail ||
            responseBody.slice(0, 1000) || `Groq API trả về HTTP ${response.status}`;
          const error = new Error(providerMessage);
          error.status = response.status;
          throw error;
        }

        const reply = data.choices?.[0]?.message?.content || 'Xin lỗi, tôi không thể trả lời lúc này. Vui lòng thử lại.';

        // Lưu vào lịch sử hội thoại chỉ khi thành công
        session.history.push({ user: trimmedMessage, assistant: reply });

        if (attempt > 1) {
          console.log(`[ChatbotService] Thành công sau ${attempt} lần thử.`);
        }
        return { reply };

      } catch (error) {
        // Tự động fallback nếu model không tồn tại
        if (error.message?.includes('does not exist') && this.fallbackModel && this.model !== this.fallbackModel) {
          console.warn(`[ChatbotService] Model ${this.model} không tồn tại, tự động chuyển sang fallback ${this.fallbackModel}...`);
          this.model = this.fallbackModel;
          continue;
        }
        const isOverloaded = error.status === 503 ||
          (error.message && (error.message.includes('503') || error.message.includes('UNAVAILABLE') || error.message.includes('high demand')));

        const isQuotaExceeded = error.status === 429 ||
          (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('RATE_LIMIT')));

        // Lỗi quota (429) → không retry, báo ngay
        if (isQuotaExceeded) {
          throw { statusCode: 429, message: 'AI đang bận hoặc vượt giới hạn quota. Vui lòng thử lại sau vài giây.' };
        }

        if (error.status === 401 || error.status === 403) {
          throw { statusCode: 503, message: 'Groq API key không hợp lệ hoặc không có quyền truy cập. Vui lòng kiểm tra cấu hình backend.' };
        }

        // Nếu không phải lỗi quá tải, hoặc đã hết số lần thử → ném lỗi
        if (!isOverloaded || attempt === MAX_RETRIES) {
          console.error(`[ChatbotService] Lỗi lần ${attempt}/${MAX_RETRIES} (Groq model=${this.model}):`, error.message || error);

          if (error.statusCode) throw error;
          if (error.message?.toLowerCase().includes('api key')) {
            throw { statusCode: 503, message: 'Groq API key không hợp lệ hoặc đã bị thu hồi. Vui lòng kiểm tra cấu hình backend.' };
          }
          if (error.status === 400) {
            throw { statusCode: 502, message: 'Groq API từ chối yêu cầu chatbot. Quản trị viên hãy kiểm tra log backend.' };
          }
          if (isOverloaded) {
            throw { statusCode: 429, message: 'Hệ thống AI đang quá tải. Vui lòng thử lại sau ít phút.' };
          }
          throw { statusCode: 500, message: 'Không thể kết nối đến hệ thống AI. Vui lòng thử lại sau.' };
        }

        // Chờ rồi thử lại
        const delay = RETRY_DELAYS[attempt - 1];
        console.warn(`[ChatbotService] Groq API quá tải (lần ${attempt}/${MAX_RETRIES}), thử lại sau ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Xóa lịch sử hội thoại của một session
   * @param {string} sessionId
   */
  clearSession(sessionId) {
    this.sessions.delete(sessionId);
  }
}

// Xuất ra một instance duy nhất (Singleton Pattern)
module.exports = new ChatbotService();
