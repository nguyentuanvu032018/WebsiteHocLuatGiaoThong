const lookupService = require('../services/lookup.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Lớp Điều Khiển Tra Cứu (Lookup Controller)
 * Xử lý các request tra cứu biển báo và mức xử phạt Nghị định 100/123
 */
class LookupController {
  // --- BIỂN BÁO ---
  getSignCategories = async (req, res, next) => {
    try {
      const categories = await lookupService.getSignCategories();
      return successResponse(res, { categories }, 'Lấy danh mục nhóm biển báo thành công');
    } catch (error) {
      next(error);
    }
  };

  getSigns = async (req, res, next) => {
    try {
      const result = await lookupService.getSigns(req.query);
      return successResponse(res, result, 'Tra cứu biển báo giao thông thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  getSignById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const sign = await lookupService.getSignById(id);
      return successResponse(res, { sign }, 'Lấy chi tiết biển báo thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  // --- MỨC PHẠT ---
  getFineCategories = async (req, res, next) => {
    try {
      const categories = await lookupService.getFineCategories();
      return successResponse(res, { categories }, 'Lấy danh mục phương tiện vi phạm thành công');
    } catch (error) {
      next(error);
    }
  };

  getFines = async (req, res, next) => {
    try {
      const result = await lookupService.getFines(req.query);
      return successResponse(res, result, 'Tra cứu mức phạt vi phạm thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  getFineById = async (req, res, next) => {
    try {
      const { id } = req.params;
      const fine = await lookupService.getFineById(id);
      return successResponse(res, { fine }, 'Lấy chi tiết mức phạt thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };
}

module.exports = new LookupController();
