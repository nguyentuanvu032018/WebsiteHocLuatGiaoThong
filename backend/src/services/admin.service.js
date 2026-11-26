const AdminDashboardModel = require('../models/adminDashboard.model');
const TrafficSignModel = require('../models/trafficSign.model');
const ChapterModel = require('../models/chapter.model');
const LicenseTypeModel = require('../models/licenseType.model');
const ExamStructureRuleModel = require('../models/examRule.model');
const TrafficFineModel = require('../models/trafficFine.model');

const response = (data, message, statusCode = 200) => ({ data, message, statusCode });
const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class AdminService {
  async getDashboardStats() {
    const stats = await AdminDashboardModel.getStats();
    const totalExams = Number(stats.examStats[0].total_exams) || 0;
    const passedExams = Number(stats.examStats[0].passed_exams) || 0;
    const failedExams = Number(stats.examStats[0].failed_exams) || 0;
    const paralysisFailedExams = Number(stats.examStats[0].paralysis_failed_exams) || 0;
    const passRate = totalExams > 0 ? Math.round((passedExams / totalExams) * 100) : 0;
    const averageScore = Number(Number(stats.examStats[0].average_score).toFixed(1)) || 0;

    const licenseStats = stats.licenseStatsRows.map(row => {
      const total = Number(row.total_exams) || 0;
      const passed = Number(row.passed_exams) || 0;
      const failed = Number(row.failed_exams) || 0;
      return {
        id: row.id,
        code: row.code,
        name: row.name,
        totalQuestions: row.total_questions,
        passingScore: row.passing_score,
        totalExams: total,
        passedExams: passed,
        failedExams: failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
        averageScore: Number(Number(row.average_score).toFixed(1))
      };
    });

    const chapterStats = stats.chapterStatsRows.map(row => ({
      id: row.id,
      title: row.title,
      questionCount: Number(row.question_count) || 0,
      paralysisCount: Number(row.paralysis_count) || 0
    }));

    const trendMap = new Map();
    stats.trendRows.forEach(row => {
      const total = Number(row.total_count) || 0;
      const passed = Number(row.passed_count) || 0;
      const failed = Number(row.failed_count) || 0;
      trendMap.set(row.raw_date, {
        dateLabel: row.date_label,
        totalCount: total,
        passedCount: passed,
        failedCount: failed,
        passRate: total > 0 ? Math.round((passed / total) * 100) : 0
      });
    });

    const trends = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      const dateKey = `${yyyy}-${mm}-${dd}`;
      const dateLabel = `${dd}/${mm}`;
      trends.push(trendMap.has(dateKey)
        ? { dateKey, ...trendMap.get(dateKey) }
        : { dateKey, dateLabel, totalCount: 0, passedCount: 0, failedCount: 0, passRate: 0 });
    }

    const recentExams = stats.recentExamsRows.map(row => ({
      id: row.id,
      userName: row.user_name,
      userEmail: row.user_email,
      licenseCode: row.license_code,
      score: row.score,
      totalQuestions: row.total_questions,
      isPassed: !!row.is_passed,
      hasParalysisFailed: !!row.has_paralysis_failed,
      timeSpentSeconds: row.time_spent_seconds,
      submittedAt: row.submitted_at
    }));

    const topStudents = stats.topStudentsRows.map(row => ({
      id: row.id,
      fullName: row.full_name,
      email: row.email,
      examCount: Number(row.exam_count) || 0,
      passedCount: Number(row.passed_count) || 0,
      passRate: Number(row.exam_count) > 0
        ? Math.round((Number(row.passed_count) / Number(row.exam_count)) * 100)
        : 0,
      avgScore: Number(Number(row.avg_score).toFixed(1)) || 0
    }));

    return response({
      kpi: {
        totalStudents: stats.userCount[0].total,
        totalAdmins: stats.adminCount[0].total,
        totalQuestions: stats.questionCount[0].total,
        totalParalysisQuestions: Number(stats.questionCount[0].paralysis_count) || 0,
        totalExams,
        passedExams,
        failedExams,
        normalFailedExams: Math.max(0, failedExams - paralysisFailedExams),
        paralysisFailedExams,
        passRate,
        averageScore,
        totalSigns: stats.signCount[0].total,
        totalFines: stats.fineCount[0].total
      },
      licenseStats,
      chapterStats,
      trends,
      recentExams,
      topStudents
    }, 'Lấy dữ liệu thống kê Dashboard thành công');
  }

  async getSignCategories() {
    return response({ categories: await TrafficSignModel.getCategories() }, 'Lấy danh sách nhóm biển báo thành công');
  }

  async getSigns({ query }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const categoryId = query.categoryId ? Number(query.categoryId) : null;
    const keyword = query.keyword ? String(query.keyword).trim() : '';
    const result = await TrafficSignModel.findWithFilter({ categoryId, keyword, page, limit });
    return response({
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      signs: result.signs.map(sign => sign.toJSON())
    }, 'Lấy danh sách biển báo thành công');
  }

  async createSign({ body, file }) {
    const { categoryId, signCode, name, description } = body || {};
    const imageUrl = file ? `/uploads/signs/${file.filename}` : (body?.imageUrl || null);
    const sign = await TrafficSignModel.create({ categoryId, signCode, name, description, imageUrl });
    return response({ sign: sign.toJSON() }, 'Thêm biển báo mới thành công', 201);
  }

  async updateSign({ params, body, file }) {
    const { categoryId, signCode, name, description } = body || {};
    const imageUrl = file ? `/uploads/signs/${file.filename}` : (body?.imageUrl || null);
    const sign = await TrafficSignModel.update(params.id, { categoryId, signCode, name, description, imageUrl });
    return response({ sign: sign.toJSON() }, 'Cập nhật biển báo thành công');
  }

  async uploadSignImage({ file }) {
    if (!file) throw createError('Vui lòng chọn tệp hình ảnh để tải lên', 400);
    return response({ imageUrl: `/uploads/signs/${file.filename}` }, 'Tải ảnh biển báo lên thành công');
  }

  async deleteSign({ params }) {
    await TrafficSignModel.deleteById(params.id);
    return response({}, 'Xóa biển báo thành công');
  }

  async getChapters() {
    const chapters = await ChapterModel.findAll();
    return response({ chapters: chapters.map(chapter => chapter.toJSON()) }, 'Lấy danh sách chương lý thuyết thành công');
  }

  async getChapterById({ params }) {
    const chapter = await ChapterModel.findById(Number(params.id));
    if (!chapter) throw createError(`Không tìm thấy chương lý thuyết với ID = ${params.id}`, 404);
    return response({ chapter: chapter.toJSON() }, 'Lấy chi tiết chương thành công');
  }

  async createChapter({ body }) {
    const { title, description, orderNumber } = body || {};
    const chapter = await ChapterModel.create({ title, description, orderNumber });
    return response({ chapter: chapter.toJSON() }, 'Thêm mới chương lý thuyết thành công', 201);
  }

  async updateChapter({ params, body }) {
    const { title, description, orderNumber } = body || {};
    const chapter = await ChapterModel.update(Number(params.id), { title, description, orderNumber });
    return response({ chapter: chapter.toJSON() }, 'Cập nhật chương lý thuyết thành công');
  }

  async deleteChapter({ params }) {
    await ChapterModel.deleteById(Number(params.id));
    return response({}, 'Xóa chương lý thuyết thành công');
  }

  async getLicenseTypes() {
    const licenseTypes = await LicenseTypeModel.findAll({ activeOnly: false, includeStats: true });
    return response({ licenseTypes: licenseTypes.map(license => license.toJSON()) }, 'Lấy danh sách phòng thi / hạng bằng thành công');
  }

  async getLicenseTypeById({ params }) {
    const license = await LicenseTypeModel.findById(Number(params.id), true);
    if (!license) throw createError('Không tìm thấy phòng thi / hạng bằng', 404);
    return response({ licenseType: license.toJSON() }, 'Lấy chi tiết phòng thi thành công');
  }

  async createLicenseType({ body }) {
    const license = await LicenseTypeModel.create(body);
    return response({ licenseType: license.toJSON() }, 'Thêm mới phòng thi / hạng bằng sát hạch thành công', 201);
  }

  async updateLicenseType({ params, body }) {
    const license = await LicenseTypeModel.update(Number(params.id), body);
    return response({ licenseType: license.toJSON() }, 'Cập nhật cấu hình phòng thi thành công');
  }

  async toggleLicenseTypeStatus({ params }) {
    const license = await LicenseTypeModel.toggleActive(Number(params.id));
    const statusText = license.isActive ? 'Đã mở phòng thi' : 'Đã đóng phòng thi';
    return response({ licenseType: license.toJSON() }, `${statusText} thành công`);
  }

  async deleteLicenseType({ params }) {
    await LicenseTypeModel.deleteById(Number(params.id));
    return response({}, 'Đã xóa phòng thi sát hạch thành công');
  }

  async getLicenseMatrix({ params }) {
    const licenseId = Number(params.id);
    const license = await LicenseTypeModel.findById(licenseId);
    if (!license) throw createError('Không tìm thấy phòng thi', 404);
    const chapters = await ChapterModel.findAll();
    const existingRules = await ExamStructureRuleModel.findByLicenseTypeId(licenseId);
    const ruleMap = new Map();
    existingRules.forEach(rule => ruleMap.set(rule.chapterId, rule));
    const matrix = chapters.map(chapter => {
      const existing = ruleMap.get(chapter.id);
      return {
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        orderNumber: chapter.orderNumber,
        totalQuestionsInBank: chapter.totalQuestions || 0,
        paralysisInBank: chapter.paralysisQuestions || 0,
        questionCount: existing ? existing.questionCount : 0,
        paralysisCount: existing ? existing.paralysisCount : 0
      };
    });
    return response({ licenseType: license.toJSON(), matrix }, 'Lấy ma trận cấu hình đề thi thành công');
  }

  async updateLicenseMatrix({ params, body }) {
    const { rules } = body;
    if (!Array.isArray(rules)) {
      throw createError('Dữ liệu ma trận quy tắc không hợp lệ (cần danh sách mảng)', 400);
    }
    const licenseId = Number(params.id);
    const license = await LicenseTypeModel.findById(licenseId);
    if (!license) throw createError('Không tìm thấy phòng thi', 404);
    const totalConfiguredQuestions = rules.reduce((sum, rule) => sum + Number(rule.questionCount || 0), 0);
    if (totalConfiguredQuestions !== license.totalQuestions) {
      throw createError(
        `Tổng số câu hỏi trong ma trận (${totalConfiguredQuestions} câu) không khớp với tổng số câu quy định của phòng thi Hạng ${license.code} (${license.totalQuestions} câu). Vui lòng kiểm tra lại.`,
        400
      );
    }
    await ExamStructureRuleModel.saveRules(licenseId, rules);
    return response({ totalQuestions: totalConfiguredQuestions }, 'Đã lưu cấu hình ma trận đề thi thành công');
  }

  async getFineCategories() {
    return response({ categories: await TrafficFineModel.getCategories() }, 'Lấy danh mục nhóm phương tiện xử phạt thành công');
  }

  async getFines({ query }) {
    const { vehicleType, fineCategoryId, keyword, minFine, maxFine, page = 1, limit = 15 } = query;
    const result = await TrafficFineModel.findWithFilter({
      vehicleType,
      fineCategoryId: fineCategoryId ? Number(fineCategoryId) : null,
      keyword,
      minFine: minFine ? Number(minFine) : null,
      maxFine: maxFine ? Number(maxFine) : null,
      page: Number(page),
      limit: Number(limit)
    });
    return response({
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      fines: result.fines.map(fine => fine.toJSON())
    }, 'Lấy danh sách mức xử phạt vi phạm thành công');
  }

  async getFineById({ params }) {
    const fine = await TrafficFineModel.findById(Number(params.id));
    if (!fine) throw createError('Không tìm thấy thông tin mức xử phạt', 404);
    return response({ fine: fine.toJSON() }, 'Lấy chi tiết mức xử phạt thành công');
  }

  async createFine({ body }) {
    const fine = await TrafficFineModel.create(body);
    return response({ fine: fine.toJSON() }, 'Thêm mới mức xử phạt vi phạm thành công', 201);
  }

  async updateFine({ params, body }) {
    const fine = await TrafficFineModel.update(Number(params.id), body);
    return response({ fine: fine.toJSON() }, 'Cập nhật mức xử phạt vi phạm thành công');
  }

  async deleteFine({ params }) {
    await TrafficFineModel.deleteById(Number(params.id));
    return response({}, 'Đã xóa mức xử phạt thành công');
  }
}

module.exports = new AdminService();
