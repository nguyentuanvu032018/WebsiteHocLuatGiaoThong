const TrafficSignModel = require('../models/trafficSign.model');
const TrafficFineModel = require('../models/trafficFine.model');

/**
 * Lớp Dịch vụ Tra cứu Biển Báo & Mức Phạt (Lookup Service)
 * Đảm nhiệm nghiệp vụ tra cứu hệ thống biển báo và mức phạt vi phạm giao thông
 */
class LookupService {
  // ===========================================================================
  // TRA CỨU BIỂN BÁO GIAO THÔNG
  // ===========================================================================

  /**
   * Lấy danh sách 5 nhóm danh mục biển báo
   */
  async getSignCategories() {
    return TrafficSignModel.getCategories();
  }

  /**
   * Tra cứu biển báo giao thông theo nhóm và từ khóa
   * @param {Object} query { categoryId, keyword, page, limit }
   */
  async getSigns(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const categoryId = query.categoryId ? Number(query.categoryId) : null;
    const keyword = query.keyword ? String(query.keyword).trim() : '';

    const result = await TrafficSignModel.findWithFilter({
      categoryId,
      keyword,
      page,
      limit
    });

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      signs: result.signs.map(s => s.toJSON())
    };
  }

  /**
   * Lấy chi tiết một biển báo theo ID
   * @param {number|string} id 
   */
  async getSignById(id) {
    const signId = Number(id);
    if (isNaN(signId) || signId <= 0) {
      const error = new Error('ID biển báo không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const sign = await TrafficSignModel.findById(signId);
    if (!sign) {
      const error = new Error(`Không tìm thấy biển báo với ID = ${signId}`);
      error.statusCode = 404;
      throw error;
    }

    return sign.toJSON();
  }

  // ===========================================================================
  // TRA CỨU MỨC PHẠT VI PHẠM GIAO THÔNG (NGHỊ ĐỊNH 100/123)
  // ===========================================================================

  /**
   * Lấy danh mục các nhóm phương tiện vi phạm
   */
  async getFineCategories() {
    return TrafficFineModel.getCategories();
  }

  /**
   * Tra cứu mức phạt vi phạm có bộ lọc phương tiện, từ khóa và mức tiền phạt
   * @param {Object} query { vehicleType, fineCategoryId, keyword, minFine, maxFine, page, limit }
   */
  async getFines(query = {}) {
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const fineCategoryId = query.fineCategoryId ? Number(query.fineCategoryId) : null;
    const vehicleType = query.vehicleType ? String(query.vehicleType).trim().toUpperCase() : null;
    const keyword = query.keyword ? String(query.keyword).trim() : '';
    const minFine = query.minFine !== undefined && query.minFine !== '' ? Number(query.minFine) : null;
    const maxFine = query.maxFine !== undefined && query.maxFine !== '' ? Number(query.maxFine) : null;

    const result = await TrafficFineModel.findWithFilter({
      vehicleType,
      fineCategoryId,
      keyword,
      minFine,
      maxFine,
      page,
      limit
    });

    return {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
      fines: result.fines.map(f => f.toJSON())
    };
  }

  /**
   * Lấy chi tiết mức phạt theo ID
   * @param {number|string} id 
   */
  async getFineById(id) {
    const fineId = Number(id);
    if (isNaN(fineId) || fineId <= 0) {
      const error = new Error('ID mức phạt không hợp lệ');
      error.statusCode = 400;
      throw error;
    }

    const fine = await TrafficFineModel.findById(fineId);
    if (!fine) {
      const error = new Error(`Không tìm thấy mức phạt với ID = ${fineId}`);
      error.statusCode = 404;
      throw error;
    }

    return fine.toJSON();
  }
}

module.exports = new LookupService();
