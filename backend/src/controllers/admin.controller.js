const adminService = require('../services/admin.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

const endpoint = (serviceMethod, includeRequest = false) => async (req, res, next) => {
  try {
    const input = includeRequest
      ? { params: req.params, query: req.query, body: req.body, file: req.file }
      : undefined;
    const result = await serviceMethod.call(adminService, input);
    return successResponse(res, result.data, result.message, result.statusCode);
  } catch (error) {
    if (error.statusCode) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return next(error);
  }
};

class AdminController {
  getDashboardStats = endpoint(adminService.getDashboardStats);
  getSignCategories = endpoint(adminService.getSignCategories);
  getSigns = endpoint(adminService.getSigns, true);
  createSign = endpoint(adminService.createSign, true);
  updateSign = endpoint(adminService.updateSign, true);
  uploadSignImage = endpoint(adminService.uploadSignImage, true);
  deleteSign = endpoint(adminService.deleteSign, true);

  getChapters = endpoint(adminService.getChapters);
  getChapterById = endpoint(adminService.getChapterById, true);
  createChapter = endpoint(adminService.createChapter, true);
  updateChapter = endpoint(adminService.updateChapter, true);
  deleteChapter = endpoint(adminService.deleteChapter, true);

  getLicenseTypes = endpoint(adminService.getLicenseTypes);
  getLicenseTypeById = endpoint(adminService.getLicenseTypeById, true);
  createLicenseType = endpoint(adminService.createLicenseType, true);
  updateLicenseType = endpoint(adminService.updateLicenseType, true);
  toggleLicenseTypeStatus = endpoint(adminService.toggleLicenseTypeStatus, true);
  deleteLicenseType = endpoint(adminService.deleteLicenseType, true);
  getLicenseMatrix = endpoint(adminService.getLicenseMatrix, true);
  updateLicenseMatrix = endpoint(adminService.updateLicenseMatrix, true);

  getFineCategories = endpoint(adminService.getFineCategories);
  getFines = endpoint(adminService.getFines, true);
  getFineById = endpoint(adminService.getFineById, true);
  createFine = endpoint(adminService.createFine, true);
  updateFine = endpoint(adminService.updateFine, true);
  deleteFine = endpoint(adminService.deleteFine, true);
}

module.exports = new AdminController();
