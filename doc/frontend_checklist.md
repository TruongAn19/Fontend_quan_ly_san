# Frontend Implementation Checklist

Dựa trên tài liệu `frontend_technical_spec.md` mô tả thiết kế và các ràng buộc từ Backend, dưới đây là **Checklist chi tiết** để xây dựng dự án Frontend (Angular) này. 

Checklist này được sắp xếp theo mức độ ưu tiên từ nền tảng đến các tính năng cụ thể, và tuân thủ đúng thứ tự triển khai an toàn (Safe implementation order) đã được khuyến nghị trong tài liệu.

## 🏗️ 1. Khởi tạo & Cấu hình Nền tảng (Setup & Core)
*Đây là bước cấu hình khung của dự án, cần làm cẩn thận để tránh lỗi lặp lại ở các tính năng sau.*

- [x] Khởi tạo project Angular với cấu trúc thư mục chuẩn: `core/`, `shared/`, `features/`.
- [x] Cấu hình biến môi trường (`environments`): Đặt Base URL là `http://localhost:8080`.
- [x] Định nghĩa các Model/Interface cốt lõi (`ApiResponse<T>`, `JwtAuthResponse`, `ProductResponseDTO`, `AvailableTimeDTO`, v.v.).
- [x] Viết **Auth Interceptor**: Tự động đính kèm header `Authorization: Bearer <token>` vào các request cần xác thực.
- [x] Viết **Error Interceptor**:
  - [x] Xử lý mã lỗi `400 Validation` để trích xuất thông báo lỗi cho từng field.
  - [x] Bắt lỗi `401/403` để tự động điều hướng về trang Login hoặc báo lỗi cấm truy cập.
- [x] Thiết lập Router & Guards cho các Role: `Public`, `USER`, `STAFF`, `ADMIN`.
- [x] Viết hàm tiện ích xử lý **Phân trang (Pagination)**: Chuyển đổi linh hoạt vì API có endpoint dùng `0-based`, có endpoint dùng `1-based`.
- [x] Viết hàm tiện ích xử lý **FormData** để hỗ trợ tính năng upload file kèm JSON (Multipart/form-data cho avatar, ảnh sản phẩm).

---

## 🌐 2. Client Portal (Giao diện Khách hàng)
*Phát triển các tính năng dành cho user theo đúng ràng buộc về API.*

### Xác thực & Cá nhân (Auth & Profile)
- [x] Giao diện và kết nối API Đăng nhập (`POST /api/v1/auth/login`), lưu trữ JWT Token.
- [x] Giao diện và kết nối API Đăng ký (`POST /api/v1/auth/register`).
- [x] Giao diện Quên mật khẩu & Đặt lại mật khẩu.
- [x] Trang thông tin cá nhân: Xem và Cập nhật (hỗ trợ upload avatar qua FormData).
- [x] Tính năng Đổi mật khẩu: **Xóa JWT và bắt buộc đăng nhập lại** sau khi đổi thành công.

### Sản phẩm & Vợt (Catalog)
- [x] Trang chủ: Hiển thị sản phẩm/vợt nổi bật (`GET /api/v1/client/home` - 1-based page).
- [x] Danh sách Sản phẩm: Hỗ trợ bộ lọc tìm kiếm, địa chỉ, giá và phân trang (1-based).
- [x] Chi tiết Sản phẩm: Hiển thị thông tin, thời gian trống, giá khuyến mãi.
- [x] Danh sách Vợt: Lọc theo hãng, giá và phân trang (0-based).
- [x] Chi tiết Vợt & API check tồn kho theo ngày (`POST /api/v1/racket-stock`).

### Đặt Sân (Booking Flow)
- [x] Lấy danh sách khung giờ trống hoặc được gợi ý (`/available-times`, `/recommend`).
- [x] Tính năng **Giữ chỗ (Hold Slot)**: Giao diện đếm ngược 180 giây khi giữ chỗ.
- [x] Giao diện Đặt sân chính thức: Đặt 1 lần hoặc định kỳ (`WEEKLY_RECURRING`).
- [x] Sau khi đặt sân, lấy payment URL trả về để tự động điều hướng sang VNPay.
- [x] Trang quản lý Lịch sử Đặt sân cá nhân (0-based page).

### Thuê dụng cụ & Thanh toán (Rental & Payment)
- [x] Tạo đơn thuê theo ngày (`DAILY`) hoặc thuê tại sân (`ON_SITE`).
- [x] Thanh toán đơn thuê (`VNPAY` hoặc `CASH`). Hiển thị giá do backend trả về (không tự tính toán ở frontend).
- [x] Trang thông báo kết quả thanh toán khi VNPay redirect về (`/api/v1/payments/vnpay-callback`).
- [x] Trang quản lý Lịch sử Thuê dụng cụ (0-based page).

### Tìm người chơi & Chat (Match-post) - Gọi qua HTTP
- [x] Danh sách bài đăng tìm người chơi (Lọc theo khu vực, ngày, trình độ).
- [x] Giao diện tạo bài đăng mới (MatchPost).
- [x] Chi tiết bài đăng: Chức năng Tham gia, Rời khỏi, và Chủ phòng Kick user.
- [x] Lịch sử Chat: Hiển thị qua API HTTP GET `/api/v1/chat/history/{chatRoomId}`.

---

## 🛡️ 3. Admin & Staff Dashboard (Giao diện Quản trị)
*Quản lý hệ thống với quyền STAFF và ADMIN.*

### Tổng quan & Thống kê (Dashboard)
- [x] Dashboard chung: Xem số lượng Users, Products.
- [x] Báo cáo Doanh thu theo khoảng thời gian (`/api/v1/admin/products/statistics/revenue`).
- [x] Thống kê Vợt: Lượt thuê trong tháng, top vợt, biểu đồ.

### Quản lý Hệ thống (CRUD)
- [x] Quản lý User: Phân quyền (`PUT /role`), xóa, sửa thông tin người dùng.
- [x] Quản lý Sản phẩm: Thêm/Sửa (Multipart data), xóa sản phẩm.
- [x] Quản lý Vợt: Thêm/Sửa ảnh vợt (Multipart data).

### Quản lý Vận hành (Staff & Admin)
- [x] Quản lý Booking: Danh sách đặt sân và Cập nhật trạng thái *(Lưu ý: Backend nhận label text, không phải enum key như `DA_DAT`)*.
- [x] Quản lý Thuê đồ (Rentals): Quản lý các đơn thuê `DAILY` và cập nhật trạng thái đơn.
- [x] **Thông báo (NTFY)**: Giao diện theo dõi luồng SSE realtime (`/api/v1/ntfy-sse/{topic}`) và gửi thông báo thủ công.

---

## ⏳ 4. Giai đoạn Tương lai (Trì hoãn triển khai / Feature Flag)
*Đây là các tính năng chưa hoàn thiện hoàn toàn từ phía Backend hoặc cần làm sau cùng.*

- [x] **Websocket (STOMP) Chat Realtime**: Thay thế HTTP lấy tin nhắn bằng Realtime WebSocket sau khi backend làm rõ cơ chế Auth qua Socket.
- [x] **User Notifications Realtime**: Nghe queue thông báo `/user/queue/notifications`.
- [x] **Email Link Đặt lại mật khẩu**: Triển khai khi backend sửa luồng email hardcode để hỗ trợ redirect thẳng về link của frontend.
