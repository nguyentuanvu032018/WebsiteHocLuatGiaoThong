const express = require('express');
const router = express.Router();
const chapterController = require('../controllers/chapter.controller');

// GET /api/v1/chapters - Lấy danh sách 7 chương
router.get('/', chapterController.getAll);

// GET /api/v1/chapters/:id - Chi tiết 1 chương
router.get('/:id', chapterController.getById);

module.exports = router;
