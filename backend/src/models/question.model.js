const { pool } = require('../config/db.config');
const AnswerModel = require('./answer.model');

/**
 * Lớp Thực thể Câu Hỏi (Question Model Entity)
 * Quản lý ngân hàng 600 câu hỏi sát hạch lý thuyết
 */
class QuestionModel {
  constructor(data = {}) {
    this.id = data.id || null;
    this.chapterId = data.chapter_id || data.chapterId || null;
    this.chapterTitle = data.chapter_title || data.chapterTitle || '';
    this.content = data.content || '';
    this.imageUrl = data.image_url || data.imageUrl || null;
    this.isParalysis = data.is_paralysis !== undefined ? !!data.is_paralysis : (data.isParalysis || false);
    this.explanation = data.explanation || '';
    this.isActive = data.is_active !== undefined ? !!data.is_active : true;
    this.answers = data.answers || [];
    this.createdAt = data.created_at || data.createdAt || null;
  }

  /**
   * Tìm câu hỏi theo ID
   * @param {number} id 
   * @param {boolean} includeAnswers Có nạp kèm danh sách đáp án hay không
   * @param {boolean} includeCorrect Có kèm cờ isCorrect hay không
   * @returns {Promise<QuestionModel|null>}
   */
  static async findById(id, includeAnswers = true, includeCorrect = false, includeInactive = false) {
    const query = `
      SELECT q.*, c.title AS chapter_title
      FROM questions q
      JOIN chapters c ON q.chapter_id = c.id
      WHERE q.id = ? ${includeInactive ? '' : 'AND q.is_active = 1'}
      LIMIT 1
    `;
    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;

    const question = new QuestionModel(rows[0]);
    if (includeAnswers) {
      question.answers = await AnswerModel.findByQuestionId(question.id, includeCorrect);
    }
    return question;
  }

  static async ensureChapterQuestionCapacity(connection, chapterId, removedQuestionCount = 0) {
    const [rows] = await connection.query(
      'SELECT id, title FROM chapters WHERE id = ? FOR UPDATE',
      [chapterId]
    );
    if (rows.length === 0) {
      const error = new Error(`Không tìm thấy chương lý thuyết #${chapterId}`);
      error.statusCode = 404;
      throw error;
    }

    const [capacityRows] = await connection.query(
      `SELECT
         (SELECT COUNT(*) FROM questions q
          WHERE q.chapter_id = ? AND q.is_active = 1) AS active_count,
         COALESCE((SELECT MAX(esr.question_count)
                   FROM exam_structure_rules esr
                   WHERE esr.chapter_id = ?), 0) AS required_count`,
      [chapterId, chapterId]
    );

    const activeCount = Number(capacityRows[0].active_count);
    const requiredCount = Number(capacityRows[0].required_count);
    const remainingCount = activeCount - removedQuestionCount;
    if (remainingCount < requiredCount) {
      const error = new Error(
        `Không thể ẩn hoặc chuyển câu hỏi khỏi "${rows[0].title}". Sau thao tác, chương chỉ còn ${remainingCount} câu đang hoạt động, thấp hơn ${requiredCount} câu mà ma trận đề thi yêu cầu nhiều nhất. Vui lòng giữ lại/kích hoạt thêm câu hỏi hoặc điều chỉnh ma trận đề thi trước.`
      );
      error.statusCode = 409;
      throw error;
    }
  }

  static async findRandomActive({ chapterId = null, isParalysis = null, excludeIds = [], limit }) {
    const conditions = ['is_active = 1'];
    const params = [];

    if (chapterId !== null) {
      conditions.push('chapter_id = ?');
      params.push(Number(chapterId));
    }
    if (isParalysis !== null) {
      conditions.push('is_paralysis = ?');
      params.push(isParalysis ? 1 : 0);
    }
    if (excludeIds.length > 0) {
      conditions.push(`id NOT IN (${excludeIds.map(() => '?').join(',')})`);
      params.push(...excludeIds);
    }

    const [rows] = await pool.query(
      `SELECT id, chapter_id, content, image_url, is_paralysis, explanation
       FROM questions
       WHERE ${conditions.join(' AND ')}
       ORDER BY RAND()
       LIMIT ?`,
      [...params, Number(limit)]
    );
    return rows;
  }

  /**
   * Lấy danh sách câu hỏi có phân trang và bộ lọc linh hoạt
   * @param {Object} filter { chapterId, isParalysis, keyword, page, limit, includeAnswers, includeCorrect }
   * @returns {Promise<{total: number, page: number, limit: number, totalPages: number, questions: Array<QuestionModel>}>}
   */
  static async findFiltered({
    chapterId = null,
    isParalysis = null,
    isActive = 'all',
    keyword = '',
    page = 1,
    limit = 20,
    includeAnswers = true,
    includeCorrect = false
  }) {
    let whereClauses = [];
    let params = [];

    // Explicitly scope public callers to active questions; admin routes may request any status.
    if (isActive === '1' || isActive === 1 || isActive === true) {
      whereClauses.push('q.is_active = 1');
    } else if (isActive === '0' || isActive === 0 || isActive === false) {
      whereClauses.push('q.is_active = 0');
    } else if (isActive !== 'all') {
      whereClauses.push('q.is_active = 1');
    }

    if (chapterId && chapterId !== 'all') {
      whereClauses.push('q.chapter_id = ?');
      params.push(Number(chapterId));
    }

    if (isParalysis !== null && isParalysis !== undefined && isParalysis !== 'all') {
      whereClauses.push('q.is_paralysis = ?');
      params.push((isParalysis === '1' || isParalysis === 1 || isParalysis === true) ? 1 : 0);
    }

    if (keyword && keyword.trim().length > 0) {
      whereClauses.push('q.content LIKE ?');
      params.push(`%${keyword.trim()}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // 1. Đếm tổng số bản ghi
    const countSql = `SELECT COUNT(*) AS total FROM questions q ${whereSql}`;
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // 2. Lấy dữ liệu phân trang
    const offset = (Math.max(1, page) - 1) * limit;
    const dataSql = `
      SELECT q.*, c.title AS chapter_title
      FROM questions q
      JOIN chapters c ON q.chapter_id = c.id
      ${whereSql}
      ORDER BY q.id ASC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await pool.query(dataSql, [...params, Number(limit), Number(offset)]);

    const questions = rows.map(row => new QuestionModel(row));

    // 3. Tải kèm danh sách đáp án nếu được yêu cầu
    if (includeAnswers && questions.length > 0) {
      for (const q of questions) {
        q.answers = await AnswerModel.findByQuestionId(q.id, includeCorrect);
      }
    }

    return {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      questions
    };
  }

  /**
   * Bốc ngẫu nhiên câu hỏi theo chương phục vụ Thuật toán sinh đề thi
   * @param {number} chapterId 
   * @param {number} count Số câu cần lấy
   * @param {boolean} isParalysis Lấy câu điểm liệt hay câu thường
   * @returns {Promise<Array<QuestionModel>>}
   */
  static async findRandomByChapter(chapterId, count, isParalysis = false) {
    if (count <= 0) return [];

    const query = `
      SELECT q.id, q.chapter_id, q.content, q.image_url, q.is_paralysis, q.explanation
      FROM questions q
      WHERE q.chapter_id = ? AND q.is_paralysis = ? AND q.is_active = 1
      ORDER BY RAND()
      LIMIT ?
    `;
    const [rows] = await pool.query(query, [chapterId, isParalysis ? 1 : 0, count]);
    return rows.map(row => new QuestionModel(row));
  }

  /**
   * Tạo câu hỏi mới kèm danh sách các lựa chọn đáp án
   * @param {Object} data { chapterId, content, imageUrl, isParalysis, explanation, answers }
   * @returns {Promise<QuestionModel>}
   */
  static async create({
    chapterId,
    content,
    imageUrl = null,
    isParalysis = false,
    explanation = '',
    isActive = true,
    answers = []
  }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra ràng buộc khóa ngoại chapter_id với chapters
      const [chap] = await connection.query('SELECT id, title FROM chapters WHERE id = ?', [chapterId]);
      if (chap.length === 0) {
        const error = new Error(`Lỗi ràng buộc khóa ngoại: Chương lý thuyết #${chapterId} không tồn tại trong hệ thống`);
        error.statusCode = 400;
        throw error;
      }

      const [qResult] = await connection.query(
        `INSERT INTO questions (chapter_id, content, image_url, is_paralysis, explanation, is_active) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          chapterId,
          content.trim(),
          imageUrl,
          isParalysis ? 1 : 0,
          explanation,
          isActive === true || isActive === 1 || isActive === '1' ? 1 : 0
        ]
      );

      const questionId = qResult.insertId;

      const createdAnswers = [];
      for (let i = 0; i < answers.length; i++) {
        const ans = answers[i];
        const [aResult] = await connection.query(
          `INSERT INTO answers (question_id, answer_text, is_correct, order_number) 
           VALUES (?, ?, ?, ?)`,
          [questionId, ans.answerText.trim(), ans.isCorrect ? 1 : 0, ans.orderNumber || i + 1]
        );
        createdAnswers.push(new AnswerModel({
          id: aResult.insertId,
          question_id: questionId,
          answer_text: ans.answerText.trim(),
          is_correct: ans.isCorrect,
          order_number: ans.orderNumber || i + 1
        }));
      }

      await connection.commit();

      return new QuestionModel({
        id: questionId,
        chapter_id: chapterId,
        chapter_title: chap[0].title,
        content: content.trim(),
        image_url: imageUrl,
        is_paralysis: isParalysis,
        explanation,
        is_active: isActive === true || isActive === 1 || isActive === '1',
        answers: createdAnswers
      });
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        const err = new Error(`Lỗi ràng buộc khóa ngoại: Dữ liệu chương #${chapterId} không tồn tại`);
        err.statusCode = 400;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Cập nhật thông tin câu hỏi và các lựa chọn đáp án
   * @param {number} id 
   * @param {Object} data 
   * @returns {Promise<QuestionModel>}
   */
  static async update(id, { chapterId, content, imageUrl, isParalysis, explanation, isActive, answers }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // Kiểm tra câu hỏi có tồn tại không
      const [existing] = await connection.query('SELECT * FROM questions WHERE id = ? FOR UPDATE', [id]);
      if (existing.length === 0) {
        const error = new Error(`Không tìm thấy câu hỏi với ID = ${id}`);
        error.statusCode = 404;
        throw error;
      }

      const currentChapterId = Number(existing[0].chapter_id);
      const nextChapterId = chapterId !== undefined ? Number(chapterId) : currentChapterId;
      const willBeActive = isActive !== undefined
        ? (isActive === true || isActive === 1 || isActive === '1')
        : Boolean(existing[0].is_active);
      const removesActiveQuestion = Boolean(existing[0].is_active) &&
        (!willBeActive || nextChapterId !== currentChapterId);
      if (removesActiveQuestion) {
        await QuestionModel.ensureChapterQuestionCapacity(connection, currentChapterId, 1);
      }

      // 1. Cập nhật bảng questions
      const updateFields = [];
      const updateParams = [];

      if (chapterId !== undefined) {
        // Kiểm tra ràng buộc khóa ngoại chapter_id với chapters
        const [chap] = await connection.query('SELECT id FROM chapters WHERE id = ?', [chapterId]);
        if (chap.length === 0) {
          const error = new Error(`Lỗi ràng buộc khóa ngoại: Chương lý thuyết #${chapterId} không tồn tại trong hệ thống`);
          error.statusCode = 400;
          throw error;
        }
        updateFields.push('chapter_id = ?');
        updateParams.push(Number(chapterId));
      }

      if (content !== undefined) {
        updateFields.push('content = ?');
        updateParams.push(content.trim());
      }

      if (imageUrl !== undefined) {
        updateFields.push('image_url = ?');
        updateParams.push(imageUrl);
      }

      if (isParalysis !== undefined) {
        updateFields.push('is_paralysis = ?');
        updateParams.push(isParalysis ? 1 : 0);
      }

      if (explanation !== undefined) {
        updateFields.push('explanation = ?');
        updateParams.push(explanation);
      }

      if (isActive !== undefined) {
        updateFields.push('is_active = ?');
        updateParams.push(willBeActive ? 1 : 0);
      }

      if (updateFields.length > 0) {
        updateParams.push(id);
        await connection.query(`UPDATE questions SET ${updateFields.join(', ')} WHERE id = ?`, updateParams);
      }

      // 2. Cập nhật danh sách đáp án nếu có
      if (Array.isArray(answers) && answers.length > 0) {
        // Lấy danh sách đáp án hiện tại
        const [currAnswers] = await connection.query('SELECT id FROM answers WHERE question_id = ?', [id]);
        const currAnswerIds = currAnswers.map(a => a.id);
        const incomingIds = answers.filter(a => a.id).map(a => a.id);

        // Xóa những đáp án không còn trong danh sách mới
        const idsToDelete = currAnswerIds.filter(cid => !incomingIds.includes(cid));
        if (idsToDelete.length > 0) {
          await connection.query(
            `DELETE FROM answers WHERE id IN (${idsToDelete.map(() => '?').join(',')}) AND question_id = ?`,
            [...idsToDelete, id]
          );
        }

        // Cập nhật hoặc thêm mới các đáp án
        for (let i = 0; i < answers.length; i++) {
          const ans = answers[i];
          const orderNum = ans.orderNumber || (i + 1);
          const isCorr = (ans.isCorrect === true || ans.isCorrect === 1) ? 1 : 0;
          const text = (ans.answerText || '').trim();

          if (ans.id && currAnswerIds.includes(ans.id)) {
            await connection.query(
              `UPDATE answers SET answer_text = ?, is_correct = ?, order_number = ? WHERE id = ? AND question_id = ?`,
              [text, isCorr, orderNum, ans.id, id]
            );
          } else {
            await connection.query(
              `INSERT INTO answers (question_id, answer_text, is_correct, order_number) VALUES (?, ?, ?, ?)`,
              [id, text, isCorr, orderNum]
            );
          }
        }
      }

      await connection.commit();
      return await QuestionModel.findById(id, true, true);
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_NO_REFERENCED_ROW_2' || error.errno === 1452) {
        const err = new Error('Lỗi ràng buộc khóa ngoại: Dữ liệu tham chiếu không hợp lệ hoặc không tồn tại trong hệ thống');
        err.statusCode = 400;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Xóa câu hỏi khỏi ngân hàng - Có kiểm tra nghiêm ngặt ràng buộc khóa ngoại
   * @param {number} id 
   * @returns {Promise<{success: boolean, message: string}>}
   */
  static async delete(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      // 1. Kiểm tra sự tồn tại của câu hỏi
      const [existing] = await connection.query('SELECT id, content FROM questions WHERE id = ?', [id]);
      if (existing.length === 0) {
        const error = new Error(`Không tìm thấy câu hỏi với ID = ${id}`);
        error.statusCode = 404;
        throw error;
      }

      // 2. KIỂM TRA RÀNG BUỘC KHÓA NGOẠI:
      // Kiểm tra câu hỏi đã từng xuất hiện trong lịch sử làm bài thi (exam_session_details) chưa
      const [detailRef] = await connection.query(
        'SELECT COUNT(*) AS exam_count FROM exam_session_details WHERE question_id = ?',
        [id]
      );
      const examCount = detailRef[0]?.exam_count || 0;

      if (examCount > 0) {
        const error = new Error(
          `Không thể xóa câu hỏi #${id} vì câu hỏi này đã được sử dụng trong ${examCount} bài thi của học viên (Ràng buộc khóa ngoại với bảng exam_session_details). Để bảo toàn tính toàn vẹn lịch sử thi, bạn hãy chọn chức năng "Ẩn câu hỏi" thay vì xóa vĩnh viễn!`
        );
        error.statusCode = 409; // 409 Conflict
        error.isForeignKeyConstraint = true;
        error.examCount = examCount;
        throw error;
      }

      // 3. Tiến hành xóa câu hỏi (bảng answers sẽ tự động xóa nhờ ON DELETE CASCADE)
      await connection.query('DELETE FROM questions WHERE id = ?', [id]);

      await connection.commit();
      return {
        success: true,
        message: `Đã xóa vĩnh viễn câu hỏi #${id} khỏi ngân hàng đề thi thành công!`
      };
    } catch (error) {
      await connection.rollback();
      // Bắt lỗi ràng buộc khóa ngoại từ MySQL nếu phát sinh ngoài dự kiến
      if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
        const err = new Error(
          `Lỗi ràng buộc khóa ngoại (MySQL 1451): Câu hỏi #${id} đang được tham chiếu bởi các bản ghi khác trong cơ sở dữ liệu. Vui lòng sử dụng tính năng "Ẩn câu hỏi" để không ảnh hưởng dữ liệu liên quan.`
        );
        err.statusCode = 409;
        err.isForeignKeyConstraint = true;
        throw err;
      }
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Đổi trạng thái hiển thị / ẩn câu hỏi (Soft-delete / Restore)
   * @param {number} id 
   */
  static async toggleActive(id) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [existing] = await connection.query(
        'SELECT id, chapter_id, is_active FROM questions WHERE id = ? FOR UPDATE',
        [id]
      );
      if (existing.length === 0) {
        const error = new Error(`Không tìm thấy câu hỏi với ID = ${id}`);
        error.statusCode = 404;
        throw error;
      }

      const newStatus = existing[0].is_active ? 0 : 1;
      if (newStatus === 0) {
        await QuestionModel.ensureChapterQuestionCapacity(connection, Number(existing[0].chapter_id), 1);
      }

      await connection.query('UPDATE questions SET is_active = ? WHERE id = ?', [newStatus, id]);
      await connection.commit();
      return {
        id,
        isActive: newStatus === 1,
        message: newStatus === 1 ? 'Đã kích hoạt câu hỏi lại vào ngân hàng đề thi' : 'Đã ẩn câu hỏi khỏi ngân hàng đề thi'
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Chuyển đổi thành Object JSON trả về Client
   * @param {boolean} includeCorrect Có đính kèm trường isCorrect của đáp án hay không
   */
  toJSON(includeCorrect = false) {
    return {
      id: this.id,
      chapterId: this.chapterId,
      chapterTitle: this.chapterTitle,
      content: this.content,
      imageUrl: this.imageUrl,
      isParalysis: this.isParalysis,
      explanation: this.explanation,
      isActive: this.isActive,
      answers: this.answers.map(a => (a instanceof AnswerModel ? a.toJSON(includeCorrect) : a)),
      createdAt: this.createdAt
    };
  }
}

module.exports = QuestionModel;
