const express = require('express');
const router = express.Router();
const lookupController = require('../controllers/lookup.controller');
const aiSignController = require('../controllers/aiSign.controller');
const { uploadSignImage } = require('../middlewares/upload.middleware');
const { aiRecognitionLimiter } = require('../middlewares/rateLimit.middleware');

// --- Cụm API Nhận diện Biển báo Giao thông bằng AI (ResNet50) ---
// POST /api/v1/lookup/signs/recognize-file - Nhận diện qua tệp tin tải lên
router.post('/signs/recognize-file', aiRecognitionLimiter, uploadSignImage.single('image'), aiSignController.recognizeFromFile);
// POST /api/v1/lookup/signs/recognize-camera - Nhận diện qua Camera trực tiếp (Base64)
router.post('/signs/recognize-camera', aiRecognitionLimiter, aiSignController.recognizeFromCamera);

// --- Cụm API Biển báo giao thông ---
// GET /api/v1/lookup/signs/categories - Nhóm biển báo
router.get('/signs/categories', lookupController.getSignCategories);
// GET /api/v1/lookup/signs - Danh sách / tìm kiếm biển báo
router.get('/signs', lookupController.getSigns);
// GET /api/v1/lookup/signs/:id - Chi tiết biển báo
router.get('/signs/:id', lookupController.getSignById);

// --- Cụm API Mức phạt giao thông (Nghị định 100/123) ---
// GET /api/v1/lookup/fines/categories - Danh mục phương tiện
router.get('/fines/categories', lookupController.getFineCategories);
// GET /api/v1/lookup/fines - Danh sách / tìm kiếm mức phạt
router.get('/fines', lookupController.getFines);
// GET /api/v1/lookup/fines/:id - Chi tiết mức phạt
router.get('/fines/:id', lookupController.getFineById);

module.exports = router;
