# SỔ TAY PROMPTS ĐIỀU PHỐI AI (AI PROMPTS PLAYBOOK)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Học phần:** Niên luận Ngành (CT466)  
> **Kiến trúc:** Tách rời (Decoupled Architecture - RESTful API)  
> **Công nghệ:** Node.js (Express) + MySQL 8.0 + Vue.js 3 (Vite, Pinia, Bootstrap 5)  
> **Trạng thái dự án đến 2026-11-09:** Các phân hệ học viên, thi thử và quản trị chính đã được hiện thực; 9 hạng bằng, OTP email, nhận diện biển báo ResNet-50 và chatbot Gemini đã tích hợp. Học viên và admin chạy ở hai cổng riêng (`5173`/`5174`); cổng admin mặc định đến đăng nhập và không có đăng ký, ngrok chỉ được dùng cho cổng học viên. Lối vào ôn tập chung “7 Chương lý thuyết” đã được gỡ; ôn tập theo nhóm: A/A1 gồm chương I–V; B/B1 và C/C1 gồm 7 chương. Cấu trúc chương vẫn cần cho ôn theo hạng, ma trận thi và quản trị. Thi thử vẫn chọn hạng cụ thể; lịch sử nhóm lọc theo các hạng thành viên. Hạng mục kiểm thử còn lại theo checkpoint cần tiếp tục xác minh end-to-end trên môi trường có CSDL/dịch vụ.

> **Tình trạng tiến độ:** `[/]` CP-01 đến CP-04 hoàn thành; CP-05 đang hoàn thiện, các task hiện được ghi đến CP-05.34. CP-05.6 (slide/kịch bản demo) vẫn cần theo dõi.

---

## 1. PROMPT NẠP NGỮ CẢNH DỰ ÁN (PROJECT CONTEXT INITIALIZATION)

*Sử dụng prompt này ở đầu mỗi phiên làm việc mới để nạp toàn diện ngữ cảnh mã nguồn, kiến trúc và tiến độ hiện tại cho AI Agent:*

```markdown
Tôi đang phát triển dự án Niên luận Ngành (CT466): Hệ thống Website Học và Thi Thử Luật Giao Thông Đường Bộ Trực Tuyến.
Dưới đây là thông tin hiện trạng mã nguồn và kiến trúc của hệ thống:

1. KIẾN TRÚC & CÔNG NGHỆ:
- Kiến trúc tách rời hoàn toàn: Backend RESTful API độc lập, Frontend Single Page Application (SPA).
- Backend: Node.js (Express), hệ quản trị CSDL MySQL 8.0 (kết nối qua Connection Pool `mysql2/promise`), xác thực Stateless JWT và phân quyền Role-Based Access Control (RBAC: 'student', 'admin'), bảo mật HTTP Headers bằng Helmet (cấu hình CORP cross-origin phục vụ tài nguyên ảnh tĩnh uploads).
- Mô hình lập trình Backend: Hướng đối tượng (OOP) phân tầng nghiêm ngặt (Models -> Services -> Controllers -> Routes).
- Frontend: Vue.js 3 (Composition API `<script setup>`), Vite, Pinia (`authStore`), Vue Router 4, Axios, Bootstrap 5, Bootstrap Icons, Chart.js. Trạng thái ôn tập và phòng thi hiện được quản lý trong các view; không mô tả `examStore`/`studyStore` như các store đã có.
- Nhận diện thương hiệu: Logo chuẩn "Tập Lái" tại `/logo.png`, Favicon `/logo.png`, Typography Plus Jakarta Sans, giao diện Responsive hiện đại.

2. CÁC PHÂN HỆ ĐÃ HIỆN THỰC (TRẠNG THÁI CHI TIẾT TRONG CHECKPOINT):
- [CP-01] Xác thực & Phân quyền: Đăng ký, đăng nhập, mã hóa bcryptjs, cấp phát và verify JWT Bearer Token, Middleware RBAC.
- [CP-02] Ngân hàng dữ liệu & Engine thi: Dữ liệu 600 câu hỏi chuẩn Bộ GTVT, cờ điểm liệt `is_paralysis = 1`, 53 biển báo chuẩn QCVN 41:2019, 35 hành vi xử phạt theo Nghị định 100/123. Thuật toán xáo trộn câu hỏi Fisher-Yates, sinh đề ngẫu nhiên theo ma trận từng hạng bằng (A, A1, B, B1, C, C1, D, D1, D2). Thuật toán chấm điểm và phát hiện trượt câu điểm liệt ở Server. Bộ dữ liệu chuẩn hóa toàn vẹn UTF-8 (tích hợp script `fix_vietnamese_encoding.js` xử lý triệt để sự cố lệch bảng mã Windows).
- [CP-03] Giao diện Học viên: Ôn tập theo nhóm hạng trong phạm vi chương được áp dụng, chế độ ôn 60 câu điểm liệt, tra cứu biển báo/mức phạt tức thì, Phòng thi sát hạch lý thuyết `ExamRoomView.vue` (đồng hồ đếm ngược, phím tắt 1-4, bàn phím điều hướng câu, modal xác nhận nộp), màn hình kết quả thi `ExamResultView.vue`. Không còn lối vào ôn tập chung toàn bộ 7 chương.
- Ôn tập theo nhóm GPLX: A/A1 gồm chương I–V; B/B1 và C/C1 gồm đủ 7 chương. Hạng trong cùng nhóm dùng chung phạm vi; thi thử vẫn chọn hạng cụ thể, còn lịch sử nhóm lọc theo các hạng thành viên.
- [CP-04] Lịch sử thi & Quản trị Admin: Màn hình xem lại chi tiết bài thi `ExamReviewView.vue`, lịch sử thi cá nhân `ExamHistoryView.vue` kèm phân tích chương yếu; Admin Dashboard `AdminDashboardView.vue` với 4 thẻ KPI và biểu đồ Chart.js; Quản lý 600 câu hỏi `AdminQuestionsView.vue` (upload ảnh Multer, modal thêm/sửa, phân trang); Quản lý người dùng `AdminUsersView.vue` (khóa/mở tài khoản, phân quyền, cảnh báo khóa ngoại ON DELETE RESTRICT).
- [CP-05] Kiểm thử, tối ưu và hoàn thiện: bỏ lựa chọn "Tất cả các chương" khỏi luồng học và quản lý câu hỏi; hiển thị cảnh báo "Vui lòng chọn chương" khi chưa chọn chương hợp lệ; hoàn thiện quản trị biển báo giao thông với CRUD, tìm kiếm, lọc, phân trang, upload ảnh và kiểm soát quyền admin; hoàn thiện phân hệ quản lý chương lý thuyết cho Admin (`AdminChaptersView.vue`) với CRUD, KPI, tìm kiếm và bảo vệ khóa ngoại; hoàn thiện phân hệ quản lý phòng thi sát hạch cho Admin (`AdminExamRoomsView.vue`) với 2 chế độ hiển thị lưới thẻ (chuẩn giao diện học viên) & bảng chi tiết, cấu hình ma trận đề thi 7 chương, đóng/mở phòng thi và bảo vệ dữ liệu lịch sử thi; hoàn thiện phân hệ quản lý mức xử phạt giao thông cho Admin (`AdminFinesView.vue`) với CRUD, KPI theo nhóm phương tiện, lọc khoảng tiền phạt, căn cứ Nghị định 100/123; tối ưu hóa nhận diện trang chủ `HomeView.vue` tích hợp hình nền `banner.webp` dạng scoped; phân tách cổng học viên (`5173`) và admin (`5174`), cổng admin mặc định đăng nhập/không đăng ký, chỉ chia sẻ cổng học viên qua ngrok; **tích hợp tính năng Quên mật khẩu qua email OTP 6 chữ số (`/forgot-password`)**, xác thực gửi mail qua Nodemailer SMTP Google Workspace/Gmail, tự dọn OTP sau 3 phút, băm mật khẩu bcrypt và áp dụng bình đẳng cho mọi tài khoản hệ thống; **tích hợp tính năng Nhận diện biển báo giao thông bằng AI ResNet-50 (`/lookup/recognize`)**, hỗ trợ 2 hình thức (tải ảnh từ thiết bị & chụp quét trực tiếp qua Camera/Webcam), phân loại 51 lớp biển báo, tự động so khớp CSDL và giải thích quy định an toàn; kiểm tra build frontend và middleware upload ảnh; cấu hình Helmet CORP cross-origin và fallback icon khi link ảnh CDN ngoài bị lỗi 404.
- [CP-05 cập nhật 2026-11-08] Menu ôn tập có nhóm A/A1 (chương I–V), B/B1 và C/C1 (7 chương); không yêu cầu chọn lại hạng trong trang ôn vì phạm vi nhóm giống nhau. Lối vào ôn chung 7 chương đã được gỡ; URL không có nhóm hợp lệ chuyển đến trang thi thử. Cấu trúc 7 chương vẫn cần cho ma trận thi và chức năng quản trị. Thi thử chọn hạng riêng, lịch sử và thống kê được giới hạn theo nhóm. Chi tiết thay đổi và giới hạn kiểm thử xem `checkpoint.md`.

3. NGUYÊN TẮC BẢO MẬT & KỸ THUẬT BẮT BUỘC:
- Tuyệt đối KHÔNG trả trường `is_correct` về Client trong quá trình thí sinh đang làm bài thi (`/api/v1/exams/generate`). Toàn bộ việc chấm điểm thực hiện tại Server (`/api/v1/exams/:id/submit`).
- Sai bất kỳ câu điểm liệt nào (`is_paralysis = 1`) thì kết quả bài thi bị đánh trượt ngay lập tức (`is_passed = false, has_paralysis_failed = true`).
- Mọi API JSON tuân thủ format: `{ success: boolean, data: any, message: string, meta?: any }`.

Hãy tham chiếu chi tiết tại thư mục `Cores/`:
- `Cores/KE_HOACH_XAY_DUNG_CHI_TIET.md`: Bản đặc tả kỹ thuật và nghiệp vụ tổng thể.
- `Cores/Cau_truc.md`: Thiết kế lớp OOP và ERD 12 bảng CSDL MySQL.
- `Cores/checkpoint.md`: Bảng theo dõi tiến độ công việc theo các mốc CP-01 -> CP-05.
- `Cores/Chienluoc.md`: Chiến lược kiến trúc phần mềm và chống gian lận thi cử.
- `Cores/Tieuchiduan.md`: Tiêu chuẩn nghiệm thu đồ án Niên luận ngành.
```

---

## 2. BỘ PROMPT THEO CÁC MODULE ĐÃ HIỆN THỰC (BẢO TRÌ & NÂNG CẤP)

### Prompt 01: Quản trị Người dùng & Phân quyền Admin
```markdown
Hãy bảo trì/nâng cấp module Quản lý Người dùng tại `frontend/src/views/admin/AdminUsersView.vue` và `backend/src/controllers/admin.controller.js`:
1. Hỗ trợ tìm kiếm học viên theo họ tên, email, số điện thoại; lọc theo trạng thái hoạt động (Hoạt động / Bị khóa) và vai trò (Học viên / Quản trị viên).
2. Xử lý an toàn khi khóa/mở khóa tài khoản hoặc thay đổi quyền hạn `role` (Admin không thể tự khóa hoặc hạ quyền chính tài khoản đang đăng nhập).
3. Xử lý triệt để ràng buộc khóa ngoại MySQL `ON DELETE RESTRICT` (mã lỗi 1451): hiển thị thông báo thân thiện giải thích người dùng đã có lịch sử thi sát hạch nên hệ thống chỉ cho phép "Khóa tài khoản" thay vì xóa vĩnh viễn khỏi CSDL.
```

### Prompt 02: Bảng điều khiển Thống kê Admin Dashboard
```markdown
Hãy hoàn thiện màn hình tổng quan quản trị `frontend/src/views/admin/AdminDashboardView.vue` và API `/api/v1/admin/dashboard/stats`:
1. 4 thẻ KPI thống kê tức thời: Tổng người dùng, Tổng lượt thi đã nộp, Tỷ lệ đỗ trung bình (%), Số lượng câu hỏi hoạt động.
2. Tích hợp thư viện biểu đồ Chart.js:
   - Biểu đồ Bar Chart: Thống kê số lượt thi và lượt đỗ theo 7 ngày gần nhất.
   - Biểu đồ Doughnut Chart: Tỷ lệ Đạt, Trượt điểm liệt, Trượt do thiếu điểm.
3. Bảng xếp hạng Top học viên chăm chỉ và thống kê phân bố lượt thi theo từng hạng giấy phép lái xe (A, A1, B, B1, C, C1, D, D1, D2).
```

### Prompt 03: Quản lý Ngân hàng 600 Câu hỏi & Upload Ảnh Sa hình
```markdown
Hãy bảo trì/nâng cấp phân hệ Quản lý câu hỏi `frontend/src/views/admin/AdminQuestionsView.vue` và Controller `backend/src/controllers/admin.controller.js`:
1. Hỗ trợ lọc câu hỏi theo 7 chương, tìm kiếm theo nội dung câu hỏi, lọc riêng các câu điểm liệt (`is_paralysis = 1`).
2. Tích hợp Multer phía Backend để upload ảnh sa hình/biển báo vào `backend/uploads/` và lưu đường dẫn ảnh tương đối vào CSDL.
3. Modal Thêm/Sửa câu hỏi: Hỗ trợ chọn chương, tick chọn câu điểm liệt, nhập lời giải thích, thêm danh sách 2-4 đáp án với radio button chọn đáp án đúng duy nhất, có khung Preview ảnh trực quan trước khi bấm Lưu.
4. Không hiển thị tùy chọn "Tất cả các chương" trong các bộ lọc chương; nếu người dùng chưa chọn chương nào thì hiển thị cảnh báo rõ ràng: "Vui lòng chọn chương" và không gọi API lọc câu hỏi cho đến khi có giá trị chương hợp lệ.
```

### Prompt 03A: Giao diện Ôn tập 600 Câu theo Chương
```markdown
Hãy nâng cấp màn hình ôn tập lý thuyết `frontend/src/views/study/StudyView.vue` theo yêu cầu trải nghiệm người dùng mới:
1. Bỏ tùy chọn "Tất cả các chương" khỏi danh sách chương được chọn để học.
2. Khi chưa chọn chương nào, không tải danh sách câu hỏi và hiển thị trạng thái cảnh báo: "Vui lòng chọn chương".
3. Chỉ khi người dùng chọn đúng 1 chương từ danh sách 7 chương thì mới thực hiện `loadQuestions()` để lấy dữ liệu và hiển thị bài ôn tập.
4. Màn hình này nên giữ nguyên UX hiện tại, chỉ thay đổi logic chốt: không nạp dữ liệu khi `selectedChapterId` rỗng hoặc null.
```

### Prompt 03B: Quản lý Biển Báo Giao Thông trong Admin
```markdown
Hãy bổ sung phân hệ Quản lý biển báo giao thông cho vai trò Admin:
1. Tạo màn hình `frontend/src/views/admin/AdminSignsView.vue` với chức năng: xem danh sách biển báo, bộ lọc theo nhóm biển báo, tìm kiếm theo mã hoặc tên biển báo, phân trang và các nút Thêm / Sửa / Xóa.
2. Thêm route `/admin/signs` và mục menu trong `frontend/src/layouts/AdminLayout.vue` để admin truy cập nhanh.
3. Bổ sung các API quản trị trong `backend/src/routes/admin.routes.js` và `backend/src/controllers/admin.controller.js` để: lấy danh mục nhóm biển báo, lấy danh sách biển báo, thêm mới, cập nhật và xóa biển báo.
4. Tạo/điều chỉnh model `backend/src/models/trafficSign.model.js` với các phương thức `create`, `update`, `deleteById` theo chuẩn OOP và xử lý lỗi 400/404 rõ ràng.
5. Hỗ trợ trường `sign_code`, `name`, `description` và `image_url`, đảm bảo dữ liệu lưu đúng chuẩn UTF-8 và chỉ cho phép quản trị viên thao tác.
```

### Prompt 03C: Quản lý Chương Lý Thuyết trong Admin
```markdown
Hãy bổ sung phân hệ Quản lý chương lý thuyết cho vai trò Admin:
1. Tạo màn hình `frontend/src/views/admin/AdminChaptersView.vue` với chức năng: xem danh sách 7 chương kèm KPI (tổng chương, tổng câu hỏi, tổng câu điểm liệt), bộ lọc tìm kiếm theo tên/mô tả chương, bảng hiển thị thứ tự, tiêu đề, mô tả, số lượng câu hỏi (liên kết đến `/admin/questions?chapterId=X`), số câu điểm liệt và các nút Thêm / Sửa / Xóa.
2. Thêm route `/admin/chapters` và mục menu sidebar trong `frontend/src/layouts/AdminLayout.vue` để admin truy cập nhanh.
3. Bổ sung 5 API quản trị CRUD trong `backend/src/routes/admin.routes.js` và `backend/src/controllers/admin.controller.js`:
   - `GET /api/v1/admin/chapters` — Danh sách chương kèm thống kê số câu hỏi
   - `GET /api/v1/admin/chapters/:id` — Chi tiết 1 chương
   - `POST /api/v1/admin/chapters` — Thêm chương mới
   - `PUT /api/v1/admin/chapters/:id` — Cập nhật chương
   - `DELETE /api/v1/admin/chapters/:id` — Xóa chương (có bảo vệ khóa ngoại)
4. Bổ sung phương thức CRUD vào model `backend/src/models/chapter.model.js`: `create()`, `update()`, `deleteById()` theo chuẩn OOP. Phương thức `deleteById()` kiểm tra ràng buộc khóa ngoại: nếu chương còn câu hỏi liên kết thì từ chối xóa với thông báo thân thiện, đồng thời tự động dọn sạch bản ghi `exam_structure_rules` trước khi xóa.
5. Modal Thêm/Sửa chương với các trường: thứ tự (`order_number`), tiêu đề (`title`, bắt buộc), mô tả (`description`). Xác nhận xóa chương bằng SweetAlert2 với cảnh báo số câu hỏi liên kết.
```

### Prompt 03D: Quản lý Phòng Thi Sát Hạch & Hạng Bằng trong Admin
```markdown
Hãy bổ sung phân hệ Quản lý phòng thi sát hạch cho vai trò Admin:
1. Tạo màn hình `frontend/src/views/admin/AdminExamRoomsView.vue` với chức năng:
   - 4 thẻ KPI: Tổng số phòng thi, phòng thi đang mở, phòng thi tạm đóng, tổng số lượt thi của thí sinh.
   - 2 chế độ hiển thị linh hoạt: Chế độ Lưới thẻ (Cards Grid) mô phỏng chính xác giao diện chọn phòng thi của học viên (Badge hạng, icon xe máy/ô tô/xe tải/xe khách, tên phòng thi, mô tả, khung số lượng câu/thời gian/yêu cầu đạt, số lượt thi) và Chế độ Bảng chi tiết (Data Table).
   - Bộ lọc tìm kiếm nhanh theo mã hạng (A, A1, B, B1, C...), tên phòng thi hoặc mô tả; lọc theo trạng thái mở/đóng.
   - Thao tác nhanh: Bật/Tắt trạng thái mở phòng thi (`PATCH /api/v1/admin/license-types/:id/toggle-status`), Chỉnh sửa thông số phòng thi, Xóa phòng thi (bảo vệ lịch sử thi: chặn xóa nếu đã có thí sinh dự thi).
   - Modal Cấu hình Ma Trận Đề Thi: Tải và cập nhật ma trận số câu hỏi và câu điểm liệt của 7 chương cho từng hạng bằng (`GET / PUT /api/v1/admin/license-types/:id/matrix`), kiểm tra khớp chính xác tổng số câu quy định của đề thi trước khi lưu.
2. Thêm route `/admin/exam-rooms` (alias `/admin/license-types`) trong `frontend/src/router/index.js` và thêm mục menu "Quản lý phòng thi" vào Sidebar và Dropdown của `frontend/src/layouts/AdminLayout.vue`.
3. Bổ sung các API quản trị trong `backend/src/routes/admin.routes.js` và `backend/src/controllers/admin.controller.js`:
   - `GET /api/v1/admin/license-types` — Danh sách phòng thi kèm thống kê số lượt thi
   - `GET /api/v1/admin/license-types/:id` — Chi tiết 1 phòng thi
   - `POST /api/v1/admin/license-types` — Thêm mới phòng thi (tự tạo ma trận mặc định 7 chương)
   - `PUT /api/v1/admin/license-types/:id` — Cập nhật thông số phòng thi
   - `PATCH /api/v1/admin/license-types/:id/toggle-status` — Bật/Tắt mở phòng thi
   - `DELETE /api/v1/admin/license-types/:id` — Xóa phòng thi nếu chưa có lượt thi
   - `GET /api/v1/admin/license-types/:id/matrix` — Lấy ma trận đề thi 7 chương
   - `PUT /api/v1/admin/license-types/:id/matrix` — Cập nhật ma trận đề thi
4. Cập nhật model `backend/src/models/licenseType.model.js` với các phương thức OOP: `findAll({ includeStats })`, `findById(id, includeStats)`, `create()`, `update()`, `toggleActive()`, `deleteById()` (chặn xóa an toàn khi có `exam_sessions`).
```

### Prompt 03E: Quản lý Mức Xử Phạt Giao Thông trong Admin
```markdown
Hãy bổ sung phân hệ Quản lý mức xử phạt giao thông cho vai trò Admin:
1. Tạo màn hình `frontend/src/views/admin/AdminFinesView.vue` với chức năng:
   - 4 thẻ KPI: Tổng số mức phạt, số vi phạm xe máy (XE_MAY), số vi phạm xe ô tô (OTO), số vi phạm phương tiện khác/người đi bộ (KHAC).
   - Bộ lọc tìm kiếm thông minh: Tìm kiếm theo từ khóa vi phạm (hành vi, chi tiết, điều khoản căn cứ), lọc theo nhóm phương tiện, lọc theo khoảng tiền phạt (Dưới 1 triệu, 1-5 triệu, 5-10 triệu, Trên 10 triệu).
   - Bảng dữ liệu vi phạm chuẩn Nghị định 100/123: Hiển thị STT, nhóm phương tiện (badge màu + icon), tên hành vi & chi tiết, khung tiền phạt định dạng VNĐ (VD: 2.000.000 đ - 3.000.000 đ), hình phạt bổ sung (tước GPLX...), căn cứ pháp lý, nút Chỉnh sửa / Xóa.
   - Phân trang pagination responsive kèm hiển thị số bản ghi.
   - Modal Thêm mới / Chỉnh sửa mức phạt: Chọn nhóm phương tiện, tên hành vi, chi tiết vi phạm, mức phạt tối thiểu, mức phạt tối đa, hình phạt bổ sung, căn cứ pháp lý.
2. Thêm route `/admin/fines` trong `frontend/src/router/index.js` và thêm mục menu "Quản lý mức phạt" vào Sidebar và Dropdown của `frontend/src/layouts/AdminLayout.vue`.
3. Bổ sung các API quản trị trong `backend/src/routes/admin.routes.js` và `backend/src/controllers/admin.controller.js`:
   - `GET /api/v1/admin/fines/categories` — Lấy danh mục nhóm phương tiện kèm số lượng vi phạm
   - `GET /api/v1/admin/fines` — Lấy danh sách mức phạt có tìm kiếm, lọc, phân trang
   - `GET /api/v1/admin/fines/:id` — Chi tiết 1 mức phạt
   - `POST /api/v1/admin/fines` — Thêm mới mức phạt
   - `PUT /api/v1/admin/fines/:id` — Cập nhật mức phạt
   - `DELETE /api/v1/admin/fines/:id` — Xóa mức phạt
4. Cập nhật model `backend/src/models/trafficFine.model.js` với các phương thức OOP: `create()`, `update()`, `deleteById()` theo chuẩn OOP.
```

### Prompt 04: Thuật toán Sinh đề thi & Chấm điểm thi Sát hạch
```markdown
Hãy rà soát lớp `backend/src/services/exam.service.js` với 2 phương thức nghiệp vụ cốt lõi:
1. `generateExamSession(userId, licenseTypeId)`: Đọc ma trận từ `exam_structure_rules` của hạng bằng tương ứng. Áp dụng thuật toán Fisher-Yates để xáo trộn câu hỏi. Đảm bảo bốc đúng và đủ số lượng câu điểm liệt theo quy định mà không trùng lặp. Lưu phiên thi vào `exam_sessions` và chi tiết câu hỏi vào `exam_session_details`. Trả về Client danh sách câu hỏi KHÔNG chứa đáp án đúng.
2. `submitExamSession(sessionId, userId, userAnswers, timeSpentSeconds)`: Chống nộp bài lặp lại. So khớp đáp án người dùng với đáp án chuẩn trong CSDL, tính số câu đúng. Kiểm tra nếu sai bất kỳ câu hỏi điểm liệt nào thì đánh dấu `has_paralysis_failed = true` và `is_passed = false`. Cập nhật điểm số và mở khóa lời giải thích cho thí sinh.
```

### Prompt 05: Phòng thi Sát hạch Mô phỏng Chuẩn Tổng cục Đường bộ
```markdown
Hãy tối ưu hóa giao diện phòng thi `frontend/src/views/exam/ExamRoomView.vue` và layout `frontend/src/layouts/ExamLayout.vue`:
1. Layout toàn màn hình không có thanh cuộn trình duyệt thừa, phân chia rõ ràng khu vực hiển thị câu hỏi và lưới điều hướng câu (Question Palette).
2. Đồng hồ đếm ngược JavaScript: Nhận số phút làm bài từ server, đếm lùi từng giây, đổi màu đỏ cảnh báo khi còn < 3 phút, tự động gọi hàm nộp bài khi hết giờ.
3. Hỗ trợ đầy đủ phím tắt: Bấm phím 1, 2, 3, 4 trên bàn phím để chọn đáp án, bấm phím mũi tên Lên/Xuống hoặc Trái/Phải để chuyển câu.
4. Modal xác nhận nộp bài hiển thị cảnh báo nếu thí sinh còn câu hỏi chưa chọn đáp án.
```

### Prompt 06: Xem lại Bài thi & Lịch sử Học tập Học viên
```markdown
Hãy nâng cấp màn hình Xem lại bài thi `frontend/src/views/exam/ExamReviewView.vue` và Lịch sử thi `frontend/src/views/exam/ExamHistoryView.vue`:
1. `ExamReviewView.vue`: Hiển thị lại toàn bộ câu hỏi của đề thi vừa làm, làm nổi bật đáp án thí sinh đã chọn (màu xanh nếu đúng, màu đỏ nếu sai) và hiển thị đáp án đúng chuẩn của Bộ GTVT kèm hộp ghi chú "Mẹo & Giải thích chi tiết". Nếu thí sinh trượt vì câu điểm liệt, hiển thị huy hiệu cảnh báo nổi bật tại câu đó.
2. `ExamHistoryView.vue`: Bảng thống kê toàn bộ lịch sử các lần thi, bộ lọc theo hạng bằng, hiển thị ngày thi, thời gian làm bài, điểm số, trạng thái Đạt/Không đạt và nút bấm "Xem lại bài thi".
```

---

## 3. BỘ PROMPT CHO CHECKPOINT 05 & HOÀN THIỆN ĐỒ ÁN (TRỌNG TÂM HIỆN TẠI)

### Prompt 07: Kịch bản Kiểm thử Tự động & Test Cases Nghiệp vụ
```markdown
Hãy xây dựng bộ kịch bản kiểm thử tích hợp (Integration Test Plan) cho toàn bộ hệ thống:
1. Test Cases Xác thực: Đăng ký email trùng, mật khẩu yếu, đăng nhập sai thông tin, truy cập route Admin bằng tài khoản Student (HTTP 403).
2. Test Cases Thuật toán Sát hạch:
   - Đạt điểm chuẩn nhưng sai 1 câu điểm liệt -> Kết quả bắt buộc TRƯỢT.
   - Đạt đủ điểm và đúng toàn bộ câu điểm liệt -> Kết quả ĐẠT.
   - Thử nghiệm gửi request nộp bài lần 2 cho cùng 1 phiên thi -> Bắt buộc bị từ chối (HTTP 400).
   - Kiểm tra API sinh đề không để lộ trường `is_correct` trong response payload.
3. Test Cases Quản trị Admin: Thêm/Sửa câu hỏi có upload ảnh, thử xóa tài khoản đã có lịch sử thi để kiểm tra tính năng bắt lỗi khóa ngoại MySQL 1451.
```

### Prompt 08: Đánh giá Hiệu năng, Bảo mật & Tối ưu hóa Toàn diện
```markdown
Hãy tối ưu hóa toàn diện hệ thống phục vụ nghiệm thu đồ án Niên luận ngành:
1. Cơ sở dữ liệu: Kiểm tra câu lệnh `EXPLAIN` cho các truy vấn phức tạp (sinh đề ngẫu nhiên, tra cứu biển báo fulltext, dashboard stats); bổ sung Indexes thích hợp trên các cột ngoại khóa và cột điều kiện tìm kiếm.
2. Bảo mật Backend: Cấu hình `express-rate-limit` chống tấn công brute-force vào API login/register; kích hoạt `helmet` để bảo vệ HTTP headers; kiểm soát upload file Multer (giới hạn dung lượng <= 2MB, chỉ cho phép định dạng ảnh JPEG/PNG/WEBP).
3. Tối ưu Frontend: Kiểm tra kích thước bundle sau khi chạy `npm run build`, lazy loading tất cả các Vue route bằng cú pháp `() => import(...)`, nén ảnh logo và tài sản tĩnh.
```

### Prompt 09: Đóng gói Dự án & Kịch bản Khởi chạy 1 Chạm (One-Click Launch)
```markdown
Hãy tạo kịch bản khởi chạy tự động toàn bộ hệ thống cho Hội đồng chấm thi:
1. Viết file script PowerShell `start_project.ps1` ở thư mục gốc:
   - Tự động kiểm tra Node.js và MySQL service.
   - Khởi động đồng thời cả Backend (port 3000) và Frontend (port 5173).
   - Tự động mở trình duyệt mặc định trỏ vào `http://localhost:5173/`.
2. Tạo file `README.md` chuyên nghiệp tại thư mục gốc với các mục:
   - Giới thiệu tổng quan đề tài và công nghệ sử dụng.
   - Hướng dẫn cài đặt CSDL từ file `backend/database/schema.sql` và nạp dữ liệu seed.
   - Tài khoản mẫu cho Giảng viên: Admin (`admin@gplx.vn` / `Admin@123456`) và Học viên (`student@gplx.vn` / `123456`).
```

### Prompt 10: Hỗ trợ Soạn thảo Báo cáo Niên luận Ngành (CT466)
```markdown
Hãy hỗ trợ tôi biên soạn các phần kỹ thuật trong Báo cáo Niên luận Ngành (CT466):
1. Chương Kiến trúc & Thiết kế hệ thống:
   - Trình bày mô hình kiến trúc tách rời (Decoupled RESTful API) và lý do lựa chọn.
   - Trình bày Sơ đồ lớp (UML Class Diagram) cho Backend theo chuẩn OOP (Model - Service - Controller).
   - Trình bày Sơ đồ thực thể liên kết (ERD) 12 bảng MySQL chuẩn hóa.
2. Chương Hiện thực các thuật toán cốt lõi:
   - Lưu đồ giải thuật và phân tích thuật toán sinh đề thi ngẫu nhiên theo ma trận Bộ GTVT.
   - Lưu đồ giải thuật và phân tích thuật toán chấm điểm và phát hiện trượt câu điểm liệt.
3. Đánh giá kết quả đạt được so với đề cương ban đầu và hướng phát triển mở rộng.
```

### Prompt 11: Soạn Kịch bản Thuyết trình & Slide Demo Nghiệm thu Đồ án
```markdown
Hãy chuẩn bị kịch bản thuyết trình bảo vệ đồ án Niên luận ngành (thời lượng 10-15 phút trước Hội đồng):
1. Dàn ý Slide báo cáo (khoảng 15-20 slides) gồm: Đặt vấn đề -> Mục tiêu đề tài -> Kiến trúc công nghệ -> Các phân hệ chức năng -> Trực quan hóa kết quả -> Kết luận.
2. Kịch bản Live Demo các tính năng ấn tượng nhất:
   - Demo 1: Học viên ôn tập câu hỏi điểm liệt và tra cứu biển báo/mức phạt.
   - Demo 2: Bước vào phòng thi sát hạch hạng B1, làm bài bằng phím tắt, cố tình chọn sai 1 câu điểm liệt để minh chứng cơ chế trượt tức thì, sau đó mở màn hình Xem lại bài thi để thấy phân tích lỗi sai.
   - Demo 3: Đăng nhập quyền Admin, xem biểu đồ Dashboard trực quan, thêm 1 câu hỏi mới kèm ảnh sa hình và quản lý người dùng.
3. Tổng hợp danh sách 10 câu hỏi vấn đáp kỹ thuật giảng viên thường hỏi và câu trả lời mẫu xuất sắc nhất (về bảo mật JWT, thuật toán sinh đề, xử lý khóa ngoại MySQL, quản lý state Pinia).
```

### Prompt 12: Xử lý Sự cố Bảng mã Tiếng Việt (Mojibake UTF-8) & Chuẩn hóa Seed Data CSDL
```markdown
Khi phát hiện dữ liệu tiếng Việt hiển thị dạng ký tự lạ (như `Biß||ân b|ío cß||ñm`, `Quß||ún Trß||ïVi|~n` do lệch bảng mã Console Windows CP437/CP1252 khi import file `schema.sql`):
1. Nguyên nhân kỹ thuật: Khi import file SQL qua CMD hoặc PowerShell trên Windows mà không thêm cờ `--default-character-set=utf8mb4`, chuỗi byte UTF-8 đa byte của tiếng Việt bị trình MySQL client đọc nhầm thành ký tự đơn byte, gây lỗi double-encoding (Mojibake) tại các bảng `sign_categories`, `fine_categories` và `users`.
2. Khắc phục tức thì: Thực thi script chuẩn hóa tại `backend/database/seeds/fix_vietnamese_encoding.js` (chạy bằng lệnh `cd backend; node database/seeds/fix_vietnamese_encoding.js`) để khôi phục chính xác 100% dữ liệu UTF-8 cho 5 nhóm biển báo, 3 nhóm mức phạt và các tài khoản người dùng ban đầu.
3. Hướng dẫn người dùng & kiểm thử:
   - Nhấn F5 trên trình duyệt để nạp lại dữ liệu hiển thị đúng cho các nút danh mục biển báo/mức phạt.
   - Đăng xuất (Logout) và Đăng nhập lại để cập nhật thông tin tên tài khoản "Quản Trị Viên" đã lưu trong localStorage trước đó.
4. Nguyên tắc phòng ngừa: Luôn chỉ định rõ charset khi import database trên môi trường Windows:
   `mysql --default-character-set=utf8mb4 -u root -p traffic_exam_db < schema.sql`
```

### Prompt 13: Xử lý Chính sách Bảo mật CORP (Helmet) & Phục vụ Ảnh Tĩnh Uploads Cross-Origin
```markdown
Khi phát hiện ảnh tải lên (`/uploads/signs/...` hoặc `/uploads/questions/...`) đã lưu vào CSDL và tồn tại trên ổ đĩa backend nhưng trình duyệt không hiển thị (lỗi `net::ERR_BLOCKED_BY_RESPONSE.NotSameOrigin 200 (OK)`):
1. Nguyên nhân kỹ thuật:
   - Thư viện bảo mật `helmet()` mặc định kích hoạt header `Cross-Origin-Resource-Policy: same-origin`.
   - Mặc định frontend truy cập API và `/uploads` qua Vite proxy cùng origin; nếu cấu hình `VITE_API_BASE_URL` trỏ thẳng tới backend `http://localhost:5000`, hai cổng sẽ khác origin và cần cấu hình CORS/CORP phù hợp.
2. Khắc phục phía Backend:
   - Cấu hình trong `backend/src/app.js`:
     ```javascript
     app.use(helmet({
       crossOriginResourcePolicy: { policy: 'cross-origin' }
     }));
     ```
3. Xử lý Fallback trên Frontend:
   - Khi các nguồn ảnh bên ngoài (CDN như `cdn.luatvietnam.vn`) bị xóa hoặc đổi link (trả về HTTP 404 Not Found), luôn tích hợp sự kiện `@error` trên các thẻ `<img>` của `AdminSignsView.vue`, `SignsView.vue`, `AdminQuestionsView.vue`.
   - Sử dụng reactive Set `failedImages` để tự động chuyển sang hiển thị icon nhóm biển báo chuẩn (`getFallbackIcon`) hoặc placeholder thanh lịch, ngăn trình duyệt hiển thị icon vỡ ảnh gây mất thẩm mỹ.
```

---

## Prompt 14 — Cập nhật hệ thống hạng bằng lái xe 9 hạng mới (2026-11-02)

```markdown
Đã chuyển đổi hoàn toàn hệ thống hạng bằng lái xe từ 8 hạng cũ (A1, A2, B1, B2, C, D, E, F)
sang 9 hạng mới theo chuẩn Bộ GTVT: A, A1, B, B1, C, C1, D, D1, D2.

THAY ĐỔI ĐÃ THỰC HIỆN:

1. Database — license_types (9 hạng hoàn chỉnh):
   ID 1: A  - Hạng A  - Xe máy 2 bánh            (25 câu / 19 phút / đạt 21)
   ID 2: A1 - Hạng A1 - Xe máy dưới 175cc         (25 câu / 19 phút / đạt 21)
   ID 3: B  - Hạng B  - Ô tô con & xe tải nhẹ     (30 câu / 20 phút / đạt 27)
   ID 4: B1 - Hạng B1 - Ô tô số tự động           (30 câu / 20 phút / đạt 27)
   ID 5: C  - Hạng C  - Xe tải trên 3.5 tấn       (40 câu / 24 phút / đạt 36)
   ID 6: C1 - Hạng C1 - Xe tải dưới 3.5 tấn       (40 câu / 24 phút / đạt 36)
   ID 7: D  - Hạng D  - Ô tô khách 10-30 chỗ      (45 câu / 26 phút / đạt 41)
   ID 8: D1 - Hạng D1 - Ô tô khách 30-45 chỗ      (45 câu / 26 phút / đạt 41)
   ID 9: D2 - Hạng D2 - Xe kéo rơ moóc            (45 câu / 26 phút / đạt 41)

2. Database — exam_structure_rules: 63 rule entries (9 hạng × 7 chương), đúng theo
   ma trận chuẩn Bộ GTVT (xem backend/database/seeds/01_license_and_matrix.sql)

3. Backend — db.config.js: Thêm charset: 'utf8mb4' và timezone: '+07:00' vào Connection Pool
   để đảm bảo tiếng Việt không bị Mojibake khi Node.js đọc dữ liệu.

4. Scripts tạo ra:
   - backend/database/seeds/update_license_codes.js — cập nhật code+name license_types
   - backend/database/seeds/test_exam_gen_all.js    — test sinh đề 9 hạng (kết quả: 9/9 ✅)
   - backend/database/seeds/check_encoding.js       — kiểm tra charset DB

5. Frontend — ExamSelectView.vue: Load dynamic từ API, getLicenseIcon() đã xử lý 9 mã ✅
6. Frontend — npm run build: ✅ Không lỗi (573ms)
7. API /api/v1/exams/license-types: Trả về 9 hạng đúng UTF-8 ✅

CHÚ Ý QUAN TRỌNG:
- Khi cần chạy SQL trên Windows MySQL CLI, dùng:
  cmd /c "mysql --default-character-set=utf8mb4 -u root -proot traffic_exam_db < file.sql"
  KHÔNG dùng PowerShell pipe < vì không hỗ trợ stdin redirect.
- PowerShell console hiển thị Mojibake không có nghĩa data bị lỗi — kiểm tra qua Node.js.
- DB connection pool Node.js phải có charset: 'utf8mb4' trong db.config.js.
```

---

## Prompt 15 — Ghi nhận lỗi phòng thi sát hạch bị kẹt tải đề (2026-11-02)

```markdown
TRẠNG THÁI: ĐÃ KHẮC PHỤC TRIỆT ĐỂ (RESOLVED)

1. Nguyên nhân gốc rễ (Root Causes):
   - Lỗi Vue Router Component Re-use & Transition Deadlock: Trong `App.vue`, router-view sử dụng `<transition name="fade" mode="out-in">` nhưng trên `<component :is="Component" />` thiếu thuộc tính `:key="route.fullPath"`. Khi người dùng chuyển giữa các phòng thi khác nhau (`/exam/room/:id`), Vue không tạo lại component instance, khiến `setup()` và `onMounted()` không chạy lại.
   - Xung đột `<Teleport>` và Transition: Việc Teleport các node đồng hồ và thông tin hạng bằng đến `#exam-header-portal` khi node target chưa có trong DOM hoặc khi transition `out-in` đang diễn ra đã làm đóng băng quá trình render của Vue ở frame đầu tiên (trạng thái `isLoading = true`).
   - Biến `sessionId` tĩnh: Trước đó `const sessionId = route.params.id;` được định nghĩa tĩnh lúc khởi tạo, không phản ứng với sự thay đổi của route param.

2. Giải pháp khắc phục đã áp dụng:
   - Trong `frontend/src/App.vue`: Bổ sung `:key="route.fullPath"` trên `<component :is="Component" :key="route.fullPath" />` đảm bảo mỗi khi param URL thay đổi, Vue luôn mount một component instance mới và kích hoạt toàn bộ lifecycle từ đầu.
   - Trong `frontend/src/views/exam/ExamRoomView.vue`:
     + Chuyển `sessionId` sang reactive: `const sessionId = computed(() => route.params.id);`.
     + Bổ sung `watch(() => route.params.id, ...)` để tự động tải lại phiên thi khi ID đổi.
     + Kiểm tra DOM sẵn sàng (`hasHeaderPortal`) trước khi kích hoạt `<Teleport>` để chống lỗi render node ngoài DOM.
     + Bổ sung nút "Tải lại đề thi" và "Chọn đề khác" ngay trong khung loading nếu mạng chậm.
     + Đảm bảo an toàn state khi gửi bài thi `executeSubmission()` lấy `sessionId.value`.
   - Kết quả: Build hoàn tất không lỗi, truy cập trực tiếp hoặc chuyển đổi giữa các phòng thi đều tải ngay tức khắc (~20ms).
```

---

## Prompt 16 — Chức năng Quên mật khẩu qua Email OTP (2026-11-03)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100% (RESOLVED)

1. Nghiệp vụ:
   - Người dùng nhập email đã đăng ký (áp dụng cho mọi vai trò: học viên & quản trị viên).
   - Nếu email chưa có trong hệ thống: Trả về lỗi 404 tiếng Việt rõ ràng ("Địa chỉ email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại.").
   - Nếu email tồn tại: Sinh mã OTP ngẫu nhiên 6 chữ số, thời gian sống 3 phút (180 giây), lưu trong in-memory Map store (`backend/src/utils/otpStore.js`).
   - Gửi email giao diện HTML chuyên nghiệp qua Nodemailer kết nối SMTP Google Workspace / Gmail (`smtp.gmail.com:587`).
   - Người dùng nhập mã OTP tại giao diện 6 ô số tự động focus/paste.
   - Nhập đúng OTP -> Cho phép đặt mật khẩu mới (tối thiểu 6 ký tự) -> Băm bcrypt 10 rounds -> Cập nhật CSDL -> Xóa OTP khỏi store.

2. Cấu hình biến môi trường (.env):
   - `SMTP_HOST=smtp.gmail.com`
   - `SMTP_PORT=587`
   - `SMTP_SECURE=false`
   - `SMTP_USER=...` (Email tài khoản gửi)
   - `SMTP_PASS=...` (App Password 16 ký tự Google)

3. Kiến trúc mã nguồn:
   - Backend: `utils/otpStore.js`, `utils/email.service.js`, `models/user.model.js` (`updatePassword`), `services/auth.service.js`, `controllers/auth.controller.js`, `routes/auth.routes.js`.
   - Frontend: `views/auth/ForgotPasswordView.vue`, route `/forgot-password`, liên kết từ `LoginView.vue`.
   - Frontend API Client: Luôn dùng `apiClient` từ `@/services/api`; mặc định base URL là `/api/v1` và Vite proxy chuyển `/api` cùng `/uploads` đến backend cục bộ. Có thể đặt `VITE_API_BASE_URL` khi triển khai với API origin riêng.
```

---

## Prompt 17 — Chức năng Nhận diện Biển báo Giao thông bằng AI (ResNet-50) (2026-11-03)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100% (RESOLVED)

1. Nghiệp vụ:
   - Nằm trong menu "Tra cứu luật" trên thanh Navbar (`/lookup/recognize`) và liên kết nhanh từ trang danh mục biển báo (`/lookup/signs`).
   - Sử dụng mô hình Deep Learning PyTorch `backend/src/ai-models/best_resnet50_traffic_signs.pth` phân loại 51 nhóm biển báo đường bộ Việt Nam.
   - Hỗ trợ 2 hình thức:
     + Hình thức 1: Chọn ảnh có sẵn trên thiết bị (Drag-and-drop / File upload JPG, PNG, WEBP).
     + Hình thức 2: Quét trực tiếp qua Camera thiết bị (HTML5 getUserMedia API, đổi camera trước/sau, chụp frame tức thời dạng Base64).
   - Tự động so khớp kết quả AI với bảng CSDL `traffic_signs` để lấy mã biển (P.102, W.205...), ảnh vector chuẩn QCVN 41:2019 và danh mục biển.
   - Cung cấp: Độ chính xác Confidence (%), ý nghĩa quy định và lời khuyên an toàn cho người lái xe.

2. Kiến trúc & Công nghệ:
   - Backend: Python 3.12 (PyTorch 2.15 CPU, Torchvision 0.29, Pillow), `predict.py`, `aiSign.service.js` (child_process.spawn), `aiSign.controller.js`, `lookup.routes.js`.
   - API endpoints:
     + `POST /api/v1/lookup/signs/recognize-file` (Multer upload)
     + `POST /api/v1/lookup/signs/recognize-camera` (JSON Base64)
   - Frontend: `SignRecognitionView.vue` (Hiệu ứng laser scanner radar, Target Reticle, Responsive), Vue Router `/lookup/recognize`, `AppNavbar.vue` dropdown.
```

---

## Prompt 18 — Chatbot hỏi đáp Luật Giao Thông AI (Gemini) (2026-11-03)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100% (RESOLVED)

1. Nghiệp vụ:
   - Nằm trong menu "Tra cứu luật" → "Hỏi đáp AI" (route `/lookup/chatbot`).
   - Sử dụng Google Gemini API (`gemini-3.5-flash`) với system instruction chuyên biệt về Luật GTĐB Việt Nam.
   - Hội thoại đa lượt: Lưu lịch sử session in-memory (tối đa 20 lượt/session, tự xóa sau 30 phút).
   - Từ chối lịch sự các câu hỏi ngoài phạm vi giao thông (nấu ăn, địa lý, toán học...).
   - Phạm vi kiến thức: Luật GTĐB, NĐ 100/2019 & 123/2021, QCVN 41:2019, 600 câu thi GPLX, 9 hạng bằng.

2. Cấu hình:
   - `GEMINI_API_KEY=...` trong `backend/.env`
   - Model: `gemini-3.5-flash` (gemini-2.0-flash và gemini-2.5-flash đã deprecated/unavailable)
   - `@google/genai` package đã cài: `npm install @google/genai` (backend)

3. Kiến trúc mã nguồn:
   - Backend: `services/chatbot.service.js` (Singleton, session Map, fire-and-forget safe),
     `controllers/chatbot.controller.js`, `routes/chatbot.routes.js`.
   - API: `POST /api/v1/chatbot/send` (body: `{ message, sessionId }`),
     `POST /api/v1/chatbot/clear` (body: `{ sessionId }`).
   - Frontend: `views/lookup/ChatbotView.vue` (Markdown renderer, typing indicator, quick questions),
     route `/lookup/chatbot`, mục menu "Hỏi đáp AI" trong `AppNavbar.vue`.
   - Build: 136 modules, 614ms ✅

4. LƯU Ý:
   - sessionId phải là string duy nhất mỗi tab (frontend tạo bằng `Date.now() + random`).
   - Nếu model 503 UNAVAILABLE: Thử lại sau vài giây, đây là lỗi tạm thời do cao tải.
   - Không dùng `gemini-2.0-flash` (404 deprecated) hay `gemini-2.5-flash` (404 unavailable for new users).
```

---

## Prompt 19 — Khắc phục lỗi nhận diện Camera & Chatbot không ổn định (2026-11-04)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100%

1. Lỗi Camera "request entity too large" (CP-05.17):
   - Nguyên nhân: Express body parser giới hạn 100KB mặc định.
   - Fix: `app.use(express.json({ limit: '10mb' }))` và
     `app.use(express.urlencoded({ extended: true, limit: '10mb' }))` trong `backend/src/app.js`.
   - Ảnh chụp từ Camera (Base64) thực tế nặng 300KB–1MB, vượt giới hạn 100KB cũ.
   - Test: Gửi body 600KB → 200 OK, không còn lỗi entity too large.

2. Chatbot siêu tốc & ổn định với Groq Cloud (CP-05.18):
   - Nền tảng: Groq Cloud API (`GROQ_API_KEY`), endpoint `https://api.groq.com/openai/v1/chat/completions`.
   - Model chính: `openai/gpt-oss-120b` (thông minh, lập luận chuẩn), tự động fallback sang `qwen/qwen3.8-27b`.
   - Tốc độ: Phản hồi cực nhanh ~1-2 giây, hoàn toàn miễn phí 100%, không bị tình trạng lag/đơ hay đòi thẻ tín dụng.
   - Axios timeout: 60s. Cơ chế retry backoff tự động bảo vệ khi mạng chập chờn.
```

---

## Prompt 20 — Cập nhật menu Ôn tập lý thuyết & Thi thử (2026-11-04)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH

- Trong `frontend/src/components/common/AppNavbar.vue`, menu "Ôn tập lý thuyết" mở danh sách khi nhấn; nhấn ra ngoài hoặc phím Esc sẽ đóng danh sách.
- Mục "Thi thử" là liên kết trực tiếp đến `/exam`, không hiển thị danh sách thả xuống.
- Xác thực: `npm run build` tại frontend thành công (137 modules).
```

---

## Prompt 21 — Xác thực Đăng ký tài khoản học viên qua mã OTP Email 3 phút (2026-11-21)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100%

1. Yêu cầu nghiệp vụ:
   - Khi học viên điền thông tin và bấm nút "Hoàn tất đăng ký", hệ thống kiểm tra dữ liệu và gửi 1 mã OTP 6 chữ số có hiệu lực 3 phút đến email của học viên.
   - Giao diện chuyển sang màn hình nhập OTP 6 chữ số kèm đồng hồ đếm ngược 180s.
   - Chỉ khi nhập đúng mã xác nhận, tài khoản mới chính thức được khởi tạo trong CSDL MySQL và cấp JWT Token tự động đăng nhập.

2. Hiện thực Backend:
   - `utils/otpStore.js`: Bổ sung `createRegisterOtp`, `verifyRegisterOtp`, `deleteRegisterOtp` lưu trữ tạm thông tin đăng ký trong bộ nhớ (hết hạn sau 3 phút).
   - `utils/email.service.js`: Bổ sung `sendRegisterOtpEmail` với giao diện HTML email chào mừng thương hiệu Tập Lái 24h, mã OTP 6 số nổi bật.
   - `services/auth.service.js`: Hiện thực `sendRegisterOtp` (validate form, check email trùng, băm bcrypt mật khẩu trước, gửi email non-blocking) và `verifyRegisterOtp` (xác thực OTP, gọi `UserModel.create`, cấp JWT).
   - `controllers/auth.controller.js` & `routes/auth.routes.js`: Thêm 2 endpoints `POST /api/v1/auth/send-register-otp` và `POST /api/v1/auth/verify-register-otp`.

3. Hiện thực Frontend:
   - `stores/auth.js`: Thêm actions `sendRegisterOtp` và `verifyRegisterOtp`.
   - `views/auth/RegisterView.vue`: Nâng cấp giao diện 2 bước trực quan (Step Indicator), 6 ô input số tự động nhảy ô/paste/backspace, đếm ngược 3 phút, nút gửi lại mã, nút quay lại chỉnh sửa thông tin.
   - Build frontend thành công: 142 modules, 737ms.
```

---

## Prompt 22 — Bổ sung trang lỗi 404 cho Phân hệ Quản trị Admin (2026-11-21)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100%

1. Yêu cầu nghiệp vụ:
   - Khi Admin nhập sai URL trong phân hệ quản trị (hoặc trên Admin Portal cổng 5174), hệ thống hiển thị trang lỗi 404 chuyên biệt dành riêng cho Admin thay vì trang 404 của học viên hoặc bị văng về trang đăng nhập.

2. Hiện thực:
   - Tạo `views/admin/AdminNotFoundView.vue`:
     * Nằm trong khung `AdminLayout` với sidebar và topbar đồng bộ của quản trị viên.
     * Card 404 tông màu đỏ sang trọng, icon khiên cảnh báo động (pulse animation).
     * Hiển thị chính xác đường dẫn lỗi mà admin vừa nhập (`route.fullPath`).
     * Cung cấp nút "Về Admin Dashboard" và nút "Quay lại trang trước".
     * Tích hợp thanh liên kết truy cập nhanh đến 7 phân hệ quản trị (Câu hỏi, Người dùng, Biển báo, Phòng thi, Chương lý thuyết, Mức phạt).
   - Router `router/index.js`:
     * Đăng ký route `/admin/:pathMatch(.*)*` trỏ tới `AdminNotFoundView` với `meta: { layout: 'admin', requiresAuth: true, requiresAdmin: true }`.
     * Tinh chỉnh Navigation Guard: Khi admin đã đăng nhập vào portal 5174 gõ URL không tồn tại, tự động chuyển đến trang 404 quản trị.
   - Build frontend thành công: 144 modules, 670ms.
```

---

## Prompt 23 — Chuẩn hóa nhận diện logo website trong Email Template OTP (2026-11-22)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100%

1. Yêu cầu nghiệp vụ:
   - Thay thế biểu tượng emoji xe hơi `🚗` bằng logo chính thức của website (`logo.png`) trong các mẫu HTML email gửi mã OTP (đặt lại mật khẩu và đăng ký tài khoản).
   - Logo cần được định dạng chuẩn email, hiển thị tự nhiên ở vị trí trên cùng, căn giữa (`align="center"`), sắc nét và không bị chặn bởi các trình duyệt/ứng dụng email như Gmail, Outlook.

2. Hiện thực:
   - Backend `backend/src/utils/email.service.js`:
     * Nhúng ảnh qua cơ chế chuẩn MIME Content-ID (CID inline attachment): `cid:taplai24h_logo`.
     * Tự động dò tìm đường dẫn logo từ `backend/src/assets/logo.png` hoặc `frontend/public/logo.png`.
     * Header email được thiết kế dạng bảng `<table>` email-safe, căn giữa: Logo kích thước 56x56px, bo tròn 12px viền trắng nổi bật trên nền xanh, bên dưới là tên hệ thống "Tập Lái 24h" và phụ đề.
     * Áp dụng đồng bộ cho cả `sendOtpEmail` và `sendRegisterOtpEmail`.
```

---

## Prompt 24 — Bổ sung thuộc tính Avatar & Chức năng Chỉnh sửa thông tin cá nhân (2026-11-22)

```markdown
TRẠNG THÁI: ĐÃ HOÀN THÀNH 100%

1. Yêu cầu nghiệp vụ:
   - Thêm thuộc tính `avatar` vào người dùng (`users`).
   - Cho phép cả độc giả/học viên và quản trị viên (Admin) xem và chỉnh sửa thông tin cá nhân (Họ tên, SĐT, Avatar) ngoại trừ Email và Mật khẩu.
   - Nếu trong quá trình đăng ký người dùng không chọn avatar (hoặc xóa avatar), hệ thống mặc định hiển thị chữ cái đầu tiên theo họ tên trên nền tròn màu (`[D]`, `[V]`) như cũ.
   - Nút mở chức năng được tích hợp trực tiếp vào khung dropdown người dùng trên Navbar học viên và Topbar quản trị.

2. Hiện thực:
   - CSDL (MySQL):
     * Thêm cột `avatar VARCHAR(255) NULL` vào bảng `users`.
   - Backend:
     * `middlewares/upload.middleware.js`: Cấu hình Multer `uploadAvatarImage` lưu vào `uploads/avatars/`, hỗ trợ JPG/PNG/WEBP/GIF tối đa 5MB.
     * `models/user.model.js`: Bổ sung `avatar` vào constructor, `findByEmail`, `findById`, `findFiltered`, `create`, `toJSON()`, và viết thêm `updateProfile(userId, { fullName, phone, avatar })`.
     * `services/auth.service.js`: Viết `updateProfile` đảm bảo chỉ cập nhật Họ tên, SĐT, Avatar (tuyệt đối không cho phép đổi Email hay Password qua route này). Hỗ trợ nhận avatar tùy chọn khi đăng ký.
     * `controllers/auth.controller.js` & `routes/auth.routes.js`: Thêm route bảo vệ `PUT /api/v1/auth/profile` có `authMiddleware` và `uploadAvatarImage.single('avatar')`.
   - Frontend:
     * `stores/auth.js`: Thêm getters `userAvatar`, `userPhone`, action `updateProfile(formData)` cập nhật reactive Pinia store và localStorage.
     * `components/common/ProfileModal.vue`: Modal xem trước avatar, chọn ảnh mới hoặc xóa ảnh, chỉnh sửa Họ tên, SĐT; Email cố định (disabled) có icon khóa và badge "Cố định".
     * `components/common/AppNavbar.vue`: Thêm mục "Thông tin cá nhân" (icon `bi-person-gear`) vào dropdown người dùng; nút avatar tự hiển thị ảnh đại diện mới nếu có hoặc fallback chữ cái tròn.
     * `layouts/AdminLayout.vue`: Thêm mục "Thông tin cá nhân" vào dropdown Admin; hiển thị avatar trên Topbar và Sidebar footer.
     * `views/auth/RegisterView.vue`: Bổ sung chọn avatar tùy chọn ở Bước 1 đăng ký. Nếu bỏ qua, tài khoản tự động dùng avatar chữ cái mặc định.
     * `views/admin/AdminUsersView.vue`: Bảng quản lý người dùng hiển thị avatar nếu có hoặc chữ cái đầu.
     * Build frontend thành công: 146 modules, 860ms.
```

---

## 4. QUY TẮC CỐT LÕI DÀNH CHO AI AGENT (DEVELOPMENT RULES)

Khi thực thi bất kỳ prompt nào ở trên, AI Agent bắt buộc phải tuân thủ nghiêm ngặt 5 nguyên tắc vàng:
1. **Bảo toàn dữ liệu & Cấu trúc:** Không làm thay đổi schema CSDL MySQL khi không có yêu cầu rõ ràng; giữ nguyên các liên kết khóa ngoại và seed data 600 câu hỏi. Khi nạp hoặc cập nhật dữ liệu SQL trên Windows, luôn đảm bảo kết nối UTF-8 (`utf8mb4`) để tránh lỗi Mojibake tiếng Việt. Nếu phát sinh lỗi bảng mã, sử dụng script `backend/database/seeds/fix_vietnamese_encoding.js` để tự động hóa khôi phục.
2. **Tuân thủ chuẩn OOP Backend:** Mọi logic Backend mới phải được viết trong các Class tương ứng (`*Model.js`, `*Service.js`, `*Controller.js`), không viết code tự do ngoài tầng phân định.
3. **Tuyệt đối bảo mật thi cử:** Không gửi cờ `is_correct` về Client trong quá trình làm bài thi; chỉ cho phép mở khóa sau khi đã nộp bài thành công vào CSDL.
4. **Tính nhất quán của UI/UX & Xử lý tài sản tĩnh:** Mọi giao diện phát triển mới phải sử dụng Bootstrap 5, font chữ Plus Jakarta Sans, gắn liền với nhận diện logo `/logo.png`, responsive tốt trên cả màn hình di động và máy tính. Trên các thẻ `<img>`, luôn sử dụng hàm `resolveAssetUrl()` và xử lý sự kiện `@error` để chuyển sang icon fallback dự phòng khi link ảnh bị lỗi mạng hoặc 404 từ bên thứ ba.
5. **Cập nhật tài liệu đồng bộ:** Sau khi hoàn thành một tính năng quan trọng, luôn cập nhật trạng thái tương ứng trong file `Cores/checkpoint.md`.
