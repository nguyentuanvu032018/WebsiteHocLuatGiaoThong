const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

// Khởi tạo Connection Pool cho MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'traffic_exam_db',
  charset: 'utf8mb4',              //Đảm bảo tiếng Việt không bị Mojibake
  timezone: '+07:00',              //Giờ Việt Nam
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Hàm kiểm tra kết nối CSDL khi khởi động
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ [MySQL] Kết nối cơ sở dữ liệu traffic_exam_db thành công!');
    connection.release();
  } catch (error) {
    console.error('❌ [MySQL] Lỗi kết nối CSDL:', error.message);
    console.error('👉 Vui lòng kiểm tra lại cấu hình DB trong file backend/.env và chắc chắn MySQL Server đang bật.');
  }
}

module.exports = {
  pool,
  testConnection
};
