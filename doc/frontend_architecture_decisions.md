# Frontend Architecture Decisions & Guidelines

Tài liệu này bổ sung các quyết định kiến trúc chi tiết, conventions và chiến lược xử lý (Best Practices) cho dự án Frontend (Angular), nhằm đồng bộ chặt chẽ với backend hiện tại.

## 1. Environment Strategy (Chiến lược Môi trường)
Sử dụng các file environment riêng biệt để quản lý cấu hình theo từng môi trường triển khai.
- **File cấu hình:**
  - `environment.ts` (Local/Development)
  - `environment.staging.ts` (Test/Staging server)
  - `environment.production.ts` (Production server)
- **Các biến môi trường bắt buộc (ví dụ cho local):**
  ```typescript
  export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:8080/api/v1',
    wsBaseUrl: 'ws://localhost:8080/ws',
    sseBaseUrl: 'http://localhost:8080/api/v1/ntfy-sse',
    vnpayReturnUrl: 'http://localhost:4200/payment/result', // Route xử lý callback ở Frontend
    features: {
      enableRealtimeChat: false,          // Feature flag
      enableRealtimeNotifications: false  // Feature flag
    }
  };
  ```

## 2. Token Lifecycle (Vòng đời Token)
- **Lựa chọn Tối ưu:** Lưu Access Token ở **`localStorage`**. Lựa chọn này giúp duy trì phiên đăng nhập kể cả khi người dùng vô tình đóng tab (đảm bảo trải nghiệm tốt cho các ứng dụng tiêu dùng).
- **Refresh Token:** Backend *hiện chưa hỗ trợ* cơ chế refresh token.
- **Quy tắc xử lý:**
  - Nếu API trả về `401 Unauthorized`: Lập tức xóa Token trong `localStorage` -> Redirect về `/login` -> Hiển thị Toast thông báo "Phiên đăng nhập hết hạn".

## 3. Route Guard Matrix (Ma trận Phân quyền)
Sử dụng Angular Functional Guards để bảo vệ các tuyến đường (Routes). Đóng gói thành 3 guards cơ bản:

| Route | Guard Áp dụng | Role Yêu cầu | Hành vi khi vi phạm |
| --- | --- | --- | --- |
| `/login`, `/register` | `guestGuard` | Public | Redirect về `/home` |
| `/profile`, `/booking-history` | `authGuard` | `USER` | Redirect `/login` |
| `/admin/*` | `authGuard` + `roleGuard` | `ADMIN` | Redirect trang `403` |
| `/staff/*` | `authGuard` + `roleGuard` | `STAFF`, `ADMIN` | Redirect trang `403` |

## 4. UI State Conventions (Chuẩn hóa Trạng thái UI)
Mỗi page/component có API call bắt buộc phải xử lý đủ 4 trạng thái:
1. **Loading:** Dùng Skeleton loader (ưu tiên) hoặc Spinner.
2. **Empty:** Hiển thị Empty State rõ ràng kèm hình minh họa (ví dụ: "Không tìm thấy sản phẩm", "Chưa có lịch sử đặt sân").
3. **Error:** Hiển thị thông báo lỗi (Toast/Alert) và nút **Thử lại (Retry)** nếu lỗi do mạng.
4. **Unauthorized / Expired:** (ví dụ: Giữ chỗ hết hạn) -> Hiển thị Modal thông báo + Nút "Tải lại trang/Tải lại slot".

## 5. Form Validation Sync (Đồng bộ Validation)
Sử dụng `ReactiveFormsModule` với custom validators để bắt lỗi ngay tại frontend, tránh đợi submit xong mới báo lỗi từ backend. Ánh xạ 1:1 các rule của backend:
- Mật khẩu: Min 6 ký tự.
- Số điện thoại: Regex định dạng VN (10 số, đầu 0).
- Email: Chuẩn định dạng email hợp lệ.
- Ngày đặt sân (`bookingDate`): Custom validator bắt buộc `>= today`.

## 6. Domain DTO Normalization Layer (Lớp chuẩn hóa dữ liệu)
Vì backend có sự không nhất quán trong response (ví dụ naming), **bắt buộc** tạo thư mục `core/adapters/` để transform dữ liệu trước khi đưa vào UI.
- `user.adapter.ts`: Chuyển đổi `ROLE_USER` -> `USER`, `ROLE_ADMIN` -> `ADMIN` để frontend dễ check quyền.
- `booking.adapter.ts`: Chuẩn hóa thời gian (time format), parse enum keys từ label.
- *Lợi ích tối ưu:* Khi backend thay đổi naming convention, chỉ cần sửa ở lớp Adapter duy nhất thay vì tìm sửa ở hàng chục UI Components.

## 7. VNPay Return Flow UI (Luồng xử lý VNPay)
Frontend xây dựng trang đích `/payment/result` để hứng user từ VNPay redirect về sau khi thanh toán.
- **Cách hoạt động:** Đọc query params từ url (`vnp_ResponseCode`, `vnp_SecureHash`...) và hiển thị giao diện tương ứng.
- **Cases:**
  - `success`: Cảm ơn, hiển thị thông tin hóa đơn, nút "Xem lịch sử".
  - `failed`: Thông báo lỗi thẻ/số dư, nút "Thử lại thanh toán".
  - `cancelled`: Người dùng hủy -> Nút "Quay lại trang thanh toán".
  - `invalid signature`: Cảnh báo giao dịch không hợp lệ.

## 8. Observability / Logging (Ghi log & Theo dõi)
- **Dev mode:** Dùng `HttpLoggingInterceptor` (chỉ kích hoạt ở dev) để in ra console `Request/Response`, thời gian thực thi (rất hữu ích khi trace lỗi data).
- **Production mode:** Gom nhóm console log (`console.group`) và có thể cân nhắc gửi lỗi unhandled (JS error, API error 500) lên các dịch vụ như Sentry.

## 9. Feature Flags (Cờ tính năng)
Dùng để vô hiệu hóa các tính năng mà backend chưa hoàn thiện/chưa ổn định (được set trong file `environment`):
- `enableRealtimeChat`: `false` (sẽ fallback về HTTP API hoặc ẩn UI realtime).
- `enableRealtimeNotifications`: `false`.

## 10. Testing Checklist (Kiểm thử)
Tập trung nguồn lực vào các phần logic dễ hỏng nhất (đạt tỷ lệ ROI - Return on Investment cao nhất cho testing):
- **Unit Tests:** `authGuard`, `HttpInterceptors` (xử lý token, error mapping), và các `Adapters` (phân trang, ngày tháng).
- **Integration Tests:** Các luồng cốt lõi sinh ra doanh thu: Login, Booking Hold (test count down expire), Booking Place, Rental Pay.

## 11. Known Backend Naming Mismatches (Các điểm bất đồng bộ từ Backend)
Cần note rõ để team Frontend tránh bug:
- Số nhiều vs Số ít: API dùng `users` vs `user` ở một số payload.
- Role mapping: `role` vs `roles` (trong JWT payload).
- Pagination Base: API list chia ra: `page=0` (Rentals/Rackets/History) vs `page=1` (Home/Products/Admin Bookings).
- Booking Status: API nhận update bằng `label` thay vì `enum key` (VD: "DA_DAT" -> backend không parse được, phải gửi label tiếng Việt).

## 12. State Management Decision (Quản lý Trạng thái)
- **Lựa chọn Tối ưu:** Sử dụng **Angular Signals kết hợp RxJS Services**.
- **Lý do:** Đối với quy mô dự án này, dùng các thư viện Redux-pattern như **NgRx là overkill** (cồng kềnh và quá nhiều boilerplate).
  - Sử dụng **Signals** (`writableSignal`, `computed`) cho các UI state đồng bộ (VD: trạng thái `isLoading`, `currentUser`, giỏ hàng đồ thuê).
  - Sử dụng **RxJS** cho luồng dữ liệu bất đồng bộ (API calls, luồng search có debounce, polling).
  
## 13. Image/File URL Strategy (Chiến lược xử lý hình ảnh)
- **Fallback Image:** Cần tạo directive `<img appFallbackImage="assets/img/default.jpg" />` để tự gán ảnh mặc định khi ảnh backend trả về bị lỗi/404.
- **Cache Busting:** Thêm query string (VD: `?v=timestamp`) vào link ảnh (như avatar) để lừa browser tải lại ảnh mới nếu user update avatar nhưng link không đổi.

## 14. Access Denied UX (Trải nghiệm Lỗi phân quyền 403)
- Truy cập vào trang không có quyền (Vd: USER gõ link `/admin`): Chuyển hướng sang một trang 403 chuyên biệt với message **"Bạn không có quyền truy cập trang này"** và nút quay về trang chủ.
- Nếu bị lỗi 403 khi thao tác (Click nút bị từ chối): Hiển thị Toast Error màu đỏ góc màn hình.
