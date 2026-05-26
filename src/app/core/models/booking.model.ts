export interface AvailableTimeDTO {
  id: number;
  time: string;
  available?: boolean;
}

export interface SubPitchDTO {
  id: number;
  name?: string;
  description?: string;
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
}

export interface BookingHistoryResponse {
  bookings: BookingHistoryItem[];
  currentPage?: number;
  totalPages: number;
  totalElements?: number;
}
