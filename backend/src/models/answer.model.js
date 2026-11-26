const { pool } = require('../config/db.config');

/**
 * Lớp Thực thể Đáp án (Answer Model Entity)
 * Quản lý các phương án trả lời của từng câu hỏi
 */
class AnswerModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.questionId = data.question_id || data.questionId || null;
    this.answerText = data.answer_text || data.answerText || '';
    this.isCorrect = data.is_correct !== undefined ? !!data.is_correct : false;
    this.orderNumber = data.order_number || data.orderNumber || 1;
  }

  /**
   * Lấy danh sách đáp án của một câu hỏi
   * @param {number} questionId ID câu hỏi
   * @param {boolean} includeCorrect Có đính kèm trường isCorrect hay không (Mặc định: false để chống gian lận)
   * @returns {Promise<Array<AnswerModel>>}
   */
  static async findByQuestionId(questionId, includeCorrect = false) {
    let sql = 'SELECT id, question_id, answer_text, order_number';
    if (includeCorrect) {
      sql += ', is_correct';
    }
    sql += ' FROM answers WHERE question_id = ? ORDER BY order_number ASC';

    const [rows] = await pool.query(sql, [questionId]);
    return rows.map(row => new AnswerModel(row));
  }

  /**
   * Lấy đáp án đúng của một câu hỏi (Dùng cho Server chấm điểm)
   * @param {number} questionId 
   * @returns {Promise<AnswerModel|null>}
   */
  static async findCorrectByQuestionId(questionId) {
    const query = `
      SELECT id, question_id, answer_text, is_correct, order_number 
      FROM answers 
      WHERE question_id = ? AND is_correct = 1 
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [questionId]);
    if (rows.length === 0) return null;
    return new AnswerModel(rows[0]);
  }

  /**
   * Thêm mới một đáp án cho câu hỏi
   * @param {Object} data 
   * @returns {Promise<AnswerModel>}
   */
  static async create({ questionId, answerText, isCorrect = false, orderNumber = 1 }) {
    const [result] = await pool.query(
      `INSERT INTO answers (question_id, answer_text, is_correct, order_number) 
       VALUES (?, ?, ?, ?)`,
      [questionId, answerText.trim(), isCorrect ? 1 : 0, orderNumber]
    );

    return new AnswerModel({
      id: result.insertId,
      question_id: questionId,
      answer_text: answerText.trim(),
      is_correct: isCorrect,
      order_number: orderNumber
    });
  }

  /**
   * Chuyển đổi thành Object JSON trả về Client (Tự động ẩn isCorrect nếu không được phép)
   */
  toJSON(includeCorrect = false) {
    const obj = {
      id: this.id,
      questionId: this.questionId,
      answerText: this.answerText,
      orderNumber: this.orderNumber
    };
    if (includeCorrect) {
      obj.isCorrect = this.isCorrect;
    }
    return obj;
  }
}

module.exports = AnswerModel;
