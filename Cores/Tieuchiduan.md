# TIÊU CHÍ DỰ ÁN (PROJECT CRITERIA & SPECIFICATION)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Học phần:** Niên luận Ngành (CT466)  
> **Kiến trúc:** Tách rời (Decoupled Architecture - RESTful API)  
> **Công nghệ:** Node.js (Express) + Vue.js 3 + Bootstrap 5 + MySQL  

---

## 1. MỤC TIÊU VÀ PHẠM VI DỰ ÁN (SCOPE OF WORK)

> **Trạng thái triển khai đến 2026-11-26:** Các phân hệ ôn tập theo nhóm hạng, thi thử, lịch sử, tra cứu, OTP, hồ sơ/avatar, nhận diện biển báo AI, chatbot và quản trị đã có trong mã nguồn. Học viên và admin chạy trên hai cổng frontend riêng (`5173` và `5174`); trang admin mặc định là đăng nhập và không có mục đăng ký, ngrok chỉ chia sẻ cổng học viên. Lối vào ôn tập chung toàn bộ 7 chương đã được gỡ; A/A1 gồm chương I–V, B/B1 và C/C1 gồm đủ 7 chương. Bảng yêu cầu bên dưới vẫn là đặc tả nghiệm thu; trạng thái từng mốc được theo dõi tại `Cores/checkpoint.md` và các hạng mục bảo mật còn mở tại `Cores/fix_bao_mat.md`. Build/cú pháp thành công không đồng nghĩa đã kiểm thử end-to-end toàn bộ môi trường triển khai.

### 1.1. Mục tiêu chung
Xây dựng một hệ thống phần mềm web hoàn chỉnh hỗ trợ người học ôn luyện lý thuyết 600 câu hỏi và thi thử sát hạch giấy phép lái xe (GPLX) các hạng (A, A1, B, B1, C, C1) theo đúng chuẩn quy định của Bộ Giao thông Vận tải và Tổng cục Đường bộ Việt Nam.

### 1.2. Đối tượng phục vụ
- **Học viên:** Người có nhu cầu ôn thi bằng lái xe, tra cứu biển báo và quy định mức phạt vi phạm giao thông.
- **Quản trị viên (Admin):** Người quản lý ngân hàng câu hỏi, cập nhật văn bản luật, điều chỉnh ma trận đề thi và giám sát học viên.

---

## 2. TIÊU CHÍ YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

> **Cách đọc trạng thái:** Các ô `[ ]` trong phần yêu cầu là checklist kiểm thử/nghiệm thu, không khẳng định chức năng chưa có trong mã nguồn. Đối chiếu trạng thái hiện thực tại `Cores/checkpoint.md`; chỉ đánh dấu hoàn thành sau khi có kiểm thử nghiệm thu phù hợp.

### FR-01: Phân hệ Xác thực & Quản lý Tài khoản (Auth & Users)
- [ ] Cho phép người dùng đăng ký tài khoản với email, họ tên, mật khẩu.
- [ ] Đăng nhập hệ thống bằng email và mật khẩu, cấp phát **JWT Token** lưu tại Client.
- [ ] Bảo mật mật khẩu: Bắt buộc mã hóa một chiều bằng **bcrypt** (salt >= 10).
- [ ] Phân quyền người dùng (Role-Based Access Control):
  - `student`: Học viên (ôn tập, thi thử, xem lịch sử cá nhân).
  - `admin`: Quản trị viên (toàn quyền hệ thống).
- [ ] Xem và chỉnh sửa thông tin cá nhân, đổi mật khẩu.

### FR-02: Phân hệ Ôn tập theo nhóm GPLX (Study Module)
- [ ] Phân loại câu hỏi chính xác theo **7 chương chuẩn Bộ GTVT**:
  1. Khái niệm và quy tắc giao thông đường bộ.
  2. Nghiệp vụ vận tải.
  3. Văn hóa, đạo đức người lái xe.
  4. Kỹ thuật lái xe.
  5. Cấu tạo và sửa chữa xe.
  6. Hệ thống biển báo hiệu đường bộ.
  7. Giải các thế sa hình và kỹ năng xử lý tình huống.
- [ ] Lối vào ôn tập theo nhóm GPLX: A/A1 giới hạn chương I–V; B/B1 và C/C1 bao gồm cả 7 chương. Không có lối vào ôn tập chung toàn bộ 7 chương; hạng cụ thể vẫn được chọn khi bắt đầu thi thử.
- [ ] Chuyên đề đặc biệt: **Bộ 60 câu hỏi điểm liệt** (tình huống mất an toàn giao thông nghiêm trọng).
- [ ] Hiển thị câu hỏi kèm hình ảnh trực quan (sa hình, biển báo liên quan).
- [ ] Chế độ học tương tác: Xem đáp án đúng ngay khi chọn, kèm phần giải thích chi tiết lý do và mẹo làm bài.

### FR-03: Phân hệ Tra cứu Biển báo & Mức xử phạt (Lookup Module)
- [ ] **Hệ thống biển báo đường bộ:**
  - Phân loại theo 5 nhóm: Biển báo cấm, Biển báo nguy hiểm, Biển hiệu lệnh, Biển chỉ dẫn, Biển phụ.
  - Tìm kiếm nhanh theo mã hiệu biển báo (VD: P.101, W.201...) hoặc từ khóa tên biển.
- [ ] **Mức phạt vi phạm giao thông:**
  - Căn cứ pháp lý: Nghị định 100/2019/NĐ-CP và Nghị định 123/2021/NĐ-CP.
  - Phân loại theo nhóm phương tiện: Xe máy, Ô tô, Phương tiện khác.
  - Tra cứu nhanh theo từ khóa hành vi: "vượt đèn đỏ", "nồng độ cồn", "chạy quá tốc độ", "không đội mũ bảo hiểm"...
  - Hiển thị đầy đủ: Mức phạt tiền (từ - đến), hình phạt bổ sung (tước bằng, giữ xe) và điều khoản luật viện dẫn.

### FR-04: Phân hệ Thi sát hạch ngẫu nhiên (Exam Engine)
- [ ] Hỗ trợ đầy đủ các hạng giấy phép lái xe:
  - **Hạng A:** 25 câu - 19 phút - Đạt 21/25 - Không sai câu điểm liệt.
  - **Hạng A1:** 25 câu - 19 phút - Đạt 21/25 - Không sai câu điểm liệt.
  - **Hạng B:** 30 câu - 20 phút - Đạt 27/30 - Không sai câu điểm liệt.
  - **Hạng B1:** 30 câu - 20 phút - Đạt 27/30 - Không sai câu điểm liệt.
  - **Hạng C:** 40 câu - 24 phút - Đạt 36/40 - Không sai câu điểm liệt.
  - **Hạng C1:** 40 câu - 24 phút - Đạt 36/40 - Không sai câu điểm liệt.
- [ ] **Thuật toán sinh đề ma trận:** Bốc ngẫu nhiên câu hỏi phân bổ đúng tỉ lệ theo từng chương, bắt buộc có đúng số lượng câu điểm liệt theo quy định.
- [ ] **Bảo mật thi cử:** Client tuyệt đối không nhận trường `is_correct` trong lúc đang thi.
- [ ] **Đồng hồ đếm ngược:** Đếm ngược thời gian thực, tự động thu bài và chấm điểm khi hết giờ (`00:00`).
- [ ] **Phím tắt phòng thi:** Hỗ trợ phím số 1, 2, 3, 4 để chọn đáp án; phím mũi tên hoặc phím Tab để chuyển câu hỏi nhanh.
- [ ] **Lưới danh sách câu hỏi (Palette):** Đánh dấu trạng thái câu chưa làm (xám), đã làm (xanh), câu đang xem (viền sáng).
- [ ] **Cơ chế chấm điểm tự động & Kiểm tra điểm liệt:**
  - Tổng điểm $\ge$ Ngưỡng đạt VÀ Số câu điểm liệt làm sai $= 0 \implies$ **ĐẠT**.
  - Sai bất kỳ câu điểm liệt nào $\implies$ **TRƯỢT TRỰC TIẾP** (có thông báo cảnh báo rõ câu điểm liệt đã làm sai).

### FR-05: Phân hệ Lịch sử & Báo cáo tiến độ (Student History)
- [ ] Lưu trữ toàn bộ các lượt thi vào cơ sở dữ liệu (`exam_sessions` và `exam_session_details`).
- [ ] Màn hình xem lại bài thi (Review): Hiển thị từng câu, đáp án thí sinh đã chọn, đáp án đúng chuẩn và lời giải thích.
- [ ] Thống kê tỉ lệ đạt/trượt qua các lần thi, phân tích các chủ đề câu hỏi mà học viên hay làm sai nhất.

### FR-06: Phân hệ Quản trị (Admin Dashboard)
- [ ] Dashboard thống kê: Tổng số câu hỏi, số tài khoản học viên, số lượt thi thử và tỉ lệ đạt trung bình.
- [ ] Quản lý ngân hàng câu hỏi (CRUD): Thêm mới, sửa nội dung/đáp án, xóa câu hỏi, gắn cờ câu điểm liệt, upload hình ảnh sa hình.
- [ ] Import câu hỏi hàng loạt từ file dữ liệu (JSON / Excel).
- [ ] Cấu hình ma trận cấu trúc đề thi theo từng hạng bằng.
- [ ] Quản lý tài khoản người dùng: Khóa / mở khóa tài khoản.

---

## 3. TIÊU CHÍ YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

### NFR-01: Kiến trúc & Công nghệ (Decoupled Architecture)
- Phân tách 100% giữa Frontend và Backend.
- Backend cung cấp các RESTful API endpoints độc lập, giao tiếp thông qua JSON.
- Frontend là Single Page Application (SPA) viết bằng Vue.js 3 và Bootstrap 5.

### NFR-02: Hiệu năng & Tối ưu (Performance)
- Thời gian phản hồi API tra cứu câu hỏi, biển báo: $< 200\text{ms}$.
- Sử dụng MySQL Connection Pooling để xử lý nhiều yêu cầu đồng thời.
- Tạo Index đầy đủ cho các trường khóa ngoại, cờ `is_paralysis` và trường tìm kiếm.
- Áp dụng Debounce (300ms) trên các ô tìm kiếm để tối ưu lưu lượng mạng.

### NFR-03: Bảo mật (Security)
- Ngăn chặn triệt để SQL Injection bằng Parameterized Queries / Prepared Statements với `mysql2`.
- Sử dụng thư viện `helmet` để bảo vệ các HTTP headers tiêu chuẩn.
- Rate limiting để chống brute-force mật khẩu.
- Không để lộ secret key trong source code (sử dụng biến môi trường `.env`).

### NFR-04: Trải nghiệm người dùng (UI/UX)
- Thiết kế giao diện hiện đại, trực quan, chuyên nghiệp với Bootstrap 5.
- Tương thích tốt trên máy tính để bàn (Desktop), máy tính bảng (Tablet) và điện thoại di động (Mobile).
- Thông báo lỗi và trạng thái thao tác rõ ràng (SweetAlert2 hoặc Toast messages).

---

## 4. TIÊU CHÍ ĐÁNH GIÁ NGHIỆM THU (ACCEPTANCE CRITERIA / RUBRIC NIÊN LUẬN)

| STT | Hạng mục đánh giá | Mức độ hoàn thành | Điểm trọng số |
| :---: | :--- | :---: | :---: |
| 1 | **Kiến trúc & CSDL:** Phân tách Decoupled rõ ràng, CSDL MySQL chuẩn hóa 3NF, có quan hệ khóa ngoại toàn vẹn | Bắt buộc | 20% |
| 2 | **Backend API & Bảo mật:** Đầy đủ RESTful APIs, JWT Auth, mã hóa mật khẩu, phân quyền RBAC chuẩn | Bắt buộc | 25% |
| 3 | **Thuật toán cốt lõi:** Sinh đề ma trận ngẫu nhiên chuẩn GTVT, chấm điểm tự động và phán quyết điểm liệt chính xác 100% | Bắt buộc | 25% |
| 4 | **Frontend SPA & UX:** Giao diện Vue 3 đẹp, mượt mà, phòng thi đếm ngược chuẩn xác, phím tắt tiện lợi | Bắt buộc | 20% |
| 5 | **Phân hệ Admin & Báo cáo:** CRUD câu hỏi, upload ảnh sa hình, xem lịch sử thi, tài liệu đầy đủ | Khuyến khích | 10% |
