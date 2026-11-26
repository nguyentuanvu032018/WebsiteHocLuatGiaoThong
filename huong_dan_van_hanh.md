# Hướng dẫn chạy hai cổng website và chia sẻ cổng học viên bằng ngrok

## Yêu cầu

- Đã cài Node.js và ngrok trên máy.
- Đã cấu hình ngrok authtoken trên máy (`ngrok config add-authtoken ...`); chỉ cần làm một lần. Không chia sẻ authtoken.
- Đã cài dependencies nếu đây là lần đầu: chạy `npm.cmd install` trong từng thư mục `backend` và `frontend`.
- Cơ sở dữ liệu MySQL đã chạy và thông tin kết nối trong `backend\.env` chính xác.
- Chatbot cần có `GROQ_API_KEY` trong `backend\.env` để gọi Groq API. Model mặc định là `llama-3.3-70b-versatile`; có thể đổi bằng biến `GROQ_MODEL`.

## Khởi động

### Chạy cả bốn dịch vụ bằng một file

Chạy file `run.bat` ở thư mục gốc dự án (nhấp đúp file hoặc chạy `.\run.bat` trong PowerShell). File mở các cửa sổ riêng cho backend, cổng học viên, cổng quản trị và ngrok.

- Học viên: <http://localhost:5173>
- Quản trị viên: <http://localhost:5174> (đăng nhập; không có mục đăng ký)
- Ngrok chỉ chia sẻ cổng học viên. Cổng quản trị chỉ lắng nghe trên máy cục bộ và không được mở ra Internet.

Nếu Windows báo không tìm thấy `ngrok`, hãy cài đặt ngrok hoặc thêm ngrok vào `PATH`, sau đó chạy lại file. Muốn dừng dịch vụ, nhấn `Ctrl+C` tại từng cửa sổ backend, frontend và ngrok.

### Chạy thủ công

Mở bốn terminal riêng:

#### Terminal 1: Backend

```powershell
cd D:\Download\CT466_NLN\backend
npm.cmd start
```

#### Terminal 2: Cổng học viên

```powershell
cd D:\Download\CT466_NLN\frontend
npm.cmd run dev -- --host 0.0.0.0 --port 5173 --strictPort
```

#### Terminal 3: Cổng quản trị

```powershell
cd D:\Download\CT466_NLN\frontend
npm.cmd run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

#### Terminal 4: Ngrok cho học viên

```powershell
ngrok http 5173 --url https://sector-factsheet-uncombed.ngrok-free.dev
```

Mở hoặc gửi địa chỉ sau cho học viên:

<https://sector-factsheet-uncombed.ngrok-free.dev>

Vite proxy chuyển các request `/api` và `/uploads` đến backend cục bộ ở cổng 5000. Không cần mở backend bằng một tunnel ngrok riêng.

## Khi chạy lại hoặc xử lý lỗi

- Nếu ngrok báo `ERR_NGROK_334` hoặc `already online`, tunnel với URL này đang chạy ở terminal khác. Dùng tunnel đang chạy; hoặc nhấn `Ctrl+C` tại terminal ngrok cũ rồi chạy lại lệnh.
- Nếu ngrok không nhận tùy chọn `--url`, mở `ngrok http 5173` và dùng URL được hiển thị. Khi URL đổi, cập nhật `allowedHosts` trong `frontend\vite.config.js` cho hostname mới rồi khởi động lại frontend.
- Hai cổng frontend dùng `--strictPort`; nếu cổng đang bận, dừng tiến trình đang chiếm cổng thay vì để Vite tự chọn cổng khác.
- Sau khi sửa cấu hình hoặc `.env`, khởi động lại tiến trình liên quan để áp dụng.
- Máy tính, mạng Internet và các tiến trình cần hoạt động để người khác truy cập. Đây là cách chia sẻ demo, không phải hosting chạy liên tục.

## Lưu ý bảo mật

Ngrok tạo URL công khai: bất kỳ ai có link đều có thể truy cập cổng học viên khi tunnel đang chạy. Không chia sẻ file `.env`, authtoken, mật khẩu hoặc API key; không dùng cấu hình demo này để công khai dữ liệu nhạy cảm. Nếu các API key từng được ghi trong tài liệu đã sử dụng, hãy thu hồi và tạo key mới.
