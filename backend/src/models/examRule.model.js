const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Ma Trận Cấu Trúc Đề Thi (Exam Structure Rule Model)
 * Quản lý quy định số lượng câu hỏi và câu điểm liệt từng chương cho mỗi hạng bằng
 */
class ExamStructureRuleModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.licenseTypeId = data.license_type_id || data.licenseTypeId || null;
    this.chapterId = data.chapter_id || data.chapterId || null;
    this.chapterTitle = data.chapter_title || data.chapterTitle || '';
    this.questionCount = data.question_count !== undefined ? data.question_count : (data.questionCount || 0);
    this.paralysisCount = data.paralysis_count !== undefined ? data.paralysis_count : (data.paralysisCount || 0);
  }

  /**
   * Lấy ma trận cấu hình đề thi của một hạng bằng
   * @param {number} licenseTypeId 
   * @returns {Promise<Array<ExamStructureRuleModel>>}
   */
  static async findByLicenseTypeId(licenseTypeId) {
    const query = `
      SELECT 
        r.id,
        r.license_type_id,
        r.chapter_id,
        c.title AS chapter_title,
        r.question_count,
        r.paralysis_count
      FROM exam_structure_rules r
      JOIN chapters c ON r.chapter_id = c.id
      WHERE r.license_type_id = ?
      ORDER BY c.order_number ASC
    `;
    const [rows] = await pool.query(query, [licenseTypeId]);
    return rows.map(row => new ExamStructureRuleModel(row));
  }

  /**
   * Cập nhật toàn bộ ma trận câu hỏi cho một hạng bằng (Dành cho Admin)
   * @param {number} licenseTypeId 
   * @param {Array<{chapterId: number, questionCount: number, paralysisCount: number}>} rules 
   * @returns {Promise<boolean>}
   */
  static async saveRules(licenseTypeId, rules) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const chapterIds = [...new Set(rules.map(rule => Number(rule.chapterId)))];
      if (chapterIds.some(id => !Number.isInteger(id) || id <= 0)) {
        const error = new Error('Chương trong ma trận đề thi không hợp lệ');
        error.statusCode = 400;
        throw error;
      }

      const [questionCounts] = chapterIds.length > 0
        ? await connection.query(
          `SELECT
             chapter_id,
             COUNT(*) AS active_count,
             SUM(CASE WHEN is_paralysis = 1 THEN 1 ELSE 0 END) AS active_paralysis_count
           FROM questions
           WHERE is_active = 1 AND chapter_id IN (${chapterIds.map(() => '?').join(',')})
           GROUP BY chapter_id`,
          chapterIds
        )
        : [[]];
      const availableByChapter = new Map(
        questionCounts.map(row => [
          Number(row.chapter_id),
          {
            total: Number(row.active_count),
            paralysis: Number(row.active_paralysis_count)
          }
        ])
      );

      for (const rule of rules) {
        const chapterId = Number(rule.chapterId);
        const questionCount = Number(rule.questionCount || 0);
        const paralysisCount = Number(rule.paralysisCount || 0);
        if (
          !Number.isInteger(questionCount) || questionCount < 0 ||
          !Number.isInteger(paralysisCount) || paralysisCount < 0 ||
          paralysisCount > questionCount
        ) {
          const error = new Error(`Số câu trong ma trận của chương #${chapterId} không hợp lệ`);
          error.statusCode = 400;
          throw error;
        }

        const available = availableByChapter.get(chapterId) || { total: 0, paralysis: 0 };
        const normalRequired = questionCount - paralysisCount;
        const normalAvailable = available.total - available.paralysis;
        if (
          questionCount > available.total ||
          paralysisCount > available.paralysis ||
          normalRequired > normalAvailable
        ) {
          const error = new Error(
            `Chương #${chapterId} chỉ có ${available.total} câu đang kích hoạt ` +
            `(${normalAvailable} câu thường, ${available.paralysis} câu điểm liệt), ` +
            `không đủ cho cấu hình ${questionCount} câu (${normalRequired} câu thường, ${paralysisCount} câu điểm liệt).`
          );
          error.statusCode = 400;
          throw error;
        }
      }

      // 1. Xóa cấu hình cũ của hạng bằng này
      await connection.query(
        'DELETE FROM exam_structure_rules WHERE license_type_id = ?',
        [licenseTypeId]
      );

      // 2. Chèn cấu hình ma trận mới
      for (const rule of rules) {
        await connection.query(
          `INSERT INTO exam_structure_rules (license_type_id, chapter_id, question_count, paralysis_count)
           VALUES (?, ?, ?, ?)`,
          [licenseTypeId, rule.chapterId, rule.questionCount || 0, rule.paralysisCount || 0]
        );
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Chuyển đổi thành Object JSON
   */
  toJSON() {
    return {
      id: this.id,
      licenseTypeId: this.licenseTypeId,
      chapterId: this.chapterId,
      chapterTitle: this.chapterTitle,
      questionCount: this.questionCount,
      paralysisCount: this.paralysisCount
    };
  }
}

module.exports = ExamStructureRuleModel;
