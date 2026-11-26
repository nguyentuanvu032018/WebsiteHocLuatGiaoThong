const { pool } = require('../config/db.config');

class AdminDashboardModel {
  static async getStats() {
    const [userCount] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'student'");
    const [adminCount] = await pool.query("SELECT COUNT(*) AS total FROM users WHERE role = 'admin'");
    const [questionCount] = await pool.query("SELECT COUNT(*) AS total, SUM(CASE WHEN is_paralysis = 1 THEN 1 ELSE 0 END) AS paralysis_count FROM questions WHERE is_active = 1");
    const [examStats] = await pool.query(`
      SELECT 
        COUNT(*) AS total_exams,
        SUM(CASE WHEN is_passed = 1 THEN 1 ELSE 0 END) AS passed_exams,
        SUM(CASE WHEN is_passed = 0 AND submitted_at IS NOT NULL THEN 1 ELSE 0 END) AS failed_exams,
        SUM(CASE WHEN is_passed = 0 AND has_paralysis_failed = 1 THEN 1 ELSE 0 END) AS paralysis_failed_exams,
        COALESCE(AVG(score), 0) AS average_score
      FROM exam_sessions 
      WHERE submitted_at IS NOT NULL
    `);
    const [signCount] = await pool.query('SELECT COUNT(*) AS total FROM traffic_signs');
    const [fineCount] = await pool.query('SELECT COUNT(*) AS total FROM traffic_fines');
    const [licenseStatsRows] = await pool.query(`
      SELECT 
        l.id, 
        l.code, 
        l.name,
        l.total_questions,
        l.passing_score,
        COUNT(s.id) AS total_exams,
        SUM(CASE WHEN s.is_passed = 1 THEN 1 ELSE 0 END) AS passed_exams,
        SUM(CASE WHEN s.is_passed = 0 AND s.submitted_at IS NOT NULL THEN 1 ELSE 0 END) AS failed_exams,
        COALESCE(AVG(s.score), 0) AS average_score
      FROM license_types l
      LEFT JOIN exam_sessions s ON l.id = s.license_type_id AND s.submitted_at IS NOT NULL
      GROUP BY l.id, l.code, l.name, l.total_questions, l.passing_score
      ORDER BY l.id ASC
    `);
    const [chapterStatsRows] = await pool.query(`
      SELECT 
        c.id, 
        c.title,
        COUNT(q.id) AS question_count,
        SUM(CASE WHEN q.is_paralysis = 1 THEN 1 ELSE 0 END) AS paralysis_count
      FROM chapters c
      LEFT JOIN questions q ON c.id = q.chapter_id AND q.is_active = 1
      GROUP BY c.id, c.title
      ORDER BY c.order_number ASC
    `);
    const [trendRows] = await pool.query(`
      SELECT 
        DATE_FORMAT(s.submitted_at, '%Y-%m-%d') AS raw_date,
        DATE_FORMAT(s.submitted_at, '%d/%m') AS date_label,
        COUNT(s.id) AS total_count,
        SUM(CASE WHEN s.is_passed = 1 THEN 1 ELSE 0 END) AS passed_count,
        SUM(CASE WHEN s.is_passed = 0 THEN 1 ELSE 0 END) AS failed_count
      FROM exam_sessions s
      WHERE s.submitted_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
      GROUP BY raw_date, date_label
      ORDER BY raw_date ASC
    `);
    const [recentExamsRows] = await pool.query(`
      SELECT 
        s.id,
        u.full_name AS user_name,
        u.email AS user_email,
        l.code AS license_code,
        s.score,
        s.total_questions,
        s.is_passed,
        s.has_paralysis_failed,
        s.time_spent_seconds,
        s.submitted_at
      FROM exam_sessions s
      JOIN users u ON s.user_id = u.id
      JOIN license_types l ON s.license_type_id = l.id
      WHERE s.submitted_at IS NOT NULL
      ORDER BY s.submitted_at DESC
      LIMIT 5
    `);
    const [topStudentsRows] = await pool.query(`
      SELECT 
        u.id,
        u.full_name,
        u.email,
        COUNT(s.id) AS exam_count,
        SUM(CASE WHEN s.is_passed = 1 THEN 1 ELSE 0 END) AS passed_count,
        COALESCE(AVG(s.score), 0) AS avg_score
      FROM users u
      JOIN exam_sessions s ON u.id = s.user_id AND s.submitted_at IS NOT NULL
      WHERE u.role = 'student'
      GROUP BY u.id, u.full_name, u.email
      ORDER BY exam_count DESC, avg_score DESC
      LIMIT 5
    `);

    return {
      userCount,
      adminCount,
      questionCount,
      examStats,
      signCount,
      fineCount,
      licenseStatsRows,
      chapterStatsRows,
      trendRows,
      recentExamsRows,
      topStudentsRows
    };
  }
}

module.exports = AdminDashboardModel;
