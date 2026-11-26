const app = require('./app');
const { testConnection } = require('./config/db.config');

const PORT = process.env.PORT || 5000;

// Khởi chạy máy chủ HTTP
const server = app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 [Backend Server] Đang chạy tại: http://localhost:${PORT}`);
  console.log(`📡 [Môi trường]: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📧 [SMTP Host]: ${process.env.SMTP_HOST || 'Chưa cấu hình'}`);
  console.log(`=======================================================`);

  // Kiểm tra kết nối tới MySQL
  await testConnection();
});

// Xử lý sự cố tắt máy chủ đột ngột (Graceful Shutdown)
process.on('SIGTERM', () => {
  console.log('🛑 [SIGTERM] Nhận tín hiệu dừng server, đang đóng kết nối...');
  server.close(() => {
    console.log('✅ Máy chủ đã dừng an toàn.');
    process.exit(0);
  });
});
