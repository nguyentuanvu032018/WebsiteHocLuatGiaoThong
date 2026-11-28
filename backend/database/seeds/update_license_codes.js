/**
 * Script: update_license_codes.js
 * Mục đích: Cập nhật code và name của license_types theo hệ thống 6 hạng
 * Chạy: node backend/database/seeds/update_license_codes.js
 */

const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'traffic_exam_db',
  charset: 'utf8mb4',
};

// Dữ liệu mới: id => { code, name, description }
const LICENSE_UPDATES = [
  { id: 1, code: 'A',  name: 'Hạng A - Xe máy 2 bánh',                    description: 'Phương tiện 2 bánh theo tiêu chuẩn của Bộ GTVT' },
  { id: 2, code: 'A1', name: 'Hạng A1 - Xe máy dưới 175cc',               description: 'Phương tiện 2 bánh có dung tích xi lanh dưới 175cc' },
  { id: 3, code: 'B',  name: 'Hạng B - Ô tô con & xe tải nhẹ',            description: 'Ôtô chở người dưới 9 chỗ và xe tải sử dụng cho vận tải nhẹ' },
  { id: 4, code: 'B1', name: 'Hạng B1 - Ô tô số tự động',                 description: 'Ôtô chở người dưới 9 chỗ, số tự động hoặc máy kéo hạng nhẹ' },
  { id: 5, code: 'C',  name: 'Hạng C - Xe tải trên 3.5 tấn',              description: 'Xe tải có trọng tải lớn hơn 3.500kg và các phương tiện tương ứng' },
  { id: 6, code: 'C1', name: 'Hạng C1 - Xe tải dưới 3.5 tấn',            description: 'Xe tải có trọng tải dưới 3.500kg và các phương tiện tương ứng' },
];

async function updateLicenseCodes() {
  const conn = await mysql.createConnection(DB_CONFIG);
  
  try {
    console.log('🔧 Bắt đầu cập nhật license_types...\n');
    
    // Disable unique check tạm thời để tránh conflict khi đổi code
    await conn.query('SET foreign_key_checks = 0');
    await conn.query('SET unique_checks = 0');

    for (const lic of LICENSE_UPDATES) {
      // Phải dùng UPDATE trực tiếp theo ID để đổi được cả code (UNIQUE)
      const [result] = await conn.query(
        `UPDATE license_types 
         SET code = ?, name = ?, description = ?
         WHERE id = ?`,
        [lic.code, lic.name, lic.description, lic.id]
      );
      
      const status = result.affectedRows > 0 ? '✅' : '⚠️  (không tìm thấy)';
      console.log(`  ${status} ID ${lic.id}: ${lic.code} - ${lic.name}`);
    }
    
    // Re-enable checks
    await conn.query('SET foreign_key_checks = 1');
    await conn.query('SET unique_checks = 1');

    // Verify kết quả
    console.log('\n📋 Kết quả sau cập nhật:');
    const [rows] = await conn.query(
      'SELECT id, code, name, total_questions, duration_minutes, passing_score FROM license_types ORDER BY id'
    );
    
    for (const row of rows) {
      console.log(`  ID ${row.id}: [${row.code}] ${row.name} — ${row.total_questions} câu / ${row.duration_minutes} phút / đạt ${row.passing_score}`);
    }

    // Kiểm tra exam_structure_rules
    console.log('\n📊 Kiểm tra exam_structure_rules:');
    const [rules] = await conn.query(
      `SELECT lt.code, COUNT(esr.chapter_id) as chapters, SUM(esr.question_count) as total_q
       FROM exam_structure_rules esr
       JOIN license_types lt ON lt.id = esr.license_type_id
       GROUP BY lt.id, lt.code
       ORDER BY lt.id`
    );
    
    for (const r of rules) {
      console.log(`  Hạng ${r.code}: ${r.chapters} chương, ${r.total_q} câu`);
    }

    console.log('\n🎉 Cập nhật hoàn tất!');
    
  } catch (err) {
    console.error('❌ Lỗi:', err.message);
    throw err;
  } finally {
    await conn.end();
  }
}

updateLicenseCodes().catch(console.error);

