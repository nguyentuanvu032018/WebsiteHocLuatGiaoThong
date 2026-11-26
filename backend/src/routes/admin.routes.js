const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const verifyToken = require('../middlewares/auth.middleware');
const requireRole = require('../middlewares/rbac.middleware');
const { uploadSignImage } = require('../middlewares/upload.middleware');

// Toàn bộ các route trong phân hệ Admin yêu cầu đăng nhập và có quyền 'admin'
router.use(verifyToken, requireRole('admin'));

// GET /api/v1/admin/dashboard/stats - Dữ liệu thống kê Dashboard
router.get('/dashboard/stats', adminController.getDashboardStats);

// GET /api/v1/admin/signs/categories - danh mục biển báo
router.get('/signs/categories', adminController.getSignCategories);

// POST /api/v1/admin/signs/upload-image - tải ảnh biển báo (Admin only)
router.post('/signs/upload-image', uploadSignImage.single('image'), adminController.uploadSignImage);

// GET /api/v1/admin/signs - danh sách biển báo quản trị
router.get('/signs', adminController.getSigns);

// POST /api/v1/admin/signs - thêm mới biển báo
router.post('/signs', uploadSignImage.single('image'), adminController.createSign);

// PUT /api/v1/admin/signs/:id - cập nhật biển báo
router.put('/signs/:id', uploadSignImage.single('image'), adminController.updateSign);

// DELETE /api/v1/admin/signs/:id - xóa biển báo
router.delete('/signs/:id', adminController.deleteSign);

// =========================================================================
// QUẢN LÝ CHƯƠNG LÝ THUYẾT (ADMIN CHAPTERS CRUD)
// =========================================================================

// GET /api/v1/admin/chapters - danh sách toàn bộ chương lý thuyết
router.get('/chapters', adminController.getChapters);

// GET /api/v1/admin/chapters/:id - chi tiết 1 chương
router.get('/chapters/:id', adminController.getChapterById);

// POST /api/v1/admin/chapters - tạo mới chương
router.post('/chapters', adminController.createChapter);

// PUT /api/v1/admin/chapters/:id - cập nhật chương
router.put('/chapters/:id', adminController.updateChapter);

// DELETE /api/v1/admin/chapters/:id - xóa chương
router.delete('/chapters/:id', adminController.deleteChapter);

// =========================================================================
// QUẢN LÝ PHÒNG THI / HẠNG BẰNG SÁT HẠCH (ADMIN EXAM ROOMS / LICENSE TYPES)
// =========================================================================

// GET /api/v1/admin/license-types - danh sách toàn bộ phòng thi sát hạch kèm thống kê
router.get('/license-types', adminController.getLicenseTypes);

// GET /api/v1/admin/license-types/:id - chi tiết 1 phòng thi
router.get('/license-types/:id', adminController.getLicenseTypeById);

// POST /api/v1/admin/license-types - thêm mới phòng thi
router.post('/license-types', adminController.createLicenseType);

// PUT /api/v1/admin/license-types/:id - cập nhật thông số phòng thi
router.put('/license-types/:id', adminController.updateLicenseType);

// PATCH /api/v1/admin/license-types/:id/toggle-status - đóng/mở phòng thi
router.patch('/license-types/:id/toggle-status', adminController.toggleLicenseTypeStatus);

// DELETE /api/v1/admin/license-types/:id - xóa phòng thi
router.delete('/license-types/:id', adminController.deleteLicenseType);

// GET /api/v1/admin/license-types/:id/matrix - lấy cấu hình ma trận đề thi
router.get('/license-types/:id/matrix', adminController.getLicenseMatrix);

// PUT /api/v1/admin/license-types/:id/matrix - cập nhật cấu hình ma trận đề thi
router.put('/license-types/:id/matrix', adminController.updateLicenseMatrix);

// =========================================================================
// QUẢN LÝ MỨC XỬ PHẠT GIAO THÔNG (ADMIN TRAFFIC FINES)
// =========================================================================

// GET /api/v1/admin/fines/categories - danh mục nhóm phương tiện xử phạt
router.get('/fines/categories', adminController.getFineCategories);

// GET /api/v1/admin/fines - danh sách mức xử phạt có tìm kiếm, lọc, phân trang
router.get('/fines', adminController.getFines);

// GET /api/v1/admin/fines/:id - chi tiết mức xử phạt
router.get('/fines/:id', adminController.getFineById);

// POST /api/v1/admin/fines - thêm mới mức xử phạt
router.post('/fines', adminController.createFine);

// PUT /api/v1/admin/fines/:id - cập nhật mức xử phạt
router.put('/fines/:id', adminController.updateFine);

// DELETE /api/v1/admin/fines/:id - xóa mức xử phạt
router.delete('/fines/:id', adminController.deleteFine);

module.exports = router;
