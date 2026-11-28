# Các điểm cần chỉnh sửa

Đã xử lý các mục sau trong dự án:

    - Cập nhật hệ thống hạng bằng lái xe theo bộ danh mục dự án: A, A1, B, B1, C, C1; đồng bộ dữ liệu từ frontend/backend.
    - Tách cổng học viên và cổng admin thành hai địa chỉ chạy riêng; đăng nhập tại từng cổng theo đúng vai trò, trang admin không có mục đăng ký.
    - Tái cấu hình phong cách giao diện admin và học viên theo hai chủ đề khác biệt; ưu tiên Bootstrap và tách theme CSS riêng cho từng giao diện.
    - Chuyển các hiệu ứng riêng cho giao diện học viên và admin vào hai file CSS riêng để dễ bảo trì và đồng bộ hình ảnh mẫu.
    - Đồng bộ danh sách hạng bằng trong dữ liệu seed, ma trận đề thi, giao diện chọn hạng, bình luận tài liệu và mô tả trong thư mục Cores.

Trạng thái: Đã hoàn thành và cập nhật mã nguồn chính trong frontend/backend tương ứng; các tài liệu trong thư mục Cores đã được đồng bộ với thiết kế cuối cùng.

## Cập nhật trạng thái hệ thống — 2026-11-08

- Thêm ôn tập theo nhóm hạng: A/A1 gồm chương I–V; B/B1 và C/C1 gồm đủ 7 chương. Bỏ thanh chọn lại giữa các hạng cùng nhóm vì phạm vi ôn giống nhau.
- Thi thử tiếp tục chọn hạng cụ thể; lịch sử và thống kê ở lối vào theo nhóm chỉ lấy các hạng thành viên.
- Gỡ mục ôn tập chung “7 Chương lý thuyết” cùng các CTA và liên kết dẫn tới chế độ này; URL `/study` không có nhóm hạng hợp lệ được chuyển sang `/exam`. Giữ chức năng ôn theo nhóm hạng, 60 câu điểm liệt và dữ liệu chương cần cho ma trận thi/quản trị.
- Đã ghi trạng thái và các hạng mục kiểm thử gần nhất trong `checkpoint.md`; build frontend và kiểm tra cú pháp backend thành công. Kiểm thử end-to-end trên cơ sở dữ liệu/môi trường triển khai cần được thực hiện riêng.
- Build frontend sau khi gỡ lối vào ôn tập chung thành công.

## Chỉnh sửa cấu trúc trang web

### Trạng thái cập nhật (2026-11-09)

- Đã tách hai cổng chạy frontend: cổng học viên tại `http://localhost:5173`, cổng quản trị tại `http://localhost:5174`.
- Truy cập cổng học viên mở trang chủ; truy cập cổng admin mở trang đăng nhập. Trang đăng nhập học viên giữ liên kết đăng ký; trang admin không hiển thị và chặn route đăng ký.
- Route quản trị yêu cầu tài khoản admin. Cổng admin chỉ bind loopback; tunnel ngrok chỉ trỏ đến cổng học viên, không công khai giao diện quản trị.
- `run.bat`, `huong_dan_van_hanh.md` và toàn bộ tài liệu trong `Cores` đã được đồng bộ với cấu trúc hai cổng.

### Cập nhật xác thực & Trang lỗi Quản trị (2026-11-21)

- **Xác thực OTP Email khi đăng ký:** Tích hợp quy trình xác thực OTP email 6 số (3 phút) khi tạo tài khoản học viên mới. Tránh đăng ký tài khoản rác hoặc email giả mạo.
- **Trang lỗi 404 Quản trị:** Bổ sung trang lỗi 404 riêng cho Admin (`AdminNotFoundView.vue`) với cảnh báo URL sai phong cách quản trị và liên kết tắt đến các phân hệ.

### Cập nhật Nhận diện Email & Quản lý Thông tin Cá nhân (2026-11-22)

- **Chuẩn hóa nhận diện logo Email OTP:** Thay thế icon `🚗` bằng logo chính thức của website (`logo.png`) định dạng CID inline attachment, bố trí căn giữa ở trên cùng header email gửi OTP.
- **Thuộc tính Avatar & Quản lý thông tin cá nhân:**
  - Thêm cột `avatar` vào bảng `users`. Nếu không có avatar, hệ thống hiển thị chữ cái đầu tiên theo họ tên trên nền tròn màu (`[D]`, `[V]`) như cũ.
  - Cho phép cả học viên và quản trị viên cập nhật thông tin cá nhân (Họ tên, SĐT, Avatar) qua Modal `ProfileModal.vue`.
  - Email cố định (`disabled/readonly`) để bảo mật tài khoản; mật khẩu không cho phép sửa qua route này.
  - Tích hợp mục "Thông tin cá nhân" vào dropdown trên cả Navbar học viên và Topbar quản trị.
  - Hỗ trợ tải avatar tùy chọn ngay từ bước đăng ký tài khoản mới.
