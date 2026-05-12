# Frontend Checklist — Dự Án Quản Lý Sân Pickleball

## 1. Setup Project & Environment

### Khởi tạo dự án
- [x] Khởi tạo project Angular 17+
- [x] Cấu hình TypeScript
- [x] Cài TailwindCSS
- [x] Cài Angular Material
- [x] Cấu hình HttpClient (thay Axios)
- [x] Cấu hình State Management (Signals / RxJS)
- [x] Cấu hình Reactive Forms (thay React Hook Form)
- [x] Cấu hình Angular Router
- [x] Cài dayjs
- [x] Cài @stomp/ng2-stompjs hoặc sockjs-client
- [x] Cài ng2-charts hoặc Chart.js
- [x] Cấu hình ESLint + Prettier
- [x] Cấu hình alias path (`@/`)

### Environment
- [x] Tạo file `.env`
- [x] Cấu hình `VITE_API_BASE_URL`
- [x] Cấu hình `VITE_WS_URL`
- [x] Cấu hình `VITE_VNPAY_RETURN_PATH`
- [x] Cấu hình `VITE_NTFY_SSE_URL`
- [x] Cấu hình `VITE_VAPID_PUBLIC_KEY`
- [x] Kiểm tra backend CORS cho port frontend

---

# 2. Kiến Trúc & Cấu Trúc Thư Mục

## App Structure
- [x] Tạo thư mục `app/`
- [x] Tạo thư mục `api/`
- [x] Tạo thư mục `auth/`
- [x] Tạo thư mục `components/`
- [x] Tạo thư mục `features/`
- [x] Tạo thư mục `hooks/`
- [x] Tạo thư mục `shared/`
- [x] Tạo thư mục `styles/`

## Shared Setup
- [x] Tạo `constants.ts`
- [x] Tạo `enums.ts`
- [x] Tạo `types.ts`
- [x] Tạo helper format tiền tệ
- [x] Tạo helper format date/time

---

# 3. Authentication & Authorization

## Login/Register
- [x] Tạo trang Login
- [x] Tạo trang Register
- [x] Tạo trang Forgot Password
- [x] Tạo trang Reset Password
- [x] Validate form bằng Zod
- [x] Tích hợp API login
- [x] Tích hợp API register
- [x] Tích hợp API forgot password
- [x] Tích hợp API reset password

## JWT
- [x] Lưu JWT vào memory/sessionStorage
- [x] Decode role từ JWT
- [x] Gắn token vào Axios interceptor
- [x] Xử lý logout khi 401
- [x] Redirect theo role sau login

## Route Guard
- [x] Tạo `PublicRoute`
- [x] Tạo `PrivateRoute`
- [x] Tạo `AdminRoute`
- [x] Kiểm tra role USER
- [x] Kiểm tra role ADMIN/STAFF

---

# 4. Layout & Navigation

## Public Layout
- [x] Header public
- [x] Footer
- [x] Navigation menu
- [x] Responsive mobile menu

## Client Layout
- [x] Header user
- [x] Avatar dropdown
- [x] Notification bell
- [x] Logout button

## Admin Layout
- [x] Sidebar admin
- [x] Breadcrumb
- [x] Responsive sidebar drawer

---

# 5. Public Pages

## Home
- [x] Banner
- [x] Danh sách sân nổi bật
- [x] Danh sách vợt nổi bật

## Product
- [x] Trang danh sách sân
- [x] Filter theo giá
- [x] Filter theo địa chỉ
- [x] Sort tăng/giảm giá
- [x] Pagination
- [x] Trang chi tiết sân

## Racket
- [x] Trang danh sách vợt
- [x] Filter hãng
- [x] Filter giá
- [x] Pagination
- [x] Trang chi tiết vợt

---

# 6. Profile

- [x] Trang profile
- [x] API lấy profile
- [x] API cập nhật profile
- [x] Upload avatar
- [x] Đổi mật khẩu
- [x] Validate form đổi mật khẩu

---

# 7. Booking System

## Booking UI
- [x] Date selector
- [x] Sub court tabs
- [x] Time slot grid
- [x] Hold countdown
- [x] Recurring booking picker

## Booking API
- [x] API booking info
- [x] API available times
- [x] API recommend slots
- [x] API hold booking
- [x] API place booking
- [x] API booking history
- [x] API booking detail

## Booking Flow
- [x] User chọn ngày
- [x] User chọn slot
- [x] Kiểm tra available slot
- [x] Hold slot thành công
- [x] Countdown giữ chỗ
- [x] Place booking
- [x] Redirect VNPay

## Booking States
- [x] Slot available
- [x] Slot selected
- [x] Slot held
- [x] Slot booked
- [x] Slot unavailable

---

# 8. Realtime Slot Lock (STOMP)

## WebSocket
- [ ] Setup STOMP client
- [ ] Setup SockJS fallback
- [ ] Auto reconnect
- [ ] Attach JWT vào WS headers

## Slot Topic
- [ ] Subscribe `/topic/slots.{courtId}.{date}`
- [ ] Nhận HOLD event
- [ ] Nhận RELEASE event
- [ ] Nhận BOOKED event

## Slot Snapshot
- [ ] API slot snapshot
- [ ] Merge realtime event vào cache
- [ ] Refetch khi reconnect

## UI Countdown
- [ ] Countdown realtime
- [ ] Tooltip trạng thái giữ chỗ
- [ ] Toast khi slot bị giữ
- [ ] Toast khi slot được release

---

# 9. Rental System

## Rental Pages
- [x] Trang tạo rental
- [x] Chọn rental type
- [x] Chọn racket
- [x] Hiển thị stock

## Rental API
- [x] API create rental
- [x] API pay rental
- [x] API rental history

## Rental Flow
- [x] Tạo rental
- [x] Redirect VNPay
- [x] Callback payment
- [x] Hiển thị trạng thái PAID

---

# 10. Match Post & Chat (REMOVED)
- Đã được xoá theo yêu cầu để tinh gọn project.

---

# 11. VNPay Payment

## Payment Flow
- [x] Nhận paymentUrl từ backend
- [x] Redirect VNPay
- [x] Callback page
- [x] Đọc query `vnp_*`
- [x] Hiển thị loading spinner
- [x] Hiển thị success state
- [x] Hiển thị failed state

## Payment Handling
- [x] Invalidate booking history
- [x] Invalidate rental history
- [x] Redirect về lịch sử đơn

---

# 12. Notification & SSE (REMOVED)
- Đã được xoá theo yêu cầu (Không sử dụng).

---

# 13. Admin Dashboard

## Dashboard
- [x] Revenue today
- [x] Revenue month
- [x] Booking statistics
- [x] Rental statistics
- [x] Top rackets chart

## User Management
- [x] Danh sách user
- [x] Pagination
- [x] Search/filter

## Product Management
- [x] CRUD products
- [x] Upload image
- [x] Validation

## Racket Management
- [x] CRUD rackets
- [x] Stock management

## Booking Management
- [x] Danh sách booking
- [x] Chi tiết booking

## Rental Management
- [x] Danh sách rental
- [x] Đổi trạng thái rental

---

# 14. State Management

## React Query
- [x] Setup QueryClient
- [x] Query key convention
- [x] Invalidate strategy
- [x] Error handling

## Zustand
- [x] Auth store
- [x] Booking draft store
- [x] Notification store

## URL State
- [x] Sync filter với query string
- [x] Browser back/forward support

---

# 15. Error Handling

## API Error
- [ ] Handle VALIDATION_FAILED
- [ ] Handle BOOKING_CONFLICT
- [ ] Handle HOLD_EXPIRED
- [ ] Handle RACKET_OUT_OF_STOCK
- [ ] Handle UNAUTHORIZED

## UI Error
- [ ] Global ErrorBoundary
- [ ] Toast errors
- [ ] Retry button

---

# 16. Security

- [ ] Không log JWT
- [ ] Escape HTML chat content
- [ ] Chống double submit
- [ ] CSP config
- [ ] SameSite cookie config

---

# 17. Performance

- [ ] Route code splitting
- [ ] Lazy loading image
- [ ] Prefetch homepage data
- [ ] React Query staleTime
- [ ] Virtualize admin tables

---

# 18. Responsive & Accessibility

## Responsive
- [ ] Mobile booking layout
- [ ] Responsive admin sidebar
- [ ] Responsive tables

## Accessibility
- [ ] Semantic HTML
- [ ] Focus ring
- [ ] Contrast ratio
- [ ] Aria-live countdown

---

# 19. Testing

## Unit Test
- [ ] Setup Vitest
- [ ] Test utility functions
- [ ] Test hooks

## Component Test
- [ ] Test booking form
- [ ] Test slot grid
- [ ] Test auth form

## Integration Test
- [ ] Setup MSW
- [ ] Mock API booking flow

## E2E
- [ ] Setup Playwright
- [ ] Login flow
- [ ] Booking flow
- [ ] VNPay callback flow

---

# 20. Deployment

## Local
- [ ] npm install
- [ ] npm run dev
- [ ] Connect backend localhost:8080

## Production
- [ ] npm run build
- [ ] Deploy dist/
- [ ] Configure Nginx
- [ ] Configure reverse proxy

## CORS
- [ ] Update allowed origins
- [ ] Verify production domain

---

# 21. CI/CD

- [ ] Setup GitHub Actions
- [ ] Run lint
- [ ] Run typecheck
- [ ] Run tests
- [ ] Auto deploy staging

---

# 22. Final QA

- [ ] Kiểm tra toàn bộ flow login
- [ ] Kiểm tra booking realtime
- [ ] Kiểm tra rental flow
- [ ] Kiểm tra VNPay callback
- [ ] Kiểm tra responsive mobile
- [ ] Kiểm tra performance
- [ ] Kiểm tra accessibility
- [ ] Kiểm tra websocket reconnect
- [ ] Kiểm tra SSE notifications
- [ ] Kiểm tra admin permissions

---