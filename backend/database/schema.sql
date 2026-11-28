-- ==============================================================================
-- HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN
-- Database Schema: traffic_exam_db
-- Thiết kế theo chuẩn 600 câu hỏi sát hạch lý thuyết Tổng cục Đường bộ Việt Nam
-- ==============================================================================

-- 1. Khởi tạo Cơ sở dữ liệu
CREATE DATABASE IF NOT EXISTS traffic_exam_db 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE traffic_exam_db;

-- Tạm thời vô hiệu hóa kiểm tra khóa ngoại để dọn dẹp các bảng cũ (nếu có)
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS exam_session_details;
DROP TABLE IF EXISTS exam_sessions;
DROP TABLE IF EXISTS exam_structure_rules;
DROP TABLE IF EXISTS answers;
DROP TABLE IF EXISTS questions;
DROP TABLE IF EXISTS chapters;
DROP TABLE IF EXISTS license_types;
DROP TABLE IF EXISTS traffic_fines;
DROP TABLE IF EXISTS fine_categories;
DROP TABLE IF EXISTS traffic_signs;
DROP TABLE IF EXISTS sign_categories;
DROP TABLE IF EXISTS users;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 1. BẢNG NGƯỜI DÙNG & PHÂN QUYỀN (users)
-- ==============================================================================
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL COMMENT 'Họ và tên thí sinh/quản trị viên',
    email VARCHAR(150) NOT NULL UNIQUE COMMENT 'Email đăng nhập hệ thống',
    password_hash VARCHAR(255) NOT NULL COMMENT 'Mật khẩu mã hóa băm bằng bcrypt',
    phone VARCHAR(20) NULL COMMENT 'Số điện thoại liên hệ',
    role ENUM('student', 'admin') NOT NULL DEFAULT 'student' COMMENT 'Quyền hạn: học viên hoặc admin',
    is_active TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1: Hoạt động, 0: Đã khóa',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. BẢNG CẤU HÌNH HẠNG BẰNG LÁI XE (license_types)
-- ==============================================================================
CREATE TABLE license_types (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(10) NOT NULL UNIQUE COMMENT 'Mã hạng: A, A1, B, B1, C, C1',
    name VARCHAR(100) NOT NULL COMMENT 'Tên đầy đủ của hạng giấy phép lái xe',
    total_questions INT NOT NULL COMMENT 'Tổng số lượng câu hỏi trong 1 đề thi',
    duration_minutes INT NOT NULL COMMENT 'Thời gian thi tính bằng phút',
    passing_score INT NOT NULL COMMENT 'Số câu trả lời đúng tối thiểu để ĐẠT',
    description TEXT NULL COMMENT 'Mô tả đối tượng phương tiện được phép điều khiển',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. BẢNG CHƯƠNG LÝ THUYẾT (chapters)
-- ==============================================================================
CREATE TABLE chapters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT 'Tên chương giáo trình 600 câu',
    description TEXT NULL,
    order_number INT NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. BẢNG NGÂN HÀNG CÂU HỎI (questions)
-- ==============================================================================
CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    chapter_id INT NOT NULL COMMENT 'Thuộc chương nào trong 7 chương',
    content TEXT NOT NULL COMMENT 'Nội dung câu hỏi lý thuyết',
    image_url VARCHAR(255) NULL COMMENT 'Đường dẫn ảnh sa hình, biển báo liên quan (nếu có)',
    is_paralysis TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Câu hỏi điểm liệt (sai là rớt trực tiếp), 0: Câu hỏi bình thường',
    explanation TEXT NULL COMMENT 'Lời giải thích đáp án và mẹo nhớ luật',
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE RESTRICT,
    INDEX idx_question_chapter (chapter_id),
    INDEX idx_question_paralysis (is_paralysis)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. BẢNG CÁC PHƯƠNG ÁN ĐÁP ÁN (answers)
-- ==============================================================================
CREATE TABLE answers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    answer_text TEXT NOT NULL COMMENT 'Nội dung phương án trả lời',
    is_correct TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Đáp án đúng, 0: Đáp án sai',
    order_number INT NOT NULL DEFAULT 1 COMMENT 'Thứ tự hiển thị 1, 2, 3, 4',
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    INDEX idx_answer_question (question_id),
    INDEX idx_answer_correct (is_correct)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. BẢNG MA TRẬN CẤU TRÚC ĐỀ THI THEO BỘ GTVT (exam_structure_rules)
-- ==============================================================================
CREATE TABLE exam_structure_rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    license_type_id INT NOT NULL,
    chapter_id INT NOT NULL,
    question_count INT NOT NULL DEFAULT 0 COMMENT 'Số câu bình thường lấy từ chương này',
    paralysis_count INT NOT NULL DEFAULT 0 COMMENT 'Số câu điểm liệt bắt buộc lấy từ chương này',
    FOREIGN KEY (license_type_id) REFERENCES license_types(id) ON DELETE CASCADE,
    FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
    UNIQUE KEY uk_license_chapter (license_type_id, chapter_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 7. BẢNG LƯỢT THI CỦA THÍ SINH (exam_sessions)
-- ==============================================================================
CREATE TABLE exam_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    license_type_id INT NOT NULL,
    score INT NOT NULL DEFAULT 0 COMMENT 'Tổng số câu trả lời đúng',
    total_questions INT NOT NULL COMMENT 'Tổng số câu trong đề thi',
    has_paralysis_failed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Bị đánh rớt do làm sai câu hỏi điểm liệt',
    is_passed TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: ĐẠT, 0: KHÔNG ĐẠT',
    time_spent_seconds INT NOT NULL DEFAULT 0 COMMENT 'Thời gian làm bài thực tế (giây)',
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (license_type_id) REFERENCES license_types(id) ON DELETE RESTRICT,
    INDEX idx_session_user (user_id, started_at),
    INDEX idx_session_license (license_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 8. BẢNG CHI TIẾT TỪNG CÂU TRONG BÀI THI (exam_session_details)
-- ==============================================================================
CREATE TABLE exam_session_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_session_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_answer_id INT NULL COMMENT 'ID đáp án thí sinh đã chọn (NULL nếu bỏ trống)',
    is_correct TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1: Đúng, 0: Sai',
    FOREIGN KEY (exam_session_id) REFERENCES exam_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE RESTRICT,
    FOREIGN KEY (selected_answer_id) REFERENCES answers(id) ON DELETE SET NULL,
    INDEX idx_detail_session (exam_session_id),
    INDEX idx_detail_question (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 9. BẢNG PHÂN LOẠI BIỂN BÁO (sign_categories)
-- ==============================================================================
CREATE TABLE sign_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE COMMENT 'CAM, NGUY_HIEM, HIEU_LENH, CHI_DAN, PHU',
    name VARCHAR(150) NOT NULL COMMENT 'Tên nhóm: Biển báo cấm, Biển nguy hiểm...',
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. BẢNG HỆ THỐNG BIỂN BÁO ĐƯỜNG BỘ (traffic_signs)
-- ==============================================================================
CREATE TABLE traffic_signs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL,
    sign_code VARCHAR(50) NOT NULL COMMENT 'Mã hiệu biển báo: P.101, W.201...',
    name VARCHAR(255) NOT NULL COMMENT 'Tên biển báo',
    description TEXT NULL COMMENT 'Ý nghĩa và quy cách áp dụng của biển báo',
    image_url VARCHAR(255) NULL COMMENT 'Hình ảnh biển báo',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES sign_categories(id) ON DELETE RESTRICT,
    INDEX idx_sign_category (category_id),
    INDEX idx_sign_code (sign_code),
    FULLTEXT INDEX ft_sign_search (sign_code, name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 11. BẢNG PHÂN LOẠI MỨC XỬ PHẠT (fine_categories)
-- ==============================================================================
CREATE TABLE fine_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_type ENUM('OTO', 'XE_MAY', 'KHAC') NOT NULL COMMENT 'Nhóm phương tiện vi phạm',
    name VARCHAR(150) NOT NULL,
    description TEXT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 12. BẢNG TRA CỨU MỨC XỬ PHẠT GIAO THÔNG (traffic_fines)
-- ==============================================================================
CREATE TABLE traffic_fines (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fine_category_id INT NOT NULL,
    violation_title VARCHAR(255) NOT NULL COMMENT 'Hành vi vi phạm: Vượt đèn đỏ, nồng độ cồn...',
    violation_detail TEXT NOT NULL COMMENT 'Chi tiết hành vi vi phạm',
    min_fine_amount BIGINT NOT NULL DEFAULT 0 COMMENT 'Mức phạt tiền tối thiểu (VNĐ)',
    max_fine_amount BIGINT NOT NULL DEFAULT 0 COMMENT 'Mức phạt tiền tối đa (VNĐ)',
    penalty_addition TEXT NULL COMMENT 'Hình phạt bổ sung: Tước bằng, tạm giữ xe...',
    legal_reference VARCHAR(255) NULL COMMENT 'Căn cứ: Nghị định 100/2019/NĐ-CP & 123/2021/NĐ-CP',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (fine_category_id) REFERENCES fine_categories(id) ON DELETE RESTRICT,
    INDEX idx_fine_category (fine_category_id),
    FULLTEXT INDEX ft_fine_search (violation_title, violation_detail)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- DỮ LIỆU CỐT LÕI MẪU (CORE SEED DATA BAN ĐẦU)
-- ==============================================================================

-- 1. Tài khoản Quản trị viên mặc định (Mật khẩu: admin123)
-- Hash bcrypt tương ứng: $2a$10$wT4cK2p1C7Zq6lWvH6V8t.fVfX.g1V6YgQh0VqM9kK9P0H7m4I4x6
INSERT INTO users (full_name, email, password_hash, role) 
VALUES
--mk: admin123 
('Quản Trị Viên', 'admin@gmail.com', '$2b$10$bBfRULGNICEIHLyR4P5ofuwjOuh.xc8NG.ajFJoPEvWTotWa4/C1m', 'admin'),--mk: admin123
('Học Viên Mẫu', 'hocvien@gmail.com', '$2b$10$bBfRULGNICEIHLyR4P5ofuwjOuh.xc8NG.ajFJoPEvWTotWa4/C1m', 'student')
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name), password_hash=VALUES(password_hash);

-- 2. Khởi tạo 7 chương lý thuyết chuẩn
INSERT INTO chapters (id, title, description, order_number) VALUES
(1, 'Chương I: Khái niệm và quy tắc giao thông đường bộ', 'Bao gồm các định nghĩa, quy tắc đi đường, tốc độ và khoảng cách an toàn.', 1),
(2, 'Chương II: Nghiệp vụ vận tải', 'Quy định đối với người lái xe vận tải hàng hóa, hành khách.', 2),
(3, 'Chương III: Văn hóa, đạo đức người lái xe', 'Trách nhiệm, đạo đức và cách ứng xử văn hóa khi tham gia giao thông.', 3),
(4, 'Chương IV: Kỹ thuật lái xe ô tô', 'Kỹ năng lái xe an toàn trên các địa hình đèo dốc, trơn trượt, mưa bão.', 4),
(5, 'Chương V: Cấu tạo và sửa chữa xe ô tô', 'Kiến thức cơ bản về động cơ, phanh, lốp, đèn và cách khắc phục sự cố thông thường.', 5),
(6, 'Chương VI: Hệ thống biển báo hiệu đường bộ', 'Ý nghĩa các loại biển cấm, biển nguy hiểm, biển hiệu lệnh, biển chỉ dẫn.', 6),
(7, 'Chương VII: Giải các thế sa hình và kỹ năng xử lý tình huống', 'Quy tắc nhường đường tại nơi giao nhau và giải các tình huống sa hình.', 7)
ON DUPLICATE KEY UPDATE title=VALUES(title);

-- 3. Khởi tạo các hạng giấy phép lái xe chuẩn Bộ GTVT
INSERT INTO license_types (id, code, name, total_questions, duration_minutes, passing_score, description) VALUES
(1, 'A', 'Hạng A - Xe máy 2 bánh', 25, 19, 21, 'Phương tiện 2 bánh theo tiêu chuẩn của Bộ GTVT'),
(2, 'A1', 'Hạng A1 - Xe máy dưới 175cc', 25, 19, 21, 'Phương tiện 2 bánh có dung tích xi lanh dưới 175cc'),
(3, 'B', 'Hạng B - Ô tô con & xe tải nhẹ', 30, 20, 27, 'Ôtô chở người dưới 9 chỗ và xe tải sử dụng cho vận tải nhẹ'),
(4, 'B1', 'Hạng B1 - Ô tô số tự động', 30, 20, 27, 'Ôtô chở người dưới 9 chỗ, số tự động hoặc máy kéo hạng nhẹ'),
(5, 'C', 'Hạng C - Xe tải trên 3.5 tấn', 40, 24, 36, 'Xe tải có trọng tải lớn hơn 3.500kg và các phương tiện tương ứng'),
(6, 'C1', 'Hạng C1 - Xe tải dưới 3.5 tấn', 40, 24, 36, 'Xe tải có trọng tải dưới 3.500kg và các phương tiện tương ứng')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 4. Khởi tạo 5 nhóm biển báo đường bộ
INSERT INTO sign_categories (id, code, name, description) VALUES
(1, 'CAM', 'Biển báo cấm', 'Biểu thị các điều cấm mà người tham gia giao thông không được vi phạm (Hình tròn, viền đỏ, nền trắng).'),
(2, 'NGUY_HIEM', 'Biển báo nguy hiểm', 'Cảnh báo trước các nguy hiểm có thể xảy ra trên đoạn đường (Hình tam giác đều, viền đỏ, nền vàng).'),
(3, 'HIEU_LENH', 'Biển hiệu lệnh', 'Báo các hiệu lệnh phải thi hành (Hình tròn, nền xanh lam, hình vẽ màu trắng).'),
(4, 'CHI_DAN', 'Biển chỉ dẫn', 'Chỉ dẫn hướng đi hoặc các điều cần thiết (Hình chữ nhật hoặc hình vuông, nền xanh lam).'),
(5, 'PHU', 'Biển phụ', 'Thuyết minh bổ sung cho các loại biển báo chính (Hình chữ nhật, viền đen, nền trắng).')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- 5. Khởi tạo các nhóm phương tiện tra cứu mức phạt
INSERT INTO fine_categories (id, vehicle_type, name, description) VALUES
(1, 'XE_MAY', 'Xe môtô, xe gắn máy', 'Áp dụng cho xe môtô 2 bánh, 3 bánh, xe gắn máy kể cả xe máy điện.'),
(2, 'OTO', 'Xe ôtô và phương tiện tương tự', 'Áp dụng cho ôtô con, xe tải, xe khách, máy kéo chuyên dùng.'),
(3, 'KHAC', 'Xe đạp, xe thô sơ, người đi bộ', 'Các vi phạm liên quan đến người đi bộ, xe súc vật kéo, xe đạp điện.')
ON DUPLICATE KEY UPDATE name=VALUES(name);
