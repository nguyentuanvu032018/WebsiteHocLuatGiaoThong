const LicenseTypeModel = require('../models/licenseType.model');
const ExamStructureRuleModel = require('../models/examRule.model');
const ExamSessionModel = require('../models/examSession.model');
const QuestionModel = require('../models/question.model');
const AnswerModel = require('../models/answer.model');

/**
 * Lớp Dịch Vụ Sát Hạch & Thi Thử (Exam Service)
 * Đảm nhiệm thuật toán sinh đề thi ngẫu nhiên theo ma trận Bộ GTVT,
 * quản lý phiên thi và bảo mật chống lộ đề/đáp án.
 */
class ExamService {
  /**
   * Lấy danh sách các hạng bằng lái xe kèm quy định thời gian, số câu, điểm đỗ
   * @returns {Promise<Array<Object>>}
   */
  async getLicenseTypes() {
    const licenseTypes = await LicenseTypeModel.findAll(true);
    return licenseTypes.map(l => l.toJSON());
  }

  /**
   * Lấy ma trận quy chuẩn câu hỏi của một hạng bằng
   * @param {number|string} licenseTypeId 
   * @returns {Promise<Array<Object>>}
   */
  async getExamStructureRules(licenseTypeId) {
    const rules = await ExamStructureRuleModel.findByLicenseTypeId(Number(licenseTypeId));
    return rules.map(r => r.toJSON());
  }

  /**
   * THUẬT TOÁN SINH ĐỀ THI NGẪU NHIÊN THEO MA TRẬN BỘ GTVT
   * 
   * Quy trình nghiệp vụ:
   * 1. Xác thực hạng bằng lái xe và lấy tổng số câu, thời gian thi tương ứng.
   * 2. Tải ma trận đề thi (số câu hỏi và số câu điểm liệt bắt buộc của từng chương).
   * 3. Rút thăm ngẫu nhiên (ORDER BY RAND()) câu điểm liệt theo từng chương.
   * 4. Rút thăm ngẫu nhiên câu thường theo số lượng quy định của từng chương.
   * 5. Bù đắp số câu thiếu hụt (nếu ngân hàng câu hỏi của chương đó chưa đủ) từ toàn bộ ngân hàng câu hỏi.
   * 6. Trộn ngẫu nhiên (Fisher-Yates Shuffle) danh sách câu hỏi đề thi để câu điểm liệt nằm rải rác.
   * 7. Khởi tạo phiên thi trong CSDL (exam_sessions và exam_session_details).
   * 8. Trả về đề thi cho thí sinh VÀ TUYỆT ĐỐI KHÔNG LỘ ĐÁP ÁN ĐÚNG (is_correct = 0 / omitted).
   * 
   * @param {Object} params { userId, licenseTypeId, licenseCode }
   * @returns {Promise<Object>}
   */
  async generateExamSession({ userId, licenseTypeId = null, licenseCode = null }) {
    if (!userId) {
      const error = new Error('Yêu cầu định danh thí sinh (userId)');
      error.statusCode = 401;
      throw error;
    }

    // 1. Xác thực Hạng bằng
    let licenseType = null;
    if (licenseTypeId) {
      licenseType = await LicenseTypeModel.findById(Number(licenseTypeId));
    } else if (licenseCode) {
      licenseType = await LicenseTypeModel.findByCode(licenseCode);
    }

    if (!licenseType || !licenseType.isActive) {
      const error = new Error('Hạng bằng lái xe không hợp lệ hoặc đang tạm khóa');
      error.statusCode = 400;
      throw error;
    }

    // 2. Lấy quy định ma trận đề thi của hạng bằng này
    const rules = await ExamStructureRuleModel.findByLicenseTypeId(licenseType.id);
    if (!rules || rules.length === 0) {
      const error = new Error(`Chưa thiết lập ma trận đề thi cho hạng bằng ${licenseType.code}`);
      error.statusCode = 500;
      throw error;
    }

    const selectedQuestionIds = new Set();
    const selectedQuestions = [];

    // 3. Thực hiện bốc thăm câu hỏi theo từng chương trong ma trận
    for (const rule of rules) {
      // 3.1. Bốc câu hỏi điểm liệt bắt buộc trước (nếu rule có yêu cầu)
      if (rule.paralysisCount > 0) {
        const paralysisRows = await QuestionModel.findRandomActive({
          chapterId: rule.chapterId,
          isParalysis: true,
          limit: rule.paralysisCount
        });

        for (const row of paralysisRows) {
          if (!selectedQuestionIds.has(row.id)) {
            selectedQuestionIds.add(row.id);
            selectedQuestions.push(row);
          }
        }

        // Nếu chương này không đủ câu điểm liệt, bốc bù từ các chương khác
        if (paralysisRows.length < rule.paralysisCount) {
          const needed = rule.paralysisCount - paralysisRows.length;
          const extraParalysis = await QuestionModel.findRandomActive({
            isParalysis: true,
            excludeIds: Array.from(selectedQuestionIds),
            limit: needed
          });
          for (const row of extraParalysis) {
            if (!selectedQuestionIds.has(row.id)) {
              selectedQuestionIds.add(row.id);
              selectedQuestions.push(row);
            }
          }
        }
      }

      // 3.2. Bốc câu hỏi thông thường theo số lượng quy định của chương
      const normalCountNeeded = Math.max(0, rule.questionCount - rule.paralysisCount);
      if (normalCountNeeded > 0) {
        const normalRows = await QuestionModel.findRandomActive({
          chapterId: rule.chapterId,
          isParalysis: false,
          excludeIds: Array.from(selectedQuestionIds),
          limit: normalCountNeeded
        });
        for (const row of normalRows) {
          if (!selectedQuestionIds.has(row.id)) {
            selectedQuestionIds.add(row.id);
            selectedQuestions.push(row);
          }
        }
      }
    }

    // 4. Kiểm tra tổng số câu; nếu thiếu hụt so với chuẩn của hạng bằng, bốc bù từ ngân hàng chung
    if (selectedQuestions.length < licenseType.totalQuestions) {
      const deficit = licenseType.totalQuestions - selectedQuestions.length;
      const fillRows = await QuestionModel.findRandomActive({
        excludeIds: Array.from(selectedQuestionIds),
        limit: deficit
      });
      for (const row of fillRows) {
        if (!selectedQuestionIds.has(row.id)) {
          selectedQuestionIds.add(row.id);
          selectedQuestions.push(row);
        }
      }
    }

    // 5. Trộn ngẫu nhiên vị trí các câu hỏi (Fisher-Yates Shuffle Algorithm)
    for (let i = selectedQuestions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedQuestions[i], selectedQuestions[j]] = [selectedQuestions[j], selectedQuestions[i]];
    }

    // 6. Lưu phiên thi vào CSDL (exam_sessions và exam_session_details)
    const questionIds = selectedQuestions.map(q => q.id);
    const session = await ExamSessionModel.create({
      userId,
      licenseTypeId: licenseType.id,
      totalQuestions: questionIds.length,
      questionIds
    });

    // 7. Lấy lại phiên thi kèm câu hỏi và danh sách đáp án
    // BẢO MẬT: includeCorrect = false (tuyệt đối không gửi đáp án đúng về phía client)
    const fullSession = await ExamSessionModel.findByIdWithQuestions(session.id, true, false);

    return fullSession.toJSON(true);
  }

  /**
   * Lấy thông tin phiên thi hiện tại theo ID
   * @param {number} sessionId 
   * @param {number} userId 
   * @param {boolean} isAdmin 
   */
  async getExamSession(sessionId, userId, isAdmin = false) {
    const session = await ExamSessionModel.findById(sessionId);
    if (!session) {
      const error = new Error('Không tìm thấy bài thi sát hạch');
      error.statusCode = 404;
      throw error;
    }

    // Kiểm tra quyền: chỉ thí sinh tạo bài thi hoặc Admin mới được xem
    if (!isAdmin && session.userId !== userId) {
      const error = new Error('Bạn không có quyền truy cập vào bài thi này');
      error.statusCode = 403;
      throw error;
    }

    // Nếu bài thi đã nộp, cho phép xem đáp án đúng; nếu đang làm bài, KHÔNG ĐƯỢC LỘ ĐÁP ÁN ĐÚNG
    const isSubmitted = !!session.submittedAt;
    const fullSession = await ExamSessionModel.findByIdWithQuestions(sessionId, true, isSubmitted);
    return fullSession.toJSON(true);
  }

  /**
   * Lấy lịch sử làm bài thi của học viên kèm thống kê tỷ lệ đỗ
   * @param {number} userId 
   * @param {Object} query { page, limit, status, licenseTypeId }
   */
  async getUserExamHistory(userId, query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit) || 10));
    const status = query.status || 'all';
    const licenseTypeId = query.licenseTypeId || 'all';
    const licenseTypeIds = query.licenseTypeIds !== undefined
      ? [...new Set(String(query.licenseTypeIds).split(',').map(value => Number(value)))]
      : null;
    if (licenseTypeIds?.some(id => !Number.isInteger(id) || id <= 0) || (licenseTypeIds && licenseTypeIds.length > 20)) {
      const error = new Error('Danh sách hạng bằng cần lọc không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const [result, stats] = await Promise.all([
      ExamSessionModel.findByUserId(userId, { page, limit, status, licenseTypeId, licenseTypeIds }),
      ExamSessionModel.getUserStatistics(userId, licenseTypeIds)
    ]);

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      stats,
      sessions: result.sessions.map(s => s.toJSON(false))
    };
  }

  /**
   * THUẬT TOÁN CHẤM ĐIỂM VÀ PHÁT HIỆN TRƯỢT DO CÂU ĐIỂM LIỆT
   * 
   * Quy tắc chấm thi chuẩn Tổng cục Đường bộ Việt Nam:
   * 1. Mỗi câu hỏi trả lời đúng được tính 1 điểm.
   * 2. Nếu làm SAI hoặc BỎ TRỐNG bất kỳ CÂU HỎI ĐIỂM LIỆT nào (is_paralysis = 1),
   *    thí sinh bị ĐÁNH RỚT TRỰC TIẾP (is_passed = 0), kể cả khi tổng điểm >= điểm đỗ!
   * 3. Nếu không sai câu điểm liệt:
   *    - score >= passing_score => ĐẠT (is_passed = 1)
   *    - score < passing_score  => KHÔNG ĐẠT (is_passed = 0)
   * 4. Sau khi nộp bài, hệ thống mở khóa đáp án đúng và lời giải thích mẹo nhớ luật.
   * 
   * @param {number} sessionId ID của phiên thi
   * @param {number} userId ID học viên thực hiện nộp bài
   * @param {Object} data { answers: Array<{questionId: number, selectedAnswerId: number|null}>, timeSpentSeconds: number }
   * @returns {Promise<Object>} Kết quả chấm thi chi tiết
   */
  async submitExamSession(sessionId, userId, { answers = [], timeSpentSeconds = 0 } = {}) {
    const sId = Number(sessionId);
    if (isNaN(sId) || sId <= 0) {
      const error = new Error('ID bài thi không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    // 1. Kiểm tra tồn tại phiên thi
    const session = await ExamSessionModel.findById(sId);
    if (!session) {
      const error = new Error('Không tìm thấy bài thi sát hạch tương ứng');
      error.statusCode = 404;
      throw error;
    }

    // 2. Kiểm tra quyền sở hữu bài thi
    if (session.userId !== userId) {
      const error = new Error('Bạn không có quyền nộp bài thi của thí sinh khác');
      error.statusCode = 403;
      throw error;
    }

    // 3. Kiểm tra xem bài thi đã được nộp trước đó chưa
    if (session.submittedAt) {
      const error = new Error('Bài thi này đã được nộp và chấm điểm trước đó');
      error.statusCode = 400;
      throw error;
    }

    // 4. Lấy danh sách câu hỏi trong đề thi này
    const questionRows = await ExamSessionModel.findQuestionDetailsForGrading(sId);

    let score = 0;
    let hasParalysisFailed = false;
    const gradedDetails = [];
    const paralysisFailedQuestions = [];

    // 5. Duyệt và chấm điểm từng câu hỏi
    for (const row of questionRows) {
      // Lấy toàn bộ các lựa chọn đáp án của câu hỏi này
      const answerRows = await AnswerModel.findByQuestionId(row.question_id, true);
      const correctAnswer = answerRows.find(answer => answer.isCorrect);

      // Tìm câu trả lời mà thí sinh đã nộp cho câu hỏi này
      const userSubmission = (answers || []).find(
        a => Number(a.questionId) === Number(row.question_id)
      );
      const selectedAnswerId = userSubmission && userSubmission.selectedAnswerId 
        ? Number(userSubmission.selectedAnswerId) 
        : null;

      // So khớp đáp án
      const isCorrect = selectedAnswerId !== null && correctAnswer && selectedAnswerId === correctAnswer.id;

      if (isCorrect) {
        score++;
      } else {
        // Nếu sai hoặc bỏ trống câu điểm liệt => Đánh dấu rớt do điểm liệt
        if (row.is_paralysis === 1) {
          hasParalysisFailed = true;
          paralysisFailedQuestions.push({
            questionId: row.question_id,
            content: row.content
          });
        }
      }

      gradedDetails.push({
        detailId: row.detail_id,
        questionId: row.question_id,
        chapterId: row.chapter_id,
        chapterTitle: row.chapter_title,
        content: row.content,
        imageUrl: row.image_url,
        isParalysis: !!row.is_paralysis,
        selectedAnswerId,
        isCorrect: !!isCorrect,
        correctAnswerId: correctAnswer ? correctAnswer.id : null,
        explanation: row.explanation,
        answers: answerRows.map(a => ({
          id: a.id,
          questionId: a.questionId,
          answerText: a.answerText,
          isCorrect: a.isCorrect,
          orderNumber: a.orderNumber
        }))
      });
    }

    // 6. Xác định kết quả chung cuộc (ĐẠT / KHÔNG ĐẠT)
    const isPassingScoreReached = (score >= session.passingScore);
    let isPassed = false;
    let resultStatus = '';
    let feedbackMessage = '';

    if (hasParalysisFailed) {
      isPassed = false;
      resultStatus = 'FAILED_BY_PARALYSIS';
      feedbackMessage = `KHÔNG ĐẠT - Bạn đã làm sai ${paralysisFailedQuestions.length} câu hỏi điểm liệt. Theo quy định sát hạch, dù đạt ${score}/${session.totalQuestions} điểm bạn vẫn bị trượt trực tiếp.`;
    } else if (!isPassingScoreReached) {
      isPassed = false;
      resultStatus = 'FAILED_BY_SCORE';
      feedbackMessage = `KHÔNG ĐẠT - Số câu đúng của bạn (${score}/${session.totalQuestions}) chưa đạt ngưỡng tối thiểu (${session.passingScore}/${session.totalQuestions}).`;
    } else {
      isPassed = true;
      resultStatus = 'PASSED';
      feedbackMessage = `CHÚC MỪNG - Bạn đã ĐẠT kỳ thi sát hạch với kết quả ${score}/${session.totalQuestions} điểm!`;
    }

    // 7. Cập nhật kết quả vào CSDL
    await ExamSessionModel.updateSubmission(sId, {
      score,
      hasParalysisFailed,
      isPassed,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      details: gradedDetails
    });

    return {
      sessionId: sId,
      licenseCode: session.licenseCode,
      licenseName: session.licenseName,
      durationMinutes: session.durationMinutes,
      passingScore: session.passingScore,
      score,
      totalQuestions: session.totalQuestions,
      isPassed,
      hasParalysisFailed,
      paralysisFailedCount: paralysisFailedQuestions.length,
      resultStatus,
      feedbackMessage,
      timeSpentSeconds: Number(timeSpentSeconds) || 0,
      submittedAt: new Date().toISOString(),
      questions: gradedDetails
    };
  }
}

module.exports = new ExamService();
