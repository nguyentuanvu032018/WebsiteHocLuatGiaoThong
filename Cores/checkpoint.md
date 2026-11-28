# BẢNG THEO DÕI TIẾN ĐỘ DỰ ÁN (PROJECT CHECKPOINTS)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Quy ước trạng thái:**  
> - `[ ]` : Chưa thực hiện (Pending)  
> - `[/]` : Đang thực hiện (In Progress)  
> - `[x]` : Đã hoàn thành (Done)  

> **Cập nhật trạng thái hệ thống đến 2026-11-26:** `[/]` Các chức năng cốt lõi của học viên và quản trị đã được hiện thực: xác thực JWT, OTP đăng ký/đặt lại mật khẩu, quản lý hồ sơ và avatar, ngân hàng câu hỏi phân loại theo 7 chương, ôn tập theo nhóm hạng, thi thử theo ma trận 6 hạng bằng A, A1, B, B1, C, C1, chấm điểm câu liệt, lịch sử/xem lại bài thi, tra cứu biển báo/mức phạt, nhận diện biển báo AI ResNet-50, chatbot Groq và các màn hình quản trị. Học viên và admin chạy ở hai cổng frontend riêng (`5173` và `5174`); trang admin mặc định là đăng nhập, không có đăng ký, và ngrok chỉ mở cổng học viên. Lối vào ôn tập chung toàn bộ 7 chương đã được gỡ; A/A1 vẫn ôn chương I–V, B/B1 và C/C1 ôn đủ 7 chương theo nhóm hạng. Backend đã được chuẩn hóa theo `routes → controllers → services → models`. Ngày 2026-11-25 đã vá lỗi upload giả ảnh có thể thực thi nội dung chủ động bằng kiểm tra chữ ký tệp, phần mở rộng do máy chủ quy định và CSP sandbox cho `/uploads` (CP-05.42 / SEC-01.3). Đợt rà soát bảo mật 2026-11-26 ghi nhận các hạng mục còn mở trong `fix_bao_mat.md`; các kiểm thử hiện tại chưa thay thế kiểm thử end-to-end trên cơ sở dữ liệu và dịch vụ triển khai. Công việc tài liệu/demo còn lại cần theo dõi tại CP-05.6.

---

## 1. TỔNG QUAN TIẾN ĐỘ CÁC MỐC (MILESTONE SUMMARY)

| Mốc | Tên mốc công việc | Số lượng Task | Trạng thái | Ngày hoàn thành |
| :---: | :--- | :---: | :---: | :---: |
| **CP-01** | Kế hoạch, Thiết kế CSDL & Xác thực JWT | 6 tasks | `[x]` Hoàn thành | 2026-10-18 |
| **CP-02** | Dữ liệu 600 câu, Biển báo & Backend Exam Engine | 6 tasks | `[x]` Hoàn thành | 2026-10-18 |
| **CP-03** | Frontend SPA: Ôn tập, Tra cứu & Phòng thi sát hạch | 7 tasks | `[x]` Hoàn thành | 2026-10-19 |
| **CP-04** | Lịch sử thi của học viên & Phân hệ Admin Dashboard | 5 tasks | `[x]` Hoàn thành | 2026-10-19 |
| **CP-05** | Kiểm thử tích hợp, Tối ưu hóa & Đóng gói đồ án | 42 tasks | `[/]` Đang hoàn thiện | Đang cập nhật đến 2026-11-26 |

---

## 2. CHI TIẾT TỪNG CHECKPOINT

### CHECKPOINT 01: KẾ HOẠCH, THIẾT KẾ CSDL & AUTHENTICATION API
- [x] **CP-01.1:** Soạn thảo tài liệu kiến trúc, tiêu chí dự án và chiến lược phát triển trong thư mục `Cores/`.
- [x] **CP-01.2:** Khởi tạo cấu trúc dự án tách rời Monorepo (`backend/` và `frontend/`), cài đặt đầy đủ dependencies.
- [x] **CP-01.3:** Viết file kịch bản SQL khởi tạo cơ sở dữ liệu `schema.sql` (12 bảng, khóa ngoại, indexes, seed 7 chương, 6 hạng bằng).
- [x] **CP-01.4:** Thiết lập kết nối Node.js Express với MySQL Connection Pool (`mysql2/promise`).
- [x] **CP-01.5:** Hiện thực các API Xác thực: Đăng ký, Đăng nhập, Hashing mật khẩu bằng `bcryptjs`, cấp JWT Token.
- [x] **CP-01.6:** Xây dựng Middleware xác thực Token JWT và Middleware kiểm tra quyền hạn Role (Student / Admin).

### CHECKPOINT 02: DỮ LIỆU CHUẨN & BACKEND EXAM ENGINE
- [x] **CP-02.1:** Soạn thảo bộ dữ liệu mẫu/seed data: 7 chương lý thuyết, ma trận đề thi các hạng bằng (A, A1, B, B1, C, C1) và tạo các lớp OOP (`ChapterModel`, `LicenseTypeModel`, `ExamStructureRuleModel`).
- [x] **CP-02.2:** Soạn thảo bộ seed data câu hỏi & đáp án (gắn chính xác cờ `is_paralysis = 1` cho các câu điểm liệt) và hoàn thiện các lớp OOP (`QuestionModel`, `AnswerModel`).
- [x] **CP-02.3:** Nạp dữ liệu hệ thống biển báo đường bộ (53 biển báo đủ 5 nhóm chuẩn QCVN 41:2019) và danh mục mức phạt theo Nghị định 100/123 (35 hành vi vi phạm cho Xe máy, Ô tô, Khác) và hoàn thiện các lớp OOP (`TrafficSignModel`, `TrafficFineModel`).
- [x] **CP-02.4:** Xây dựng nhóm API phục vụ Ôn tập & Tra cứu (`/api/v1/chapters`, `/api/v1/questions` có lọc và phân trang, `/api/v1/questions/paralysis`, `/api/v1/lookup/signs`, `/api/v1/lookup/fines`) theo chuẩn OOP (`ChapterService`, `ChapterController`, `QuestionService`, `QuestionController`, `LookupService`, `LookupController`).
- [x] **CP-02.5:** Hiện thực **Thuật toán sinh đề thi ngẫu nhiên** theo ma trận từng hạng bằng (`/api/v1/exams/generate`), trộn ngẫu nhiên Fisher-Yates, bảo đảm số lượng câu điểm liệt và tuyệt đối bảo mật đáp án đúng theo chuẩn OOP (`ExamSessionModel`, `ExamService`, `ExamController`, `exam.routes.js`).
- [x] **CP-02.6:** Hiện thực **Thuật toán chấm điểm và phát hiện trượt do câu điểm liệt** (`/api/v1/exams/:id/submit`), chống nộp bài lặp lại, cập nhật chi tiết phiên thi và mở khóa lời giải thích (`ExamService.submitExamSession`, `ExamSessionModel.updateSubmission`, `ExamController.submitExam`).

### CHECKPOINT 03: PHÁT TRIỂN GIAO DIỆN HỌC VIÊN (FRONTEND SPA)
- [x] **CP-03.1:** Khởi tạo dự án Vue 3 với Vite, tích hợp Bootstrap 5, Bootstrap Icons, Vue Router 4, Pinia và Axios.
- [x] **CP-03.2:** Thiết kế hệ thống Layouts (`DefaultLayout.vue`, `ExamLayout.vue` toàn màn hình không xao nhãng), thanh điều hướng Navbar responsive (`AppNavbar.vue`), chân trang (`AppFooter.vue`), tích hợp Design System hiện đại (Google Fonts Plus Jakarta Sans, Soft Gradients, Glassmorphism).
- [x] **CP-03.3:** Xây dựng màn hình Đăng ký, Đăng nhập, liên kết với Pinia `authStore` và lưu trữ Token.
- [x] **CP-03.4:** Xây dựng màn hình Ôn tập 600 câu: xem theo chương, chế độ xem 60 câu điểm liệt, hiển thị mẹo giải thích khi chọn đáp án.
- [x] **CP-03.5:** Xây dựng màn hình Tra cứu Biển báo giao thông & Tra cứu Mức phạt với bộ lọc tìm kiếm tức thì.
- [x] **CP-03.6:** Xây dựng **Giao diện Phòng thi sát hạch (`ExamRoomView.vue`)**:
  - Tích hợp đồng hồ đếm ngược JavaScript đổi màu theo thời gian còn lại.
  - Lưới danh sách câu hỏi bên hông (Question Palette) theo dõi trạng thái.
  - Bắt sự kiện bàn phím (1-4 chọn đáp án, mũi tên chuyển câu).
  - Modal cảnh báo xác nhận nộp bài.
- [x] **CP-03.7:** Xây dựng màn hình Kết quả thi (`ExamResultView.vue`): Huy hiệu Đạt/Trượt, nêu rõ lý do nếu trượt vì câu điểm liệt.

### CHECKPOINT 04: LỊCH SỬ THI & PHÂN HỆ QUẢN TRỊ ADMIN
- [x] **CP-04.1:** Xây dựng màn hình Xem lại bài thi (`ExamReviewView.vue`): So sánh đáp án của thí sinh vs đáp án chuẩn.
- [x] **CP-04.2:** Xây dựng màn hình Lịch sử thi cá nhân (`ExamHistoryView.vue`): Bảng thống kê các lần thi, tỉ lệ đỗ.
- [x] **CP-04.3:** Xây dựng Admin Dashboard (`AdminDashboardView.vue`): Thống kê số lượng học viên, số lượt thi, biểu đồ kết quả.
- [x] **CP-04.4:** Xây dựng màn hình Quản lý câu hỏi (`AdminQuestionsView.vue`): Thêm, sửa, xóa, gắn cờ câu điểm liệt, upload ảnh.
- [x] **CP-04.5:** Xây dựng màn hình Quản lý người dùng (`AdminUsersView.vue`): Danh sách tài khoản, khóa/mở khóa.

### CHECKPOINT 05: KIỂM THỬ TÍCH HỢP, TỐI ƯU & HOÀN THIỆN
- [x] **CP-05.1:** Điều chỉnh dữ liệu và giao diện theo yêu cầu sửa dự án: đồng bộ bộ hạng bằng A, A1, B, B1, C, C1, cô lập giao diện học viên vs admin, đồng bộ theme riêng cho hai phân hệ.
- [x] **CP-05.2:** Kiểm tra tính tương thích Responsive trên Desktop, Tablet và Mobile.
- [x] **CP-05.3:** Đánh giá hiệu năng truy vấn CSDL, kiểm tra Indexing và tối ưu hóa thời gian phản hồi API.
- [x] **CP-05.4:** Cập nhật tài liệu hướng dẫn bổ sung trong thư mục `Cores/` cho các thay đổi giao diện và cấu hình dữ liệu mới, bao gồm quy tắc: bỏ tùy chọn "Tất cả các chương" và hiển thị cảnh báo "Vui lòng chọn chương" khi chưa chọn chương nào.
- [x] **CP-05.5:** Hoàn thiện phân hệ quản lý biển báo giao thông cho Admin (`/admin/signs`), bao gồm CRUD, lọc tìm kiếm, phân trang, upload ảnh và kiểm soát quyền truy cập dành riêng cho quản trị viên.
- [/] **CP-05.6:** Chuẩn bị slide và kịch bản demo bảo vệ đề tài niên luận (đang hoàn thiện cuối cùng).
- [x] **CP-05.7:** Khắc phục triệt để lỗi màn hình Phòng thi sát hạch (`/exam/room/:id`) bị kẹt trạng thái xoay vòng tải liên tục ("Đang chuẩn bị đề thi..."). Giải quyết xung đột giữa Vue Router transition `mode="out-in"` và `<Teleport>`, bổ sung `:key="route.fullPath"` trên router-view component, chuyển `sessionId` sang reactive `computed`, đồng bộ `watch` param thay đổi và cơ chế Teleport an toàn có fallback nút tải lại.
- [x] **CP-05.8:** Hoàn thiện phân hệ quản lý chương lý thuyết cho Admin (`/admin/chapters`), bao gồm CRUD đầy đủ (thêm/sửa/xóa chương), 3 thẻ KPI thống kê (tổng chương, tổng câu hỏi, tổng câu điểm liệt), tìm kiếm theo tên/mô tả, liên kết nhanh đến danh sách câu hỏi theo chương (`/admin/questions?chapterId=X`), bảo vệ khóa ngoại khi xóa chương có câu hỏi liên kết. Backend: bổ sung 3 phương thức CRUD vào `ChapterModel` (`create`, `update`, `deleteById`), 5 controller methods và 5 routes trong `admin.routes.js`. Frontend: `AdminChaptersView.vue` (507 dòng), route `/admin/chapters` và menu sidebar.
- [x] **CP-05.9:** Hoàn thiện phân hệ quản lý phòng thi sát hạch cho Admin (`/admin/exam-rooms` / `/admin/license-types`), bao gồm:
  - 4 thẻ KPI: Tổng số phòng thi, phòng thi đang mở, phòng thi tạm đóng, tổng số lượt thi của thí sinh.
  - 2 chế độ hiển thị linh hoạt: Lưới thẻ (Cards Grid) mô phỏng chính xác giao diện chọn phòng thi của học viên (Badge hạng, icon xe, thông số đề thi số câu/thời gian/điểm đạt) và Chế độ Bảng chi tiết (Data Table).
  - Tìm kiếm và lọc theo trạng thái mở/đóng; Đóng/mở phòng thi nhanh chóng (`PATCH toggle-status`).
  - Modal thêm/sửa phòng thi và Modal cấu hình ma trận đề thi 7 chương (`GET / PUT matrix`) kiểm tra khớp chính xác tổng số câu quy định.
  - Xóa phòng thi với cơ chế bảo vệ an toàn: chặn xóa nếu đã có thí sinh tham gia thi cử.
  - Backend: Cập nhật `LicenseTypeModel` (+6 methods), 8 controller methods, 8 routes trong `admin.routes.js`. Frontend: `AdminExamRoomsView.vue`, route `/admin/exam-rooms` và menu sidebar/dropdown.
- [x] **CP-05.10:** Tối ưu hóa giao diện trang chủ `HomeView.vue`:
  - Di chuyển tệp tin `banner.webp` vào thư mục tài nguyên chuẩn của Frontend (`frontend/public/banner.webp` và `frontend/src/assets/banner.webp`).
  - Thiết lập `banner.webp` làm ảnh nền khu vực Hero Banner trang chủ với lớp phủ đa lớp `linear-gradient(135deg, ...)` tinh tế, bảo đảm chữ tiêu đề, phụ đề và các nút CTA có độ tương phản cao và sắc nét.
  - Tích hợp hiệu ứng kính mờ (Glassmorphism / `backdrop-filter: blur(12px)`) cho thẻ Quick Start chọn hạng bằng, tạo chiều sâu thị giác sang trọng.
  - Toàn bộ phong cách thiết kế được đóng gói hoàn toàn trong thẻ `<style scoped>` của `HomeView.vue`, cam kết 100% không ảnh hưởng đến bất kỳ trang hay layout nào khác.
- [x] **CP-05.11:** Hoàn thiện phân hệ quản lý mức xử phạt giao thông cho Admin (`/admin/fines`), bao gồm:
  - 4 thẻ KPI: Tổng số mức phạt trong hệ thống, số vi phạm xe máy (`XE_MAY`), xe ô tô (`OTO`), phương tiện khác / người đi bộ (`KHAC`).
  - Bộ lọc tìm kiếm thông minh: Tìm kiếm theo từ khóa (hành vi, chi tiết vi phạm, căn cứ pháp lý), lọc theo nhóm phương tiện, và lọc theo 4 khoảng tiền phạt (< 1 triệu, 1 - 5 triệu, 5 - 10 triệu, > 10 triệu).
  - Bảng dữ liệu vi phạm chuẩn Nghị định 100/2019 & Nghị định 123/2021: Hiển thị STT, nhóm phương tiện (badge màu + icon), tên hành vi & chi tiết vi phạm, khung tiền phạt định dạng VNĐ, hình phạt bổ sung (tước GPLX, tạm giữ phương tiện...), căn cứ pháp lý, thao tác Chỉnh sửa / Xóa.
  - Modal Thêm mới và Chỉnh sửa mức phạt với validation đầy đủ, format số tiền và kiểm tra logic khoảng tiền phạt (`min_fine_amount <= max_fine_amount`).
  - Xóa mức phạt có hộp thoại xác nhận SweetAlert2.
  - Backend: Bổ sung 3 phương thức CRUD vào `TrafficFineModel` (`create`, `update`, `deleteById`), 6 controller methods trong `AdminController`, 6 API routes trong `admin.routes.js`. Frontend: Tạo `AdminFinesView.vue`, thêm route `/admin/fines` và menu trong `AdminLayout.vue`.
- [x] **CP-05.12:** Gộp trang đăng nhập Học viên & Quản trị viên thành **một trang đăng nhập chung duy nhất** (`/login`). Hệ thống tự động phân luồng theo `role` trong JWT response: `admin` → `/admin/dashboard`, `student` → `/`. Cập nhật Navigation Guard (`guestOnly`) phân luồng chính xác cho admin khi đã đăng nhập. Sửa title route `/login` thành trung lập (`'Đăng nhập hệ thống'`). **Cập nhật cơ chế xác thực đăng nhập nghiêm ngặt: Phân biệt chính xác chữ hoa và chữ thường cho cả Email (`BINARY email = ?`) và Mật khẩu (bcrypt hash)**; bổ sung nhãn thông báo "Phân biệt hoa/thường" trên form đăng nhập. Build thành công 133 modules.
- [x] **CP-05.13:** Tích hợp chức năng **Quên mật khẩu / Đặt lại mật khẩu qua email OTP**:
  - Luồng 3 bước trên 1 trang: (1) Nhập email → (2) Nhập mã OTP 6 chữ số → (3) Đặt mật khẩu mới.
  - Áp dụng bình đẳng cho mọi tài khoản người dùng đã đăng ký (Học viên & Quản trị viên). Báo lỗi 404 rõ ràng nếu email chưa có trong hệ thống để người dùng kiểm tra lại.
  - OTP 6 chữ số ngẫu nhiên an toàn, hết hạn sau **3 phút** (In-Memory store `otpStore.js`, tự dọn dẹp định kỳ 5 phút).
  - Gửi email HTML chuyên nghiệp qua **Nodemailer / SMTP Google Workspace** (`smtp.gmail.com:587`). Bắt lỗi kết nối SMTP riêng biệt (mã 503) với thông báo tiếng Việt rõ ràng.
  - Bảo mật mật khẩu: Băm bcryptjs 10 rounds, xóa mã OTP ngay sau khi đổi mật khẩu thành công.
  - Backend: `utils/otpStore.js` (Map in-memory), `utils/email.service.js` (HTML template email), 3 phương thức mới trong `AuthService` (`sendPasswordResetOtp`, `verifyPasswordResetOtp`, `resetPassword`), `UserModel.updatePassword()`, 3 routes mới trong `auth.routes.js`, 3 controller methods trong `AuthController`.
  - Frontend: Tạo `ForgotPasswordView.vue` — giao diện 3 bước tích hợp `apiClient` Axios chuẩn (kết nối trực tiếp Backend `http://localhost:5000/api/v1`), bộ 6 ô OTP tách biệt có xử lý paste/backspace tự động, đồng hồ đếm ngược 180s hiển thị thời gian còn lại, nút Gửi lại OTP kích hoạt khi hết hạn. Thêm route `/forgot-password`. Thêm link "Quên mật khẩu?" vào `LoginView.vue`.
  - Build thành công: 133 modules, 582ms.
- [x] **CP-05.14:** Tích hợp chức năng **Nhận diện biển báo giao thông bằng AI** (Deep Learning ResNet-50):
  - Sử dụng mô hình `best_resnet50_traffic_signs.pth` (51 lớp biển báo Việt Nam).
  - Hỗ trợ 2 hình thức nhận diện linh hoạt:
    1. **Tải ảnh từ thiết bị:** Kéo thả / duyệt tệp tin ảnh từ máy tính hoặc điện thoại.
    2. **Quét trực tiếp qua Camera:** Sử dụng Webcam / Camera thiết bị với giao diện ngắm nhắm mục tiêu, đổi camera trước/sau, chụp frame và phân tích tức thì.
  - Tự động liên kết và so khớp với danh mục biển báo chuẩn Bộ GTVT trong CSDL MySQL, trả về ý nghĩa chi tiết, lời khuyên lái xe an toàn, mã biển và top các dự đoán có xác suất cao nhất.
  - Backend: `ai-models/predict.py` (PyTorch ResNet-50 inference), `services/aiSign.service.js`, `controllers/aiSign.controller.js`, 2 API routes (`POST /lookup/signs/recognize-file`, `POST /lookup/signs/recognize-camera`).
  - Frontend: `SignRecognitionView.vue` (hiệu ứng quét radar/laser sinh động, responsive), route `/lookup/recognize`, thêm mục menu "Nhận diện biển báo AI" trên Navbar dropdown và nút CTA trên trang tra cứu biển báo `SignsView.vue`.
  - Build thành công: 135 modules, 598ms.
- [x] **CP-05.15:** Sửa lỗi timeout chức năng Quên mật khẩu (ForgotPassword) — Backend gửi email OTP theo cơ chế **fire-and-forget** (non-blocking), API phản hồi tức thì (~0.09s thay vì chờ 6–13s trước đó). Tăng `timeout` của `apiClient` từ 10s lên 30s để xử lý các tác vụ dài hơn. Build frontend: 135 modules, 587ms.
- [x] **CP-05.16:** Tích hợp chức năng **Chatbot hỏi đáp Luật Giao Thông AI** (`/lookup/chatbot`) sử dụng Groq Cloud API.
  - Giao diện chatbox hiện đại nằm trong menu "Tra cứu luật", hỗ trợ hội thoại đa lượt có nhớ ngữ cảnh (lưu lịch sử 20 lượt gần nhất mỗi session, tự xóa sau 30 phút không hoạt động).
  - Phạm vi kiến thức: Luật Giao thông đường bộ, Nghị định 100/2019 & 123/2021 (mức phạt), QCVN 41:2019 (biển báo), 600 câu thi GPLX, quy trình sát hạch 6 hạng bằng A, A1, B, B1, C, C1. Tự động từ chối câu hỏi ngoài chủ đề giao thông.
  - Tính năng UI: Typing indicator 3 chấm nhảy, render Markdown (bold/italic/list/code), câu hỏi gợi ý nhanh, nút Làm mới hội thoại, đếm ký tự, phím tắt Enter gửi / Shift+Enter xuống dòng, responsive mobile.
  - Backend: `chatbot.service.js` (Singleton + session Map in-memory), `chatbot.controller.js`, `chatbot.routes.js`, route `POST /api/v1/chatbot/send` và `POST /api/v1/chatbot/clear`. `GROQ_API_KEY` và `GROQ_MODEL` cấu hình trong `.env`.
  - Frontend: `ChatbotView.vue`, route `/lookup/chatbot`, mục menu "Hỏi đáp AI" (badge Mới) trong Navbar dropdown "Tra cứu luật".
  - Test OK: Câu hỏi on-topic (vượt đèn đỏ, biển P.102), context memory nhiều lượt, off-topic rejection (nấu ăn), xóa session. Build thành công: 136 modules, 614ms.
- [x] **CP-05.17:** Khắc phục lỗi nhận diện biển báo qua Camera bị từ chối `request entity too large`:
  - Nguyên nhân: `express.json()` mặc định giới hạn body 100KB, ảnh chụp từ Camera encode Base64 có kích thước 300KB–1MB.
  - Fix: Tăng giới hạn lên 10MB trong `backend/src/app.js`: `express.json({ limit: '10mb' })` và `express.urlencoded({ extended: true, limit: '10mb' })`.
  - Test: Body 600KB đã vượt qua thành công. Build frontend: 136 modules, 817ms.
- [x] **CP-05.18:** Nâng cấp Chatbot AI sang nền tảng **Groq Cloud API** (LPU siêu tốc, miễn phí 100%):
  - Model: `openai/gpt-oss-120b` (kèm cơ chế tự động fallback sang `qwen/qwen3.8-27b`).
  - Tốc độ phản hồi cực nhanh (~1-2s), khắc phục triệt để tình trạng trễ/lag và lỗi quota của các nền tảng trước.
  - Tích hợp tự động retry backoff, bắt đúng lỗi API key/quota/model không tồn tại.
  - Cấu hình qua biến môi trường `GROQ_API_KEY` và `GROQ_MODEL` trong `.env`.
- [x] **CP-05.19:** Cập nhật menu điều hướng học viên trong `AppNavbar.vue`: nhấn "Ôn tập lý thuyết" để mở danh sách lựa chọn, nhấn ngoài danh sách hoặc phím `Esc` để đóng. Mục "Thi thử" là liên kết trực tiếp đến trang chọn hạng bằng.
- [x] **CP-05.20:** Ngăn tạo/cập nhật chương với thứ tự hiển thị đã được sử dụng. Form quản lý chương hiển thị cảnh báo theo thời gian thực, yêu cầu nhập số nguyên dương chưa dùng và không cho lưu khi trùng; backend kiểm tra lại để trả lỗi 409 nếu thứ tự bị trùng, đồng thời tự đề xuất thứ tự mới theo giá trị lớn nhất hiện có.
- [x] **CP-05.21:** Bảo vệ ngân hàng câu hỏi theo ma trận đề thi: khi ẩn câu hỏi hoặc cập nhật làm câu hỏi đang hoạt động bị ẩn/chuyển khỏi chương, backend kiểm tra số câu còn hoạt động của chương so với `question_count` lớn nhất được cấu hình trong các ma trận. Nếu không đủ, từ chối thao tác với lỗi 409 và thông báo số câu hiện có, số câu tối thiểu cần giữ; giao diện Admin hiển thị cảnh báo này.
- [x] **CP-05.22:** Bỏ danh sách thả xuống của mục "Thi thử" trên navbar; giữ mục này là liên kết trực tiếp đến `/exam`. Danh sách "Ôn tập lý thuyết" vẫn giữ nguyên hành vi mở khi nhấn và đóng khi nhấn ngoài hoặc phím `Esc`.
- [x] **CP-05.23:** Hoàn thiện phân tầng API quản lý người dùng theo `routes → controllers → services → models`: route tiếp nhận và bảo vệ endpoint, controller xử lý HTTP, `UserService` thực hiện nghiệp vụ/kiểm tra quyền thao tác, `UserModel` chỉ truy cập dữ liệu. Cập nhật sơ đồ lớp và bảng ánh xạ kiến trúc trong `Cores/Cau_truc.md`.
- [x] **CP-05.24:** Chuẩn hóa toàn bộ backend theo `routes → controllers → services → models`: chuyển nghiệp vụ quản trị khỏi `AdminController` vào `AdminService`, đưa truy vấn Dashboard vào Model; chuyển truy vấn CSDL còn trong `ExamService` và `AISignService` xuống các Model tương ứng. Các endpoint và định dạng phản hồi API hiện có được giữ nguyên. Kiểm tra cú pháp thành công cho toàn bộ 46 tệp JavaScript backend.
- [x] **CP-05.25:** Sửa trạng thái kích hoạt câu hỏi ở form Admin: mặc định checkbox được chọn khi tạo mới; nếu bỏ chọn thì câu hỏi được tạo hoặc cập nhật với `is_active = 0`, không tham gia sinh đề. Backend vẫn mặc định kích hoạt khi client không gửi trường `isActive`.
- [x] **CP-05.26:** Bổ sung lối vào ôn tập theo nhóm hạng trên menu học viên. Hạng A/A1 ôn chương I–V; B/B1 và C/C1 ôn đủ 7 chương. Các hạng trong cùng nhóm dùng chung phạm vi nên trang ôn tập không có thanh chọn hạng trùng lặp.
- [x] **CP-05.27:** Bổ sung liên kết thi thử và lịch sử theo nhóm; thi thử tiếp tục chọn hạng cụ thể. API lịch sử hỗ trợ lọc nhiều `licenseTypeIds` và áp dụng cùng phạm vi cho danh sách, thống kê, chương yếu.
- [x] **CP-05.28:** Tinh chỉnh bảng ngân hàng câu hỏi để giải thích và tên chương tự xuống dòng, cân lại cột trạng thái/thao tác nhằm tránh nút kích hoạt tràn. Bổ sung `stop.bat` nhắm các cửa sổ có tiêu đề do `run.bat` tạo; cần kiểm thử đóng tiến trình thực tế trên máy chạy demo.
- [x] **CP-05.29:** Gỡ lối vào ôn tập chung “7 Chương lý thuyết” và các CTA/liên kết dẫn tới chế độ này; URL `/study` không có nhóm hợp lệ chuyển sang `/exam`. Giữ nguyên ôn tập theo nhóm hạng, 60 câu điểm liệt và dữ liệu/cấu trúc 7 chương đang được ma trận thi, quản trị sử dụng. Build frontend thành công.
- [x] **CP-05.30:** Thay thế luồng đăng nhập chung tại CP-05.12: tách cổng học viên (`5173`) và quản trị (`5174`) bằng hai Vite dev server; admin mặc định vào đăng nhập và không có đăng ký. Giới hạn ngrok ở cổng học viên, bind cổng admin vào loopback, đặt API Client mặc định dùng đường dẫn tương đối `/api/v1` qua Vite proxy để demo ngrok gọi đúng backend, đồng bộ CORS và cập nhật `run.bat`, hướng dẫn vận hành cùng tài liệu `Cores`.
- [x] **CP-05.31:** Tích hợp quy trình **Xác thực Đăng ký tài khoản học viên qua mã OTP Email** (hiệu lực 3 phút):
  - Quy trình 2 bước trực quan: Sau khi học viên điền form đăng ký và bấm "Hoàn tất đăng ký", hệ thống kiểm tra dữ liệu và gửi mã xác nhận 6 chữ số có hiệu lực 3 phút đến email của học viên.
  - Giao diện nhập OTP hiện đại: 6 ô input số tự động chuyển ô/paste/backspace, đồng hồ đếm ngược 180s, nút gửi lại mã mới khi hết hạn, nút quay lại chỉnh sửa thông tin.
  - Backend bảo mật cao: Chỉ khi người dùng nhập đúng mã OTP còn hạn, tài khoản mới chính thức được khởi tạo trong CSDL MySQL và cấp JWT Token, tránh tình trạng rác tài khoản chưa xác thực.
  - Backend: `createRegisterOtp`, `verifyRegisterOtp`, `deleteRegisterOtp` trong `otpStore.js`, `sendRegisterOtpEmail` trong `email.service.js`, API `POST /auth/send-register-otp` và `POST /auth/verify-register-otp`.
  - Frontend: Nâng cấp `RegisterView.vue` với Step Indicator, tích hợp `authStore.sendRegisterOtp` và `authStore.verifyRegisterOtp`. Build thành công: 142 modules, 737ms.
- [x] **CP-05.32:** Bổ sung trang lỗi 404 chuyên biệt cho Phân hệ Quản trị (**`AdminNotFoundView.vue`** tại `/admin/:pathMatch(.*)*`):
  - Khi Admin nhập sai URL trong phân hệ quản trị (hoặc trên Admin Portal `5174`), hệ thống hiển thị trang 404 phong cách Admin trong khung `AdminLayout` chuẩn mực.
  - Giao diện chuyên nghiệp: Icon cảnh báo pulse động, số 404 font monospace đỏ, hiển thị chính xác đường dẫn lỗi (`route.fullPath`), nút quay về Admin Dashboard và quay lại trang trước.
  - Bổ sung thanh điều hướng nhanh 7 phân hệ quản trị cốt lõi (Câu hỏi, Người dùng, Biển báo, Phòng thi, Chương lý thuyết, Mức phạt).
  - Navigation Guard thông minh: Tự động điều hướng URL sai trên portal 5174 về trang 404 của admin mà không bị văng về trang đăng nhập. Build frontend: 144 modules, 670ms.

---

## 3. NHẬT KÝ HOÀN THÀNH (CHANGELOG)

- **2026-10-18:**
  - Hoàn thành soạn thảo trọn bộ tài liệu: [KE_HOACH_XAY_DUNG_CHI_TIET.md](file:///d:/Download/CT466_NLN/Cores/KE_HOACH_XAY_DUNG_CHI_TIET.md), `Tieuchiduan.md`, `Chienluoc.md`, `checkpoint.md`, `next_step_guide.md`, `prompt.md`.
  - Khởi tạo xong cấu trúc Monorepo: `backend/` và `frontend/`.
  - Cài đặt đầy đủ 100% packages Backend (`express`, `mysql2`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv`, `helmet`, `multer`, `nodemon`).
  - Cài đặt đầy đủ 100% packages Frontend (`vue 3`, `vite`, `bootstrap 5`, `bootstrap-icons`, `pinia`, `vue-router`, `axios`, `sweetalert2`).
  - Hoàn thành viết mã nguồn DDL [schema.sql](file:///d:/Download/CT466_NLN/backend/database/schema.sql) tạo 12 bảng chuẩn hóa và dữ liệu seed ban đầu (7 chương, 6 hạng bằng, tài khoản admin).
  - Cấu hình file `backend/.env` và sửa scripts khởi chạy server trong `backend/package.json`.
  - Hoàn thành toàn bộ **Checkpoint 01**: Xây dựng module Xác thực JWT (`auth.service.js`, `auth.controller.js`, `auth.routes.js`), băm mật khẩu `bcryptjs`, xác thực token qua `auth.middleware.js` và phân quyền vai trò `rbac.middleware.js`.
  - Hoàn thành **CP-02.1**: Nạp file seed `database/seeds/01_license_and_matrix.sql` (7 chương, 6 hạng bằng A, A1, B, B1, C, C1, ma trận `exam_structure_rules` chuẩn Bộ GTVT) và hoàn thiện 3 lớp OOP: `ChapterModel`, `LicenseTypeModel`, `ExamStructureRuleModel`.
  - Hoàn thành **CP-02.2**: Nạp bộ dữ liệu câu hỏi và đáp án vào CSDL MySQL (gắn cờ chính xác các câu hỏi điểm liệt `is_paralysis = 1`, lời giải thích chi tiết, đường dẫn ảnh) và hoàn thiện 2 lớp OOP: `QuestionModel`, `AnswerModel`.
- **2026-10-19:**
  - Hoàn thành toàn bộ **Checkpoint 03**: Ôn tập 600 câu (`StudyView.vue`), 60 câu điểm liệt (`ParalysisView.vue`), tra cứu biển báo & mức phạt (`SignsView.vue`, `FinesView.vue`), phòng thi sát hạch (`ExamRoomView.vue`) và kết quả thi (`ExamResultView.vue`).
  - Hoàn thành toàn bộ **Checkpoint 04**:
    - `CP-04.1`: Màn hình xem lại bài thi (`ExamReviewView.vue`) so sánh đáp án thí sinh vs đáp án Bộ GTVT.
    - `CP-04.2`: Màn hình lịch sử thi cá nhân (`ExamHistoryView.vue`) với bảng thống kê các lần thi và phân tích chương yếu.
    - `CP-04.3`: Màn hình Admin Dashboard (`AdminDashboardView.vue`) với 4 thẻ KPI, biểu đồ cột xu hướng 7 ngày, biểu đồ tròn Donut phân bố kết quả thi, thống kê theo hạng bằng & 7 chương, top học viên tích cực.
    - `CP-04.4`: Màn hình quản lý 600 câu hỏi (`AdminQuestionsView.vue`) với upload ảnh, gắn cờ điểm liệt, modal thêm/sửa và xử lý nghiêm ngặt lỗi khóa ngoại `ON DELETE RESTRICT` (1451).
    - `CP-04.5`: Màn hình quản lý người dùng (`AdminUsersView.vue`) với bộ lọc, phân quyền vai trò, khóa/mở khóa tài khoản và cảnh báo ràng buộc dữ liệu lịch sử thi.
- **2026-11-02:**
  - Phát hiện và giải quyết triệt để lỗi bảng mã tiếng Việt (Mojibake / Double-Encoding) tại các bảng `sign_categories`, `fine_categories` và `users` phát sinh do import schema trên môi trường Windows mà không chỉ định charset `utf8mb4`.
  - Xây dựng và thực thi thành công script tự động hóa [`backend/database/seeds/fix_vietnamese_encoding.js`](file:///d:/Download/CT466_NLN/backend/database/seeds/fix_vietnamese_encoding.js) khôi phục 100% dữ liệu tiếng Việt chuẩn UTF-8.
  - Khắc phục sự cố xung đột chính sách bảo mật CORP của `helmet` trong [`backend/src/app.js`](file:///d:/Download/CT466_NLN/backend/src/app.js) (`crossOriginResourcePolicy: { policy: 'cross-origin' }`), cho phép Frontend nhúng ảnh tĩnh tải lên từ thư mục `/uploads/` mà không bị trình duyệt chặn cross-origin.
  - Tích hợp cơ chế fallback icon thông minh trên Vue (`AdminSignsView.vue`, `SignsView.vue`) khi ảnh ngoài bị lỗi 404 hoặc mất kết nối.
  - Bổ sung `Prompt 12`, `Prompt 13` và cập nhật nguyên tắc bảo toàn dữ liệu bảng mã UTF-8 & tài sản tĩnh vào sổ tay điều phối AI [`Cores/prompt.md`](file:///d:/Download/CT466_NLN/Cores/prompt.md).
  - Cập nhật chuẩn hóa dữ liệu 6 hạng giấy phép lái xe (A, A1, B, B1, C, C1) kèm ma trận phân bổ đề thi vào CSDL.
  - Tinh chỉnh giao diện Phòng thi sát hạch (`ExamRoomView.vue`): sửa lỗi tràn danh sách câu hỏi bên phải (palette grid 5 cột) và tăng độ tương phản màu chữ.
  - **[ĐÃ KHẮC PHỤC TRIỆT ĐỂ SỰ CỐ LOADING LOOP]**: Màn hình phòng thi sát hạch (`/exam/room/:id`) hoạt động trơn tru. Đã xử lý xung đột Vue Router transition và dynamic params, thêm fallback nút tải lại và cơ chế Teleport portal an toàn.
- **2026-11-03:**
  - Hoàn thành **CP-05.8**: Phân hệ quản lý chương lý thuyết cho Admin (`/admin/chapters`).
    - Backend: Bổ sung 3 phương thức CRUD vào `ChapterModel` (`create`, `update`, `deleteById` với bảo vệ khóa ngoại), 5 controller methods vào `AdminController` (`getChapters`, `getChapterById`, `createChapter`, `updateChapter`, `deleteChapter`), 5 API routes vào `admin.routes.js`.
    - Frontend: Tạo `AdminChaptersView.vue` (507 dòng) với 3 KPI cards, bảng dữ liệu, modal thêm/sửa, xóa có xác nhận SweetAlert2, tìm kiếm trực tiếp, liên kết nhanh câu hỏi theo chương.
    - Đăng ký route `/admin/chapters` trong `router/index.js` và thêm mục sidebar trong `AdminLayout.vue`.
    - Build frontend thành công: `AdminChaptersView-DhOOw1BV.js` (13.42 kB).
  - Hoàn thành **CP-05.9**: Phân hệ quản lý phòng thi sát hạch cho Admin (`/admin/exam-rooms` & `/admin/license-types`).
    - Backend: Cập nhật `LicenseTypeModel` với các phương thức OOP (`findAll` kèm stats, `findById`, `create`, `update`, `toggleActive`, `deleteById` có bảo vệ lịch sử thi), 8 controller methods trong `AdminController`, 8 routes trong `admin.routes.js`.
    - Frontend: Tạo `AdminExamRoomsView.vue` với 2 chế độ hiển thị (Lưới thẻ Cards Grid trực quan theo đúng thiết kế phòng thi của học viên + Bảng dữ liệu Data Table), modal thêm/sửa, modal cấu hình ma trận đề thi 7 chương, đóng/mở phòng thi, SweetAlert2 xác nhận.
    - Đăng ký route `/admin/exam-rooms` (alias `/admin/license-types`) trong `router/index.js` và thêm mục menu vào Sidebar & Topbar của `AdminLayout.vue`.
    - Build frontend thành công: `AdminExamRoomsView-ClspW-vp.js` (33.78 kB).
  - Cập nhật tài liệu `Cores/prompt.md` (Prompt 03D), `Cores/checkpoint.md` (CP-05.9) và `Cores/Cau_truc.md` (LicenseTypeModel, AdminController, Mapping Matrix).
  - Hoàn thành **CP-05.10**: Di chuyển và tích hợp `banner.webp` làm ảnh nền khu vực Hero của trang chủ `HomeView.vue`.
    - Tệp đồ họa được chuyển vào `frontend/public/banner.webp` và `frontend/src/assets/banner.webp`.
    - CSS tùy biến được đóng gói 100% trong `<style scoped>` của `HomeView.vue`, kết hợp lớp phủ gradient dịu nhẹ và backdrop-filter kính mờ cho Quick Start Card, không làm ảnh hưởng các trang khác trong hệ thống.
    - Build frontend hoàn tất thành công (`HomeView-DeW2gqO7.js` và `HomeView-BYJIU7Wq.css`).
  - Hoàn thành **CP-05.11**: Phân hệ quản lý mức xử phạt giao thông cho Admin (`/admin/fines`).
    - Backend: Bổ sung 3 phương thức CRUD vào `TrafficFineModel` (`create`, `update`, `deleteById`), 6 controller methods trong `AdminController` (`getFineCategories`, `getFines`, `getFineById`, `createFine`, `updateFine`, `deleteFine`), 6 API routes trong `admin.routes.js`.
    - Frontend: Tạo `AdminFinesView.vue` với 4 thẻ KPI thống kê, bộ lọc tìm kiếm theo từ khóa / nhóm phương tiện / 4 khoảng tiền phạt, modal thêm mới & chỉnh sửa có format VNĐ, SweetAlert2 xác nhận xóa. Đăng ký route `/admin/fines` và menu sidebar/dropdown trong `AdminLayout.vue`.
    - Build frontend thành công: `AdminFinesView-C17oKz66.js` (21.75 kB).
  - Tinh chỉnh `ExamReviewView.vue`: Lược bỏ tính năng in/tải PDF và gỡ bỏ package `html2pdf.js`, giữ giao diện xem lại bài thi trực quan, tinh gọn với các nút điều hướng cốt lõi (Thi lại đề thi khác, Lịch sử thi cá nhân, Về trang chủ). Bundle size tối ưu hóa chỉ còn 18.8 kB.
  - Hoàn thành **CP-05.12**: Gộp đăng nhập thành 1 trang chung (`LoginView.vue` tại `/login`).
    - Sửa title route `/login` → `'Đăng nhập hệ thống'` (trung lập, dùng cho cả 2 vai trò).
    - Cập nhật Navigation Guard `guestOnly`: Khi admin đã đăng nhập vào `/login` → redirect đúng về `/admin/dashboard` (thay vì `/`).
    - Bổ sung badge "Tự động chuyển giao diện theo vai trò" vào UI header của form đăng nhập.
    - Cập nhật cơ chế xác thực phân biệt chính xác chữ hoa và chữ thường cho cả Email và Mật khẩu: sử dụng `BINARY email = ?` và so sánh chính xác `user.email !== trimmedEmail` trong `UserModel.findByEmail` & `AuthService.loginUser`.
    - Bổ sung nhãn gợi ý "Phân biệt hoa/thường" bên cạnh trường Email và Mật khẩu trên giao diện `LoginView.vue`.
    - Logic redirect sau đăng nhập đã đúng từ trước: `authStore.isAdmin ? '/admin/dashboard' : '/'`.
    - Build thành công: 133 modules, 649ms.
  - Hoàn thành **CP-05.14**: Chức năng Nhận diện biển báo giao thông bằng AI ResNet-50.
    - Cài đặt PyTorch CPU & Torchvision cho môi trường Python 3.12.
    - Tích hợp mô hình `best_resnet50_traffic_signs.pth` (51 classes), `predict.py`, `aiSign.service.js`, `aiSign.controller.js`.
    - Hỗ trợ đầy đủ 2 hình thức: Tải ảnh từ thiết bị & Quét trực tiếp qua Camera.
    - Giao diện `SignRecognitionView.vue`, route `/lookup/recognize`, menu dropdown Navbar & nút CTA tại `SignsView.vue`.
    - Build thành công: 135 modules, 598ms.
- [x] **CP-05.15:** Sửa lỗi timeout chức năng Quên mật khẩu (ForgotPassword) — Backend gửi email OTP theo cơ chế **fire-and-forget** (non-blocking), API phản hồi tức thì (~0.09s thay vì chờ 6–13s trước đó). Tăng `timeout` của `apiClient` từ 10s lên 30s để xử lý các tác vụ dài hơn. Build frontend: 135 modules, 587ms.
- [x] **CP-05.16:** Tích hợp chức năng **Chatbot hỏi đáp Luật Giao Thông AI** (`/lookup/chatbot`) sử dụng Groq Cloud API:
  - Giao diện chatbox hiện đại nằm trong menu "Tra cứu luật", hỗ trợ hội thoại đa lượt có nhớ ngữ cảnh (lưu lịch sử 20 lượt gần nhất mỗi session, tự xóa sau 30 phút không hoạt động).
  - Phạm vi kiến thức: Luật Giao thông đường bộ, Nghị định 100/2019 & 123/2021 (mức phạt), QCVN 41:2019 (biển báo), 600 câu thi GPLX, quy trình sát hạch 6 hạng bằng A, A1, B, B1, C, C1. Tự động từ chối câu hỏi ngoài chủ đề giao thông.
  - Tính năng UI: Typing indicator 3 chấm nhảy, render Markdown (bold/italic/list/code), câu hỏi gợi ý nhanh, nút Làm mới hội thoại, đếm ký tự, phím tắt Enter gửi / Shift+Enter xuống dòng, responsive mobile.
  - Backend: `chatbot.service.js` (Singleton + session Map in-memory), `chatbot.controller.js`, `chatbot.routes.js`, route `POST /api/v1/chatbot/send` và `POST /api/v1/chatbot/clear`. `GROQ_API_KEY` cấu hình trong `.env`.
  - Frontend: `ChatbotView.vue`, route `/lookup/chatbot`, mục menu "Hỏi đáp AI" (badge Mới) trong Navbar dropdown "Tra cứu luật".
  - Test OK: Câu hỏi on-topic (vượt đèn đỏ, biển P.102), context memory nhiều lượt, off-topic rejection (nấu ăn), xóa session. Build thành công: 136 modules, 614ms.
  - Hoàn thành **CP-05.13**: Chức năng Quên mật khẩu / Đặt lại mật khẩu qua email OTP.
    - Áp dụng bình đẳng cho mọi tài khoản đã đăng ký (Học viên & Quản trị viên). Nếu email chưa đăng ký, hệ thống phản hồi lỗi 404 rõ ràng để người dùng kiểm tra lại.
    - Cấu hình SMTP Gmail/Google Workspace (`smtp.gmail.com:587`) an toàn qua `nodemailer` và App Password.
    - Backend: `utils/otpStore.js`, `utils/email.service.js`, `UserModel.updatePassword()`, 3 API routes mới (`POST /auth/forgot-password`, `/auth/verify-otp`, `/auth/reset-password`).
    - Frontend: `ForgotPasswordView.vue` tích hợp `apiClient` Axios chuẩn (kết nối trực tiếp Backend `http://localhost:5000/api/v1`), giao diện 3 bước mượt mà kèm đếm ngược 3 phút và nhập OTP 6 ô tự động focus/paste.
    - Build thành công: 133 modules, 582ms.
  - Hoàn thành **CP-05.15**: Sửa lỗi timeout ForgotPassword — email gửi non-blocking, API phản hồi tức thì.
  - Hoàn thành **CP-05.16**: Chatbot hỏi đáp Luật Giao Thông AI (Groq `openai/gpt-oss-120b`).
    - Backend: `chatbot.service.js`, `chatbot.controller.js`, `chatbot.routes.js`, `GROQ_API_KEY` trong `.env`.
    - Frontend: `ChatbotView.vue`, route `/lookup/chatbot`, mục menu "Hỏi đáp AI" trong Navbar.
    - Build thành công: 136 modules, 614ms.
- **2026-11-04:**
  - Khắc phục **CP-05.17**: Lỗi `request entity too large` khi nhận diện biển báo qua Camera. Nguyên nhân: Express body parser mặc định giới hạn 100KB. Fix: `express.json({ limit: '10mb' })` và `express.urlencoded({ extended: true, limit: '10mb' })` trong `backend/src/app.js`.
  - Khắc phục **CP-05.18**: Chatbot AI nâng cấp sang **Groq Cloud API** (`openai/gpt-oss-120b` & `qwen/qwen3.8-27b`), miễn phí và phản hồi siêu nhanh dưới 2s, xử lý trôi chảy hội thoại luật giao thông. Thay thế icon Trang chủ bằng `icon_home.jpg` trên Navbar.
  - Hoàn thành **CP-05.19**: Cải thiện menu Ôn tập lý thuyết; mở danh sách khi nhấn, đóng khi nhấn ngoài/phím `Esc`, tự đóng sau khi chuyển trang. Mục Thi thử liên kết trực tiếp đến trang chọn hạng.
  - Hoàn thành **CP-05.22**: Bỏ danh sách thả xuống của mục Thi thử, giữ liên kết trực tiếp đến `/exam`.
- **2026-11-21:**
  - Hoàn thành **CP-05.31**: Tích hợp quy trình xác thực Đăng ký tài khoản học viên qua mã OTP Email 6 chữ số có hiệu lực 3 phút. Sau khi người dùng điền thông tin và bấm "Hoàn tất đăng ký", hệ thống gửi OTP tới email. Chỉ khi nhập đúng OTP trong vòng 3 phút, tài khoản mới được tạo chính thức trong CSDL MySQL và cấp JWT Token tự động đăng nhập. Build frontend: 142 modules, 737ms.
  - Hoàn thành **CP-05.32**: Bổ sung trang lỗi 404 chuyên biệt cho Phân hệ Quản trị (`AdminNotFoundView.vue`). Hiển thị cảnh báo URL sai phong cách Admin, có nút về Admin Dashboard, nút quay lại và các liên kết điều hướng nhanh đến 7 phân hệ quản lý. Build frontend: 144 modules, 670ms.
- **2026-11-22:**
  - Hoàn thành **CP-05.33**: Cập nhật nhận diện thương hiệu cho Email Template OTP (`backend/src/utils/email.service.js`).
    - Thay thế emoji xe hơi `🚗` bằng logo chính thức của website (`frontend/public/logo.png` / `backend/src/assets/logo.png`).
    - Nhúng ảnh qua chuẩn MIME Content-ID (`cid:taplai24h_logo`), đảm bảo logo hiển thị tự nhiên, sắc nét và không bị chặn bởi các trình duyệt mail (Gmail, Outlook, Apple Mail).
    - Tinh chỉnh bố cục header email: Logo 56x56px bo tròn 12px viền trắng đặt ở vị trí trên cùng, căn giữa (`align="center"`), ngay bên dưới là tên thương hiệu "Tập Lái 24h" và phụ đề hệ thống.
  - Hoàn thành **CP-05.34**: Tích hợp thuộc tính `avatar` và tính năng Quản lý / Chỉnh sửa thông tin cá nhân (Profile Management).
    - CSDL: Thêm cột `avatar VARCHAR(255) NULL` vào bảng `users`. Nếu người dùng không chọn avatar khi đăng ký hoặc xóa avatar, hệ thống mặc định hiển thị chữ cái đại diện đầu tiên trên nền tròn màu (`[D]`, `[V]`) như cũ.
    - Backend:
      - `upload.middleware.js`: Cấu hình Multer `uploadAvatarImage` lưu trữ tại `backend/uploads/avatars/`.
      - `user.model.js`: Bổ sung xử lý `avatar` và phương thức `updateProfile(userId, { fullName, phone, avatar })`.
      - `auth.service.js` & `auth.controller.js`: Xử lý cập nhật thông tin cá nhân, đảm bảo chỉ cho phép đổi Họ tên, SĐT và Avatar, **tuyệt đối không cho phép đổi Email và Mật khẩu**. Đồng thời hỗ trợ đính kèm avatar tùy chọn ngay từ bước đăng ký gửi mã OTP.
      - `auth.routes.js`: Cung cấp endpoint bảo vệ `PUT /api/v1/auth/profile`.
    - Frontend:
      - Pinia `auth.js`: Thêm getter `userAvatar`, `userPhone` và action `updateProfile(formData)` cập nhật reactive store và localStorage.
      - `ProfileModal.vue`: Tạo modal chuyên dụng xem trước avatar, tải ảnh mới lên (JPG/PNG/WEBP/GIF ≤ 5MB) hoặc xóa avatar, chỉnh sửa họ tên và số điện thoại; email cố định (disabled) có biểu tượng ổ khóa bảo mật.
      - `AppNavbar.vue`: Thêm mục "Thông tin cá nhân" (icon `bi-person-gear`) vào dropdown người dùng, hiển thị ảnh đại diện thay cho chữ cái nếu có.
      - `AdminLayout.vue`: Thêm mục "Thông tin cá nhân" vào dropdown Admin topbar và hiển thị avatar cả trên thanh topbar lẫn sidebar footer.
      - `RegisterView.vue`: Bổ sung chọn avatar tùy chọn ở Bước 1 đăng ký. Nếu bỏ qua, tài khoản mặc định dùng avatar chữ cái.
      - `AdminUsersView.vue`: Hiển thị avatar người dùng trong bảng danh sách quản lý người dùng.
      - Build frontend thành công: 146 modules, 860ms.
- **2026-11-25:**
  - Hoàn thành **CP-05.35**: Cơ chế chống brute-force đăng nhập — Nhập sai mật khẩu 5 lần liên tiếp sẽ khóa tạm thời 30 giây (`loginAttemptStore.js`, mã `429` kèm `retryAfter`, đồng hồ đếm ngược & lưu `localStorage` tại `LoginView.vue`).
  - Hoàn thành **CP-05.36 (SEC-01.1)**: Gỡ bỏ endpoint đăng ký trực tiếp không qua OTP (`POST /api/v1/auth/register`) ở cả Backend (`auth.routes.js`, `auth.controller.js`, `auth.service.js`) và Frontend (`stores/auth.js`), bắt buộc đăng ký qua luồng xác thực OTP 2 bước. Cập nhật trạng thái tại `Cores/fix_bao_mat.md` và `Cores/Cau_truc.md`.
  - Hoàn thành **CP-05.37 (SEC-01.2)**: Tạo `rateLimit.middleware.js` (`express-rate-limit`) bảo vệ các API gửi/xác minh OTP, Chatbot AI và Nhận diện biển báo AI; nâng cấp `otpStore.js` giới hạn tối đa 5 lần nhập sai cho mỗi mã OTP (tự hủy OTP khi vượt quá). Cập nhật `Cores/fix_bao_mat.md`.
  - Hoàn thành **CP-05.38 (SEC-02.1)**: Tạo `backend/src/config/jwt.config.js` bắt buộc biến môi trường `JWT_SECRET` (fail-fast khi thiếu), loại bỏ chuỗi secret hardcode ở `auth.middleware.js` và `auth.service.js`. Cập nhật `Cores/fix_bao_mat.md`.
  - Hoàn thành **CP-05.39 (SEC-02.2)**: Thêm cột `token_version` vào bảng `users` để thu hồi toàn bộ JWT Token cũ khi đổi mật khẩu, khóa tài khoản hoặc đổi vai trò; tạo `frontend/src/utils/tokenStorage.js` hỗ trợ lưu phiên theo `sessionStorage` / `localStorage` (gắn với tùy chọn "Ghi nhớ đăng nhập"). Cập nhật `Cores/fix_bao_mat.md` và `Cores/Cau_truc.md`.
  - Hoàn thành **CP-05.40 (SEC-03.1)**: Tạo `backend/src/utils/fileCleanup.js` (`deleteAvatarFile` chống path traversal) tự động dọn ảnh avatar cũ/mồ côi khi đổi/xóa avatar, khi upload gặp lỗi hoặc khi OTP đăng ký hết hạn/bị hủy. Cập nhật `Cores/fix_bao_mat.md`.
  - Hoàn thành **CP-05.41 (SEC-03.2)**: Tạo file `.gitignore` tại thư mục gốc dự án để bảo vệ biến môi trường (`.env`), `node_modules/`, `frontend/dist/`, `backend/uploads/avatars/`, `backend/uploads/temp/` và cache hệ thống. Hoàn tất 100% các mục trong `Cores/fix_bao_mat.md`.
- **2026-11-25:**
  - Hoàn thành **CP-05.42 (SEC-01.3)**: Khắc phục nguy cơ upload tệp giả ảnh có thể thực thi trên cùng origin. Bỏ qua phần mở rộng do người dùng cung cấp, kiểm tra chữ ký nội dung JPEG/PNG/WEBP/GIF và xóa tệp không hợp lệ; thêm CSP sandbox cùng `X-Content-Type-Options: nosniff` cho `/uploads` để giảm rủi ro từ tệp cũ. Cập nhật trạng thái tại `Cores/fix_bao_mat.md`. Đã kiểm tra cú pháp backend, upload multipart và các header bảo mật.
