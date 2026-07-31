# Kế hoạch thiết kế UI dựa trên API Backend

## 1. Mục tiêu và nguyên tắc bắt buộc

Tài liệu này là checklist để thiết kế bằng Pencil. Phạm vi chỉ gồm dữ liệu và thao tác đã được backend tại `BE/src/main/java/com/pitchbooking/app/controller` cung cấp.

- Mọi response đọc từ `data` của cấu trúc `ApiResponse<T>` (`status`, `message`, `data`). Không thiết kế UI dựa trên field giả định nằm ở root response.
- Chỉ render field được nêu trong DTO hoặc `Map.of(...)` của endpoint. Không tự thêm rating, bình luận, bản đồ, voucher, yêu thích, mã giảm giá, chat, ghép kèo, lịch sân tổng quan, hoặc thanh toán bằng phương thức khác.
- Giá, tiền cọc, giảm giá, số buổi và tiền hoàn luôn lấy từ response server. UI không tự tính hoặc hiển thị “ước tính hoàn tiền” trước phản hồi hủy.
- Mọi nút thay đổi dữ liệu phải chỉ rõ endpoint, payload và dữ liệu trả về bên dưới.
- Dùng API `available-times` là nguồn duy nhất quyết định một slot có thể chọn; không suy ra từ dữ liệu `availableTimes` ở trang chi tiết.

## 2. Quy ước dữ liệu và trạng thái

### 2.1. Trạng thái booking

`BookingResponseDTO.status` và `CancelBookingResponse.status` có các giá trị:

| Giá trị | Nhãn hiển thị |
|---|---|
| `CHO_THANH_TOAN` | Chờ thanh toán |
| `DA_DAT` | Đã đặt cọc |
| `DA_THANH_TOAN` | Đã thanh toán |
| `DA_HUY` | Đã hủy |

### 2.2. Trạng thái thuê phụ kiện

`RentalToolDTO.status` nhận: `PENDING` (Chờ nhận phụ kiện), `RENTING` (Đang thuê), `COMPLETED` (Đã trả phụ kiện), `CANCELLED` (Đã hủy). UI gửi chính những enum này hoặc nhãn backend chấp nhận khi admin cập nhật trạng thái.

### 2.3. Field dùng lặp lại

| Đối tượng | Field được phép hiển thị |
|---|---|
| Sân (`ProductResponseDTO`) | `id`, `name`, `price`, `image`, `detailDesc`, `shortDesc`, `quantity`, `sale`, `address`, `addressDetail`, `depositPrice`, `status`, `ownerName`, `pitchType` |
| Slot (`AvailableTimeDTO`) | `id`, `time` (`HH:mm`), `status` |
| Booking (`BookingResponseDTO`) | `bookingCode`, `totalPrice`, `depositPrice`, `receiverName`, `receiverAddress`, `receiverPhone`, `status`, `bookingDate`, `rentalToolCode`, `courtName`, `time`, `bookingType`, `refundStatus`, `refundAmount`, `cancelledAt`, `usedSessionsAtCancel`, `totalSessionsAtCancel`, `cancelReason`, `bookingDetails` |
| Chi tiết suất (`BookingDetailResponseDTO`) | `price`, `sale`, `date`, `productId`, `productName`, `availableTimeId`, `availableTime`, `subPitchId`, `subPitchName` |
| Thuê phụ kiện (`RentalToolDTO`) | `rentalToolCode`, `fullName`, `email`, `phone`, `type`, `bookingCode`, `bookingDate`, `bookingTime`, `equipmentName`, `productId`, `price`, `rentalPrice`, `status`, `paymentStatus`, `quantity`, `quantityDay`, `rentalDate`, `refundStatus`, `depositAmount`, `cancelledAt` |

## 3. Thứ tự thiết kế trên Pencil

### Bước 1 — Design tokens và component trạng thái

Thiết kế các component dùng lại: input văn bản, chọn ngày, select, button, card, bảng, phân trang, dialog xác nhận, badge và toast lỗi/thành công. Đây là thành phần trình bày, không tạo thêm nghiệp vụ.

- Badge booking phải map đúng 4 giá trị ở mục 2.1.
- Badge thuê phải map đúng 4 giá trị ở mục 2.2.
- Mọi danh sách phân trang chỉ hiển thị khi endpoint có `currentPage`, `totalPages` (và nếu có `totalElements`).
- Trạng thái loading, rỗng và lỗi chỉ hiển thị `message` server trả về; không tạo lý do lỗi nghiệp vụ mới.

### Bước 2 — Trang chủ khách hàng

**Endpoint:** `GET /api/v1/client/home?page={page}`.

**Dữ liệu response:** `data.products`, `data.equipments`, `data.topProducts`, `data.currentPage`, `data.totalPages`.

Thiết kế ba khu vực dữ liệu:

1. Danh sách sân dùng field của `ProductResponseDTO` ở mục 2.3.
2. Danh sách thiết bị dùng chính field entity API trả về; không thêm mô tả thiết bị vì BE không có field `description`.
3. Khu vực sân nổi bật chỉ dùng phần tử có trong `topProducts`; không gán nhãn “đánh giá cao”.

CTA duy nhất: mở danh sách sân hoặc chi tiết theo `product.id`; không đặt nút đặt sân trực tiếp nếu chưa có lựa chọn ngày/sân con/slot.

### Bước 3 — Danh sách và chi tiết sân

#### 3.1 Danh sách sân

**Endpoint:** `GET /api/v1/products?search=&address=&price=&sort=&page=`.

**Dữ liệu response:** `products`, `currentPage`, `totalPages`, `totalElements`; mỗi trang có 6 phần tử.

Thiết kế điều khiển đúng request parameter:

- Ô tìm kiếm gửi `search`.
- Ô địa chỉ gửi `address`.
- Giá tối đa gửi `price`; mặc định không truyền `price`, không gán mức trần mặc định.
- Sắp xếp chỉ gửi giá trị `sort` mà backend đang xử lý; nếu chưa xác nhận danh sách giá trị, Pencil thể hiện control trung tính, không ghi các lựa chọn cụ thể.
- Phân trang dùng `page` bắt đầu từ 1.

Card chỉ hiển thị `image`, `name`, `shortDesc`, `address`, `pitchType`, `price`, `sale`, `depositPrice`, `status` khi field có dữ liệu. Không thay `detailDesc` thành mô tả ngắn.

#### 3.2 Chi tiết sân

**Endpoint:** `GET /api/v1/products/{productId}`.

**Dữ liệu response:** `product`, `availableTime`, `discountPrice`.

Thiết kế phần thông tin với `product.image`, `name`, `detailDesc`, `shortDesc`, `address`, `addressDetail`, `pitchType`, `quantity`, `price`, `sale`, `depositPrice`, `status`. Chỉ hiển thị `discountPrice` theo response endpoint này, không tự suy ra.

Danh sách `availableTime` chỉ là thông tin cấu hình. Không dùng nó để bật/tắt slot đặt sân.

### Bước 4 — Luồng chọn lịch và giữ chỗ

Thiết kế một màn theo trình tự dưới đây, giữ nguyên dữ liệu người dùng đã chọn tại mỗi bước.

1. **Tải dữ liệu đặt sân:** `GET /api/v1/client/bookings/{productId}/info` trả `product`, `courts`, `availableTimes`, `totalPrice`. Hiển thị `courts` để chọn sân con và chỉ hiển thị `totalPrice` đúng giá trị trả về.
2. **Chọn ngày và sân con:** gọi `GET /api/v1/client/bookings/available-times?date=yyyy-MM-dd&courtId={courtId}`. Render duy nhất `data[]` gồm `id`, `time`, `status`. Slot không xuất hiện trong mảng tuyệt đối không được hiển thị là còn trống.
3. **Giữ chỗ:** khi chọn slot, gửi `POST /api/v1/client/bookings/hold` body `{subPitchId, availableTimeId, bookingDate}`. Response `remainingTime` là số giây countdown duy nhất; không tự đặt thời lượng khác. Với HTTP 409, hiển thị `message` và `remainingTime`, khóa tiếp tục thanh toán.
4. **Gợi ý (nếu đưa vào thiết kế):** `GET /api/v1/client/bookings/recommend/{productId}` trả `AvailableTimeDTO[]`. Chỉ thiết kế dưới dạng danh sách slot gợi ý, không diễn giải lý do hay mức độ phù hợp vì API không trả các dữ liệu đó.

### Bước 5 — Báo giá và tạo thanh toán booking

**Báo giá:** `POST /api/v1/client/bookings/estimate`.

Payload chỉ có: `productId`, `availableTimeId`, `bookingDate`, `bookingType` (`ONE_TIME` hoặc `WEEKLY_RECURRING`), `recurringEndDate`, `daysOfWeek`, `durationMonths`. Với lịch định kỳ, ngày trong tuần là 1–7 và `durationMonths` chỉ dùng 1, 2 hoặc 3 theo DTO; không thiết kế tần suất khác.

Khu vực tóm tắt chỉ hiển thị `basePrice`, `sessions`, `totalPrice`, `depositPrice`, `savings`, `discountRate`, `remainingPrice` từ `EstimatePriceResponse`.

**Tạo payment:** `POST /api/v1/client/bookings/place`.

Form chỉ có các field request sau:

- `receiverName`, `receiverAddress`, `receiverPhone` (10–11 chữ số)
- `productId`, `availableTimeId`, `courtId`, `bookingDate`
- `bookingType`, `recurringEndDate`, `daysOfWeek`, `durationMonths`

Response chỉ có `paymentUrl`: UI chuyển hướng tới URL này. Không tự thiết kế màn chọn phương thức thanh toán cho booking vì endpoint này đã tạo VNPay URL và không nhận `paymentMethod`.

### Bước 6 — Lịch sử, chi tiết và hủy booking của khách

- **Danh sách:** `GET /api/v1/client/booking-history?page=&size=` trả `bookings`, `currentPage`, `totalPages`.
- **Chi tiết:** dùng `GET /api/v1/client/bookings/detail/{bookingId}` hoặc `GET /api/v1/client/booking-history/{id}`. Trong response lịch sử, dữ liệu gồm `booking`, `bookingDetails`, `rentalTools`.
- **Hủy:** `POST /api/v1/client/bookings/{bookingId}/cancel` body chỉ `{reason}`. Sau response, modal kết quả chỉ hiển thị `bookingId`, `status`, `refundStatus`, `refundAmount`, `usedSessions`, `totalSessions`, `cancelledAt`, `contactHotline`, `contactEmail`.

Không hiển thị tiền hoàn trước khi API hủy phản hồi. Không tự tạo màn “theo dõi tiến độ hoàn”; chỉ hiển thị `refundStatus` và thông tin liên hệ khi API trả về.

### Bước 7 — Thuê phụ kiện của khách

**Tạo đơn:** `POST /api/v1/rentals` với `CreateRentalRequest`.

Form gồm đúng: `fullName`, `email`, `phone`, `type`, `equipmentId`, `quantity`; chỉ khi `type=DAILY` mới dùng `quantityDay`, `rentalDate`; chỉ khi `type=ON_SITE` mới dùng `bookingCode`.

**Thanh toán:** `POST /api/v1/rentals/{id}/pay` body `{paymentMethod}`; danh sách lựa chọn chỉ lấy từ enum `PaymentMethod` BE trả/định nghĩa, không tự thêm lựa chọn.

**Hủy:** `PATCH /api/v1/rentals/{id}/cancel`. Không thiết kế form lý do vì endpoint không nhận payload lý do.

**Lịch sử:** `GET /api/v1/client/rental-history` trả danh sách `RentalToolDTO`; màn chi tiết có thể dùng `GET /api/v1/admin/rentals/{id}` chỉ trong phạm vi admin, vì không có endpoint chi tiết thuê riêng của khách được xác nhận trong controller.

### Bước 8 — Thông báo và tài khoản khách

- Thông báo: `GET /api/v1/client/notifications`, `GET /unread-count`, `PUT /{id}/read`, `PUT /read-all`. Card chỉ dùng `type`, `title`, `message`, `refType`, `refId`, `isRead`, `createdAt`.
- Hồ sơ: `GET /api/v1/client/profile`, `PUT /api/v1/client/profile` (multipart). Thiết kế theo các field response/request thực tế `UserResponseDTO`: `email`, `fullName`, `address`, `phone`, `avatar`, `roleName`.
- Đổi mật khẩu: `PUT /api/v1/client/change-password`. Chỉ thêm field theo body controller xác nhận; không thiết kế lịch sử mật khẩu hoặc 2FA.

### Bước 9 — Dashboard admin

**Endpoint:** `GET /api/v1/admin/dashboard`.

Các KPI được phép là: `countUser`, `countProduct`, `countByEquipment`, `countBookingToday`, `monthlyRevenue`. Danh sách sân hàng đầu chỉ có `name`, `bookingCount`, `revenue`; danh sách booking gần đây chỉ có `id`, `totalPrice`.

Không hiển thị ngày, khách hàng, trạng thái hoặc tên sân trong “booking gần đây” trên dashboard vì endpoint không trả các field đó.

### Bước 10 — Quản trị booking và hoàn tiền

**Danh sách:** `GET /api/v1/admin/bookings?date=&search=&page=&size=`.

- Bộ lọc ngày gửi `date` (`yyyy-MM-dd`).
- Tìm kiếm gửi `search`; chỉ thiết kế nhãn “Tìm theo mã booking” vì service tìm `bookingCode`.
- Bảng dùng field `BookingResponseDTO` ở mục 2.3 và phân trang `bookings`, `currentPage`, `totalPages`, `totalElements`.

**Chi tiết:** `GET /api/v1/admin/bookings/{id}` trả `booking` và `rentalTools`.

**Thao tác:**

- `PUT /api/v1/admin/bookings/{id}/status` body `{status}`.
- `DELETE /api/v1/admin/bookings/{id}` trả `CancelBookingResponse`.
- `GET /api/v1/admin/bookings/refund-requests?status=&page=&size=` trả booking đã hủy. Filter chỉ dùng enum `RefundStatus` đã có.
- `PUT /api/v1/admin/bookings/{id}/refund` xác nhận hoàn và trả `CancelBookingResponse`.

### Bước 11 — Quản trị sân, sân con và thiết bị

**Sân:** `GET/POST /api/v1/admin/products`, `GET/PUT/DELETE /api/v1/admin/products/{productId}`. Form `multipart/form-data` gồm request part `product` (`ProductUpsertRequest`) và file tùy chọn `productImg`. Các field form chính xác: `name`, `price`, `image`, `detailDesc`, `shortDesc`, `quantity`, `sale`, `address`, `addressDetail`, `status`, `pitchType`, `subPitchNames`.

**Sân con:** `GET /api/v1/admin/sub-pitches?productId=`, `POST /api/v1/admin/sub-pitches`, `PUT/DELETE /api/v1/admin/sub-pitches/{id}`. `SubPitchDTO` chỉ có `id`, `name`, `pitchType`, `productId`; không thêm hình ảnh, giá riêng hoặc lịch riêng vào form.

**Thiết bị:** `GET/POST /api/v1/admin/equipments`, `GET/PUT /api/v1/admin/equipments/{equipmentId}`. Form multipart gồm request part `equipment` và file tùy chọn `equipmentImg`. Field chính xác: `name`, `factory`, `price`, `available`, `rentalPricePerDay`, `rentalPricePerPlay`, `bookingStockQuantity`, `quantity`, `status`, `productId`.

### Bước 12 — Quản trị thuê và thống kê thiết bị

- Danh sách thuê: `GET /api/v1/admin/rentals?search=&page=&size=`. `search` chỉ theo mã đơn thuê. Response: `rentals`, `currentPage`, `totalPages`, `totalElements`.
- Chi tiết: `GET /api/v1/admin/rentals/{id}` trả `rentalTool`, `equipment`.
- Cập nhật trạng thái: `PUT /api/v1/admin/rentals/{id}/status` body `{status}`.
- Hoàn cọc: `GET /api/v1/admin/rentals/refunds?refundStatus=&page=&size=`, sau đó `POST /api/v1/admin/rentals/{id}/confirm-refund`.
- Thống kê: `GET /api/v1/admin/equipment-statistics?startDate=&endDate=&courtId=`. Chỉ vẽ dữ liệu `totalEquipments`, `currentlyRented`, `monthlyRentals`, `monthlyRevenue`, `topEquipments`, `rentalsByMonth`, `revenueByMonth`, `listProduct`. `topEquipments` có `id`, `name`, `price`, `factory`, `image`, `rentalStock`, `rentCount`, `revenue`.

## 4. Checklist trước khi chuyển từng màn từ Pencil sang code

- [ ] Mỗi text/number/image được trace đến một field response cụ thể.
- [ ] Mỗi CTA mutating được trace đến một endpoint và payload cụ thể.
- [ ] Không tự tính tổng tiền, cọc, giảm giá hay hoàn tiền.
- [ ] Không hiển thị filter, sort, tab hay thao tác mà BE chưa có request parameter/endpoint.
- [ ] Pagination tuân theo index của endpoint: products/admin equipment bắt đầu 1; rentals và phần lớn history/admin refund bắt đầu 0 theo controller.
- [ ] Loading, empty và error state không thêm nội dung nghiệp vụ không có trong `message` hoặc response.

