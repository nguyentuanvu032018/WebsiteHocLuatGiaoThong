const userService = require('../services/user.service');
const { successResponse, errorResponse } = require('../utils/apiResponse');

/**
 * Controller Quản Lý Người Dùng Dành Cho Quản Trị Viên (Admin)
 */
class UserController {
  /**
   * Lấy danh sách tài khoản người dùng có lọc, tìm kiếm và phân trang
   * GET /api/v1/users
   */
  getAll = async (req, res, next) => {
    try {
      const result = await userService.getAll(req.query);
      return successResponse(res, result, 'Lấy danh sách người dùng thành công');
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Khóa hoặc mở khóa tài khoản
   * PATCH /api/v1/users/:id/toggle-lock
   */
  toggleLock = async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentAdminId = req.user.id;
      const result = await userService.toggleLock(id, currentAdminId);
      return successResponse(res, result, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Cập nhật vai trò người dùng (Admin / Student)
   * PATCH /api/v1/users/:id/role
   */
  updateRole = async (req, res, next) => {
    try {
      const { id } = req.params;
      const { role } = req.body || {};
      const currentAdminId = req.user.id;
      const result = await userService.updateRole(id, role, currentAdminId);
      return successResponse(res, result, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };

  /**
   * Xóa tài khoản người dùng (Có kiểm tra chặt chẽ ràng buộc khóa ngoại)
   * DELETE /api/v1/users/:id
   */
  delete = async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentAdminId = req.user.id;
      const result = await userService.delete(id, currentAdminId);
      return successResponse(res, result, result.message);
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  };
}

module.exports = new UserController();
