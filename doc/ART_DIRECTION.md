# Art Direction — Anchored Ribbon Grid

## Visual Style

- Style: Anchored Ribbon Grid
- Decorative imagery: Fluid Ribbon Gradients
- Color palette: Lavender Cream
- Roundness: Basic Roundness
- Elevation: Gentle Lift

## Typography

- Headings: Funnel Sans
- Body: Inter
- Captions and metadata: Geist

## Application Notes

- Use a structured grid with clearly anchored content blocks.
- Use fluid ribbon gradients as supporting visual movement, not as background noise.
- Keep lavender and cream as the dominant surfaces; reserve stronger accents for primary actions and active states.
- Use moderate corner radii across cards, inputs, buttons, modals, and tables.
- Use soft, restrained shadows to separate interactive surfaces.
- Maintain strong information hierarchy and sufficient contrast for booking states, administrative data, and accessibility.

## Status

Approved by the user as the visual direction for the upcoming Pencil design.

---

# Quy trình thiết kế API-first

## 1. Nguyên tắc bắt buộc

Thiết kế phải phụ thuộc vào contract đang tồn tại trong backend
`backend_do_an/src/main/java/com/example/quanly`. Không suy diễn dữ liệu từ tên màn hình,
không dùng dữ liệu có vẻ hợp lý nhưng API không trả về, và không thêm hành động nếu backend
không có endpoint tương ứng.

Thứ tự ưu tiên khi có thông tin không thống nhất:

1. Controller và DTO/domain hiện tại của backend.
2. Service đang được frontend gọi.
3. Route đang tồn tại trong `src/app/app.routes.ts`.
4. Tài liệu dự án chỉ dùng để tham khảo, không được dùng thay contract backend.

Mọi response chuẩn của backend có dạng:

```text
ApiResponse<T>
├── status
├── message
├── errorCode       (có thể không có)
├── path            (có thể không có)
├── timestamp
└── data
```

Chỉ nội dung trong `data` được dùng để dựng dữ liệu chính của màn hình. `message`,
`status`, `errorCode` và `path` chỉ phục vụ thông báo hoặc trạng thái lỗi.

## 2. Quy trình trước khi vẽ một màn hình trong Pencil

### Bước 1 — Xác định route thật

- Kiểm tra route đã tồn tại trong `src/app/app.routes.ts`.
- Xác định route public, yêu cầu đăng nhập hay yêu cầu quyền admin.
- Không tạo thêm mục điều hướng hoặc màn hình mới chỉ vì tài liệu cũ có đề cập.

### Bước 2 — Lập API contract cho màn hình

Trước khi vẽ, ghi ngay bên cạnh frame hoặc trong ghi chú thiết kế:

- Method và endpoint.
- Query/path parameter.
- Request body.
- Các field thật trong `data`.
- Các response đặc biệt như `400`, `401`, `403`, `409`.
- Endpoint của từng hành động xuất hiện trên UI.

Nếu một thành phần không ánh xạ được tới field hoặc endpoint cụ thể thì loại khỏi thiết kế.

### Bước 3 — Tạo data matrix

Với từng card, bảng, biểu đồ hoặc form, lập ánh xạ:

```text
UI element → API field → định dạng hiển thị → fallback hợp lệ
```

Fallback chỉ được dùng cho trạng thái kỹ thuật:

- Field ảnh rỗng → ảnh placeholder.
- Danh sách rỗng → empty state.
- API đang tải → skeleton.
- API lỗi → thông báo từ `message` và nút thử lại.

Không tạo fallback dưới dạng dữ liệu giả như rating, số lượt đánh giá, khoảng cách,
tiện ích hoặc lượt yêu thích.

### Bước 4 — Chỉ tạo filter mà API nhận

- Không tạo filter chỉ hoạt động ở mockup.
- Giá trị filter phải map được vào query parameter hoặc request body hiện có.
- Phân trang trên giao diện luôn hiển thị bắt đầu từ trang 1, nhưng adapter phải chuyển
  đúng sang API 0-based hoặc 1-based.

### Bước 5 — Chỉ tạo CTA có endpoint

Mỗi button thay đổi dữ liệu phải có:

- Endpoint cụ thể.
- Trạng thái loading/disabled.
- Trạng thái thành công lấy từ `message`.
- Trạng thái lỗi.
- Modal xác nhận nếu hành động có tính huỷ/xoá/hoàn tiền.

Không đặt button “Yêu thích”, “Đánh giá”, “Chia sẻ”, “Chat với chủ sân”,
“Xem trên bản đồ” hoặc “Mua vợt” vì backend hiện không có nghiệp vụ tương ứng.

### Bước 6 — Thiết kế đủ trạng thái

Mỗi màn hình dùng API phải có tối thiểu:

- Loading.
- Có dữ liệu.
- Không có dữ liệu.
- Lỗi API.
- Hết phiên `401` nếu route yêu cầu đăng nhập.
- `403` nếu route yêu cầu admin.
- `409` riêng cho các thao tác giữ chỗ, thanh toán hoặc cập nhật xung đột.

### Bước 7 — Kiểm tra contract trước khi duyệt frame

Trước khi đánh dấu frame hoàn thành:

- Đối chiếu lại toàn bộ text động với field backend.
- Đối chiếu toàn bộ button với endpoint.
- Không để số liệu minh hoạ trở thành một phần của thiết kế chính thức.
- Nếu Pencil cần sample data để thể hiện layout, sample phải được gắn nhãn
  `SAMPLE — theo schema API`, không được xem là dữ liệu backend thực.

## 3. Áp dụng Anchored Ribbon Grid vào dữ liệu API

### Grid

- Dùng grid làm khung cố định cho dữ liệu, không dùng ribbon để thay thế thông tin.
- Card sân, card vợt, booking và rental phải giữ cùng hệ thống cột.
- Các khối thống kê chỉ xuất hiện khi có field thống kê tương ứng.

### Typography

- Funnel Sans: tiêu đề trang, tiêu đề section, số KPI.
- Inter: nội dung, form, table, button và thông báo.
- Geist: mã booking, mã rental, thời gian, caption, metadata và nhãn kỹ thuật.

### Lavender Cream palette

- Cream là surface chính.
- Lavender nhạt dùng phân vùng và trạng thái chọn.
- Màu nhấn đậm dùng cho CTA chính.
- Màu trạng thái phải đảm bảo đọc được và không phụ thuộc duy nhất vào màu;
  luôn kèm text hoặc icon.

### Basic Roundness và Gentle Lift

- Card, input, button, modal dùng bo góc vừa phải và nhất quán.
- Shadow nhẹ chỉ dùng để tách card/modal khỏi nền.
- Table admin không dùng shadow cho từng row.

### Fluid Ribbon Gradients

- Chỉ dùng làm hình trang trí ở hero, header section, auth panel và empty state.
- Ribbon không được che dữ liệu, không thay thế ảnh sản phẩm và không biểu diễn số liệu.
- Ảnh sân/vợt chỉ lấy từ field `image`; nếu không có thì dùng placeholder được định nghĩa rõ.

## 4. Kế hoạch thiết kế theo màn hình và dữ liệu thật

### 4.1. App shell và điều hướng

Route hiện có cho khách hàng:

- `/`
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/profile`
- `/products`
- `/products/detail/:id`
- `/rackets`
- `/rackets/detail/:id`
- `/booking/:id`
- `/booking-success`
- `/booking-history`
- `/booking-detail/:id`
- `/rentals/:id`
- `/rental-success`
- `/rental-history`
- `/payments/vnpay-callback`

Route admin hiện có:

- `/admin/dashboard`
- `/admin/users`
- `/admin/products`
- `/admin/rackets`
- `/admin/bookings`
- `/admin/rentals`
- `/admin/refund-requests`

Header/sidebar chỉ liên kết tới các route này. Notification bell và chatbot có thể là
component nổi vì frontend và backend đã có service tương ứng; không tạo route notification
hoặc chat history mới.

### 4.2. Đăng nhập

`POST /api/v1/auth/login`

Request:

- `email`
- `password`

Response `data`:

- `accessToken`
- `tokenType`
- `email`
- `role`

Thiết kế:

- Chỉ có input email, password và submit.
- Điều hướng tới đăng ký/quên mật khẩu là link tới route hiện có.
- Không thêm social login, remember-me hoặc đăng nhập số điện thoại.
- `401` hiển thị `message` từ API.

### 4.3. Đăng ký

`POST /api/v1/auth/register`

Request:

- `firstName`
- `lastName`
- `email`
- `password`
- `confirmPassword`
- `phone`

Response thành công không có dữ liệu nghiệp vụ, chỉ có `message`.

Không thêm avatar, địa chỉ, ngày sinh, giới tính hoặc chọn vai trò vào form đăng ký.

### 4.4. Quên và đặt lại mật khẩu

`POST /api/v1/auth/forgot-password`

- Request: `email`, `redirectUrl`.
- Response: chỉ dùng `message`.

`POST /api/v1/auth/reset-password`

- Request: `token`, `password`.
- `token` lấy từ query string của route.
- Response: chỉ dùng `message`.

Không thiết kế OTP vì backend dùng reset link/token.

### 4.5. Trang chủ

`GET /api/v1/client/home?page={1-based}`

Response `data`:

- `products`
- `rackets`
- `topProducts`
- `topRackets`
- `currentPage`
- `totalPages`

Thiết kế được phép:

- Section danh sách sân từ `products`.
- Section sân nổi bật từ `topProducts`.
- Section vợt từ `rackets`.
- Section vợt nổi bật từ `topRackets`.
- Pagination nếu hiển thị nhiều trang.

Không được hiển thị rating, review count, khoảng cách, vị trí GPS, tiện nghi,
lượt xem hoặc badge “gần bạn” vì response không có các field đó.

Hero chỉ được dùng nội dung tĩnh mang tính giới thiệu và CTA tới route hiện có.
Không đặt ô tìm ngày/giờ trực tiếp trong hero vì endpoint home không nhận ngày/giờ.

### 4.6. Danh sách sân

`GET /api/v1/products`

Query hợp lệ:

- `search`
- `address`
- `price` — giá tối đa.
- `sort` — `gia-tang-dan`, `gia-giam-dan`, `pricePerHour,asc`,
  hoặc `pricePerHour,desc`.
- `page` — 1-based.

Response `data`:

- `products`
- `currentPage`
- `totalPages`
- `totalElements`

Field của mỗi `ProductResponseDTO`:

- `id`
- `name`
- `price`
- `image`
- `detailDesc`
- `shortDesc`
- `quantity`
- `sale`
- `address`
- `addressDetail`
- `depositPrice`
- `status`
- `ownerName`

Card chỉ dùng các field trên. Giá sau giảm được phép tính từ `price` và `sale`,
nhưng phải dùng cùng công thức backend.

### 4.7. Chi tiết sân

`GET /api/v1/products/{productId}`

Response `data`:

- `product`
- `availableTime`
- `discountPrice`
- `rackets`

Thiết kế:

- Một ảnh chính từ `product.image`; không tạo gallery vì API chỉ có một ảnh.
- Thông tin sân từ `product`.
- Khung giờ cấu hình từ `availableTime`.
- Danh sách vợt liên quan từ `rackets`.
- CTA đặt sân dẫn tới `/booking/:id`.

Không hiển thị các sân con ở trang public này vì endpoint không trả `courts`.

### 4.8. Danh sách và chi tiết vợt

`GET /api/v1/rackets`

Query hợp lệ:

- `factory`
- `price`
- `sort`
- `page` — 0-based.

Response `data`:

- `rackets`
- `currentPage`
- `totalPages`
- `totalElements`

`GET /api/v1/rackets/{racketId}` trả một `Racket` có các field:

- `id`
- `name`
- `price`
- `available`
- `factory`
- `image`
- `rentalPricePerDay`
- `rentalPricePerPlay`
- `bookingStockQuantity`
- `quantity`
- `status`
- `product`

Không thêm thông số kỹ thuật vợt, đánh giá, chất liệu, trọng lượng hoặc màu sắc.

### 4.9. Luồng đặt sân

`GET /api/v1/client/bookings/{productId}/info`

Response `data`:

- `product`
- `courts`
- `availableTimes`
- `totalPrice`

`courts` cung cấp `id`, `name` và quan hệ product. UI chỉ cần dùng `id`, `name`
để chọn sân con.

`GET /api/v1/client/bookings/available-times?date={yyyy-MM-dd}&courtId={id}`

Mỗi item:

- `id`
- `time`
- `status`

`GET /api/v1/client/bookings/recommend/{productId}`

- Trả danh sách `AvailableTimeDTO`.
- Chỉ được gắn nhãn gợi ý cho slot có `id` trùng dữ liệu trả về.

`GET /api/v1/client/bookings/products/{productId}/rackets`

- Trả danh sách vợt có thể thuê kèm.

`POST /api/v1/client/bookings/hold`

Request:

- `subCourtId`
- `availableTimeId`
- `bookingDate`

Response thành công:

- `remainingTime` — hiện là 180 giây.

Response xung đột `409` có thể trả:

- `remainingTime`
- `message`

UI phải có countdown sau khi hold thành công. Không thêm nút “Huỷ giữ chỗ”
vì backend hiện không có endpoint huỷ hold chủ động.

`POST /api/v1/client/bookings/place`

Request:

- `receiverName`
- `receiverAddress`
- `receiverPhone`
- `productId`
- `availableTimeId`
- `courtId`
- `bookingDate`
- `bookingType`
- `recurringEndDate`
- `rackets`, mỗi item gồm `racketId`, `quantity`

Response tại bước này chỉ có:

- `paymentUrl`

Không hiển thị `bookingId` hoặc `bookingCode` trước khi callback thanh toán thành công.

Các bước UI hợp lệ:

1. Chọn sân con.
2. Chọn ngày.
3. Tải và chọn giờ trống.
4. Hold slot.
5. Nhập thông tin nhận.
6. Chọn loại booking và ngày kết thúc nếu đặt định kỳ.
7. Chọn vợt thuê kèm nếu API trả danh sách.
8. Xác nhận dữ liệu request.
9. Gọi place và chuyển hướng tới `paymentUrl`.

Không thêm mã giảm giá, điểm thưởng, ví nội bộ hoặc phương thức thanh toán khác
ở bước booking vì request hiện không nhận các dữ liệu này.

### 4.10. VNPay callback và màn hình kết quả

`GET /api/v1/payments/vnpay-callback` dùng query parameters do VNPay trả về.

Booking thành công trả:

- `type = BOOKING`
- `bookingId`
- `bookingCode`

Rental thành công trả:

- `type = RENTAL_TOOL`
- `rentalToolId`
- `rentalCode`

Thanh toán thất bại trả:

- `type`
- `status = FAILED`

Thiết kế success/failure chỉ hiển thị các field này và `message`.
Không tạo hoá đơn chi tiết, số tiền, phương thức thanh toán hoặc mã giao dịch
nếu callback API không trả chúng.

### 4.11. Lịch sử và chi tiết đặt sân

`GET /api/v1/client/booking-history?page={0-based}&size={1..100}`

Response `data`:

- `bookings`
- `currentPage`
- `totalPages`

Mỗi `BookingResponseDTO`:

- `id`
- `bookingCode`
- `totalPrice`
- `depositPrice`
- `receiverName`
- `receiverAddress`
- `receiverPhone`
- `status`
- `bookingDate`
- `rentalToolCode`
- `courtName`
- `time`
- `bookingDetails`
- `refundStatus`
- `cancelledAt`
- `usedSessionsAtCancel`
- `totalSessionsAtCancel`
- `cancelReason`

`GET /api/v1/client/booking-history/{id}` trả:

- `booking`
- `bookingDetails`
- `rentalTools`

Mỗi booking detail có:

- `id`
- `price`
- `sale`
- `date`
- `productId`
- `productName`
- `availableTimeId`
- `subCourtId`
- `subCourtName`

`POST /api/v1/client/bookings/{id}/cancel`

- Request có thể chứa `reason`.
- Response có `refundStatus`, `usedSessions`, `totalSessions`, `hotline`, `email`.

Chỉ hiển thị CTA huỷ khi trạng thái nghiệp vụ cho phép; điều kiện phải bám logic
backend/frontend hiện có, không tự tạo nút đổi lịch.

### 4.12. Thuê vợt độc lập

`POST /api/v1/rentals`

Request:

- `fullName`
- `email`
- `phone`
- `type`
- `racketId`
- `quantity`
- `quantityDay`
- `rentalDate`
- `bookingCode`

`type` chỉ có:

- `DAILY`
- `ON_SITE`

`POST /api/v1/rentals/{id}/pay`

- Request: `paymentMethod`.
- `paymentMethod` chỉ có `VNPAY` hoặc `CASH`.
- Với `VNPAY`, response có `paymentUrl`.
- Với thanh toán không chuyển hướng, response có `rentalToolId`.

Không thêm giao hàng, phí vận chuyển, địa chỉ nhận vợt hoặc giỏ hàng.

### 4.13. Lịch sử thuê vợt

`GET /api/v1/client/rental-history?page={0-based}&size={1..100}`

Response `data`:

- `rentals`
- `currentPage`
- `totalPages`

Mỗi `RentalToolDTO`:

- `id`
- `fullName`
- `email`
- `phone`
- `type`
- `bookingId`
- `bookingCode`
- `racketId`
- `racketName`
- `productId`
- `price`
- `rentalPrice`
- `status`
- `quantity`
- `quantityDay`
- `rentalDate`
- `bookingTime`
- `accountName`
- `rentalToolCode`

Rental status hợp lệ:

- `PENDING`
- `PAID`
- `RENTING`
- `RETURNED`
- `COMPLETED`
- `CANCELLED`

Không thêm CTA huỷ rental vì backend client hiện không có endpoint huỷ rental.

### 4.14. Hồ sơ

`GET /api/v1/client/profile`

Response:

- `id`
- `email`
- `fullName`
- `address`
- `phone`
- `avatar`
- `roleName`
- `active`

`PUT /api/v1/client/profile` dùng multipart:

- Part `user`.
- Part `avatarFile` không bắt buộc.
- Chỉ cập nhật `fullName`, `address`, `phone`, avatar.
- Email là định danh và không được thiết kế như field chỉnh sửa.

`PUT /api/v1/client/change-password`

Query parameters:

- `oldPassword`
- `newPassword`
- `confirmPassword`

Sau khi đổi mật khẩu thành công backend đăng xuất phiên hiện tại; thiết kế phải
thể hiện thông báo và chuyển về đăng nhập.

### 4.15. Notification bell

`GET /api/v1/client/notifications?page={0-based}&size={1..100}`

Mỗi notification:

- `id`
- `type`
- `refType`
- `refId`
- `title`
- `message`
- `isRead`
- `createdAt`

Endpoint hành động:

- `GET /client/notifications/unread-count`
- `PUT /client/notifications/{id}/read`
- `PUT /client/notifications/read-all`

Thiết kế dropdown/list và badge unread được phép. Không tự tạo nút xoá notification,
mute hoặc cấu hình notification.

### 4.16. AI chatbot

`POST /api/v1/ai/chat`, response streaming.

Request:

- `message`
- `chatId`

Thiết kế được phép có input, lịch sử tạm trong phiên UI, trạng thái streaming và retry.
Không thiết kế danh sách cuộc trò chuyện đã lưu, xoá hội thoại, đính kèm file hoặc voice
vì API không hỗ trợ.

## 5. Kế hoạch thiết kế admin

### 5.1. Dashboard

`GET /api/v1/admin/dashboard`:

- `countUser`
- `countProduct`
- `countByRacket`

`GET /api/v1/admin/booking-statistics?startDate&endDate`:

- `countByStatus`
- `revenuePerCourt`
- `totalBookings`
- `totalRevenue`

`GET /api/v1/admin/racket-statistics?startDate&endDate&courtId`:

- `listProduct`
- `totalRackets`
- `currentlyRented`
- `monthlyRentals`
- `monthlyRevenue`
- `topRackets`
- `rentalsByMonth`
- `revenueByMonth`

Chỉ vẽ KPI và chart từ các field trên. Không thêm tăng trưởng phần trăm,
so sánh kỳ trước, conversion rate hoặc dự báo nếu API không trả/tính chúng.

### 5.2. Người dùng

`GET /api/v1/admin/users` trả danh sách `UserResponseDTO`.

Hành động hiện có:

- Tạo user bằng multipart.
- Xem chi tiết.
- Cập nhật `fullName`, `address`, `phone`, avatar.
- Cập nhật role bằng body `{ role }`.
- Delete endpoint thực chất dùng để vô hiệu hoá user; UI phải dùng nhãn phù hợp,
  không mô tả là xoá vĩnh viễn.

Không có search, filter hoặc pagination backend cho danh sách user; không thiết kế
search/filter server-side.

### 5.3. Quản lý sân

`GET /api/v1/admin/products?page={1-based}&search={text}`

Response:

- `products`
- `currentPage`
- `totalPages`
- `totalElements`

Hành động:

- Tạo bằng multipart `product` và `productImg`.
- Xem chi tiết.
- Cập nhật.
- Xoá.

Form chỉ dùng field của `Product`:

- `name`, `price`, `image`, `detailDesc`, `shortDesc`, `quantity`,
  `sale`, `address`, `addressDetail`, `depositPrice`, `status`.

### 5.4. Quản lý vợt

`GET /api/v1/admin/rackets?page={1-based}`

Response:

- `rackets`
- `currentPage`
- `totalPages`

Hành động:

- Tạo bằng multipart `racket` và `racketImg`.
- Xem chi tiết.
- Cập nhật.
- Xoá.

Không có search/filter backend cho trang admin rackets; không thêm các control đó.

### 5.5. Quản lý booking

`GET /api/v1/admin/bookings`

Query:

- `date`
- `search`
- `page` — 1-based.
- `size`.

Response:

- `bookings`
- `currentPage`
- `totalPages`
- `totalElements`

Hành động:

- Xem chi tiết.
- Cập nhật status.
- Xoá booking.
- Xác nhận hoàn cọc.

Booking status hợp lệ:

- `CHO_THANH_TOAN`
- `DA_DAT`
- `DA_DAT_COC`
- `DA_THANH_TOAN`
- `DA_HUY`

### 5.6. Quản lý rental

`GET /api/v1/admin/rentals`

Query:

- `search`
- `page` — 0-based.
- `size`.

Response:

- `rentals`
- `currentPage`
- `totalPages`
- `totalElements`

Hành động:

- Xem chi tiết.
- Cập nhật một trong các `RentalToolStatus`.

Không có create/delete rental ở admin; không đặt các button này.

### 5.7. Yêu cầu hoàn tiền

`GET /api/v1/admin/refund-requests`

Query:

- `status`
- `page` — 0-based.
- `size`.

Response:

- `items`
- `currentPage`
- `totalPages`
- `totalElements`

Refund status:

- `NONE`
- `PENDING_REFUND`
- `REFUNDED`
- `NOT_APPLICABLE`

Hành động xác nhận:

- `PUT /api/v1/admin/bookings/{id}/refund`

Không thêm từ chối hoàn tiền, hoàn một phần hoặc nhập số tiền hoàn vì backend
không có endpoint/request cho các thao tác này.

## 6. Những tính năng không được đưa vào thiết kế hiện tại

- Đánh giá và xếp hạng sân/vợt.
- Yêu thích.
- Giỏ hàng hoặc mua sản phẩm.
- Voucher, mã giảm giá do người dùng nhập.
- Điểm thưởng, membership, gói hội viên.
- Bản đồ, khoảng cách, GPS và tìm sân gần nhất.
- Gallery nhiều ảnh.
- Chat giữa người dùng với chủ sân.
- Cộng đồng, tìm trận, tham gia trận hoặc chat room.
- Đổi lịch booking.
- Huỷ hold chủ động.
- Huỷ rental từ phía client.
- Xoá notification.
- Lịch sử AI chat được lưu trên server.
- Social login, OTP và refresh token UI.
- Báo cáo hoặc KPI không xuất hiện trong API thống kê.

Chỉ bổ sung một mục trong danh sách này khi backend đã có endpoint và contract rõ ràng,
hoặc người dùng yêu cầu thay đổi đồng thời cả backend và frontend.

## 7. Thứ tự dựng trong Pencil

1. Design tokens và component primitives theo Anchored Ribbon Grid.
2. App shell public/client và admin shell.
3. Auth: login, register, forgot/reset password.
4. Home.
5. Product list và product detail.
6. Racket list và racket detail.
7. Booking flow, hold countdown và payment redirect.
8. Payment callback success/failure/conflict.
9. Booking history và detail/cancel/refund summary.
10. Rental flow, rental result và rental history.
11. Profile và change password.
12. Notification bell và AI chatbot.
13. Admin dashboard.
14. Admin users, products, rackets, bookings, rentals và refund requests.
15. Responsive variants cho các màn hình client quan trọng.
16. Review toàn bộ frame bằng API contract checklist.

## 8. Checklist duyệt thiết kế cuối

- [ ] Mỗi màn hình có route thật.
- [ ] Mỗi dữ liệu động map tới field API thật.
- [ ] Mỗi CTA thay đổi dữ liệu map tới endpoint thật.
- [ ] Không dùng field chỉ tồn tại trong type frontend nhưng backend không trả.
- [ ] Không có filter giả.
- [ ] Không có KPI hoặc chart suy diễn.
- [ ] Đã xử lý loading, empty, error và quyền truy cập.
- [ ] Đã xử lý phân trang đúng base.
- [ ] Đã xử lý `409` ở luồng giữ chỗ/thanh toán.
- [ ] Không hiển thị booking code trước VNPay callback thành công.
- [ ] Chỉ dùng một ảnh khi API chỉ trả một field `image`.
- [ ] Typography, palette, roundness, elevation và ribbon đúng art direction.
- [ ] Ribbon chỉ là trang trí, không che hoặc làm sai nghĩa dữ liệu.
