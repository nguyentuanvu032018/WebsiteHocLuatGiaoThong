const { pool } = require('../config/db.config');
const AnswerModel = require('./answer.model');

/**
 * Lớp Thực thể Lượt Thi Sát Hạch (Exam Session Model Entity)
 * Quản lý phiên thi, chi tiết câu hỏi thi và kết quả làm bài của thí sinh
 */
class ExamSessionModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.userId = data.user_id || data.userId || null;
    this.userFullName = data.user_full_name || data.userFullName || '';
    this.licenseTypeId = data.license_type_id || data.licenseTypeId || null;
    this.licenseCode = data.license_code || data.licenseCode || '';
    this.licenseName = data.license_name || data.licenseName || '';
    this.durationMinutes = Number(data.duration_minutes || data.durationMinutes || 0);
    this.passingScore = Number(data.passing_score || data.passingScore || 0);
    this.score = Number(data.score || 0);
    this.totalQuestions = Number(data.total_questions || data.totalQuestions || 0);
    this.hasParalysisFailed = data.has_paralysis_failed !== undefined ? !!data.has_paralysis_failed : (data.hasParalysisFailed || false);
    this.isPassed = data.is_passed !== undefined ? !!data.is_passed : (data.isPassed || false);
    this.timeSpentSeconds = Number(data.time_spent_seconds || data.timeSpentSeconds || 0);
    this.startedAt = data.started_at || data.startedAt || null;
    this.submittedAt = data.submitted_at || data.submittedAt || null;
    this.questions = data.questions || [];
  }

  /**
   * Tạo phiên thi mới trong CSDL và gắn chi tiết danh sách câu hỏi
   * @param {Object} sessionData { userId, licenseTypeId, totalQuestions, questionIds }
   * @returns {Promise<ExamSessionModel>}
   */
  static async create({ userId, licenseTypeId, totalQuestions, questionIds }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Tạo bản ghi exam_sessions
      const [sessionResult] = await connection.query(
        `INSERT INTO exam_sessions (user_id, license_type_id, total_questions, started_at)
         VALUES (?, ?, ?, NOW())`,
        [userId, licenseTypeId, totalQuestions]
      );

      const sessionId = sessionResult.insertId;

      // 2. Chèn danh sách chi tiết các câu hỏi vào exam_session_details
      for (const qId of questionIds) {
        await connection.query(
          `INSERT INTO exam_session_details (exam_session_id, question_id, selected_answer_id, is_correct)
           VALUES (?, ?, NULL, 0)`,
          [sessionId, qId]
        );
      }

      await connection.commit();

      // Lấy lại dữ liệu đầy đủ vừa tạo
      return await ExamSessionModel.findById(sessionId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Tìm phiên thi theo ID
   * @param {number} id 
   * @returns {Promise<ExamSessionModel|null>}
   */
  static async findById(id) {
    const query = `
      SELECT 
        s.*,
        u.full_name AS user_full_name,
        l.code AS license_code,
        l.name AS license_name,
        l.duration_minutes,
        l.passing_score
      FROM exam_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN license_types l ON s.license_type_id = l.id
      WHERE s.id = ?
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;
    return new ExamSessionModel(rows[0]);
  }

  static async findQuestionDetailsForGrading(sessionId) {
    const query = `
      SELECT
        d.id AS detail_id,
        d.question_id,
        q.chapter_id,
        q.content,
        q.image_url,
        q.is_paralysis,
        q.explanation,
        c.title AS chapter_title
      FROM exam_session_details d
      JOIN questions q ON d.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE d.exam_session_id = ?
      ORDER BY d.id ASC
    `;
    const [rows] = await pool.query(query, [sessionId]);
    return rows;
  }

  /**
   * Tìm phiên thi theo ID kèm danh sách chi tiết câu hỏi và các lựa chọn đáp án
   * @param {number} id 
   * @param {boolean} includeAnswers Có đính kèm danh sách lựa chọn đáp án hay không
   * @param {boolean} includeCorrect Có đính kèm cờ is_correct của đáp án hay không (BẢO MẬT: false khi làm bài thi)
   * @returns {Promise<ExamSessionModel|null>}
   */
  static async findByIdWithQuestions(id, includeAnswers = true, includeCorrect = false) {
    const session = await ExamSessionModel.findById(id);
    if (!session) return null;

    const detailsQuery = `
      SELECT 
        d.id AS detail_id,
        d.question_id,
        d.selected_answer_id,
        d.is_correct AS detail_is_correct,
        q.chapter_id,
        q.content,
        q.image_url,
        q.is_paralysis,
        q.explanation,
        c.title AS chapter_title
      FROM exam_session_details d
      JOIN questions q ON d.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE d.exam_session_id = ?
      ORDER BY d.id ASC
    `;
    const [rows] = await pool.query(detailsQuery, [id]);

    const questions = [];
    for (const row of rows) {
      let answers = [];
      if (includeAnswers) {
        answers = await AnswerModel.findByQuestionId(row.question_id, includeCorrect);
      }

      questions.push({
        detailId: row.detail_id,
        id: row.question_id,
        chapterId: row.chapter_id,
        chapterTitle: row.chapter_title,
        content: row.content,
        imageUrl: row.image_url,
        isParalysis: !!row.is_paralysis,
        explanation: includeCorrect ? row.explanation : undefined,
        selectedAnswerId: row.selected_answer_id,
        isCorrect: includeCorrect ? !!row.detail_is_correct : undefined,
        answers: answers.map(a => (a instanceof AnswerModel ? a.toJSON(includeCorrect) : a))
      });
    }

    session.questions = questions;
    return session;
  }

  /**
   * Lấy lịch sử thi của một học viên có lọc và phân trang
   * @param {number} userId 
   * @param {Object} options { page, limit, status, licenseTypeId }
   */
  static async findByUserId(userId, { page = 1, limit = 10, status = 'all', licenseTypeId = 'all', licenseTypeIds = null } = {}) {
    const offset = (Math.max(1, page) - 1) * limit;
    let whereConditions = ['s.user_id = ?'];
    const params = [userId];

    if (status === 'passed') {
      whereConditions.push('s.is_passed = 1');
    } else if (status === 'failed') {
      whereConditions.push('s.is_passed = 0 AND s.submitted_at IS NOT NULL');
    } else if (status === 'paralysis_failed') {
      whereConditions.push('s.has_paralysis_failed = 1');
    }

    if (licenseTypeId && licenseTypeId !== 'all') {
      whereConditions.push('s.license_type_id = ?');
      params.push(Number(licenseTypeId));
    } else if (Array.isArray(licenseTypeIds) && licenseTypeIds.length > 0) {
      whereConditions.push(`s.license_type_id IN (${licenseTypeIds.map(() => '?').join(',')})`);
      params.push(...licenseTypeIds);
    }

    const whereSql = 'WHERE ' + whereConditions.join(' AND ');

    const countSql = `SELECT COUNT(*) AS total FROM exam_sessions s ${whereSql}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    const query = `
      SELECT 
        s.*,
        l.code AS license_code,
        l.name AS license_name,
        l.duration_minutes,
        l.passing_score
      FROM exam_sessions s
      JOIN license_types l ON s.license_type_id = l.id
      ${whereSql}
      ORDER BY s.started_at DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(query, [...params, Number(limit), Number(offset)]);

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      sessions: rows.map(r => new ExamSessionModel(r))
    };
  }

  /**
   * Thống kê tổng hợp kết quả các lần thi của học viên
   * @param {number} userId 
   */
  static async getUserStatistics(userId, licenseTypeIds = null) {
    const hasLicenseScope = Array.isArray(licenseTypeIds) && licenseTypeIds.length > 0;
    const licenseCondition = hasLicenseScope
      ? ` AND license_type_id IN (${licenseTypeIds.map(() => '?').join(',')})`
      : '';
    const scopedWeakChapterCondition = hasLicenseScope
      ? ` AND s.license_type_id IN (${licenseTypeIds.map(() => '?').join(',')})`
      : '';
    const scopedParams = [userId, ...(licenseTypeIds || [])];
    const statsQuery = `
      SELECT 
        COUNT(*) AS total_exams,
        SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) AS passed_exams,
        SUM(CASE WHEN is_passed = 0 AND submitted_at IS NOT NULL THEN 1 ELSE 0 END) AS failed_exams,
        SUM(CASE WHEN has_paralysis_failed = 1 THEN 1 ELSE 0 END) AS paralysis_failed_exams,
        COALESCE(AVG(score), 0) AS average_score
      FROM exam_sessions 
      WHERE user_id = ? AND submitted_at IS NOT NULL${licenseCondition}
    `;
    const [statsRows] = await pool.query(statsQuery, scopedParams);
    const row = statsRows[0] || {};
    const totalExams = Number(row.total_exams) || 0;
    const passedExams = Number(row.passed_exams) || 0;
    const failedExams = Number(row.failed_exams) || 0;
    const paralysisFailedExams = Number(row.paralysis_failed_exams) || 0;
    const averageScore = Number(Number(row.average_score).toFixed(1)) || 0;
    const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;

    // Các chương thường xuyên làm sai nhất
    const weakChaptersQuery = `
      SELECT c.id, c.title, COUNT(d.id) AS wrong_count
      FROM exam_session_details d
      JOIN exam_sessions s ON d.exam_session_id = s.id
      JOIN questions q ON d.question_id = q.id
      JOIN chapters c ON q.chapter_id = c.id
      WHERE s.user_id = ? AND s.submitted_at IS NOT NULL AND d.is_correct = 0${scopedWeakChapterCondition}
      GROUP BY c.id, c.title
      ORDER BY wrong_count DESC
      LIMIT 3
    `;
    const [weakRows] = await pool.query(weakChaptersQuery, scopedParams);
    const weakChapters = weakRows.map(r => ({
      id: r.id,
      title: r.title,
      wrongCount: Number(r.wrong_count)
    }));

    return {
      totalExams,
      passedExams,
      failedExams,
      paralysisFailedExams,
      averageScore,
      passRate,
      weakChapters
    };
  }

  /**
   * Lưu kết quả chấm điểm bài thi của thí sinh
   * @param {number} sessionId 
   * @param {Object} submissionData { score, hasParalysisFailed, isPassed, timeSpentSeconds, details }
   */
  static async updateSubmission(sessionId, { score, hasParalysisFailed, isPassed, timeSpentSeconds, details }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Cập nhật bảng exam_sessions
      await connection.query(
        `UPDATE exam_sessions 
         SET score = ?, 
             has_paralysis_failed = ?, 
             is_passed = ?, 
             time_spent_seconds = ?, 
             submitted_at = NOW() 
         WHERE id = ?`,
        [
          score,
          hasParalysisFailed ? 1 : 0,
          isPassed ? 1 : 0,
          timeSpentSeconds || 0,
          sessionId
        ]
      );

      // 2. Cập nhật chi tiết từng câu trong exam_session_details
      for (const item of details) {
        await connection.query(
          `UPDATE exam_session_details 
           SET selected_answer_id = ?, 
               is_correct = ? 
           WHERE id = ? AND exam_session_id = ?`,
          [
            item.selectedAnswerId || null,
            item.isCorrect ? 1 : 0,
            item.detailId,
            sessionId
          ]
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
   * @param {boolean} includeQuestions Có xuất kèm mảng câu hỏi hay không
   */
  toJSON(includeQuestions = true) {
    const data = {
      id: this.id,
      userId: this.userId,
      userFullName: this.userFullName,
      licenseTypeId: this.licenseTypeId,
      licenseCode: this.licenseCode,
      licenseName: this.licenseName,
      durationMinutes: this.durationMinutes,
      passingScore: this.passingScore,
      score: this.score,
      totalQuestions: this.totalQuestions,
      hasParalysisFailed: this.hasParalysisFailed,
      isPassed: this.isPassed,
      timeSpentSeconds: this.timeSpentSeconds,
      startedAt: this.startedAt,
      submittedAt: this.submittedAt
    };

    if (includeQuestions && this.questions && this.questions.length > 0) {
      data.questions = this.questions;
    }

    return data;
  }
}

module.exports = ExamSessionModel;
