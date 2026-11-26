const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Người dùng (User Model Entity)
 * Quản lý các tương tác trực tiếp với bảng `users` trong cơ sở dữ liệu
 */
class UserModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.fullName = data.full_name || data.fullName || '';
    this.email = data.email || '';
    this.passwordHash = data.password_hash || data.passwordHash || '';
    this.phone = data.phone || null;
    this.avatar = data.avatar || null;
    this.role = data.role || 'student';
    this.isActive = data.is_active !== undefined ? !!data.is_active : true;
    this.tokenVersion = data.token_version !== undefined ? Number(data.token_version) : 1;
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  /**
   * Tìm người dùng theo địa chỉ Email
   * @param {string} email 
   * @param {boolean} caseSensitive - Mặc định false. Nếu true: phân biệt chính xác chữ hoa / chữ thường (BINARY)
   * @returns {Promise<UserModel|null>}
   */
  static async findByEmail(email, caseSensitive = false) {
    const trimmedEmail = email ? email.trim() : '';
    if (!trimmedEmail) return null;

    let query = 'SELECT id, full_name, email, password_hash, phone, avatar, role, is_active, token_version, created_at, updated_at FROM users WHERE ';
    if (caseSensitive) {
      query += 'BINARY email = ? LIMIT 1';
    } else {
      query += 'email = ? LIMIT 1';
    }

    const [rows] = await pool.query(query, [trimmedEmail]);

    if (rows.length === 0) {
      return null;
    }

    // Kiểm tra thêm lớp an toàn bằng JavaScript để tuyệt đối khớp từng ký tự hoa/thường
    if (caseSensitive && rows[0].email !== trimmedEmail) {
      return null;
    }

    return new UserModel(rows[0]);
  }

  /**
   * Tìm người dùng theo ID
   * @param {number} id 
   * @returns {Promise<UserModel|null>}
   */
  static async findById(id) {
    const [rows] = await pool.query(
      'SELECT id, full_name, email, phone, avatar, role, is_active, token_version, created_at, updated_at FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (rows.length === 0) {
      return null;
    }

    return new UserModel(rows[0]);
  }

  /**
   * Kiểm tra email đã tồn tại hay chưa
   * @param {string} email 
   * @returns {Promise<boolean>}
   */
  static async existsByEmail(email) {
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email.trim().toLowerCase()]
    );
    return rows.length > 0;
  }

  /**
   * Tạo tài khoản người dùng mới
   * @param {Object} userData 
   * @returns {Promise<UserModel>}
   */
  static async create({ fullName, email, passwordHash, phone, avatar = null, role = 'student' }) {
    const [result] = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, phone, avatar, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [fullName.trim(), email.trim().toLowerCase(), passwordHash, phone ? phone.trim() : null, avatar || null, role]
    );

    return new UserModel({
      id: result.insertId,
      full_name: fullName.trim(),
      email: email.trim().toLowerCase(),
      password_hash: passwordHash,
      phone: phone ? phone.trim() : null,
      avatar: avatar || null,
      role: role,
      is_active: 1,
      created_at: new Date()
    });
  }

  /**
   * Lấy danh sách người dùng có lọc, tìm kiếm và phân trang (Kèm số lượt thi)
   * @param {Object} options { page, limit, role, isActive, keyword }
   */
  static async findFiltered({ page = 1, limit = 10, role = 'all', isActive = 'all', keyword = '' } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    let whereClauses = [];
    let params = [];

    if (role && role !== 'all') {
      whereClauses.push('u.role = ?');
      params.push(role);
    }

    if (isActive === '1' || isActive === 1 || isActive === true) {
      whereClauses.push('u.is_active = 1');
    } else if (isActive === '0' || isActive === 0 || isActive === false) {
      whereClauses.push('u.is_active = 0');
    }

    if (keyword && keyword.trim().length > 0) {
      whereClauses.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
      const kw = `%${keyword.trim()}%`;
      params.push(kw, kw, kw);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Đếm tổng số người dùng
    const countSql = `SELECT COUNT(*) AS total FROM users u ${whereSql}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // 2. Truy vấn danh sách kèm số lượt thi
    const query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.email, 
        u.phone, 
        u.avatar, 
        u.role, 
        u.is_active, 
        u.created_at, 
        u.updated_at,
        (SELECT COUNT(*) FROM exam_sessions s WHERE s.user_id = u.id AND s.submitted_at IS NOT NULL) AS exam_count,
        (SELECT COUNT(*) FROM exam_sessions s WHERE s.user_id = u.id AND s.is_passed = 1) AS passed_count
      FROM users u
      ${whereSql}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [...params, Number(limit), Number(offset)]);

    const users = rows.map(r => ({
      id: r.id,
      fullName: r.full_name,
      email: r.email,
      phone: r.phone,
      avatar: r.avatar || null,
      role: r.role,
      isActive: !!r.is_active,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      examCount: Number(r.exam_count) || 0,
      passedCount: Number(r.passed_count) || 0
    }));

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      users
    };
  }

  /**
   * Cập nhật thông tin cá nhân người dùng (Họ tên, SĐT, Avatar)
   * Tuyệt đối không cho phép đổi email hay password qua hàm này
   */
  static async updateProfile(userId, { fullName, phone, avatar }) {
    const fields = ['full_name = ?', 'phone = ?', 'updated_at = NOW()'];
    const params = [fullName.trim(), phone ? phone.trim() : null];

    if (avatar !== undefined) {
      fields.push('avatar = ?');
      params.push(avatar);
    }

    params.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(userId);
  }

  static async setActive(userId, isActive) {
    await pool.query(
      'UPDATE users SET is_active = ?, token_version = token_version + 1 WHERE id = ?',
      [isActive ? 1 : 0, userId]
    );
  }

  static async setRole(userId, role) {
    await pool.query(
      'UPDATE users SET role = ?, token_version = token_version + 1 WHERE id = ?',
      [role, userId]
    );
  }

  static async countExamSessions(userId) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS exam_count FROM exam_sessions WHERE user_id = ?',
      [userId]
    );
    return Number(rows[0]?.exam_count) || 0;
  }

  static async deleteById(userId) {
    try {
      await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error) {
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
        const conflict = new Error('Không thể xóa tài khoản vì dữ liệu này đang được tham chiếu trong hệ thống.');
        conflict.statusCode = 409;
        conflict.isForeignKeyConstraint = true;
        throw conflict;
      }
      throw error;
    }
  }

  /**
   * Cập nhật mật khẩu đã băm cho người dùng
   * @param {number} userId 
   * @param {string} passwordHash 
   */
  static async updatePassword(userId, passwordHash) {
    await pool.query(
      'UPDATE users SET password_hash = ?, token_version = token_version + 1, updated_at = NOW() WHERE id = ?',
      [passwordHash, userId]
    );
    return true;
  }

  /**
   * Ẩn thông tin nhạy cảm (mật khẩu) khi trả về Client
   */
  toJSON() {
    return {
      id: this.id,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      avatar: this.avatar,
      role: this.role,
      isActive: this.isActive,
      createdAt: this.createdAt
    };
  }
}

module.exports = UserModel;
