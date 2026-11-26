const express = require('express');
const router = express.Router();
const questionController = require('../controllers/question.controller');
const verifyToken = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const { uploadQuestionImage } = require('../middlewares/upload.middleware');

// GET /api/v1/questions/paralysis - Lấy danh sách câu điểm liệt (phải đặt trước /:id)
router.get('/paralysis', questionController.getParalysis);

// Admin-only question management endpoints include hidden questions.
router.get('/admin', verifyToken, requireRole('admin'), questionController.getAllAdmin);
router.get('/admin/:id', verifyToken, requireRole('admin'), questionController.getByIdAdmin);

// POST /api/v1/questions/upload-image - Tải ảnh minh họa câu hỏi (Admin only)
router.post('/upload-image', verifyToken, requireRole('admin'), uploadQuestionImage.single('image'), questionController.uploadImage);

// GET /api/v1/questions - Lấy danh sách câu hỏi có lọc và phân trang
router.get('/', questionController.getAll);

// GET /api/v1/questions/:id - Lấy chi tiết câu hỏi theo ID
router.get('/:id', questionController.getById);

// POST /api/v1/questions - Thêm câu hỏi mới (Yêu cầu đăng nhập & quyền admin)
router.post('/', verifyToken, requireRole('admin'), uploadQuestionImage.single('image'), questionController.create);

// PUT /api/v1/questions/:id - Cập nhật thông tin câu hỏi (Yêu cầu đăng nhập & quyền admin)
router.put('/:id', verifyToken, requireRole('admin'), uploadQuestionImage.single('image'), questionController.update);

// DELETE /api/v1/questions/:id - Xóa câu hỏi khỏi ngân hàng (Yêu cầu đăng nhập & quyền admin)
router.delete('/:id', verifyToken, requireRole('admin'), questionController.delete);

// PATCH /api/v1/questions/:id/toggle-active - Bật/tắt trạng thái hiển thị câu hỏi (Admin only)
router.patch('/:id/toggle-active', verifyToken, requireRole('admin'), questionController.toggleActive);

module.exports = router;
