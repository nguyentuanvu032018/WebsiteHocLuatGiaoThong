const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Hạng Giấy Phép Lái Xe & Phòng Thi Sát Hạch (License Type / Exam Room Model)
 * Quản lý các phòng thi theo hạng bằng: A, A1, B, B1, C, C1, D, D1, D2
 */
class LicenseTypeModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.code = data.code || '';
    this.name = data.name || '';
    this.totalQuestions = data.total_questions !== undefined ? Number(data.total_questions) : Number(data.totalQuestions || 0);
    this.durationMinutes = data.duration_minutes !== undefined ? Number(data.duration_minutes) : Number(data.durationMinutes || 0);
    this.passingScore = data.passing_score !== undefined ? Number(data.passing_score) : Number(data.passingScore || 0);
    this.description = data.description || '';
    this.isActive = data.is_active !== undefined ? !!data.is_active : true;
    this.createdAt = data.created_at || data.createdAt || null;
    this.totalSessions = Number(data.total_sessions || data.totalSessions || 0);
    this.passedSessions = Number(data.passed_sessions || data.passedSessions || 0);
    this.inProgressSessions = Number(data.in_progress_sessions || data.inProgressSessions || 0);
  }

  /**
   * Lấy danh sách toàn bộ các hạng bằng / phòng thi sát hạch
   * Hỗ trợ gọi kiểu boolean cũ: findAll(true) hoặc Object options: findAll({ activeOnly, includeStats })
   * @param {boolean|Object} options 
   * @returns {Promise<Array<LicenseTypeModel>>}
   */
  static async findAll(options = true) {
    let activeOnly = false;
    let includeStats = false;

    if (typeof options === 'boolean') {
      activeOnly = options;
    } else if (typeof options === 'object' && options !== null) {
      activeOnly = !!options.activeOnly;
      includeStats = !!options.includeStats;
    }

    let sql;
    if (includeStats) {
      sql = `
        SELECT 
          lt.*,
          COUNT(DISTINCT es.id) AS total_sessions,
          COUNT(DISTINCT CASE WHEN es.is_passed = 1 THEN es.id END) AS passed_sessions,
          COUNT(DISTINCT CASE WHEN es.submitted_at IS NULL THEN es.id END) AS in_progress_sessions
        FROM license_types lt
        LEFT JOIN exam_sessions es ON es.license_type_id = lt.id
        ${activeOnly ? 'WHERE lt.is_active = 1' : ''}
        GROUP BY lt.id
        ORDER BY lt.id ASC
      `;
    } else {
      sql = `SELECT * FROM license_types ${activeOnly ? 'WHERE is_active = 1' : ''} ORDER BY id ASC`;
    }

    const [rows] = await pool.query(sql);
    return rows.map(row => new LicenseTypeModel(row));
  }

  /**
   * Tìm hạng bằng / phòng thi theo ID
   * @param {number} id 
   * @param {boolean} includeStats
   * @returns {Promise<LicenseTypeModel|null>}
   */
  static async findById(id, includeStats = false) {
    let sql;
    if (includeStats) {
      sql = `
        SELECT 
          lt.*,
          COUNT(DISTINCT es.id) AS total_sessions,
          COUNT(DISTINCT CASE WHEN es.is_passed = 1 THEN es.id END) AS passed_sessions,
          COUNT(DISTINCT CASE WHEN es.submitted_at IS NULL THEN es.id END) AS in_progress_sessions
        FROM license_types lt
        LEFT JOIN exam_sessions es ON es.license_type_id = lt.id
        WHERE lt.id = ?
        GROUP BY lt.id
        LIMIT 1
      `;
    } else {
      sql = 'SELECT * FROM license_types WHERE id = ? LIMIT 1';
    }

    const [rows] = await pool.query(sql, [id]);
    if (rows.length === 0) return null;
    return new LicenseTypeModel(rows[0]);
  }

  /**
   * Tìm hạng bằng theo mã ký hiệu (VD: 'A', 'B1', 'D2'...)
   * @param {string} code 
   * @returns {Promise<LicenseTypeModel|null>}
   */
  static async findByCode(code) {
    if (!code) return null;
    const [rows] = await pool.query(
      'SELECT * FROM license_types WHERE code = ? LIMIT 1',
      [code.trim().toUpperCase()]
    );
    if (rows.length === 0) return null;
    return new LicenseTypeModel(rows[0]);
  }

  /**
   * Tạo mới phòng thi / hạng bằng sát hạch
   * @param {Object} data { code, name, totalQuestions, durationMinutes, passingScore, description, isActive }
   * @returns {Promise<LicenseTypeModel>}
   */
  static async create(data) {
    const code = (data.code || '').trim().toUpperCase();
    const name = (data.name || '').trim();
    const totalQuestions = Number(data.totalQuestions || data.total_questions || 30);
    const durationMinutes = Number(data.durationMinutes || data.duration_minutes || 20);
    const passingScore = Number(data.passingScore || data.passing_score || 27);
    const description = (data.description || '').trim();
    const isActive = data.isActive !== undefined ? (data.isActive ? 1 : 0) : (data.is_active !== undefined ? (data.is_active ? 1 : 0) : 1);

    if (!code) {
      const error = new Error('Mã hạng bằng / phòng thi không được để trống (VD: A, B1, C...)');
      error.statusCode = 400;
      throw error;
    }

    if (!name) {
      const error = new Error('Tên phòng thi / hạng bằng không được để trống');
      error.statusCode = 400;
      throw error;
    }

    if (totalQuestions <= 0 || durationMinutes <= 0 || passingScore <= 0) {
      const error = new Error('Số lượng câu hỏi, thời gian thi và điểm đạt yêu cầu phải lớn hơn 0');
      error.statusCode = 400;
      throw error;
    }

    if (passingScore > totalQuestions) {
      const error = new Error('Điểm yêu cầu đạt không được lớn hơn tổng số câu hỏi của đề thi');
      error.statusCode = 400;
      throw error;
    }

    // Kiểm tra trùng mã code
    const existing = await this.findByCode(code);
    if (existing) {
      const error = new Error(`Mã hạng bằng "${code}" đã tồn tại trong hệ thống`);
      error.statusCode = 400;
      throw error;
    }

    const [result] = await pool.query(
      `INSERT INTO license_types (code, name, total_questions, duration_minutes, passing_score, description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code, name, totalQuestions, durationMinutes, passingScore, description, isActive]
    );

    const newLicenseId = result.insertId;

    // Tự động tạo ma trận đề thi mặc định phân bổ đều theo 7 chương để tránh lỗi khi thí sinh thi thử
    const [chapters] = await pool.query('SELECT id FROM chapters ORDER BY order_number ASC');
    if (chapters.length > 0) {
      const avgQuestions = Math.floor(totalQuestions / chapters.length);
      let remainder = totalQuestions % chapters.length;

      for (let i = 0; i < chapters.length; i++) {
        const qCount = avgQuestions + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder--;
        // Chương 1 và 2 mặc định 1 câu điểm liệt nếu có câu hỏi
        const pCount = (i === 0 || i === 1) && qCount > 0 ? 1 : 0;

        await pool.query(
          `INSERT INTO exam_structure_rules (license_type_id, chapter_id, question_count, paralysis_count)
           VALUES (?, ?, ?, ?)`,
          [newLicenseId, chapters[i].id, qCount, pCount]
        );
      }
    }

    return await this.findById(newLicenseId, true);
  }

  /**
   * Cập nhật thông tin phòng thi / hạng bằng sát hạch
   * @param {number} id 
   * @param {Object} data 
   * @returns {Promise<LicenseTypeModel>}
   */
  static async update(id, data) {
    const license = await this.findById(id);
    if (!license) {
      const error = new Error(`Không tìm thấy phòng thi / hạng bằng với ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const updates = [];
    const params = [];

    if (data.code !== undefined) {
      const newCode = data.code.trim().toUpperCase();
      if (!newCode) {
        const error = new Error('Mã hạng bằng không được để trống');
        error.statusCode = 400;
        throw error;
      }
      // Kiểm tra trùng code với hạng khác
      const [existing] = await pool.query(
        'SELECT id FROM license_types WHERE code = ? AND id != ? LIMIT 1',
        [newCode, id]
      );
      if (existing.length > 0) {
        const error = new Error(`Mã hạng bằng "${newCode}" đã được sử dụng bởi phòng thi khác`);
        error.statusCode = 400;
        throw error;
      }
      updates.push('code = ?');
      params.push(newCode);
    }

    if (data.name !== undefined) {
      const newName = data.name.trim();
      if (!newName) {
        const error = new Error('Tên phòng thi không được để trống');
        error.statusCode = 400;
        throw error;
      }
      updates.push('name = ?');
      params.push(newName);
    }

    if (data.totalQuestions !== undefined || data.total_questions !== undefined) {
      const totalQ = Number(data.totalQuestions || data.total_questions);
      if (totalQ <= 0) {
        const error = new Error('Tổng số câu hỏi phải lớn hơn 0');
        error.statusCode = 400;
        throw error;
      }
      updates.push('total_questions = ?');
      params.push(totalQ);
    }

    if (data.durationMinutes !== undefined || data.duration_minutes !== undefined) {
      const duration = Number(data.durationMinutes || data.duration_minutes);
      if (duration <= 0) {
        const error = new Error('Thời gian thi phải lớn hơn 0');
        error.statusCode = 400;
        throw error;
      }
      updates.push('duration_minutes = ?');
      params.push(duration);
    }

    if (data.passingScore !== undefined || data.passing_score !== undefined) {
      const score = Number(data.passingScore || data.passing_score);
      if (score <= 0) {
        const error = new Error('Điểm yêu cầu đạt phải lớn hơn 0');
        error.statusCode = 400;
        throw error;
      }
      updates.push('passing_score = ?');
      params.push(score);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description.trim());
    }

    if (data.isActive !== undefined || data.is_active !== undefined) {
      const activeVal = (data.isActive !== undefined ? !!data.isActive : !!data.is_active) ? 1 : 0;
      updates.push('is_active = ?');
      params.push(activeVal);
    }

    if (updates.length > 0) {
      params.push(id);
      await pool.query(
        `UPDATE license_types SET ${updates.join(', ')} WHERE id = ?`,
        params
      );
    }

    return await this.findById(id, true);
  }

  /**
   * Bật / Tắt trạng thái mở phòng thi
   * @param {number} id 
   * @returns {Promise<LicenseTypeModel>}
   */
  static async toggleActive(id) {
    const license = await this.findById(id);
    if (!license) {
      const error = new Error(`Không tìm thấy phòng thi với ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    const nextState = license.isActive ? 0 : 1;
    await pool.query('UPDATE license_types SET is_active = ? WHERE id = ?', [nextState, id]);
    return await this.findById(id, true);
  }

  /**
   * Xóa phòng thi / hạng bằng
   * Kiểm tra an toàn: nếu đã có lượt thi (exam_sessions), chặn xóa để bảo toàn dữ liệu lịch sử
   * @param {number} id 
   * @returns {Promise<boolean>}
   */
  static async deleteById(id) {
    const license = await this.findById(id);
    if (!license) {
      const error = new Error(`Không tìm thấy phòng thi với ID ${id}`);
      error.statusCode = 404;
      throw error;
    }

    // 1. Kiểm tra lượt thi liên kết
    const [sessions] = await pool.query(
      'SELECT COUNT(*) AS count FROM exam_sessions WHERE license_type_id = ?',
      [id]
    );
    const sessionCount = sessions[0].count;

    if (sessionCount > 0) {
      const error = new Error(
        `Không thể xóa phòng thi "${license.name}" vì đã có ${sessionCount} lượt thi sát hạch liên kết. Để bảo toàn lịch sử thi của học viên, vui lòng sử dụng chức năng "Đóng phòng thi" thay thế.`
      );
      error.statusCode = 400;
      throw error;
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 2. Xóa các quy tắc ma trận đề thi liên quan
      await connection.query('DELETE FROM exam_structure_rules WHERE license_type_id = ?', [id]);

      // 3. Xóa hạng bằng
      await connection.query('DELETE FROM license_types WHERE id = ?', [id]);

      await connection.commit();
      return true;
    } catch (err) {
      await connection.rollback();
      throw err;
    } finally {
      connection.release();
    }
  }

  /**
   * Chuyển đổi thành Object JSON trả về Client
   */
  toJSON() {
    return {
      id: this.id,
      code: this.code,
      name: this.name,
      totalQuestions: this.totalQuestions,
      durationMinutes: this.durationMinutes,
      passingScore: this.passingScore,
      description: this.description,
      isActive: this.isActive,
      createdAt: this.createdAt,
      totalSessions: this.totalSessions,
      passedSessions: this.passedSessions,
      inProgressSessions: this.inProgressSessions
    };
  }
}

module.exports = LicenseTypeModel;
