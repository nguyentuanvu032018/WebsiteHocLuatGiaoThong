const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// 1. Cấu hình bảo mật HTTP Headers (cho phép Frontend tải ảnh tĩnh cross-origin)
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. Cấu hình CORS cho phép các địa chỉ frontend được khai báo truy cập
const allowedOrigins = new Set(
  (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
allowedOrigins.add('http://localhost:5173');
allowedOrigins.add('http://127.0.0.1:5173');
allowedOrigins.add('http://localhost:5174');
allowedOrigins.add('http://127.0.0.1:5174');

app.use(cors({
  origin: (origin, callback) => callback(null, !origin || allowedOrigins.has(origin)),
  credentials: true
}));

// Logger trung gian ghi nhận mọi request đến backend để dễ debug
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[REQ] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// 3. Phân tích nội dung Request Body
// Tăng giới hạn lên 10MB để hỗ trợ ảnh Base64 từ Camera (mặc định 100KB quá nhỏ)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 4. Phục vụ thư mục hình ảnh tĩnh (ảnh sa hình, biển báo tải lên)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  setHeaders: (res) => {
    res.setHeader('Content-Security-Policy', "sandbox; default-src 'none'");
    res.setHeader('X-Content-Type-Options', 'nosniff');
  }
}));

// 5. Tuyến đường kiểm tra sức khỏe hệ thống (Health Check)
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Chào mừng đến với API Hệ Thống Học & Thi Thử Luật Giao Thông Đường Bộ',
    version: '1.0.0',
    documentation: '/api/v1/health'
  });
});

app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'UP',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// 6. Gắn kết các tuyến đường API phiên bản 1 (/api/v1)
const apiRoutes = require('./routes');
app.use('/api/v1', apiRoutes);

// 7. Xử lý Route không tồn tại (404)
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `Không tìm thấy endpoint: ${req.method} ${req.originalUrl}`
  });
});

// 7. Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 [Server Error]:', err);
  res.status(err.status || err.statusCode || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ (Internal Server Error)',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;
