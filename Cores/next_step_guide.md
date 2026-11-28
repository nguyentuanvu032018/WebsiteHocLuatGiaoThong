# HƯỚNG DẪN THỰC HIỆN CÁC BƯỚC TIẾP THEO (NEXT STEP GUIDE)
## HỆ THỐNG HỌC & THI THỬ LUẬT GIAO THÔNG ĐƯỜNG BỘ TRỰC TUYẾN

> Tài liệu này cung cấp hướng dẫn thực thi từng bước bằng dòng lệnh (CLI) để khởi tạo toàn bộ môi trường mã nguồn cho cả Backend và Frontend.
>
> **Lưu ý trạng thái (2026-11-26):** Đây là hướng dẫn khởi tạo/dựng lại dự án, không phải danh sách việc cần chạy trên workspace hiện có. Hệ thống có hai cổng frontend: học viên `5173`, quản trị `5174`; chỉ cổng học viên được mở qua ngrok. Xem `Cores/checkpoint.md` để biết trạng thái hiện tại và `Cores/fix_bao_mat.md` để biết các hạng mục bảo mật còn mở.

---

## BƯỚC 1: KHỞI TẠO MÔ HÌNH DỰ ÁN MONOREPO

Từ thư mục gốc của dự án `d:\Download\CT466_NLN`, cấu trúc 2 thư mục độc lập:

```powershell
# Tạo các thư mục chính
mkdir backend
mkdir frontend
```

---

## BƯỚC 2: THIẾT LẬP VÀ CÀI ĐẶT BACKEND (NODE.JS + EXPRESS)

### 2.1. Khởi tạo `package.json` và cài đặt dependencies
```powershell
cd d:\Download\CT466_NLN\backend
npm init -y
```

Cài đặt các gói thư viện cần thiết:
```powershell
# Các thư viện cốt lõi
npm install express mysql2 jsonwebtoken bcryptjs cors dotenv helmet express-rate-limit multer

# Thư viện hỗ trợ phát triển (DevDependencies)
npm install --save-dev nodemon
```

### 2.2. Tạo cây thư mục Backend
```powershell
mkdir src\config
mkdir src\controllers
mkdir src\middlewares
mkdir src\routes
mkdir src\services
mkdir src\utils
mkdir database\seeds
mkdir uploads
```

### 2.3. Tạo file cấu hình môi trường `.env`
Tạo file `.env` tại thư mục `backend/`:
```env
PORT=5000
NODE_ENV=development

# Cấu hình Cơ sở dữ liệu MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=traffic_exam_db

# Cấu hình JWT
JWT_SECRET=super_secret_jwt_key_traffic_exam_2026
JWT_EXPIRES_IN=7d

# Đường dẫn Client phục vụ CORS
CLIENT_URL=http://localhost:5173
```

---

## BƯỚC 3: THIẾT LẬP VÀ CÀI ĐẶT FRONTEND (VUE.JS 3 + BOOTSTRAP 5)

### 3.1. Khởi tạo dự án Vue 3 với Vite
```powershell
cd d:\Download\CT466_NLN\frontend
npm create vite@latest . -- --template vue
```

### 3.2. Cài đặt các gói thư viện Frontend
```powershell
npm install
npm install bootstrap @popperjs/core bootstrap-icons
npm install vue-router@4 pinia axios sweetalert2
```

### 3.3. Tạo cây thư mục Frontend
```powershell
mkdir src\assets\css
mkdir src\components\common
mkdir src\components\exam
mkdir src\components\admin
mkdir src\layouts
mkdir src\router
mkdir src\stores
mkdir src\services
mkdir src\views\study
mkdir src\views\lookup
mkdir src\views\exam
mkdir src\views\profile
mkdir src\views\admin
```

---

## BƯỚC 4: THIẾT LẬP CƠ SỞ DỮ LIỆU MYSQL

1. Khởi động MySQL Server (thông qua MySQL Service, XAMPP, Laragon hoặc Docker).
2. Tạo cơ sở dữ liệu rỗng:
   ```sql
   CREATE DATABASE traffic_exam_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Chạy file kịch bản DDL `backend/database/schema.sql` để khởi tạo các bảng:
   ```powershell
   # Chạy qua mysql CLI
   mysql -u root -p traffic_exam_db < d:\Download\CT466_NLN\backend\database\schema.sql
   ```
4. Chạy các file seed dữ liệu ban đầu trong thư mục `backend/database/seeds/`.

---

## BƯỚC 5: KHỞI CHẠY HỆ THỐNG KIỂM THỬ

### Chạy Backend Server:
```powershell
cd d:\Download\CT466_NLN\backend
npm run dev
# Server lắng nghe tại: http://localhost:5000
```

### Chạy Frontend Development Server:
```powershell
cd d:\Download\CT466_NLN\frontend
npm run dev -- --host 0.0.0.0 --port 5173 --strictPort
# Cổng học viên: http://localhost:5173
```

### Chạy Frontend Admin:
```powershell
cd d:\Download\CT466_NLN\frontend
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
# Cổng quản trị: http://localhost:5174 (đăng nhập, không có đăng ký)
```

---

## BƯỚC 6: TRÌNH TỰ LẬP TRÌNH CODE THEO TÍNH NĂNG (FEATURE FLOW)

Sau khi môi trường đã sẵn sàng, hãy thực hiện theo thứ tự:
1. **API Auth & Middleware:** Tạo tài khoản quản trị và học viên, test login nhận token qua Postman/Thunder Client.
2. **Seed 600 câu hỏi & Biển báo:** Đảm bảo dữ liệu các chương và câu điểm liệt đã vào database.
3. **API Exam Engine:** Kiểm thử hàm sinh đề `/exams/generate` và hàm chấm điểm `/exams/:id/submit`.
4. **Vue 3 UI:** Lắp ráp màn hình Ôn tập $\rightarrow$ Tra cứu $\rightarrow$ Phòng thi sát hạch $\rightarrow$ Admin Dashboard.
