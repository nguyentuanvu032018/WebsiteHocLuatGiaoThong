const questionService = require('../services/question.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Lớp Điều Khiển Ngân Hàng Câu Hỏi (Question Controller)
 * Xử lý các request về ôn tập lý thuyết, phân trang, lọc theo chương và câu điểm liệt
 */
class QuestionController {
  /**
   * Lấy danh sách câu hỏi ôn tập (hỗ trợ lọc chapterId, isParalysis, keyword, pagination)
   * GET /api/v1/questions
   */
  getAll = async (req, res, next) => {
    try {
      const result = await questionService.getQuestions(req.query);
      return successResponse(res, result, 'Lấy danh sách câu hỏi ôn tập thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  getAllAdmin = async (req, res, next) => {
    try {
      const result = await questionService.getQuestions(req.query, true);
      return successResponse(res, result, 'Lấy danh sách quản lý câu hỏi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy danh sách câu hỏi điểm liệt
   * GET /api/v1/questions/paralysis
   */
  getParalysis = async (req, res, next) => {
    try {
      const result = await questionService.getParalysisQuestions(req.query);
      return successResponse(res, result, 'Lấy danh sách câu hỏi điểm liệt thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy chi tiết một câu hỏi theo ID
   * GET /api/v1/questions/:id
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const showAnswer = req.query.showAnswer === undefined ? true : (req.query.showAnswer === 'true' || req.query.showAnswer === '1');
      const question = await questionService.getQuestionById(id, showAnswer);
      return successResponse(res, { question }, 'Lấy chi tiết câu hỏi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  getByIdAdmin = async (req, res, next) => {
    try {
      const { id } = req.params;
      const showAnswer = req.query.showAnswer === undefined ? true : (req.query.showAnswer === 'true' || req.query.showAnswer === '1');
      const question = await questionService.getQuestionById(id, showAnswer, true);
      return successResponse(res, { question }, 'Lấy chi tiết câu hỏi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Tạo mới câu hỏi (Dành cho Admin)
   * POST /api/v1/questions
   */
  create = async (req, res, next) => {
    try {
      const data = { ...req.body };
      if (req.file) {
        data.imageUrl = `/uploads/questions/${req.file.filename}`;
      }
      // Parse answers if sent as JSON string in form-data
      if (typeof data.answers === 'string') {
        try {
          data.answers = JSON.parse(data.answers);
        } catch (e) {
          // keep as is
        }
      }
      const newQuestion = await questionService.createQuestion(data);
      return successResponse(res, { question: newQuestion }, 'Tạo câu hỏi mới thành công', 201);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Cập nhật thông tin câu hỏi (Dành cho Admin)
   * PUT /api/v1/questions/:id
   */
  update = async (req, res, next) => {
    try {
      const { id } = req.params;
      const data = { ...req.body };
      if (req.file) {
        data.imageUrl = `/uploads/questions/${req.file.filename}`;
      }
      if (typeof data.answers === 'string') {
        try {
          data.answers = JSON.parse(data.answers);
        } catch (e) {
          // keep as is
        }
      }
      const updated = await questionService.updateQuestion(id, data);
      return successResponse(res, { question: updated }, 'Cập nhật câu hỏi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Xóa câu hỏi khỏi ngân hàng (Dành cho Admin)
   * DELETE /api/v1/questions/:id
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await questionService.deleteQuestion(id);
      return successResponse(res, result, result.message || 'Xóa câu hỏi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Đổi trạng thái hiển thị / ẩn câu hỏi (Dành cho Admin)
   * PATCH /api/v1/questions/:id/toggle-active
   */
  toggleActive = async (req, res, next) => {
    try {
      const { id } = req.params;
      const result = await questionService.toggleQuestionActive(id);
      return successResponse(res, result, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Upload ảnh sa hình / minh họa câu hỏi
   * POST /api/v1/questions/upload-image
   */
  uploadImage = async (req, res, next) => {
    try {
      if (!req.file) {
        return errorResponse(res, 'Vui lòng chọn tệp hình ảnh để tải lên', 400);
      }
      const imageUrl = `/uploads/questions/${req.file.filename}`;
      return successResponse(res, { imageUrl }, 'Tải ảnh minh họa lên thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };
}

module.exports = new QuestionController();
