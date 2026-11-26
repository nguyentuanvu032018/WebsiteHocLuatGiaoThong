const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const verifyToken = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');

// Toàn bộ các route quản lý người dùng yêu cầu đăng nhập và có quyền Admin
router.use(verifyToken, requireRole('admin'));

// GET /api/v1/users - Danh sách người dùng (lọc, tìm kiếm, phân trang)
router.get('/', userController.getAll);

// PATCH /api/v1/users/:id/toggle-lock - Khóa hoặc mở khóa tài khoản
router.patch('/:id/toggle-lock', userController.toggleLock);

// PATCH /api/v1/users/:id/role - Thay đổi vai trò người dùng (admin/student)
router.patch('/:id/role', userController.updateRole);

// DELETE /api/v1/users/:id - Xóa người dùng (có kiểm tra ràng buộc khóa ngoại)
router.delete('/:id', userController.delete);

module.exports = router;
