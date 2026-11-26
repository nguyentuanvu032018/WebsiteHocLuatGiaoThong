const chapterService = require('../services/chapter.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Lớp Điều Khiển Chương Lý Thuyết (Chapter Controller)
 * Nhận HTTP Request từ Client, gọi ChapterService và trả về response chuẩn hóa
 */
class ChapterController {
  /**
   * Lấy danh sách toàn bộ 7 chương lý thuyết
   * GET /api/v1/chapters
   */
  getAll = async (req, res, next) => {
    try {
      const chapters = await chapterService.getAllChapters();
      return successResponse(res, { chapters }, 'Lấy danh sách chương lý thuyết thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Lấy thông tin chi tiết một chương
   * GET /api/v1/chapters/:id
   */
  getById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const chapter = await chapterService.getChapterById(id);
      return successResponse(res, { chapter }, 'Lấy chi tiết chương lý thuyết thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };
}

module.exports = new ChapterController();
