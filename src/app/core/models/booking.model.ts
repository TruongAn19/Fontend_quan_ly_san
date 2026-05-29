export interface AvailableTimeDTO {
  id: number;
  time: string;
  available?: boolean;
}

export type PitchType = 'FIVE_ASIDE' | 'SEVEN_ASIDE';

export interface SubPitchDTO {
  id: number;
  name?: string;
  description?: string;
  pitchType?: PitchType;
}

export interface BookingProductInfo {
  id: number;
  name: string;
  description?: string;
  price: number;
  sale?: number;
  depositPrice?: number;
  address?: string;
  imageUrl?: string;
  /** Legacy field name kept for templates that reference {@code product.image}. */
  image?: string;
}

/** Shape of GET /client/bookings/{id}/info response payload. */
export interface BookingInfoResponse {
  product: BookingProductInfo;
  courts: SubPitchDTO[];
  availableTimes: AvailableTimeDTO[];
  totalPrice: number;
}

export interface HoldBookingRequest {
  subPitchId: number;
  availableTimeId: number;
  bookingDate: string;
}

export interface HoldBookingResponse {
  remainingTime: number;
}

export type BookingType = 'ONE_TIME' | 'WEEKLY_RECURRING';

/** Display label for a PitchType — used in select options and badges. */
export function pitchTypeLabel(t: PitchType | undefined | null): string {
  if (t === 'SEVEN_ASIDE') return 'Sân 7 người';
  return 'Sân 5 người';
}

export interface PlaceBookingRequest {
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  productId: number;
  availableTimeId: number;
  /** Backend field name is `courtId` (legacy from the original spec). */
  courtId: number;
  bookingDate: string;
  bookingType: BookingType;
  recurringEndDate?: string | null;
  daysOfWeek?: number[];
  durationMonths?: number | null;
}

export interface EstimatePriceRequest {
  productId: number;
  availableTimeId: number;
  bookingDate: string;
  bookingType: BookingType;
  recurringEndDate?: string | null;
  daysOfWeek?: number[];
  durationMonths?: number | null;
}

export interface EstimatePriceResponse {
  basePrice: number;
  sessions: number;
  totalPrice: number;
  depositPrice: number;
  savings: number;
  discountRate: number;
  /** Optional — surfaced by the template; may be derived client-side. */
  remainingPrice?: number;
}

export interface PlaceBookingResponse {
  bookingId?: number;
  bookingCode?: string;
  paymentUrl?: string;
}

export interface BookingResponseDTO {
  bookingId?: number;
  bookingCode?: string;
  paymentUrl?: string;
}

export type RefundStatus = 'NONE' | 'PENDING_REFUND' | 'REFUNDED' | 'NOT_APPLICABLE';

export interface BookingHistoryItem {
  id: number;
  bookingCode?: string;
  bookingDate?: string;
  status?: string;
  totalPrice?: number;
  depositPrice?: number;
  receiverName?: string;
  receiverPhone?: string;
  product?: BookingProductInfo;
  availableTime?: AvailableTimeDTO;
  bookingType?: BookingType;
  /** Server-enriched fields used by templates. */
  pitchName?: string;
  time?: string;
  courtName?: string;
  // CANCEL_BOOKING_FEATURE
  refundStatus?: RefundStatus;
  refundAmount?: number;
  cancelledAt?: string;
  usedSessionsAtCancel?: number;
  totalSessionsAtCancel?: number;
  cancelReason?: string;
}

export interface BookingHistoryResponse {
  bookings: BookingHistoryItem[];
  currentPage?: number;
  totalPages: number;
  totalElements?: number;
}

export interface CancelBookingRequest {
  reason?: string;
}

export interface CancelBookingResponse {
  bookingId: number;
  status: string;
  refundStatus: RefundStatus;
  refundAmount: number;
  usedSessions?: number;
  totalSessions?: number;
  cancelledAt: string;
  contactHotline: string;
  contactEmail: string;
}

/** Label for a refund status — used in badges and chips. */
export function refundStatusLabel(s: RefundStatus | undefined | null): string {
  switch (s) {
    case 'PENDING_REFUND': return 'Chờ hoàn cọc';
    case 'REFUNDED':       return 'Đã hoàn cọc';
    case 'NOT_APPLICABLE': return 'Không hoàn cọc';
    default:               return 'Không áp dụng';
  }
}
