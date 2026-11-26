const ChapterModel = require('../models/chapter.model');

/**
 * Lớp Dịch vụ Quản lý Chương Lý Thuyết (Chapter Service)
 * Đảm nhiệm nghiệp vụ lấy danh sách chương, chi tiết chương và thống kê câu hỏi
 */
class ChapterService {
  /**
   * Lấy toàn bộ 7 chương lý thuyết kèm thống kê số câu hỏi và câu điểm liệt
   * @returns {Promise<Array<Object>>}
   */
  async getAllChapters() {
    const chapters = await ChapterModel.findAll();
    return chapters.map(c => c.toJSON());
  }

  /**
   * Lấy thông tin chi tiết một chương theo ID
   * @param {number} id 
   * @returns {Promise<Object>}
   */
  async getChapterById(id) {
    const chapterId = Number(id);
    if (isNaN(chapterId) || chapterId <= 0) {
      const error = new Error('ID chương không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const chapter = await ChapterModel.findById(chapterId);
    if (!chapter) {
      const error = new Error(`Không tìm thấy chương lý thuyết với ID = ${chapterId}`);
      error.statusCode = 404;
      throw error;
    }

    return chapter.toJSON();
  }
}

module.exports = new ChapterService();
