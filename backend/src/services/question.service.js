const QuestionModel = require('../models/question.model');

/**
 * Lớp Dịch vụ Quản lý Ngân hàng Câu Hỏi (Question Service)
 * Đảm nhiệm nghiệp vụ ôn tập câu hỏi, lọc câu hỏi theo chương, tra cứu 60 câu điểm liệt
 */
class QuestionService {
  /**
   * Lấy danh sách câu hỏi với bộ lọc linh hoạt và phân trang
   * @param {Object} query { chapterId, isParalysis, keyword, page, limit, showAnswer }
   * @returns {Promise<{total: number, page: number, limit: number, totalPages: number, questions: Array<Object>}>}
   */
  async getQuestions(query = {}, includeInactive = false) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));

    let chapterId = null;
    if (query.chapterId !== undefined && query.chapterId !== '') {
      chapterId = Number(query.chapterId);
      if (isNaN(chapterId) || chapterId <= 0) {
        const error = new Error('chapterId phải là một số nguyên dương hợp lệ');
        error.statusCode = 400;
        throw error;
      }
    }

    let isParalysis = null;
    if (query.isParalysis !== undefined && query.isParalysis !== '') {
      if (query.isParalysis === 'true' || query.isParalysis === '1' || query.isParalysis === 1) {
        isParalysis = 1;
      } else if (query.isParalysis === 'false' || query.isParalysis === '0' || query.isParalysis === 0) {
        isParalysis = 0;
      }
    }

    const keyword = query.keyword ? String(query.keyword).trim() : '';

    // Mặc định ở chế độ Ôn tập: hiển thị đáp án đúng để học viên đối chiếu (showAnswer = true)
    // Nếu showAnswer = false (học viên tự giải trước), ẩn cờ isCorrect
    const showAnswer = query.showAnswer === undefined ? true : (query.showAnswer === 'true' || query.showAnswer === true || query.showAnswer === '1');

    const result = await QuestionModel.findFiltered({
      chapterId,
      isParalysis,
      isActive: includeInactive ? (query.isActive ?? 'all') : '1',
      keyword,
      page,
      limit,
      includeAnswers: true,
      includeCorrect: showAnswer
    });

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      questions: result.questions.map(q => q.toJSON(showAnswer))
    };
  }

  /**
   * Lấy danh sách các câu hỏi điểm liệt (60 câu điểm liệt bắt buộc không được sai)
   * @param {Object} query { page, limit, keyword, showAnswer }
   * @returns {Promise<Object>}
   */
  async getParalysisQuestions(query = {}) {
    return this.getQuestions({
      ...query,
      isParalysis: 1
    });
  }

  /**
   * Lấy thông tin chi tiết một câu hỏi theo ID
   * @param {number|string} id 
   * @param {boolean} showAnswer 
   * @returns {Promise<Object>}
   */
  async getQuestionById(id, showAnswer = true, includeInactive = false) {
    const questionId = Number(id);
    if (isNaN(questionId) || questionId <= 0) {
      const error = new Error('ID câu hỏi không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const question = await QuestionModel.findById(questionId, true, showAnswer, includeInactive);
    if (!question) {
      const error = new Error(`Không tìm thấy câu hỏi với ID = ${questionId}`);
      error.statusCode = 404;
      throw error;
    }

    return question.toJSON(showAnswer);
  }

  /**
   * Thêm câu hỏi mới vào ngân hàng (Dành cho Quản trị viên)
   * @param {Object} data { chapterId, content, imageUrl, isParalysis, explanation, answers }
   * @returns {Promise<Object>}
   */
  async createQuestion(data) {
    const { chapterId, content, imageUrl, isParalysis, explanation, answers } = data;
    const isActive = data.isActive === undefined
      ? true
      : ![false, 0, '0', 'false'].includes(data.isActive);

    if (!chapterId || !content || !content.trim()) {
      const error = new Error('Vui lòng cung cấp đầy đủ chapterId và nội dung câu hỏi');
      error.statusCode = 400;
      throw error;
    }

    if (!Array.isArray(answers) || answers.length < 2) {
      const error = new Error('Câu hỏi phải có tối thiểu 2 phương án đáp án');
      error.statusCode = 400;
      throw error;
    }

    const correctAnswers = answers.filter(a => a.isCorrect === true || a.isCorrect === 1);
    if (correctAnswers.length !== 1) {
      const error = new Error('Câu hỏi trắc nghiệm phải có chính xác 1 đáp án đúng');
      error.statusCode = 400;
      throw error;
    }

    const created = await QuestionModel.create({
      chapterId: Number(chapterId),
      content: content.trim(),
      imageUrl: imageUrl || null,
      isParalysis: !!isParalysis,
      explanation: explanation || '',
      isActive,
      answers
    });

    return created.toJSON(true);
  }

  /**
   * Cập nhật câu hỏi và danh sách đáp án
   * @param {number|string} id 
   * @param {Object} data 
   * @returns {Promise<Object>}
   */
  async updateQuestion(id, data) {
    const questionId = Number(id);
    if (isNaN(questionId) || questionId <= 0) {
      const error = new Error('ID câu hỏi không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const { chapterId, content, imageUrl, isParalysis, explanation, isActive, answers } = data;

    if (content !== undefined && !content.trim()) {
      const error = new Error('Nội dung câu hỏi không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (Array.isArray(answers)) {
      if (answers.length < 2) {
        const error = new Error('Câu hỏi phải có tối thiểu 2 phương án đáp án');
        error.statusCode = 400;
        throw error;
      }
      const correctAnswers = answers.filter(a => a.isCorrect === true || a.isCorrect === 1);
      if (correctAnswers.length !== 1) {
        const error = new Error('Câu hỏi trắc nghiệm phải có chính xác 1 đáp án đúng');
        error.statusCode = 400;
        throw error;
      }
    }

    const updated = await QuestionModel.update(questionId, {
      chapterId: chapterId !== undefined ? Number(chapterId) : undefined,
      content,
      imageUrl,
      isParalysis,
      explanation,
      isActive,
      answers
    });

    return updated.toJSON(true);
  }

  /**
   * Xóa câu hỏi khỏi ngân hàng (có kiểm tra ràng buộc khóa ngoại)
   * @param {number|string} id 
   * @returns {Promise<Object>}
   */
  async deleteQuestion(id) {
    const questionId = Number(id);
    if (isNaN(questionId) || questionId <= 0) {
      const error = new Error('ID câu hỏi không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    return await QuestionModel.delete(questionId);
  }

  /**
   * Chuyển trạng thái kích hoạt / ẩn câu hỏi
   * @param {number|string} id 
   */
  async toggleQuestionActive(id) {
    const questionId = Number(id);
    if (isNaN(questionId) || questionId <= 0) {
      const error = new Error('ID câu hỏi không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    return await QuestionModel.toggleActive(questionId);
  }
}

module.exports = new QuestionService();
