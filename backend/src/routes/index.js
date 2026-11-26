const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const chapterRoutes = require('./chapter.routes');
const questionRoutes = require('./question.routes');
const lookupRoutes = require('./lookup.routes');
const examRoutes = require('./exam.routes');
const userRoutes = require('./user.routes');
const adminRoutes = require('./admin.routes');
const chatbotRoutes = require('./chatbot.routes');

// Đăng ký các cụm API chính
router.use('/auth', authRoutes);
router.use('/chapters', chapterRoutes);
router.use('/questions', questionRoutes);
router.use('/lookup', lookupRoutes);
router.use('/exams', examRoutes);
router.use('/users', userRoutes);
router.use('/admin', adminRoutes);
router.use('/chatbot', chatbotRoutes);

module.exports = router;
