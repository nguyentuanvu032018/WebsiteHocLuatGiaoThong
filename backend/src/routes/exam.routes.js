const express = require('express');
const router = express.Router();
const examController = require('../controllers/exam.controller');
const verifyToken = require('../middlewares/auth.middleware');

// GET /api/v1/exams/license-types - Danh sách các hạng bằng (A, A1, B, B1, C, C1, D, D1, D2)
router.get('/license-types', examController.getLicenseTypes);

// GET /api/v1/exams/license-types/:id/rules - Xem cấu trúc ma trận của 1 hạng bằng
router.get('/license-types/:id/rules', examController.getRulesByLicense);

// GET /api/v1/exams/history - Lấy lịch sử thi của thí sinh (Đặt trước /:id)
router.get('/history', verifyToken, examController.getHistory);

// POST /api/v1/exams/generate - Sinh đề thi ngẫu nhiên theo ma trận
router.post('/generate', verifyToken, examController.generateExam);

// POST /api/v1/exams/:id/submit - Nộp bài thi và chấm điểm tự động
router.post('/:id/submit', verifyToken, examController.submitExam);

// GET /api/v1/exams/:id - Xem chi tiết bài thi theo ID
router.get('/:id', verifyToken, examController.getSession);

module.exports = router;
