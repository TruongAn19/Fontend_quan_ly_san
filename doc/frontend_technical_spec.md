# Frontend Technical Spec synced with backend `refactor_do_an`

Last sync source:
- `C:\Users\An\OneDrive\Documents\source\Persion\refactor_do_an`

This document is the implementation spec for a new frontend that integrates with the current Spring Boot backend.  
The backend source code is the source of truth.  
Anything marked as a backend constraint should be treated as a real integration limit, not a frontend assumption.

## 1. Scope

Frontend needs to cover 2 main areas:
- `Client Portal`: auth, home, product list/detail, racket list/detail, booking, rental, profile, booking history, rental history, match-post, chat history.
- `Admin/Staff Dashboard`: dashboard, users, products, rackets, bookings, rentals, racket statistics, ntfy SSE monitor.

This is an application spec, not a marketing page spec.

## 2. Backend overview

- Framework: Spring Boot `3.4.3`
- Java: `17`
- Base URL local: `http://localhost:8080`
- Context path: `/`
- Main auth: JWT Bearer
- Multipart max size: `50MB`
- CORS allowed origins:
  - `http://localhost:3000`
  - `http://localhost:5173`
- Realtime endpoints:
  - SockJS/STOMP: `/ws`
  - SSE proxy: `/api/v1/ntfy-sse/{topic}`
- Payment:
  - VNPay sandbox
  - callback URL default: `/api/v1/payments/vnpay-callback`

## 3. Security and access model

Current backend access rules:

- Public:
  - `/api/v1/auth/**`
  - `/api/v1/products/**`
  - `/api/v1/rackets/**`
  - `/api/v1/client/home`
  - `/api/v1/racket-stock/**`
  - `/api/v1/ntfy-sse/**`
  - `/api/v1/payments/vnpay-callback`
  - `/ws/**`
- Authenticated user:
  - all client APIs not listed above
  - `/api/v1/match-posts/**`
  - `/api/v1/rentals/**`
  - `/api/v1/chat/history/**`
  - `/api/v1/notify`
- STAFF or ADMIN:
  - `/api/v1/admin/bookings/**`
  - `/api/v1/admin/rentals/**`
- ADMIN only:
  - all other `/api/v1/admin/**`

Frontend role model:
- `Public`
- `USER`
- `STAFF`
- `ADMIN`

JWT token should be attached as:

```http
Authorization: Bearer <accessToken>
```

## 4. Response and error contract

### 4.1 Standard API wrapper

Most endpoints return:

```json
{
  "status": 200,
  "message": "Thanh cong",
  "errorCode": null,
  "path": null,
  "timestamp": "2026-04-28T15:00:00Z",
  "data": {}
}
```

Fields:
- `status`: HTTP-like numeric status inside payload
- `message`: human-readable message
- `errorCode`: optional machine code for errors
- `path`: optional request path on error
- `timestamp`: ISO timestamp
- `data`: actual payload

### 4.2 Validation error shape

When `@Valid` fails, backend returns:

```json
{
  "status": 400,
  "message": "Du lieu dau vao khong hop le",
  "errorCode": "VALIDATION_ERROR",
  "path": "/api/v1/rentals",
  "timestamp": "2026-04-28T15:00:00Z",
  "data": {
    "fieldName": "error message"
  }
}
```

Frontend should support:
- field-level error rendering from `data`
- global error toast from `message`

### 4.3 Security errors

`401` and `403` are generated in `SecurityConfiguration`, not in `GlobalExceptionHandler`.

Shape still follows:

```json
{
  "status": 401,
  "message": "...",
  "data": null
}
```

But do not assume `errorCode`, `path`, or `timestamp` always exist on auth errors.

### 4.4 Known response exceptions

These endpoints do not use `ApiResponse<T>`:
- `POST /api/v1/racket-stock` returns raw `RacketStockByDate`
- `GET /api/v1/ntfy-sse/{topic}` returns raw SSE stream
- `POST /api/v1/notify` returns plain text string

Frontend should keep a small endpoint exception map instead of forcing one parser for everything.

## 5. Date, time, pagination, and multipart conventions

### 5.1 Date/time formats

- `LocalDate`: `yyyy-MM-dd`
- `AvailableTimeDTO.time`: `HH:mm`
- payment callback params: raw VNPay query params

### 5.2 Pagination base by endpoint

Backend currently mixes `1-based` and `0-based` page input.

| Endpoint | Page base |
| :--- | :--- |
| `GET /api/v1/client/home` | `1-based` |
| `GET /api/v1/products` | `1-based` |
| `GET /api/v1/rackets` | `0-based` |
| `GET /api/v1/client/booking-history` | `0-based` |
| `GET /api/v1/client/rental-history` | `0-based` |
| `GET /api/v1/match-posts` | `0-based` |
| `GET /api/v1/admin/products` | `1-based` |
| `GET /api/v1/admin/rackets` | `1-based` |
| `GET /api/v1/admin/bookings` | `1-based` |
| `GET /api/v1/admin/rentals` | `0-based` |

Frontend must use endpoint-specific adapters.

### 5.3 Multipart pattern

These APIs expect JSON part + optional file:
- `PUT /api/v1/client/profile`
- `POST /api/v1/admin/users`
- `PUT /api/v1/admin/users/{id}`
- `POST /api/v1/admin/products`
- `PUT /api/v1/admin/products/{id}`
- `POST /api/v1/admin/rackets`
- `PUT /api/v1/admin/rackets/{id}`

Recommended frontend pattern:

```ts
const formData = new FormData();
formData.append(
  "product",
  new Blob([JSON.stringify(product)], { type: "application/json" })
);
if (file) formData.append("productImg", file);
```

## 6. Core enums and literals

### 6.1 Booking

- `bookingType`
  - `ONE_TIME`
  - `WEEKLY_RECURRING`

### 6.2 Rental

- `RentalType`
  - `DAILY`
  - `ON_SITE`

- `PaymentMethod`
  - `VNPAY`
  - `CASH`

- `PaymentType`
  - `BOOKING`
  - `RENTAL_TOOL`

- `RentalToolStatus`
  - `PENDING`
  - `PAID`
  - `COMPLETED`
  - `CANCELLED`

### 6.3 Booking status admin update

Admin booking status update does not parse enum key like `DA_DAT`.  
It parses the enum label through `BookingStatus.fromLabel(...)`.

Frontend should not hard-code these values until the real payload is confirmed in integration testing.

## 7. Client API inventory

### 7.1 Auth

| Function | Method + path | Auth | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Login | `POST /api/v1/auth/login` | Public | `{ email, password }` | `ApiResponse<JwtAuthResponse>` |
| Register | `POST /api/v1/auth/register` | Public | `{ firstName, lastName, email, password, confirmPassword, phone }` | `ApiResponse<null>` |
| Forgot password | `POST /api/v1/auth/forgot-password` | Public | `{ email }` | `ApiResponse<null>` |
| Reset password | `POST /api/v1/auth/reset-password` | Public | `{ token, password }` | `ApiResponse<null>` |

Login response payload:

```json
{
  "accessToken": "...",
  "tokenType": "Bearer",
  "email": "user@example.com",
  "role": "ROLE_USER"
}
```

Important:
- `register` still does not use `@Valid` in controller
- reset email link is still hard-coded by backend, see constraints section

### 7.2 Home, products, rackets, stock

| Function | Method + path | Auth | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Home | `GET /api/v1/client/home?page=1` | Public | query `page` | `products`, `rackets`, `topProducts`, `topRackets`, `currentPage`, `totalPages` |
| Product list | `GET /api/v1/products` | Public | query `page`, `search`, `address`, `price`, `sort` | `products`, `currentPage`, `totalPages`, `totalElements` |
| Product detail | `GET /api/v1/products/{productId}` | Public | path param | `product`, `availableTime`, `discountPrice` |
| Racket list | `GET /api/v1/rackets` | Public | query `factory[]`, `price[]`, `sort`, `page` | `rackets`, `currentPage`, `totalPages`, `totalElements` |
| Racket detail | `GET /api/v1/rackets/{racketId}` | Public | path param | `ApiResponse<Racket>` |
| Check stock | `POST /api/v1/racket-stock` | Public | `{ racketId, date }` | raw `RacketStockByDate` |

Product filter caveat:
- `address` and `price` filters only take effect in the code path where `sort` is present

### 7.3 Booking flow APIs

All endpoints below require JWT.

| Function | Method + path | Request | Response |
| :--- | :--- | :--- | :--- |
| Recommend slots | `GET /api/v1/client/bookings/recommend/{productId}` | path param | `ApiResponse<List<AvailableTimeDTO>>` |
| Booking info | `GET /api/v1/client/bookings/{productId}/info` | path param | `product`, `courts`, `availableTimes`, `totalPrice` |
| Available times | `GET /api/v1/client/bookings/available-times?date=yyyy-MM-dd&courtId=...` | query params | `ApiResponse<List<AvailableTimeDTO>>` |
| Hold slot | `POST /api/v1/client/bookings/hold` | `HoldBookingRequest` | `ApiResponse<{ remainingTime }>` |
| Place booking | `POST /api/v1/client/bookings/place` | `PlaceBookingRequest` | `ApiResponse<{ bookingId, bookingCode, paymentUrl }>` |
| Booking rackets | `GET /api/v1/client/bookings/{bookingCode}/{courtId}/rackets` | path params | `ApiResponse<{ rackets, bookingCode }>` |

`HoldBookingRequest`:

```json
{
  "subCourtId": 12,
  "availableTimeId": 3,
  "bookingDate": "2026-04-29"
}
```

`PlaceBookingRequest`:

```json
{
  "receiverName": "Nguyen Van A",
  "receiverAddress": "123 Example Street",
  "receiverPhone": "0901234567",
  "productId": 5,
  "availableTimeId": 3,
  "courtId": 12,
  "bookingDate": "2026-04-29",
  "bookingType": "ONE_TIME",
  "recurringEndDate": null
}
```

Booking behavior that frontend should know:
- hold timeout is `180` seconds
- backend deletes expired holds
- place booking returns `201`
- weekly recurring is supported through `bookingType = WEEKLY_RECURRING`
- backend always creates VNPay payment URL immediately after booking creation

### 7.4 Rental and payment APIs

All rental creation/payment endpoints require JWT.

| Function | Method + path | Request | Response |
| :--- | :--- | :--- | :--- |
| Create rental | `POST /api/v1/rentals` | `CreateRentalRequest` | `ApiResponse<RentalToolDTO>` |
| Pay rental | `POST /api/v1/rentals/{id}/pay` | `RentalPaymentRequest` | `ApiResponse<{ paymentUrl }>` or `ApiResponse<{ rentalToolId }>` |
| VNPay callback | `GET /api/v1/payments/vnpay-callback` | VNPay query params | `ApiResponse<{ type, bookingId? , rentalToolId? , status? }>` |

`CreateRentalRequest` for daily rental:

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0901234567",
  "type": "DAILY",
  "racketId": 7,
  "quantity": 1,
  "quantityDay": 2,
  "rentalDate": "2026-04-29"
}
```

`CreateRentalRequest` for on-site rental:

```json
{
  "fullName": "Nguyen Van A",
  "email": "user@example.com",
  "phone": "0901234567",
  "type": "ON_SITE",
  "racketId": 7,
  "quantity": 1,
  "bookingCode": "BK123456"
}
```

`RentalPaymentRequest`:

```json
{
  "paymentMethod": "VNPAY"
}
```

Rental flow:
- `POST /api/v1/rentals`
  - `ON_SITE`
    - backend links rental to booking by `bookingCode`
    - backend saves rental immediately
    - response message means rental is done
  - `DAILY`
    - backend validates stock
    - backend creates rental in `PENDING`
    - frontend must call `/api/v1/rentals/{id}/pay`
- `POST /api/v1/rentals/{id}/pay`
  - `VNPAY` returns `paymentUrl`
  - `CASH` marks rental as paid and applies stock changes immediately
- VNPay callback is now stateless
  - backend verifies signature
  - backend resolves payment target from `vnp_OrderInfo`
  - no `HttpSession` dependency remains in current flow

Important rental rules:
- price is calculated entirely in backend
- frontend should display returned price, not self-calculate final payable amount
- admin rental list currently focuses on `DAILY` rentals only

### 7.5 Profile and history

| Function | Method + path | Request | Response |
| :--- | :--- | :--- | :--- |
| Booking history | `GET /api/v1/client/booking-history?page=0&size=5` | query params | `ApiResponse<{ bookings, currentPage, totalPages }>` |
| Booking history detail | `GET /api/v1/client/booking-history/{id}` | path param | `ApiResponse<{ booking, bookingDetails, rentalTools }>` |
| Rental history | `GET /api/v1/client/rental-history?page=0&size=5` | query params | `ApiResponse<{ rentalHistories, totalPages, currentPage }>` |
| Get profile | `GET /api/v1/client/profile` | none | `ApiResponse<UserResponseDTO>` |
| Update profile | `PUT /api/v1/client/profile` | multipart `user` + `avatarFile?` | `ApiResponse<UserResponseDTO>` |
| Change password | `PUT /api/v1/client/change-password` | query params `oldPassword`, `newPassword`, `confirmPassword` | `ApiResponse<null>` |

Profile update payload pattern:

```ts
const formData = new FormData();
formData.append(
  "user",
  new Blob(
    [JSON.stringify({ fullName, email, address, phone })],
    { type: "application/json" }
  )
);
if (avatarFile) formData.append("avatarFile", avatarFile);
```

Frontend behavior recommendation:
- after successful password change, clear local JWT and redirect to login
- if profile allows email change, force re-login after update because JWT email claim will be stale

### 7.6 Match-post and chat

| Function | Method + path | Auth | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| List/search posts | `GET /api/v1/match-posts` | JWT | query `area`, `playDate`, `skillLevel`, `page`, `size` | `posts`, `currentPage`, `totalPages`, `totalElements` |
| Post detail | `GET /api/v1/match-posts/{id}` | JWT | path param | `post`, `messages`, `participants`, `alreadyJoined`, `currentUserId` |
| Create post | `POST /api/v1/match-posts` | JWT | raw `MatchPost` body | `ApiResponse<MatchPostResponseDTO>` |
| Cancel post | `POST /api/v1/match-posts/{id}/cancel` | JWT | none | `ApiResponse<null>` |
| Join post | `POST /api/v1/match-posts/{id}/join` | JWT | none | `ApiResponse<null>` |
| Leave post | `POST /api/v1/match-posts/{id}/leave` | JWT | none | `ApiResponse<null>` |
| Kick user | `POST /api/v1/match-posts/{postId}/kick/{userId}` | JWT | path params | `ApiResponse<null>` |
| Chat history | `GET /api/v1/chat/history/{chatRoomId}` | JWT | path param | `ApiResponse<List<ChatMessageDto>>` |

Recommended create-post body:

```json
{
  "playDate": "2026-04-29",
  "area": "Thu Duc",
  "timeSlot": "18:00-20:00",
  "skillLevel": "Intermediate",
  "description": "Tim them 2 nguoi",
  "maxParticipants": 4
}
```

Realtime endpoints:
- connect: `/ws`
- send chat: `/app/chat/{postId}/send`
- subscribe room: `/topic/chat/{postId}`
- subscribe user notifications: `/user/queue/notifications`

Current frontend position:
- HTTP APIs for match-post and chat history are safe to build now
- STOMP production flow is still constrained by backend auth clarity

## 8. Admin API inventory

### 8.1 Dashboard and statistics

| Function | Method + path | Role | Response |
| :--- | :--- | :--- | :--- |
| Dashboard | `GET /api/v1/admin/dashboard` | ADMIN | `countUser`, `countProduct`, `countByRacket` |
| Revenue stats | `GET /api/v1/admin/products/statistics/revenue?startDate=...&endDate=...` | ADMIN | `ApiResponse<Map<String, Double>>` |
| Racket statistics | `GET /api/v1/admin/racket-statistics` | ADMIN | `listProduct`, `totalRackets`, `currentlyRented`, `monthlyRentals`, `monthlyRevenue`, `topRackets`, `rentalsByMonth`, `revenueByMonth` |

### 8.2 User management

| Function | Method + path | Role | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| User list | `GET /api/v1/admin/users` | ADMIN | none | `ApiResponse<List<UserResponseDTO>>` |
| Create user | `POST /api/v1/admin/users` | ADMIN | multipart `user` + `avatarFile?` | `ApiResponse<UserResponseDTO>` |
| User detail | `GET /api/v1/admin/users/{userId}` | ADMIN | path param | `ApiResponse<UserResponseDTO>` |
| Update user | `PUT /api/v1/admin/users/{userId}` | ADMIN | multipart `user` + `avatarFile?` | `ApiResponse<UserResponseDTO>` |
| Delete user | `DELETE /api/v1/admin/users/{userId}` | ADMIN | path param | `ApiResponse<null>` |
| Update role | `PUT /api/v1/admin/users/{userId}/role` | ADMIN | `{ role }` | `ApiResponse<UserResponseDTO>` |

### 8.3 Product management

| Function | Method + path | Role | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Product list | `GET /api/v1/admin/products?page=1&search=...` | ADMIN | query params | `products`, `currentPage`, `totalPages`, `totalElements` |
| Create product | `POST /api/v1/admin/products` | ADMIN | multipart `product` + `productImg?` | `ApiResponse<ProductResponseDTO>` |
| Product detail | `GET /api/v1/admin/products/{productId}` | ADMIN | path param | `ApiResponse<ProductResponseDTO>` |
| Update product | `PUT /api/v1/admin/products/{productId}` | ADMIN | multipart `product` + `productImg?` | `ApiResponse<ProductResponseDTO>` |
| Delete product | `DELETE /api/v1/admin/products/{productId}` | ADMIN | path param | `ApiResponse<null>` |

### 8.4 Racket management

| Function | Method + path | Role | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Racket list | `GET /api/v1/admin/rackets?page=1` | ADMIN | query params | `rackets`, `currentPage`, `totalPages` |
| Racket detail | `GET /api/v1/admin/rackets/{racketId}` | ADMIN | path param | `ApiResponse<Racket>` |
| Create racket | `POST /api/v1/admin/rackets` | ADMIN | multipart `racket` + `racketImg?` | `ApiResponse<Racket>` |
| Update racket | `PUT /api/v1/admin/rackets/{racketId}` | ADMIN | multipart `racket` + `racketImg?` | `ApiResponse<Racket>` |

### 8.5 Booking management

| Function | Method + path | Role | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Booking list | `GET /api/v1/admin/bookings` | STAFF/ADMIN | `date?`, `search?`, `page=1`, `size=5` | `bookings`, `currentPage`, `totalPages`, `totalElements` |
| Booking detail | `GET /api/v1/admin/bookings/{id}` | STAFF/ADMIN | path param | `booking`, `rentalTools` |
| Delete booking | `DELETE /api/v1/admin/bookings/{id}` | STAFF/ADMIN | path param | `ApiResponse<null>` |
| Update booking status | `PUT /api/v1/admin/bookings/{id}/status` | STAFF/ADMIN | `{ status }` | `ApiResponse<BookingResponseDTO>` |

### 8.6 Rental management

| Function | Method + path | Role | Request | Response |
| :--- | :--- | :--- | :--- | :--- |
| Rental list | `GET /api/v1/admin/rentals` | STAFF/ADMIN | `search?`, `page=0`, `size=5` | `rentals`, `currentPage`, `totalPages`, `totalElements` |
| Rental detail | `GET /api/v1/admin/rentals/{id}` | STAFF/ADMIN | path param | `rentalTool`, `racket` |
| Update rental status | `PUT /api/v1/admin/rentals/{id}/status` | STAFF/ADMIN | `{ status }` | `ApiResponse<RentalToolDTO>` |

Note:
- current rental admin list uses `getRentalByTypeDAILY`, so staff-facing list is effectively focused on daily rentals

### 8.7 NTFY APIs

| Function | Method + path | Role in backend | Response |
| :--- | :--- | :--- | :--- |
| SSE stream | `GET /api/v1/ntfy-sse/{topic}` | Public | raw SSE |
| Send notify | `POST /api/v1/notify` | Authenticated | plain text |

Frontend should still restrict notify UI to admin/staff usage even though backend does not enforce admin role on this path.

## 9. Recommended frontend architecture

Recommended Angular folder structure:

```text
src/
  app/
    core/
      auth/
      http/
      guards/
      stores/
    shared/
      models/
      ui/
      utils/
    features/
      auth/
      home/
      products/
      rackets/
      booking/
      rental/
      profile/
      match-post/
      admin/
        dashboard/
        users/
        products/
        rackets/
        bookings/
        rentals/
        statistics/
    app.routes.ts
    app.config.ts
```

Core frontend services:
- `AuthService`
- `ProductService`
- `BookingService`
- `RentalService`
- `PaymentService`
- `ProfileService`
- `MatchPostService`
- `AdminService`
- `NtfySseService`
- `WebSocketService` for later production use

Core frontend models:
- `ApiResponse<T>`
- `JwtAuthResponse`
- `ProductResponseDTO`
- `UserResponseDTO`
- `BookingResponseDTO`
- `RentalToolDTO`
- `MatchPostResponseDTO`
- `AvailableTimeDTO`
- raw `Racket`
- raw `RacketStockByDate`

## 10. Frontend implementation rules

1. Always use an auth interceptor for Bearer token.
2. Add a central error interceptor that understands:
   - validation error payloads
   - security 401/403
   - raw endpoint exceptions
3. Use endpoint-specific pagination adapters.
4. Do not locally compute final rental or booking payable amount as source of truth.
5. Treat admin booking status update as a special case because the backend expects a label, not enum key.
6. Force re-login after password change.
7. Strongly consider forcing re-login after email change.
8. Build chat history by HTTP first; enable STOMP only after backend auth contract is confirmed.

## 11. Current backend constraints

These are real constraints that the frontend documentation must acknowledge:

1. Reset-password email link is still hard-coded to a backend domain path, not a frontend route.
2. WebSocket authentication flow is still not formally defined in code.
3. User notification payload over `/user/queue/notifications` is not fully consistent:
   - sometimes plain string
   - sometimes object `{ id, message }`
4. Booking status update expects label parsing, not enum key parsing.
5. Pagination base is inconsistent across endpoints.
6. Some request/response contracts still use raw entities instead of frontend-focused DTOs.
7. `POST /api/v1/notify` is authenticated but not admin-role protected.

## 12. Safe implementation order

Frontend can safely start with:
- auth JWT
- home/products/rackets
- booking HTTP flow
- rental create + pay flow
- payment result handling from backend callback response contract
- profile/history
- admin CRUD and statistics

Build later or behind a feature flag:
- STOMP chat production
- user notification realtime
- frontend reset-password page tied to email link
