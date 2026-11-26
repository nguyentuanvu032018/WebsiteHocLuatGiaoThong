const examService = require('../services/exam.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Lớp Điều Khiển Sát Hạch & Thi Thử (Exam Controller)
 * Xử lý tiếp nhận request tạo đề thi ngẫu nhiên, tra cứu phiên thi và lịch sử thi
 */
class ExamController {
  /**
   * Lấy danh sách các hạng bằng lái xe (A, A1, B, B1, C, C1, D, D1, D2)
   * GET /api/v1/exams/license-types
   */
  getLicenseTypes = async (req, res, next) => {
    try {
      const licenseTypes = await examService.getLicenseTypes();
      return successResponse(res, { licenseTypes }, 'Lấy danh sách hạng bằng lái xe thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy cấu trúc ma trận đề thi của một hạng bằng
   * GET /api/v1/exams/license-types/:id/rules
   */
  getRulesByLicense = async (req, res, next) => {
    try {
      const { id } = req.params;
      const rules = await examService.getExamStructureRules(id);
      return successResponse(res, { rules }, 'Lấy ma trận đề thi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * SINH ĐỀ THI NGẪU NHIÊN THEO MA TRẬN
   * POST /api/v1/exams/generate
   * Body: { licenseTypeId?: number, licenseCode?: string }
   */
  generateExam = async (req, res, next) => {
    try {
      const userId = req.user.id; // Lấy từ middleware verifyToken
      const { licenseTypeId, licenseCode } = req.body;

      if (!licenseTypeId && !licenseCode) {
        return errorResponse(res, 'Vui lòng chọn hạng giấy phép lái xe cần thi (licenseTypeId hoặc licenseCode)', 400);
      }

      const examSession = await examService.generateExamSession({
        userId,
        licenseTypeId,
        licenseCode
      });

      return successResponse(res, { examSession }, 'Khởi tạo bài thi sát hạch thành công! Bắt đầu tính giờ làm bài.', 201);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy thông tin bài thi hiện tại
   * GET /api/v1/exams/:id
   */
  getSession = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const isAdmin = req.user.role === 'admin';

      const examSession = await examService.getExamSession(Number(id), userId, isAdmin);
      return successResponse(res, { examSession }, 'Lấy thông tin bài thi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy lịch sử các lần thi của học viên
   * GET /api/v1/exams/history
   */
  getHistory = async (req, res, next) => {
    try {
      const userId = req.user.id;
      const result = await examService.getUserExamHistory(userId, req.query);
      return successResponse(res, result, 'Lấy lịch sử thi thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Nộp bài thi và chấm điểm tự động (phát hiện trượt điểm liệt)
   * POST /api/v1/exams/:id/submit
   * Body: { answers: Array<{questionId, selectedAnswerId}>, timeSpentSeconds: number }
   */
  submitExam = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { answers, timeSpentSeconds } = req.body;

      const result = await examService.submitExamSession(id, userId, { answers, timeSpentSeconds });
      return successResponse(res, result, 'Nộp bài và chấm điểm bài thi thành công!');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };
}

module.exports = new ExamController();
