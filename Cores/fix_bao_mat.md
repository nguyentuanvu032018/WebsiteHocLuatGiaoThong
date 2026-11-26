# BÁO CÁO KIỂM TRA & KHẮC PHỤC LỖ HỔNG BẢO MẬT (SECURITY CHECKPOINTS)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Quy ước trạng thái:**  
> - `[ ]` : Chưa khắc phục (Pending)  
> - `[/]` : Đang xử lý (In Progress)  
> - `[x]` : Đã khắc phục / Đã bảo vệ (Done)  

> **Ngày rà soát/cập nhật:** 2026-11-25  
> **Phạm vi kiểm tra:** Toàn bộ mã nguồn Backend (`backend/src/`) và Frontend (`frontend/src/`), cấu hình xác thực, phân quyền, API, upload tệp tin và lưu trữ dữ liệu.

---

## 1. TỔNG QUAN BẢO MẬT (SECURITY AUDIT SUMMARY)

| Mốc | Nhóm mức độ | Số lượng mục | Trạng thái | Ghi chú |
| :---: | :--- | :---: | :---: | :--- |
| **SEC-01** | Lỗ hổng mức độ **Cao (High)** | 3 tasks | `[x]` Hoàn thành (3/3) | Đã xử lý SEC-01.1, SEC-01.2 & SEC-01.3 |
| **SEC-02** | Lỗ hổng mức độ **Trung bình (Medium)** | 2 tasks | `[x]` Hoàn thành (2/2) | Đã xử lý SEC-02.1 & SEC-02.2 |
| **SEC-03** | Điểm yếu mức độ **Thấp & Vận hành (Low)** | 2 tasks | `[x]` Hoàn thành (2/2) | Đã xử lý SEC-03.1 & SEC-03.2 |
| **SEC-04** | Các cơ chế **Đã bảo vệ tốt (Verified)** | 6 tasks | `[x]` Đạt yêu cầu | Đã kiểm chứng trực tiếp trong mã nguồn |

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

## 3. CÁC HẠNG MỤC ĐÃ ĐƯỢC BẢO VỆ TỐT (VERIFIED CONTROLS)

- [x] **SEC-04.1 (Chống Brute-force Đăng nhập):** Đã triển khai `loginAttemptStore.js` — nhập sai mật khẩu 5 lần liên tiếp sẽ khóa tạm thời 30 giây ở cả Backend (`429`) và Frontend (đồng hồ đếm ngược + `localStorage`).
- [x] **SEC-04.2 (Mã hóa Mật khẩu):** Mật khẩu người dùng được băm bằng `bcryptjs` (`salt = 10`) và đối chiếu phân biệt chính xác chữ hoa/chữ thường (`BINARY email` + `bcrypt.compare`).
- [x] **SEC-04.3 (Chống SQL Injection):** Toàn bộ truy vấn MySQL trong `backend/src/models/*.js` đều sử dụng prepared/parameterized statements (`?`).
- [x] **SEC-04.4 (Bảo mật Thi cử & Chống IDOR):** `ExamService.getExamSession` và `submitExamSession` kiểm tra chặt chẽ quyền sở hữu (`session.userId === req.user.id`), không trả về `is_correct` khi đang thi và chặn nộp bài trùng lặp.
- [x] **SEC-04.5 (Phân quyền RBAC):** Toàn bộ route `/api/v1/admin/*` và `/api/v1/users/*` đều yêu cầu `authMiddleware` kết hợp `rbacMiddleware(['admin'])`.
- [x] **SEC-04.6 (Chống XSS trên Chatbot AI):** `ChatbotView.vue` thực hiện escape ký tự HTML (`&`, `<`, `>`) trước khi chuyển đổi Markdown và render qua `v-html`.
