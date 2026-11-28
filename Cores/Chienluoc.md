# CHIẾN LƯỢC PHÁT TRIỂN & QUY CHUẨN KỸ THUẬT (DEVELOPMENT STRATEGY)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> **Cập nhật cấu trúc giao diện (2026-11-26):** Frontend phục vụ hai cổng riêng: học viên ở `localhost:5173` và quản trị ở `localhost:5174`. Cổng quản trị mặc định đến trang đăng nhập, không có đăng ký; khi dùng ngrok chỉ chia sẻ cổng học viên.

---

## 1. CHIẾN LƯỢC KIẾN TRÚC PHẦN MỀM (ARCHITECTURAL STRATEGY)

### 1.1. Nguyên tắc kiến trúc tách rời (Decoupled Principles)
1. **Stateless Backend:** Backend Express không duy trì HTTP session. Toàn bộ thông tin định danh và phân quyền học viên được truyền qua JWT Header (`Authorization: Bearer <token>`).
2. **API Versioning:** Mọi endpoint đều có tiền tố `/api/v1/` để đảm bảo khả năng tương thích ngược và dễ dàng nâng cấp các phiên bản sau này.
3. **Data Representation Uniformity:** Mọi phản hồi JSON từ Backend tuân theo một khuôn mẫu duy nhất:
   ```json
   {
     "success": true, // hoặc false
     "data": {},      // Dữ liệu trả về (Object hoặc Array)
     "message": "",   // Thông báo thân thiện cho người dùng
     "meta": {}       // Thông tin phân trang, tổng số bản ghi hoặc timestamp
   }
   ```

### 1.2. Chiến lược phân tầng Backend theo chuẩn OOP (Model - Service - Controller Classes)
Hệ thống Backend được tổ chức chặt chẽ theo mô hình **Lập trình Hướng đối tượng (OOP)** giúp đồng bộ hoàn hảo với **Sơ đồ lớp (UML Class Diagram)** trong báo cáo Niên luận:
- **Models Layer (`/models`):** Chứa các lớp thực thể (Entity Classes như `class UserModel`, `class QuestionModel`). Mỗi class định nghĩa các thuộc tính đối tượng và các phương thức tĩnh (static methods) để truy vấn CSDL.
- **Services Layer (`/services`):** Chứa các lớp dịch vụ nghiệp vụ (như `class AuthService`, `class ExamService`), chịu trách nhiệm xử lý logic nghiệp vụ, tính toán, băm mật khẩu, cấp token, chấm điểm.
- **Controllers Layer (`/controllers`):** Chứa các lớp điều khiển (như `class AuthController`, `class ExamController`), tiếp nhận HTTP request, gọi Service và trả về JSON chuẩn. Sử dụng Arrow Methods để tự động ràng buộc ngữ cảnh `this`.
- **Routes Layer (`/routes`):** Định nghĩa URI RESTful và ánh xạ tới phương thức của Controller.
- **Data Access Layer (`/config/db`):** Quản lý kết nối MySQL Connection Pool an toàn thông qua Parameterized Queries.

### 1.3. Quản lý trạng thái Frontend
- **Pinia `authStore`:** Quản lý thông tin người dùng, vai trò và trạng thái xác thực.
- **StudyView:** Quản lý lựa chọn chương, bộ lọc/tìm kiếm, chế độ luyện tập và phản hồi đáp án tại view.
- **ExamRoomView:** Quản lý phiên thi hiện tại, câu đang xem, đáp án đã chọn và đồng hồ trong view; dữ liệu phiên thi được lưu ở Backend.
- Không có `examStore` hoặc `studyStore` riêng trong mã nguồn hiện tại; cần cập nhật tài liệu này nếu sau này các store đó được tạo.

---

## 2. CHIẾN LƯỢC BẢO MẬT & CHỐNG GIAN LẬN PHÒNG THI (ANTI-CHEAT STRATEGY)

Trong một hệ thống thi trắc nghiệm, việc bảo vệ tính toàn vẹn của bài thi là yếu tố sống còn:
1. **Ẩn hoàn toàn đáp án đúng tại Client:**
   - Khi gọi API `/api/v1/exams/generate`, danh sách câu hỏi và danh sách câu trả lời trả về **không chứa cột `is_correct`**.
   - Thí sinh dù có mở DevTools (F12 / Inspect) trên trình duyệt cũng không thể xem được đáp án đúng trước khi nộp bài.
2. **Tính toán điểm số tập trung tại Server:**
   - Phép chấm điểm, so khớp đáp án và phán quyết điểm liệt chỉ được thực hiện trong hàm `evaluateExamSubmission` tại Backend sau khi bài thi được nộp.
3. **Quản lý thời gian thi nghiêm ngặt:**
   - Server ghi nhận thời điểm bắt đầu thi (`started_at`).
   - Khi nộp bài (`submitted_at`), Server kiểm tra nếu thời gian làm bài vượt quá thời gian quy định + 60 giây dự phòng (độ trễ mạng), hệ thống vẫn tự động chốt bài và tính điểm tại thời điểm nộp.

---

## 3. QUY CHUẨN LẬP TRÌNH (CODING CONVENTIONS)

### 3.1. Quy chuẩn Backend (Node.js / Express)
- **Tên file:** Dùng định dạng `camelCase` hoặc `kebab-case` kèm hậu tố chức năng:
  - `auth.controller.js`, `exam.service.js`, `jwt.config.js`, `auth.middleware.js`.
- **Biến và hàm:** Đặt tên bằng tiếng Anh, theo chuẩn `camelCase` (VD: `generateExamSession`, `evaluateSubmission`, `currentUser`).
- **Hằng số (Constants):** Đặt tên bằng chữ hoa kèm gạch dưới `UPPER_SNAKE_CASE` (VD: `JWT_EXPIRES_IN`, `MAX_ATTEMPTS`).
- **Xử lý lỗi (Error Handling):** Sử dụng `try...catch` ở toàn bộ các hàm async trong Controllers và đẩy lỗi qua `next(error)` tới Global Error Handler.

### 3.2. Quy chuẩn Frontend (Vue.js 3 / Bootstrap 5)
- **Component Style:** Sử dụng 100% Vue 3 Composition API với cú pháp `<script setup>`.
- **Tên Component:** Sử dụng chuẩn `PascalCase` gồm ít nhất 2 từ để tránh trùng với thẻ HTML chuẩn (VD: `QuestionCard.vue`, `CountdownTimer.vue`, `QuestionPalette.vue`).
- **Styling:**
  - **Ưu tiên hàng đầu:** Tận dụng tối đa các lớp tiện ích chuẩn có sẵn của **Bootstrap 5** (`d-flex`, `justify-content-between`, `align-items-center`, `card`, `badge`, `btn`, `table-responsive`, `rounded-*`, `shadow-*`, `text-*`, `bg-*`).
  - **Tập trung CSS 1 file duy nhất:** Nếu có CSS tùy biến hoặc hiệu ứng đặc thù, **bắt buộc tập trung 100% vào file `src/style.css`**, tuyệt đối không viết thẻ `<style scoped>` rải rác trong từng component/view Vue.
- **Async API Calls:** Gom các hàm gọi API vào thư mục `src/services/` (VD: `exam.service.js`, `question.service.js`), không gọi Axios phân tán trong từng template.

---

## 4. QUY TRÌNH QUẢN LÝ MÃ NGUỒN (GIT WORKFLOW)

- Nhánh chính:
  - `main`: Nhánh ổn định, chứa mã nguồn hoàn thiện có thể demo nghiệm thu.
  - `develop`: Nhánh tích hợp chính cho các tính năng mới.
- Nhánh tính năng:
  - `feature/auth-jwt`: Phát triển module xác thực và phân quyền.
  - `feature/database-seed`: Tạo script CSDL và seed 600 câu hỏi.
  - `feature/exam-engine`: Thuật toán sinh đề và chấm điểm.
  - `feature/frontend-exam-room`: Giao diện phòng thi sát hạch thời gian thực.
  - `feature/admin-dashboard`: Giao diện quản trị ngân hàng câu hỏi.
- Quy tắc commit:
  - `feat: ...` : Thêm tính năng mới
  - `fix: ...`  : Sửa lỗi
  - `docs: ...` : Cập nhật tài liệu
  - `refactor: ...`: Tối ưu mã nguồn nhưng không đổi logic nghiệp vụ

---

## 5. QUẢN LÝ RỦI RÔ VÀ PHƯƠNG ÁN DỰ PHÒNG (RISK MANAGEMENT)

| Rủi ro tiềm ẩn | Mức độ | Phương án phòng ngừa & giải quyết |
| :--- | :---: | :--- |
| **Thiếu dữ liệu 600 câu hỏi & ảnh sa hình chuẩn** | Cao | Chuẩn bị sẵn file dữ liệu SQL seed trọn bộ 600 câu kèm link ảnh hoặc lưu trữ cục bộ trong thư mục `uploads/` |
| **Trình duyệt học viên bị tải lại (F5) khi đang thi** | Trung bình | Lưu trạng thái bài thi tạm thời vào `localStorage` trên máy học viên để có thể phục hồi ngay lập tức nếu vô tình F5 |
| **Lỗi chấm điểm sai hoặc bỏ sót câu điểm liệt** | Rất cao | Viết bộ Unit Test kiểm thử riêng cho `evaluateExamSubmission` với 100% các tình huống biên trước khi ghép nối giao diện |
| **Giao diện vỡ layout trên màn hình nhỏ** | Trung bình | Áp dụng hệ thống lưới Bootstrap 5 Grid (`col-12 col-md-8 col-lg-9`), kiểm thử responsive định kỳ qua Chrome DevTools Mobile View |
