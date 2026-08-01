import { UserResponseDTO } from './user.model';
import { ProductResponseDTO } from './product.model';
import { Equipment } from './equipment.model';
import { RentalToolDTO } from './rental.model';

export interface AvailableTimeDTO {
  id: number;
  time: string;
  status?: string;
}

export type PitchType = 'FIVE_ASIDE' | 'SEVEN_ASIDE';

export interface SubPitchDTO {
  id: number;
  name: string;
  pitchType: PitchType;
  productId: number;
}

export interface BookingCourtResponse {
  id: number;
  name: string;
  pitchType: PitchType;
  product: {
    id: number;
    name: string;
  } | null;
  subPitchAvailableTimes: unknown[];
}

/** Shape of GET /client/bookings/{id}/info response payload. */
export interface BookingInfoResponse {
  product: ProductResponseDTO;
  courts: BookingCourtResponse[];
  availableTimes: Array<{ id: number; time: string }>;
  totalPrice: number;
  equipments: Equipment[];
}

export interface BookingEquipmentSelection {
  equipmentId: number;
  quantity: number;
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
  equipments?: BookingEquipmentSelection[];
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
  availableTime?: AvailableTimeDTO;
  bookingType?: BookingType;
  /** Server-enriched fields used by templates. */
  pitchName?: string;
  time?: string;
  courtName?: string;
  bookingDetails?: BookingDetailResponseDTO[];
  rentalTools?: RentalToolDTO[];
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

export interface BookingDetailResponseDTO {
  id: number;
  price: number;
  sale: number;
  date: string;
  productId: number | null;
  productName: string | null;
  availableTimeId: number | null;
  availableTime: string | null;
  subPitchId: number | null;
  subPitchName: string | null;
}

export interface AdminBookingDTO {
  id: number;
  bookingCode: string | null;
  totalPrice: number;
  depositPrice: number;
  receiverName: string | null;
  receiverAddress: string | null;
  receiverPhone: string | null;
  status: string;
  bookingDate: string | null;
  rentalToolCode: string | null;
  user: UserResponseDTO | null;
  courtName: string | null;
  time: string | null;
  bookingDetails: BookingDetailResponseDTO[];
  bookingType: BookingType | null;
  refundStatus: RefundStatus | null;
  refundAmount: number | null;
  cancelledAt: string | null;
  usedSessionsAtCancel: number | null;
  totalSessionsAtCancel: number | null;
  cancelReason: string | null;
}

export interface AdminBookingListResponse {
  bookings: AdminBookingDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
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
