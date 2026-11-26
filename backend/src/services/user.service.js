const UserModel = require('../models/user.model');

const createError = (message, statusCode) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

class UserService {
  async getAll(query = {}) {
    const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 10));

    return UserModel.findFiltered({
      page,
      limit,
      role: query.role || 'all',
      isActive: query.isActive || 'all',
      keyword: query.keyword ? String(query.keyword).trim() : ''
    });
  }

  async toggleLock(targetUserId, currentAdminId) {
    const userId = this.validateUserId(targetUserId);
    this.preventSelfAction(userId, currentAdminId, 'khóa');

    const user = await this.getExistingUser(userId);
    const isActive = !user.isActive;
    await UserModel.setActive(userId, isActive);

    return {
      id: userId,
      isActive,
      message: isActive ? 'Mở khóa tài khoản thành công!' : 'Đã khóa tài khoản người dùng thành công!'
    };
  }

  async updateRole(targetUserId, role, currentAdminId) {
    const userId = this.validateUserId(targetUserId);
    this.preventSelfAction(userId, currentAdminId, 'thay đổi vai trò');
    if (!['admin', 'student'].includes(role)) {
      throw createError('Vai trò không hợp lệ. Chỉ chấp nhận admin hoặc student', 400);
    }

    await this.getExistingUser(userId);
    await UserModel.setRole(userId, role);

    return {
      id: userId,
      role,
      message: `Đã cập nhật vai trò người dùng thành "${role === 'admin' ? 'Quản trị viên' : 'Học viên'}" thành công!`
    };
  }

  async delete(targetUserId, currentAdminId) {
    const userId = this.validateUserId(targetUserId);
    this.preventSelfAction(userId, currentAdminId, 'xóa');
    await this.getExistingUser(userId);

    const examCount = await UserModel.countExamSessions(userId);
    if (examCount > 0) {
      const error = createError(
        `Không thể xóa tài khoản này vì đã có dữ liệu ${examCount} bài thi trong hệ thống (Ràng buộc toàn vẹn khóa ngoại với bảng exam_sessions). Để bảo toàn lịch sử thi, bạn hãy sử dụng tính năng "Khóa tài khoản" để ngừng quyền truy cập thay vì xóa vĩnh viễn!`,
        409
      );
      error.isForeignKeyConstraint = true;
      error.examCount = examCount;
      throw error;
    }

    await UserModel.deleteById(userId);
    return { success: true, message: 'Xóa tài khoản người dùng thành công!' };
  }

  validateUserId(value) {
    const userId = Number(value);
    if (!Number.isInteger(userId) || userId <= 0) {
      throw createError('ID người dùng không hợp lệ', 400);
    }
    return userId;
  }

  preventSelfAction(targetUserId, currentAdminId, action) {
    if (Number(targetUserId) === Number(currentAdminId)) {
      const messages = {
        khóa: 'Bạn không thể tự khóa tài khoản của chính mình!',
        'thay đổi vai trò': 'Bạn không thể tự thay đổi vai trò của chính mình!',
        'xóa': 'Bạn không thể tự xóa tài khoản của chính mình!'
      };
      throw createError(messages[action], 400);
    }
  }

  async getExistingUser(userId) {
    const user = await UserModel.findById(userId);
    if (!user) {
      throw createError(`Không tìm thấy người dùng với ID = ${userId}`, 404);
    }
    return user;
  }
}

module.exports = new UserService();
