# BÁO CÁO KIỂM TRA & KHẮC PHỤC LỖ HỔNG BẢO MẬT (SECURITY CHECKPOINTS)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Quy ước trạng thái:**  
> - `[ ]` : Chưa khắc phục (Pending)  
> - `[/]` : Đang xử lý (In Progress)  
> - `[x]` : Đã khắc phục / Đã bảo vệ (Done)  

> **Ngày rà soát/cập nhật:** 2026-11-26  
> **Phạm vi kiểm tra:** Toàn bộ mã nguồn Backend (`backend/src/`), Frontend (`frontend/src/`), cấu hình môi trường/proxy, script AI Python (`predict.py`), cơ sở dữ liệu và gói phụ thuộc (`npm audit`).

---

## 1. TỔNG QUAN BẢO MẬT (SECURITY AUDIT SUMMARY)

| Mốc | Nhóm mức độ | Số lượng mục | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **SEC-01** | Lỗ hổng mức độ **Cao (High)** *(Đợt 1 - 2026-11-25)* | 3 tasks | `[x]` Hoàn thành (3/3) | Đã xử lý SEC-01.1, SEC-01.2 & SEC-01.3 |
| **SEC-02** | Lỗ hổng mức độ **Trung bình (Medium)** *(Đợt 1)* | 2 tasks | `[x]` Hoàn thành (2/2) | Đã xử lý SEC-02.1 & SEC-02.2 |
| **SEC-03** | Điểm yếu mức độ **Thấp & Vận hành (Low)** *(Đợt 1)* | 2 tasks | `[x]` Hoàn thành (2/2) | Đã xử lý SEC-03.1 & SEC-03.2 |
| **SEC-04** | Các cơ chế **Đã bảo vệ tốt (Verified)** | 6 tasks | `[x]` Đạt yêu cầu | Đã kiểm chứng trực tiếp trong mã nguồn |
| **SEC-05** | Lỗ hổng mức độ **Nghiêm trọng (Critical)** *(Đợt 2 - 2026-11-26)* | 2 tasks | `[ ]` Chưa khắc phục (0/2) | `JWT_SECRET` mẫu / lộ API Admin qua proxy & Stored XSS |
| **SEC-06** | Lỗ hổng mức độ **Cao (High)** *(Đợt 2 - 2026-11-26)* | 5 tasks | `[ ]` Chưa khắc phục (0/5) | Proxy Rate Limit & `/login`, mật khẩu mặc định, AI/Chatbot DoS, `npm audit` |
| **SEC-07** | Lỗ hổng mức độ **Trung bình (Medium)** *(Đợt 2 - 2026-11-26)* | 6 tasks | `[ ]` Chưa khắc phục (0/6) | Exam time/race, Email HTML injection, JWT logout, User Enum, OTP CSPRNG, Validation |
| **SEC-08** | Điểm yếu mức độ **Thấp & Vận hành (Low)** *(Đợt 2 - 2026-11-26)* | 2 tasks | `[ ]` Chưa khắc phục (0/2) | Dọn ảnh câu hỏi/biển báo, Magic bytes 12B, Vite build, `LIKE` wildcard |

---

## 2. CHI TIẾT CÁC MỤC CẦN KHẮC PHỤC (SECURITY CHECKPOINTS)

### MỐC SEC-01: LỖ HỔNG MỨC ĐỘ CAO (HIGH SEVERITY)

- [x] **SEC-01.1:** Khóa / Gỡ bỏ endpoint đăng ký trực tiếp không qua OTP (`POST /api/v1/auth/register`) — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/routes/auth.routes.js`, `backend/src/controllers/auth.controller.js`, `backend/src/services/auth.service.js`, `frontend/src/stores/auth.js`.
  - **Đã xử lý:** Đã gỡ bỏ hoàn toàn route `POST /api/v1/auth/register`, handler `AuthController.register`, hàm `AuthService.registerUser` và action `authStore.register`. Mọi đăng ký tài khoản mới bắt buộc đi qua luồng xác thực OTP 2 bước (`/send-register-otp` → `/verify-register-otp`).

- [x] **SEC-01.2:** Kích hoạt Rate Limiting (`express-rate-limit`) & Giới hạn số lần nhập sai mã OTP — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/middlewares/rateLimit.middleware.js`, `backend/src/utils/otpStore.js`, `backend/src/routes/auth.routes.js`, `backend/src/routes/chatbot.routes.js`, `backend/src/routes/lookup.routes.js`.
  - **Đã xử lý:**
    - Tạo `rateLimit.middleware.js` dùng `express-rate-limit` chuẩn hóa phản hồi HTTP `429`: `otpSendLimiter` (5 req/5 phút), `otpVerifyLimiter` (15 req/5 phút), `chatbotLimiter` (20 req/phút), `aiRecognitionLimiter` (15 req/phút).
    - Nâng cấp `otpStore.js`: Giới hạn tối đa **5 lần nhập sai** cho mỗi mã OTP (`MAX_OTP_ATTEMPTS = 5`); nhập sai quá 5 lần tự động hủy mã OTP hiện tại và yêu cầu gửi lại mã mới.

- [x] **SEC-01.3:** Chặn thực thi nội dung độc hại qua tệp upload giả ảnh — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/middlewares/upload.middleware.js`, `backend/src/app.js`.
  - **Đã xử lý:** Không dùng phần mở rộng từ tên tệp người dùng; phần mở rộng được tạo theo MIME cho phép và nội dung được đối chiếu chữ ký JPEG/PNG/WEBP/GIF. Tệp sai định dạng bị xóa và trả lỗi `400`. Khu vực `/uploads` đặt `Content-Security-Policy: sandbox; default-src 'none'` và `X-Content-Type-Options: nosniff`, giảm nguy cơ thực thi cả với tệp cũ đã được tải lên trước khi vá.

---

### MỐC SEC-02: LỖ HỔNG MỨC ĐỘ TRUNG BÌNH (MEDIUM SEVERITY)

- [x] **SEC-02.1:** Loại bỏ chuỗi fallback `JWT_SECRET` hardcode trong mã nguồn — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/config/jwt.config.js`, `backend/src/middlewares/auth.middleware.js`, `backend/src/services/auth.service.js`.
  - **Đã xử lý:** Tạo `jwt.config.js` tập trung đọc `process.env.JWT_SECRET` và kiểm tra bắt buộc khi khởi động (fail-fast: ném lỗi dừng ngay nếu thiếu `JWT_SECRET` trong `.env`), loại bỏ hoàn toàn chuỗi secret fallback hardcode ở cả `auth.middleware.js` và `auth.service.js`.

- [x] **SEC-02.2:** Thu hồi JWT Token cũ sau khi đổi mật khẩu & Cải thiện lưu trữ Token phía Client — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/models/user.model.js`, `backend/src/services/auth.service.js`, `backend/src/middlewares/auth.middleware.js`, `frontend/src/utils/tokenStorage.js`, `frontend/src/stores/auth.js`, `frontend/src/services/api.js`, `frontend/src/views/auth/LoginView.vue`.
  - **Đã xử lý:**
    - CSDL & Backend: Thêm cột `token_version` (`INT NOT NULL DEFAULT 1`) vào bảng `users`; nhúng `tokenVersion` vào payload JWT; tự động tăng `token_version` khi đặt lại mật khẩu (`updatePassword`), khóa/mở tài khoản (`setActive`) hoặc đổi vai trò (`setRole`); `authMiddleware` đối chiếu `decoded.tokenVersion === user.tokenVersion` và từ chối (`401`) mọi token cũ.
    - Frontend: Tạo `tokenStorage.js` hỗ trợ tách biệt `sessionStorage` (mặc định theo phiên tab, đặc biệt cho Admin Portal) và `localStorage` (chỉ khi người dùng chọn "Ghi nhớ đăng nhập"), tự động xóa sạch cả 2 kho lưu trữ khi đăng xuất hoặc nhận lỗi `401`.

---

### MỐC SEC-03: ĐIỂM YẾU MỨC ĐỘ THẤP & VẬN HÀNH (LOW / OPERATIONAL)

- [x] **SEC-03.1:** Dọn dẹp file ảnh Avatar cũ / mồ côi trên ổ đĩa — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `backend/src/utils/fileCleanup.js`, `backend/src/utils/otpStore.js`, `backend/src/services/auth.service.js`, `backend/src/controllers/auth.controller.js`.
  - **Đã xử lý:**
    - Tạo `fileCleanup.js` với hàm `deleteAvatarFile` (chống path traversal, chỉ cho phép xóa trong `uploads/avatars/`).
    - Tự động xóa avatar cũ khi người dùng đổi ảnh hoặc bấm "Xóa ảnh" trong `updateProfile`.
    - Tự động xóa file avatar vừa tải lên nếu `sendRegisterOtp` hoặc `updateProfile` bị lỗi; tự động dọn avatar tạm trong `otpStore.js` khi OTP đăng ký hết hạn, sai quá 5 lần hoặc bị ghi đè. Giữ nguyên file khi `verifyRegisterOtp` tạo tài khoản thành công.

- [x] **SEC-03.2:** Tạo file `.gitignore` ở thư mục gốc dự án — *(Hoàn thành 2026-11-25)*
  - **Vị trí:** `.gitignore` (thư mục gốc `d:\Download\CT466_NLN\.gitignore`).
  - **Đã xử lý:** Tạo `.gitignore` loại trừ toàn bộ file biến môi trường (`.env`, `.env.*`), `node_modules/`, `frontend/dist/`, file tạm/avatar tải lên (`backend/uploads/avatars/`, `backend/uploads/temp/`), Python cache (`__pycache__/`), file log và file hệ điều hành/IDE.

---

### MỐC SEC-05: LỖ HỔNG MỨC ĐỘ NGHIÊM TRỌNG (CRITICAL SEVERITY — RÀ SOÁT 2026-11-26)

- [ ] **SEC-05.1:** Thay thế `JWT_SECRET` trùng chuỗi mẫu công khai & cô lập API quản trị khỏi Vite Proxy / Ngrok
  - **Vị trí:** `backend/.env`, `Cores/next_step_guide.md`, `frontend/vite.config.js`, `run.bat`, `huong_dan_van_hanh.md`.
  - **Vấn đề:**
    - `JWT_SECRET` trong `backend/.env` đang trùng khớp hoàn toàn với chuỗi ví dụ mẫu ghi công khai trong `Cores/next_step_guide.md`, cho phép người biết tài liệu tự ký JWT hợp lệ cho mọi vai trò (`admin` / `student`).
    - Dù chỉ chia sẻ cổng học viên (`5173`) qua Ngrok, `frontend/vite.config.js` proxy toàn bộ `/api` tới `http://localhost:5000`, khiến các endpoint quản trị (`/api/v1/admin/*`, `/api/v1/users/*`, `/api/v1/questions/admin*`) vẫn bị mở công khai ra Internet.
  - **Hướng khắc phục:** Sinh `JWT_SECRET` ngẫu nhiên tối thiểu 64 ký tự hex (`crypto.randomBytes(64).toString('hex')`); khi chia sẻ demo qua Ngrok cần chặn các đường dẫn `/api/v1/admin` và `/api/v1/users` ở lớp proxy công khai hoặc tách cổng/reverse proxy riêng.

- [ ] **SEC-05.2:** Khắc phục Stored XSS tại Cổng Quản trị & các hộp thoại cảnh báo qua `Swal.fire({ html })`
  - **Vị trí:** `frontend/src/views/admin/AdminUsersView.vue`, `frontend/src/views/admin/AdminQuestionsView.vue`, `frontend/src/views/admin/AdminSignsView.vue`, `frontend/src/views/admin/AdminChaptersView.vue`, `frontend/src/views/admin/AdminExamRoomsView.vue`, `frontend/src/views/admin/AdminFinesView.vue`, `frontend/src/views/study/ParalysisView.vue`, `backend/src/services/auth.service.js`.
  - **Vấn đề:** Học viên tự đăng ký hoặc cập nhật `fullName` mà không bị lọc/chặn ký tự HTML ở Backend. Khi Admin thao tác Khóa/Mở khóa/Xóa trong `AdminUsersView.vue`, `${u.fullName}` và `${u.email}` được nội suy trực tiếp vào thuộc tính `html:` của `Swal.fire(...)`, cho phép thực thi JavaScript ngay trên trình duyệt Admin (nguy cơ đánh cắp JWT hoặc tự nâng quyền lên `admin`). Các trang Admin khác và `ParalysisView.vue` cũng nội suy raw HTML tương tự (`q.content`, `err.message`, `sign.name`, `chapter.title`, `fine.violationTitle`, `answerText`).
  - **Hướng khắc phục:** Tạo hàm `escapeHtml` dùng chung ở Frontend để escape `& < > " '` trước khi đưa biến vào `Swal.fire({ html })` (hoặc dùng `text:` / DOM `textContent`); bổ sung kiểm tra ký tự/độ dài `fullName` ở Backend.

---

### MỐC SEC-06: LỖ HỔNG MỨC ĐỘ CAO (HIGH SEVERITY — RÀ SOÁT 2026-11-26)

- [ ] **SEC-06.1:** Khắc phục Rate Limiting sai lệch sau Vite Proxy / Ngrok (`trust proxy`) & bổ sung IP Rate Limiter cho `/auth/login`
  - **Vị trí:** `backend/src/app.js`, `backend/src/middlewares/rateLimit.middleware.js`, `backend/src/routes/auth.routes.js`, `backend/src/utils/loginAttemptStore.js`, `frontend/vite.config.js`.
  - **Vấn đề:**
    - Express chưa bật `trust proxy` và Vite proxy chưa bật `xfwd: true`. Mọi request đi qua Ngrok -> Vite proxy -> Express đều mang IP `127.0.0.1`, khiến toàn bộ người dùng dùng chung 1 hạn mức IP trong `express-rate-limit` (dễ gây Shared-IP DoS cho mọi người dùng khác).
    - `POST /api/v1/auth/login` không có rate limiter theo IP (chỉ khóa theo từng email 30 giây trong `loginAttemptStore`), cho phép password spraying trên nhiều email hoặc làm phình `attemptsMap` trong RAM.
  - **Hướng khắc phục:** Cấu hình `xfwd: true` ở proxy và `app.set('trust proxy', 1)` (hoặc `'loopback'`), thêm `loginLimiter` theo IP cho `/auth/login`, và giới hạn kích thước tối đa cho `attemptsMap` / `otpStore`.

- [ ] **SEC-06.2:** Đổi mật khẩu mặc định yếu (`admin123`), tắt `NODE_ENV=development` khi public & xóa thông tin tài khoản mẫu
  - **Vị trí:** `backend/database/schema.sql`, `frontend/src/views/auth/LoginView.vue`, `backend/.env`, `backend/src/app.js`, `backend/database/seeds/check_encoding.js`, `backend/database/seeds/update_license_codes.js`.
  - **Vấn đề:**
    - Tài khoản seed `admin@gmail.com` / `hocvien@gmail.com` có mật khẩu `admin123` công khai trong `schema.sql` và vẫn còn hàm `fillDemoAccount` trong mã nguồn `LoginView.vue`.
    - `backend/.env` đang đặt `NODE_ENV=development` khiến Global Error Handler trả về toàn bộ `err.stack` ra API khi có lỗi `500`; mật khẩu DB yếu và bị hardcode trong 2 file seed (`check_encoding.js`, `update_license_codes.js`); `backend/.env` đang chứa `SMTP_PASS` và `GROQ_API_KEY` thật trên đĩa.
  - **Hướng khắc phục:** Đổi mật khẩu mạnh cho Admin và MySQL; gỡ bỏ `fillDemoAccount` khỏi `LoginView.vue`; đặt `NODE_ENV=production` khi chạy công khai; sửa các script seed dùng `db.config.js` thay vì hardcode mật khẩu; xoay vòng (rotate) `SMTP_PASS` và `GROQ_API_KEY` nếu dự án từng được chia sẻ.

- [ ] **SEC-06.3:** Chống DoS tài nguyên, kiểm tra ảnh Base64, tách `temp/` khỏi `/uploads` & bật `weights_only=True` cho AI Nhận diện biển báo
  - **Vị trí:** `backend/src/routes/lookup.routes.js`, `backend/src/services/aiSign.service.js`, `backend/src/controllers/aiSign.controller.js`, `backend/src/ai-models/predict.py`, `backend/src/app.js`.
  - **Vấn đề:**
    - Hai endpoint AI (`/signs/recognize-file`, `/signs/recognize-camera`) không yêu cầu đăng nhập; mỗi request đều `spawn()` một tiến trình Python mới nạp toàn bộ ResNet-50 mà không có timeout hay giới hạn tiến trình chạy song song (nguy cơ cạn CPU/RAM).
    - `recognizeFromCamera` không kiểm tra định dạng Data URI / magic bytes trước khi ghi dữ liệu từ body JSON (đang mở `limit: '10mb'` toàn cục trong `app.js`) xuống `uploads/temp/cam_*.jpg` — thư mục đang bị `express.static('/uploads')` phục vụ công khai.
    - `predict.py` gọi `torch.load(MODEL_PATH, map_location=device)` không có `weights_only=True`.
    - `aiSign.controller.js` trả trực tiếp `stderrData` từ Python về client qua HTTP `500`, làm lộ đường dẫn máy chủ.
  - **Hướng khắc phục:** Xác thực MIME và magic bytes ảnh cho `recognizeFromCamera`; dời thư mục `temp` ra ngoài `/uploads`; thêm timeout và hàng đợi giới hạn concurrency (hoặc chạy Python inference worker giữ model sẵn); thêm `weights_only=True` vào `torch.load` và giới hạn `Image.MAX_IMAGE_PIXELS`; chỉ áp dụng `10mb` JSON limit riêng cho route camera; ẩn `stderr` khi trả lỗi `500`.

- [ ] **SEC-06.4:** Siết chặt bảo mật Chatbot AI (xác thực/sở hữu phiên, giới hạn `/clear`, chống tràn RAM & timeout API)
  - **Vị trí:** `backend/src/routes/chatbot.routes.js`, `backend/src/controllers/chatbot.controller.js`, `backend/src/services/chatbot.service.js`, `frontend/src/views/lookup/ChatbotView.vue`.
  - **Vấn đề:**
    - `/chatbot/send` và `/chatbot/clear` công khai (không cần đăng nhập), `/clear` không có rate limiter, dễ bị lạm dụng prompt injection để tiêu hao hạn mức `GROQ_API_KEY`.
    - `sessionId` do client tự tạo (`Date.now() + Math.random()`), không gắn định danh người dùng nên người khác có thể chèn ngữ cảnh hoặc xóa phiên hội thoại của nạn nhân.
    - `this.sessions` không giới hạn số lượng session tối đa, `session.history` chỉ `push` mà không cắt bớt mảng (chỉ `slice(-20)` lúc đọc), và `fetch` tới Groq API không có `AbortSignal.timeout`.
  - **Hướng khắc phục:** Gắn `authMiddleware` hoặc cấp `sessionId` bằng `crypto.randomUUID()` từ Backend gắn theo người dùng/phiên; thêm rate limiter cho `/clear`; giới hạn tổng số session, cắt `session.history` tối đa 20 lượt gần nhất và đặt `AbortSignal.timeout` cho `fetch`.

- [ ] **SEC-06.5:** Cập nhật các gói thư viện phụ thuộc có lỗ hổng bảo mật (`npm audit`)
  - **Vị trí:** `backend/package.json`, `frontend/package.json`.
  - **Vấn đề:** Kết quả `npm audit` ghi nhận:
    - Backend: `multer` (`2.0.0 - 2.4.0`, **High**, `GHSA-q7qp-rjg7-q26m`), `body-parser` (`2.0.0 - 2.3.0`, **High**, `GHSA-27r3-jxmh-p828`), `minimatch` (`7.0.0 - 11.0.0` dưới `nodemon`, **Moderate**, `GHSA-g3hv-75wg-m249`).
    - Frontend: `follow-redirects` (`1.16.0 - 1.16.1` dưới `axios`, **High**, `GHSA-mrwp-f3q8-3g9p`).
  - **Hướng khắc phục:** Chạy `npm audit fix` ở `backend` và `frontend`, sau đó kiểm thử lại toàn bộ API upload và gọi HTTP.

---

### MỐC SEC-07: LỖ HỔNG MỨC ĐỘ TRUNG BÌNH (MEDIUM SEVERITY — RÀ SOÁT 2026-11-26)

- [ ] **SEC-07.1:** Kiểm soát thời gian thi phía Server, khóa Transaction chống Race Condition khi nộp bài & kiểm tra `selectedAnswerId`
  - **Vị trí:** `backend/src/services/exam.service.js`, `backend/src/models/examSession.model.js`.
  - **Vấn đề:** `submitExamSession` không kiểm tra thời gian thực tế (`NOW() - startedAt`) so với `durationMinutes` và tin tưởng `timeSpentSeconds` từ client; kiểm tra `if (session.submittedAt)` nằm ngoài transaction không dùng `FOR UPDATE` nên 2 request nộp bài song song có thể ghi đè kết quả; không kiểm tra `Array.isArray(answers)` và không đối chiếu `selectedAnswerId` thuộc đúng câu hỏi (dễ gây lỗi khóa ngoại `500` hoặc lưu sai đáp án). *(Lưu ý nghiệp vụ: API ôn tập `GET /api/v1/questions/:id?showAnswer=true` đang công khai nên thí sinh có thể tự tra đáp án nếu gọi API này khi đang thi).*
  - **Hướng khắc phục:** Dùng `SELECT ... FOR UPDATE` trong transaction và `WHERE id = ? AND submitted_at IS NULL`; tính/ràng buộc thời gian từ `started_at` trên server; validate mảng `answers` và xác thực `selectedAnswerId` thuộc danh sách đáp án của câu hỏi tương ứng.

- [ ] **SEC-07.2:** Chống HTML Injection / Phishing trong Email OTP qua trường `fullName`
  - **Vị trí:** `backend/src/utils/email.service.js`, `backend/src/services/auth.service.js`.
  - **Vấn đề:** `sendOtpEmail` và `sendRegisterOtpEmail` nội suy thẳng `${fullName}` vào HTML email không escape, cho phép kẻ xấu lợi dụng endpoint công khai `/auth/send-register-otp` gửi email chứa liên kết/nội dung HTML giả mạo từ địa chỉ SMTP chính thức của hệ thống.
  - **Hướng khắc phục:** Escape HTML cho `fullName` trước khi đưa vào template email.

- [ ] **SEC-07.3:** Bổ sung `/auth/logout` thu hồi JWT (`token_version`), rút ngắn `JWT_EXPIRES_IN` & tăng cường xác thực Token
  - **Vị trí:** `backend/src/routes/auth.routes.js`, `backend/src/config/jwt.config.js`, `backend/src/middlewares/auth.middleware.js`, `frontend/src/utils/tokenStorage.js`, `frontend/src/views/auth/LoginView.vue`, `frontend/src/stores/auth.js`.
  - **Vấn đề:** Chưa có endpoint `/auth/logout` tăng `token_version` phía server nên JWT cũ vẫn dùng được tối đa `7d` sau khi đăng xuất; học viên mặc định bật `rememberMe = true` (lưu `localStorage`); `jwt.verify` chưa chỉ định tường minh `algorithms: ['HS256']`.
  - **Hướng khắc phục:** Tạo `POST /api/v1/auth/logout` tăng `token_version`; rút ngắn `JWT_EXPIRES_IN` (hoặc chuyển sang cookie `HttpOnly; Secure; SameSite=Lax`); truyền `{ algorithms: ['HS256'] }` vào `jwt.verify`.

- [ ] **SEC-07.4:** Khắc phục User Enumeration ở luồng Đăng nhập & Quên mật khẩu
  - **Vị trí:** `backend/src/services/auth.service.js`.
  - **Vấn đề:** `loginUser` trả lỗi `403` ("Tài khoản bị khóa") trước khi kiểm tra `bcrypt.compare`; `sendPasswordResetOtp` trả về các mã lỗi khác nhau (`404`/`403`/`200`) giúp dò quét danh sách email tồn tại.
  - **Hướng khắc phục:** Trong `loginUser`, luôn so khớp mật khẩu trước khi kiểm tra trạng thái khóa; cân nhắc trả phản hồi đồng nhất (`200`) ở `forgot-password`.

- [ ] **SEC-07.5:** Sinh mã OTP bằng CSPRNG (`crypto.randomInt`) & chuẩn hóa key trong `otpStore.js`
  - **Vị trí:** `backend/src/utils/otpStore.js`.
  - **Vấn đề:** `generateOtpCode()` dùng `Math.random()` (không an toàn mật mã); `createOtp` và `deleteOtp` dùng `email.toLowerCase()` thiếu `.trim()` như `verifyEntry`.
  - **Hướng khắc phục:** Thay bằng `crypto.randomInt(100000, 1000000)` và dùng chung hàm chuẩn hóa `String(email || '').trim().toLowerCase()`.

- [ ] **SEC-07.6:** Chuẩn hóa validation đầu vào & xử lý `MulterError` trả `400`/`413`
  - **Vị trí:** `backend/src/services/admin.service.js`, `backend/src/services/question.service.js`, `backend/src/services/auth.service.js`, `backend/src/middlewares/upload.middleware.js`, `backend/src/app.js`.
  - **Vấn đề:** `AdminService.getFines` không giới hạn `page`/`limit` (dễ lỗi SQL `500` hoặc truy vấn lớn); `sendRegisterOtp` không kiểm tra định dạng/độ dài `phone`, `fullName` và giới hạn mật khẩu; `MulterError` (vượt 5MB) không có `statusCode` nên trả `500`; `body.imageUrl` chưa kiểm tra scheme URL hợp lệ (`/uploads/...` hoặc `https://`).
  - **Hướng khắc phục:** Bắt `multer.MulterError` trả `400`/`413`; validate phân trang, ID nguyên dương, độ dài/định dạng `fullName`/`phone`/`password` và scheme `imageUrl`.

---

### MỐC SEC-08: ĐIỂM YẾU MỨC ĐỘ THẤP & VẬN HÀNH (LOW / OPERATIONAL — RÀ SOÁT 2026-11-26)

- [ ] **SEC-08.1:** Dọn dẹp tệp ảnh Câu hỏi/Biển báo mồ côi & đọc đúng 12 byte đầu khi kiểm tra Magic Bytes
  - **Vị trí:** `backend/src/controllers/question.controller.js`, `backend/src/controllers/admin.controller.js`, `backend/src/services/admin.service.js`, `backend/src/middlewares/upload.middleware.js`, `backend/src/routes/auth.routes.js`.
  - **Vấn đề:** Tương tự avatar trước đây, tạo/sửa câu hỏi hoặc biển báo thất bại chưa xóa tệp vừa upload, và sửa/xóa chưa dọn ảnh cũ trên đĩa; `upload.middleware.js` dùng `fs.readFile` nạp cả tệp 5MB vào RAM thay vì chỉ đọc 12 byte đầu; `send-register-otp` chạy Multer trước khi validate email/mật khẩu.
  - **Hướng khắc phục:** Bổ sung `deleteUploadedFile` an toàn cho `questions/` và `signs/`; chỉ đọc 12 byte đầu bằng `fs.open` + `fs.read`.

- [ ] **SEC-08.2:** Tối ưu vận hành khi chia sẻ Internet & vá các lỗi nhỏ
  - **Vị trí:** `run.bat`, `frontend/vite.config.js`, `backend/src/models/*.js`, `frontend/src/router/index.js`, `frontend/src/views/auth/ForgotPasswordView.vue`.
  - **Vấn đề:**
    - Chạy Vite dev server công khai qua Ngrok làm lộ mã nguồn `/src/...` chưa build.
    - Các câu truy vấn `LIKE ?` ở `user.model.js`, `question.model.js`, `trafficSign.model.js`, `trafficFine.model.js` chưa escape ký tự `%` và `_`.
    - Route `/exam/result/:id` thiếu `meta.requiresAuth: true`, và `ForgotPasswordView.vue` (dòng 173) đọc `err.response?.data?.message` dù `api.js` interceptor đã chuyển lỗi sang `err.message`.
  - **Hướng khắc phục:** Dùng `vite build` + reverse proxy khi triển khai thật; escape `%`, `_` trong `LIKE`; thêm `requiresAuth: true` cho `/exam/result/:id` và sửa đọc `err.message` tại `ForgotPasswordView.vue`.

---

## 3. CÁC HẠNG MỤC ĐÃ ĐƯỢC BẢO VỆ TỐT (VERIFIED CONTROLS)

- [x] **SEC-04.1 (Chống Brute-force Đăng nhập):** Đã triển khai `loginAttemptStore.js` — nhập sai mật khẩu 5 lần liên tiếp sẽ khóa tạm thời 30 giây ở cả Backend (`429`) và Frontend (đồng hồ đếm ngược + `localStorage`).
- [x] **SEC-04.2 (Mã hóa Mật khẩu):** Mật khẩu người dùng được băm bằng `bcryptjs` (`salt = 10`) và đối chiếu phân biệt chính xác chữ hoa/chữ thường (`BINARY email` + `bcrypt.compare`).
- [x] **SEC-04.3 (Chống SQL Injection):** Toàn bộ truy vấn MySQL trong `backend/src/models/*.js` đều sử dụng prepared/parameterized statements (`?`).
- [x] **SEC-04.4 (Bảo mật Thi cử & Chống IDOR):** `ExamService.getExamSession` và `submitExamSession` kiểm tra chặt chẽ quyền sở hữu (`session.userId === req.user.id`), không trả về `is_correct` khi đang thi và chặn nộp bài trùng lặp.
- [x] **SEC-04.5 (Phân quyền RBAC):** Toàn bộ route `/api/v1/admin/*` và `/api/v1/users/*` đều yêu cầu `authMiddleware` kết hợp `rbacMiddleware(['admin'])`.
- [x] **SEC-04.6 (Chống XSS trên Chatbot AI):** `ChatbotView.vue` thực hiện escape ký tự HTML (`&`, `<`, `>`) trước khi chuyển đổi Markdown và render qua `v-html`.
