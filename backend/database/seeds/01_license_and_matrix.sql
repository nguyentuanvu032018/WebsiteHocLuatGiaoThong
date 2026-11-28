-- ==============================================================================
-- SEED DATA 01: 7 CHƯƠNG LÝ THUYẾT & MA TRẬN ĐỀ THI CHUẨN BỘ GTVT
-- Áp dụng cho các hạng giấy phép lái xe: A, A1, B, B1, C, C1
-- ==============================================================================

USE traffic_exam_db;

-- 1. ĐẢM BẢO 7 CHƯƠNG LÝ THUYẾT ĐÃ CÓ TRONG CSDL
INSERT INTO chapters (id, title, description, order_number) VALUES
(1, 'Chương I: Khái niệm và quy tắc giao thông đường bộ', 'Bao gồm các định nghĩa, quy tắc đi đường, tốc độ và khoảng cách an toàn.', 1),
(2, 'Chương II: Nghiệp vụ vận tải', 'Quy định đối với người lái xe vận tải hàng hóa, hành khách.', 2),
(3, 'Chương III: Văn hóa, đạo đức người lái xe', 'Trách nhiệm, đạo đức và cách ứng xử văn hóa khi tham gia giao thông.', 3),
(4, 'Chương IV: Kỹ thuật lái xe ô tô', 'Kỹ năng lái xe an toàn trên các địa hình đèo dốc, trơn trượt, mưa bão.', 4),
(5, 'Chương V: Cấu tạo và sửa chữa xe ô tô', 'Kiến thức cơ bản về động cơ, phanh, lốp, đèn và cách khắc phục sự cố thông thường.', 5),
(6, 'Chương VI: Hệ thống biển báo hiệu đường bộ', 'Ý nghĩa các loại biển cấm, biển nguy hiểm, biển hiệu lệnh, biển chỉ dẫn.', 6),
(7, 'Chương VII: Giải các thế sa hình và kỹ năng xử lý tình huống', 'Quy tắc nhường đường tại nơi giao nhau và giải các tình huống sa hình.', 7)
ON DUPLICATE KEY UPDATE 
    title = VALUES(title),
    description = VALUES(description),
    order_number = VALUES(order_number);

-- 2. CẤU HÌNH CÁC HẠNG GIẤY PHÉP LÁI XE (A, A1, B, B1, C, C1)
INSERT INTO license_types (id, code, name, total_questions, duration_minutes, passing_score, description) VALUES
(1, 'A', 'Hạng A - Xe máy 2 bánh', 25, 19, 21, 'Phương tiện 2 bánh theo tiêu chuẩn của Bộ GTVT'),
(2, 'A1', 'Hạng A1 - Xe máy dưới 175cc', 25, 19, 21, 'Phương tiện 2 bánh có dung tích xi lanh dưới 175cc'),
(3, 'B', 'Hạng B - Ô tô con & xe tải nhẹ', 30, 20, 27, 'Ôtô chở người dưới 9 chỗ và xe tải sử dụng cho vận tải nhẹ'),
(4, 'B1', 'Hạng B1 - Ô tô số tự động', 30, 20, 27, 'Ôtô chở người dưới 9 chỗ, số tự động hoặc máy kéo hạng nhẹ'),
(5, 'C', 'Hạng C - Xe tải trên 3.5 tấn', 40, 24, 36, 'Xe tải có trọng tải lớn hơn 3.500kg và các phương tiện tương ứng'),
(6, 'C1', 'Hạng C1 - Xe tải dưới 3.5 tấn', 40, 24, 36, 'Xe tải có trọng tải dưới 3.500kg và các phương tiện tương ứng')
ON DUPLICATE KEY UPDATE
    name = VALUES(name),
    total_questions = VALUES(total_questions),
    duration_minutes = VALUES(duration_minutes),
    passing_score = VALUES(passing_score),
    description = VALUES(description);

-- 3. CẤU HÌNH MA TRẬN ĐỀ THI CHUẨN CỦA BỘ GTVT (exam_structure_rules)
-- Quy định số câu hỏi của từng chương và số câu điểm liệt bắt buộc cho mỗi hạng bằng

DELETE FROM exam_structure_rules;

-- -----------------------------------------------------------------------------
-- HẠNG A / A1 (25 câu - 19 phút - Đạt 21/25 - Bắt buộc 1 câu điểm liệt)
-- -----------------------------------------------------------------------------
INSERT INTO exam_structure_rules (license_type_id, chapter_id, question_count, paralysis_count) VALUES
(1, 1, 9, 1), (1, 2, 0, 0), (1, 3, 1, 0), (1, 4, 1, 0), (1, 5, 0, 0), (1, 6, 7, 0), (1, 7, 7, 0),
(2, 1, 9, 1), (2, 2, 0, 0), (2, 3, 1, 0), (2, 4, 1, 0), (2, 5, 0, 0), (2, 6, 7, 0), (2, 7, 7, 0);

-- -----------------------------------------------------------------------------
-- HẠNG B / B1 (30 câu - 20 phút - Đạt 27/30 - Bắt buộc 1 câu điểm liệt)
-- -----------------------------------------------------------------------------
INSERT INTO exam_structure_rules (license_type_id, chapter_id, question_count, paralysis_count) VALUES
(3, 1, 8, 1), (3, 2, 0, 0), (3, 3, 1, 0), (3, 4, 2, 0), (3, 5, 1, 0), (3, 6, 9, 0), (3, 7, 9, 0),
(4, 1, 8, 1), (4, 2, 0, 0), (4, 3, 1, 0), (4, 4, 2, 0), (4, 5, 1, 0), (4, 6, 9, 0), (4, 7, 9, 0);

-- -----------------------------------------------------------------------------
-- HẠNG C / C1 (40 câu - 24 phút - Đạt 36/40 - Bắt buộc 1 câu điểm liệt)
-- -----------------------------------------------------------------------------
INSERT INTO exam_structure_rules (license_type_id, chapter_id, question_count, paralysis_count) VALUES
(5, 1, 10, 1), (5, 2, 1, 0), (5, 3, 1, 0), (5, 4, 2, 0), (5, 5, 1, 0), (5, 6, 12, 0), (5, 7, 13, 0),
(6, 1, 10, 1), (6, 2, 1, 0), (6, 3, 1, 0), (6, 4, 2, 0), (6, 5, 1, 0), (6, 6, 12, 0), (6, 7, 13, 0);

