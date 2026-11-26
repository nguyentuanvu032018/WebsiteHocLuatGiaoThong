const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Biển Báo Giao Thông (Traffic Sign Model Entity)
 * Quản lý hệ thống biển báo đường bộ Việt Nam
 */
class TrafficSignModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.categoryId = data.category_id || data.categoryId || null;
    this.categoryName = data.category_name || data.categoryName || '';
    this.categoryCode = data.category_code || data.categoryCode || '';
    this.signCode = data.sign_code || data.signCode || '';
    this.name = data.name || '';
    this.description = data.description || '';
    this.imageUrl = data.image_url || data.imageUrl || null;
    this.createdAt = data.created_at || data.createdAt || null;
  }

  /**
   * Lấy danh sách biển báo có bộ lọc nhóm và từ khóa tìm kiếm (có phân trang)
   * @param {Object} filter { categoryId, keyword, page, limit }
   * @returns {Promise<{total: number, page: number, limit: number, totalPages: number, signs: Array<TrafficSignModel>}>}
   */
  static async findWithFilter({ categoryId = null, keyword = '', page = 1, limit = 20 }) {
    let whereClauses = [];
    let params = [];

    if (categoryId) {
      whereClauses.push('s.category_id = ?');
      params.push(Number(categoryId));
    }

    if (keyword && keyword.trim().length > 0) {
      whereClauses.push('(s.sign_code LIKE ? OR s.name LIKE ? OR s.description LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Đếm tổng số bản ghi
    const countSql = `SELECT COUNT(*) AS total FROM traffic_signs s ${whereSql}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Lấy dữ liệu theo phân trang
    const offset = (Math.max(1, page) - 1) * limit;
    const dataSql = `
      SELECT 
        s.*, 
        c.name AS category_name, 
        c.code AS category_code
      FROM traffic_signs s
      JOIN sign_categories c ON s.category_id = c.id
      ${whereSql}
      ORDER BY s.category_id ASC, s.sign_code ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, Number(limit), Number(offset)]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      signs: rows.map(row => new TrafficSignModel(row))
    };
  }

  /**
   * Tìm chi tiết một biển báo theo ID
   * @param {number} id 
   * @returns {Promise<TrafficSignModel|null>}
   */
  static async findById(id) {
    const query = `
      SELECT s.*, c.name AS category_name, c.code AS category_code
      FROM traffic_signs s
      JOIN sign_categories c ON s.category_id = c.id
      WHERE s.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    return new TrafficSignModel(rows[0]);
  }

  static async findByRecognitionName(className) {
    const query = `
      SELECT ts.id, ts.sign_code, ts.name, ts.image_url, ts.description, sc.name AS category_name
      FROM traffic_signs ts
      LEFT JOIN sign_categories sc ON ts.category_id = sc.id
      WHERE LOWER(ts.name) LIKE LOWER(?) OR LOWER(?) LIKE CONCAT('%', LOWER(ts.name), '%')
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [`%${className}%`, className]);
    return rows[0] || null;
  }

  /**
   * Lấy danh sách 5 nhóm danh mục biển báo
   * @returns {Promise<Array<{id: number, code: string, name: string, description: string}>>}
   */
  static async getCategories() {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(s.id) AS sign_count 
       FROM sign_categories c
       LEFT JOIN traffic_signs s ON c.id = s.category_id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );
    return rows;
  }

  static async create({ categoryId, signCode, name, description = '', imageUrl = null }) {
    const categoryIdNum = Number(categoryId);
    const cleanSignCode = String(signCode || '').trim();
    const cleanName = String(name || '').trim();

    if (!categoryIdNum || !cleanSignCode || !cleanName) {
      const error = new Error('Nhóm biển báo, mã biển báo và tên biển báo là bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      `INSERT INTO traffic_signs (category_id, sign_code, name, description, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [categoryIdNum, cleanSignCode, cleanName, description?.trim() || '', imageUrl || null]
    );

    return this.findById(result.insertId);
  }

  static async update(id, { categoryId, signCode, name, description = '', imageUrl = null }) {
    const signId = Number(id);
    const categoryIdNum = Number(categoryId);
    const cleanSignCode = String(signCode || '').trim();
    const cleanName = String(name || '').trim();

    if (isNaN(signId) || signId <= 0) {
      const error = new Error('ID biển báo không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    if (!categoryIdNum || !cleanSignCode || !cleanName) {
      const error = new Error('Nhóm biển báo, mã biển báo và tên biển báo là bắt buộc');
      error.statusCode = 400;
      throw error;
    }

    await pool.query(
      `UPDATE traffic_signs
       SET category_id = ?, sign_code = ?, name = ?, description = ?, image_url = ?
       WHERE id = ?`,
      [categoryIdNum, cleanSignCode, cleanName, description?.trim() || '', imageUrl || null, signId]
    );

    return this.findById(signId);
  }

  static async deleteById(id) {
    const signId = Number(id);
    if (isNaN(signId) || signId <= 0) {
      const error = new Error('ID biển báo không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query('DELETE FROM traffic_signs WHERE id = ?', [signId]);
    if (result.affectedRows === 0) {
      const error = new Error(`Không tìm thấy biển báo với ID = ${signId}`);
      error.statusCode = 404;
      throw error;
    }

    return true;
  }

  /**
   * Chuyển đổi thành Object JSON trả về Client
   */
  toJSON() {
    return {
      id: this.id,
      categoryId: this.categoryId,
      categoryName: this.categoryName,
      categoryCode: this.categoryCode,
      signCode: this.signCode,
      name: this.name,
      description: this.description,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt
    };
  }
}

module.exports = TrafficSignModel;
