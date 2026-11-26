const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Chương Lý Thuyết (Chapter Model Entity)
 * Quản lý 7 chương học lý thuyết 600 câu hỏi
 */
class ChapterModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || '';
    this.orderNumber = data.order_number || data.orderNumber || 1;
    this.totalQuestions = data.total_questions || data.totalQuestions || 0;
    this.paralysisQuestions = data.paralysis_questions || data.paralysisQuestions || 0;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  /**
   * Lấy toàn bộ danh sách 7 chương kèm số lượng câu hỏi mỗi chương
   * @returns {Promise<Array<ChapterModel>>}
   */
  static async findAll() {
    const query = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.order_number, 
        c.created_at,
        COUNT(q.id) AS total_questions,
        SUM(CASE WHEN q.is_paralysis = 1 THEN 1 ELSE 0 END) AS paralysis_questions
      FROM chapters c
      LEFT JOIN questions q ON c.id = q.chapter_id AND q.is_active = 1
      GROUP BY c.id
      ORDER BY c.order_number ASC
    `;
    const [rows] = await pool.query(query);
    return rows.map(row => new ChapterModel(row));
  }

  /**
   * Tìm chương lý thuyết theo ID
   * @param {number} id 
   * @returns {Promise<ChapterModel|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        c.id, 
        c.title, 
        c.description, 
        c.order_number, 
        c.created_at,
        COUNT(q.id) AS total_questions,
        SUM(CASE WHEN q.is_paralysis = 1 THEN 1 ELSE 0 END) AS paralysis_questions
      FROM chapters c
      LEFT JOIN questions q ON c.id = q.chapter_id AND q.is_active = 1
      WHERE c.id = ?
      GROUP BY c.id
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    return new ChapterModel(rows[0]);
  }

  static async validateOrderNumber(orderNumber, excludedId = null) {
    if (!Number.isInteger(orderNumber) || orderNumber < 1) {
      const error = new Error('Thứ tự chương phải là số nguyên lớn hơn 0');
      error.statusCode = 400;
      throw error;
    }

    let query = 'SELECT id, title FROM chapters WHERE order_number = ?';
    const params = [orderNumber];
    if (excludedId !== null) {
      query += ' AND id <> ?';
      params.push(excludedId);
    }
    query += ' LIMIT 1';

    const [rows] = await pool.query(query, params);
    if (rows.length > 0) {
      const error = new Error(
        `Thứ tự ${orderNumber} đã được dùng cho "${rows[0].title}". Vui lòng nhập thứ tự mới.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  /**
   * Tạo mới một chương lý thuyết
   * @param {Object} data { title, description, orderNumber }
   * @returns {Promise<ChapterModel>}
   */
  static async create({ title, description = '', orderNumber = 1 }) {
    if (!title || !title.trim()) {
      const error = new Error('Tên chương lý thuyết không được để trống');
      error.statusCode = 400;
      throw error;
    }
    await ChapterModel.validateOrderNumber(Number(orderNumber));

    const query = `
      INSERT INTO chapters (title, description, order_number)
      VALUES (?, ?, ?)
    `;
    const [result] = await pool.query(query, [
      title.trim(), 
      (description || '').trim(), 
      Number(orderNumber) || 1
    ]);
    return await ChapterModel.findById(result.insertId);
  }

  /**
   * Cập nhật thông tin chương lý thuyết
   * @param {number} id 
   * @param {Object} data { title, description, orderNumber }
   * @returns {Promise<ChapterModel>}
   */
  static async update(id, { title, description, orderNumber }) {
    const chapter = await ChapterModel.findById(id);
    if (!chapter) {
      const error = new Error(`Không tìm thấy chương lý thuyết với ID = ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const newTitle = title !== undefined ? title.trim() : chapter.title;
    if (!newTitle) {
      const error = new Error('Tên chương lý thuyết không được để trống');
      error.statusCode = 400;
      throw error;
    }

    const newDescription = description !== undefined ? description.trim() : chapter.description;
    const newOrderNumber = orderNumber !== undefined ? Number(orderNumber) : chapter.orderNumber;
    await ChapterModel.validateOrderNumber(newOrderNumber, Number(id));

    const query = `
      UPDATE chapters
      SET title = ?, description = ?, order_number = ?
      WHERE id = ?
    `;
    await pool.query(query, [newTitle, newDescription, newOrderNumber, id]);
    return await ChapterModel.findById(id);
  }

  /**
   * Xóa chương lý thuyết (có bảo vệ an toàn ràng buộc câu hỏi)
   * @param {number} id 
   * @returns {Promise<boolean>}
   */
  static async deleteById(id) {
    const chapter = await ChapterModel.findById(id);
    if (!chapter) {
      const error = new Error(`Không tìm thấy chương lý thuyết với ID = ${id}`);
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra xem có câu hỏi nào đang thuộc về chương này không
    const [questionRows] = await pool.query(
      'SELECT COUNT(*) AS total FROM questions WHERE chapter_id = ?',
      [id]
    );
    const questionCount = Number(questionRows[0]?.total || 0);
    if (questionCount > 0) {
      const error = new Error(`Không thể xóa "${chapter.title}" vì đang có ${questionCount} câu hỏi trực thuộc. Vui lòng xóa hoặc di chuyển các câu hỏi này sang chương khác trước.`);
      error.statusCode = 400;
      throw error;
    }

    // Tự động dọn dẹp các quy tắc cấu trúc ma trận đề thi nếu có
    await pool.query('DELETE FROM exam_structure_rules WHERE chapter_id = ?', [id]);

    await pool.query('DELETE FROM chapters WHERE id = ?', [id]);
    return true;
  }

  /**
   * Chuyển đổi thành Object JSON trả về Client
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      orderNumber: this.orderNumber,
      totalQuestions: Number(this.totalQuestions),
      paralysisQuestions: Number(this.paralysisQuestions),
      createdAt: this.createdAt
    };
  }
}

module.exports = ChapterModel;
