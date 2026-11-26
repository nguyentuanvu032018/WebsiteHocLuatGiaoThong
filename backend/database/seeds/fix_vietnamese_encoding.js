const { pool } = require('../../src/config/db.config');

async function fixVietnameseEncoding() {
  console.log('🔄 Đang bắt đầu cập nhật lại bảng mã tiếng Việt trong CSDL...');

  try {
    // 1. Cập nhật bảng sign_categories
    console.log('👉 Đang cập nhật sign_categories...');
    await pool.query(`
      UPDATE sign_categories SET 
        name = 'Biển báo cấm', 
        description = 'Biểu thị các điều cấm mà người tham gia giao thông không được vi phạm (Hình tròn, viền đỏ, nền trắng).' 
      WHERE id = 1
    `);
    await pool.query(`
      UPDATE sign_categories SET 
        name = 'Biển báo nguy hiểm', 
        description = 'Cảnh báo trước các nguy hiểm có thể xảy ra trên đoạn đường (Hình tam giác đều, viền đỏ, nền vàng).' 
      WHERE id = 2
    `);
    await pool.query(`
      UPDATE sign_categories SET 
        name = 'Biển hiệu lệnh', 
        description = 'Báo các hiệu lệnh phải thi hành (Hình tròn, nền xanh lam, hình vẽ màu trắng).' 
      WHERE id = 3
    `);
    await pool.query(`
      UPDATE sign_categories SET 
        name = 'Biển chỉ dẫn', 
        description = 'Chỉ dẫn hướng đi hoặc các điều cần thiết (Hình chữ nhật hoặc hình vuông, nền xanh lam).' 
      WHERE id = 4
    `);
    await pool.query(`
      UPDATE sign_categories SET 
        name = 'Biển phụ', 
        description = 'Thuyết minh bổ sung cho các loại biển báo chính (Hình chữ nhật, viền đen, nền trắng).' 
      WHERE id = 5
    `);

    // 2. Cập nhật bảng fine_categories
    console.log('👉 Đang cập nhật fine_categories...');
    await pool.query(`
      UPDATE fine_categories SET 
        name = 'Xe môtô, xe gắn máy', 
        description = 'Áp dụng cho xe môtô 2 bánh, 3 bánh, xe gắn máy kể cả xe máy điện.' 
      WHERE id = 1
    `);
    await pool.query(`
      UPDATE fine_categories SET 
        name = 'Xe ôtô và phương tiện tương tự', 
        description = 'Áp dụng cho ôtô con, xe tải, xe khách, máy kéo chuyên dùng.' 
      WHERE id = 2
    `);
    await pool.query(`
      UPDATE fine_categories SET 
        name = 'Xe đạp, xe thô sơ, người đi bộ', 
        description = 'Các vi phạm liên quan đến người đi bộ, xe súc vật kéo, xe đạp điện.' 
      WHERE id = 3
    `);

    // 3. Cập nhật bảng users
    console.log('👉 Đang cập nhật bảng users...');
    await pool.query(`
      UPDATE users SET full_name = 'Quản Trị Viên' WHERE id = 1
    `);
    await pool.query(`
      UPDATE users SET full_name = 'Học Viên Mẫu' WHERE id = 2
    `);
    await pool.query(`
      UPDATE users SET full_name = 'Thí Sinh Kiểm Thử' WHERE id = 5
    `);

    // 4. Kiểm tra lại kết quả
    console.log('\n--- KẾT QUẢ SAU KHI CẬP NHẬT ---');
    const [signCats] = await pool.query('SELECT id, code, name FROM sign_categories');
    console.log('sign_categories:', signCats);

    const [fineCats] = await pool.query('SELECT id, vehicle_type, name FROM fine_categories');
    console.log('fine_categories:', fineCats);

    const [users] = await pool.query('SELECT id, full_name, email FROM users WHERE id IN (1, 2, 5)');
    console.log('users:', users);

    console.log('\n✅ [THÀNH CÔNG] Đã cập nhật toàn bộ dữ liệu tiếng Việt chuẩn UTF-8!');
    process.exit(0);
  } catch (error) {
    console.error('❌ [LỖI]:', error);
    process.exit(1);
  }
}

fixVietnameseEncoding();

