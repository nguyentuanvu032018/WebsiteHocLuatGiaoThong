const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Mức Phạt Giao Thông (Traffic Fine Model Entity)
 * Quản lý danh mục mức phạt theo Nghị định 100/2019/NĐ-CP & 123/2021/NĐ-CP
 */
class TrafficFineModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fineCategoryId = data.fine_category_id || data.fineCategoryId || null;
    this.vehicleType = data.vehicle_type || data.vehicleType || '';
    this.categoryName = data.category_name || data.categoryName || '';
    this.violationTitle = data.violation_title || data.violationTitle || '';
    this.violationDetail = data.violation_detail || data.violationDetail || '';
    this.minFineAmount = Number(data.min_fine_amount !== undefined ? data.min_fine_amount : (data.minFineAmount || 0));
    this.maxFineAmount = Number(data.max_fine_amount !== undefined ? data.max_fine_amount : (data.maxFineAmount || 0));
    this.penaltyAddition = data.penalty_addition || data.penaltyAddition || null;
    this.legalReference = data.legal_reference || data.legalReference || '';
    this.createdAt = data.created_at || data.createdAt || null;
  }

  /**
   * Lấy danh sách mức phạt theo bộ lọc (Phương tiện, Từ khóa tìm kiếm, Mức tiền phạt) có phân trang
   * @param {Object} filter { vehicleType, fineCategoryId, keyword, minFine, maxFine, page, limit }
   * @returns {Promise<{total: number, page: number, limit: number, totalPages: number, fines: Array<TrafficFineModel>}>}
   */
  static async findWithFilter({
    vehicleType = null,
    fineCategoryId = null,
    keyword = '',
    minFine = null,
    maxFine = null,
    page = 1,
    limit = 20
  } = {}) {
    let whereClauses = [];
    let params = [];

    if (fineCategoryId) {
      whereClauses.push('f.fine_category_id = ?');
      params.push(Number(fineCategoryId));
    }

    if (vehicleType) {
      whereClauses.push('c.vehicle_type = ?');
      params.push(vehicleType.toUpperCase());
    }

    if (keyword && keyword.trim().length > 0) {
      whereClauses.push('(f.violation_title LIKE ? OR f.violation_detail LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw);
    }

    if (minFine !== null && !isNaN(minFine)) {
      whereClauses.push('f.max_fine_amount >= ?');
      params.push(Number(minFine));
    }

    if (maxFine !== null && !isNaN(maxFine)) {
      whereClauses.push('f.min_fine_amount <= ?');
      params.push(Number(maxFine));
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Đếm tổng số bản ghi
    const countSql = `
      SELECT COUNT(*) AS total 
      FROM traffic_fines f
      JOIN fine_categories c ON f.fine_category_id = c.id
      ${whereSql}
    `;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // Phân trang
    const offset = (Math.max(1, page) - 1) * limit;
    const dataSql = `
      SELECT 
        f.*,
        c.vehicle_type,
        c.name AS category_name
      FROM traffic_fines f
      JOIN fine_categories c ON f.fine_category_id = c.id
      ${whereSql}
      ORDER BY f.fine_category_id ASC, f.min_fine_amount ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, Number(limit), Number(offset)]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      fines: rows.map(row => new TrafficFineModel(row))
    };
  }

  /**
   * Lấy chi tiết mức phạt theo ID
   * @param {number} id 
   * @returns {Promise<TrafficFineModel|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        f.*,
        c.vehicle_type,
        c.name AS category_name
      FROM traffic_fines f
      JOIN fine_categories c ON f.fine_category_id = c.id
      WHERE f.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    return new TrafficFineModel(rows[0]);
  }

  /**
   * Lấy danh sách các nhóm phương tiện phạt (fine_categories) kèm số lượng vi phạm
   * @returns {Promise<Array<{id: number, vehicle_type: string, name: string, description: string, fine_count: number}>>}
   */
  static async getCategories() {
    const [rows] = await pool.query(
      `SELECT c.*, COUNT(f.id) AS fine_count
       FROM fine_categories c
       LEFT JOIN traffic_fines f ON c.id = f.fine_category_id
       GROUP BY c.id
       ORDER BY c.id ASC`
    );
    return rows;
  }

  /**
   * Thêm mới một hành vi vi phạm & mức xử phạt (Dành cho Admin)
   * @param {Object} data 
   * @returns {Promise<TrafficFineModel>}
   */
  static async create(data) {
    const fineCategoryId = Number(data.fineCategoryId || data.fine_category_id);
    const violationTitle = (data.violationTitle || data.violation_title || '').trim();
    const violationDetail = (data.violationDetail || data.violation_detail || '').trim();
    const minFineAmount = Number(data.minFineAmount !== undefined ? data.minFineAmount : (data.min_fine_amount || 0));
    const maxFineAmount = Number(data.maxFineAmount !== undefined ? data.maxFineAmount : (data.max_fine_amount || 0));
    const penaltyAddition = data.penaltyAddition !== undefined ? data.penaltyAddition : (data.penalty_addition || null);
    const legalReference = (data.legalReference || data.legal_reference || '').trim();

    if (!fineCategoryId) {
      const error = new Error('Vui lòng chọn nhóm phương tiện áp dụng mức phạt');
      error.statusCode = 400;
      throw error;
    }

    if (!violationTitle) {
      const error = new Error('Tên hành vi vi phạm không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (!violationDetail) {
      const error = new Error('Chi tiết hành vi vi phạm không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (minFineAmount < 0 || maxFineAmount < 0) {
      const error = new Error('Mức tiền phạt không được là số âm');
      error.statusCode = 400;
      throw error;
    }

    if (maxFineAmount > 0 && minFineAmount > maxFineAmount) {
      const error = new Error('Mức phạt tối thiểu không được lớn hơn mức phạt tối đa');
      error.statusCode = 400;
      throw error;
    }

    const [catRows] = await pool.query('SELECT id FROM fine_categories WHERE id = ? LIMIT 1', [fineCategoryId]);
    if (catRows.length === 0) {
      const error = new Error(`Nhóm phương tiện với ID ${fineCategoryId} không tồn tại`);
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      `INSERT INTO traffic_fines (fine_category_id, violation_title, violation_detail, min_fine_amount, max_fine_amount, penalty_addition, legal_reference)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [fineCategoryId, violationTitle, violationDetail, minFineAmount, maxFineAmount, penaltyAddition, legalReference]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Cập nhật thông tin hành vi vi phạm & mức xử phạt (Dành cho Admin)
   * @param {number} id 
   * @param {Object} data 
   * @returns {Promise<TrafficFineModel>}
   */
  static async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) {
      const error = new Error(`Không tìm thấy mức phạt với ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const updates = [];
    const params = [];

    if (data.fineCategoryId !== undefined || data.fine_category_id !== undefined) {
      const catId = Number(data.fineCategoryId || data.fine_category_id);
      const [catRows] = await pool.query('SELECT id FROM fine_categories WHERE id = ? LIMIT 1', [catId]);
      if (catRows.length === 0) {
        const error = new Error(`Nhóm phương tiện với ID ${catId} không tồn tại`);
        error.statusCode = 400;
        throw error;
      }
      updates.push('fine_category_id = ?');
      params.push(catId);
    }

    if (data.violationTitle !== undefined || data.violation_title !== undefined) {
      const title = (data.violationTitle || data.violation_title || '').trim();
      if (!title) {
        const error = new Error('Tên hành vi vi phạm không được để trống');
        error.statusCode = 400;
        throw error;
      }
      updates.push('violation_title = ?');
      params.push(title);
    }

    if (data.violationDetail !== undefined || data.violation_detail !== undefined) {
      const detail = (data.violationDetail || data.violation_detail || '').trim();
      if (!detail) {
        const error = new Error('Chi tiết hành vi vi phạm không được để trống');
        error.statusCode = 400;
        throw error;
      }
      updates.push('violation_detail = ?');
      params.push(detail);
    }

    let nextMin = existing.minFineAmount;
    let nextMax = existing.maxFineAmount;

    if (data.minFineAmount !== undefined || data.min_fine_amount !== undefined) {
      nextMin = Number(data.minFineAmount !== undefined ? data.minFineAmount : data.min_fine_amount);
      if (nextMin < 0) {
        const error = new Error('Mức tiền phạt tối thiểu không được là số âm');
        error.statusCode = 400;
        throw error;
      }
      updates.push('min_fine_amount = ?');
      params.push(nextMin);
    }

    if (data.maxFineAmount !== undefined || data.max_fine_amount !== undefined) {
      nextMax = Number(data.maxFineAmount !== undefined ? data.maxFineAmount : data.max_fine_amount);
      if (nextMax < 0) {
        const error = new Error('Mức tiền phạt tối đa không được là số âm');
        error.statusCode = 400;
        throw error;
      }
      updates.push('max_fine_amount = ?');
      params.push(nextMax);
    }

    if (nextMax > 0 && nextMin > nextMax) {
      const error = new Error('Mức phạt tối thiểu không được lớn hơn mức phạt tối đa');
      error.statusCode = 400;
      throw error;
    }

    if (data.penaltyAddition !== undefined || data.penalty_addition !== undefined) {
      const penalty = data.penaltyAddition !== undefined ? data.penaltyAddition : data.penalty_addition;
      updates.push('penalty_addition = ?');
      params.push(penalty ? penalty.trim() : null);
    }

    if (data.legalReference !== undefined || data.legal_reference !== undefined) {
      const ref = (data.legalReference || data.legal_reference || '').trim();
      updates.push('legal_reference = ?');
      params.push(ref);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(
        `UPDATE traffic_fines SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return await this.findById(id);
  }

  /**
   * Xóa một hành vi vi phạm & mức phạt khỏi CSDL
   * @param {number} id 
   * @returns {Promise<boolean>}
   */
  static async deleteById(id) {
    const existing = await this.findById(id);
    if (!existing) {
      const error = new Error(`Không tìm thấy mức phạt với ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    await pool.query('DELETE FROM traffic_fines WHERE id = ?', [id]);
    return true;
  }

  /**
   * Chuyển đổi thành JSON trả về cho Client
   */
  toJSON() {
    return {
      id: this.id,
      fineCategoryId: this.fineCategoryId,
      vehicleType: this.vehicleType,
      categoryName: this.categoryName,
      violationTitle: this.violationTitle,
      violationDetail: this.violationDetail,
      minFineAmount: this.minFineAmount,
      maxFineAmount: this.maxFineAmount,
      penaltyAddition: this.penaltyAddition,
      legalReference: this.legalReference,
      createdAt: this.createdAt
    };
  }
}

module.exports = TrafficFineModel;
