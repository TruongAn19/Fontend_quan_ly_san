export type RentalType = 'DAILY' | 'ON_SITE';

export type RentalPaymentMethod = 'VNPAY' | 'CASH';

export type RentalStatus =
  | 'PENDING'
  | 'RENTING'
  | 'COMPLETED'
  | 'CANCELLED';

export type RentalPaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export type RentalRefundStatus = 'NONE' | 'PENDING_REFUND' | 'REFUNDED' | 'NOT_APPLICABLE';

export interface CreateRentalRequest {
  fullName: string;
  email: string;
  phone: string;
  type: RentalType;
  equipmentId: number;
  quantity: number;
  /** Required when type === 'DAILY'. */
  quantityDay?: number;
  /** Required when type === 'DAILY'. ISO date (YYYY-MM-DD). */
  rentalDate?: string;
  /** Required when type === 'ON_SITE'. */
  bookingCode?: string;
}

export interface RentalCreatedResponse {
  id: number;
  rentalToolCode?: string;
  status?: RentalStatus;
  paymentStatus?: RentalPaymentStatus;
  totalPrice?: number;
}

export interface PayRentalRequest {
  paymentMethod: RentalPaymentMethod;
}

export interface PayRentalResponse {
  paymentUrl?: string;
  rentalId?: number;
}

export interface RentalHistoryItem {
  id: number;
  rentalToolCode?: string;
  rentalDate?: string;
  status?: RentalStatus | string;
  paymentStatus?: RentalPaymentStatus | string;
  type?: RentalType | string;
  quantity?: number;
  quantityDay?: number;
  rentalPrice?: number;
  price?: number;
  equipmentName?: string;
  bookingCode?: string;
  /** Enriched on the BE in {@code RentalToolService.enrichDTO}. */
  bookingDate?: string;
  /** Enriched on the BE in {@code RentalToolService.enrichDTO}. */
  bookingTime?: string;
  bookingId?: string | number | null;
  refundStatus?: RentalRefundStatus | string;
  depositAmount?: number;
  cancelledAt?: string;
}

export interface RentalHistoryResponse {
  rentals: RentalHistoryItem[];
  currentPage?: number;
  totalPages: number;
  totalElements?: number;
}

/** Exact response shape of the backend RentalToolDTO. */
export interface RentalToolDTO {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string | null;
  type: string | null;
  bookingId: string | null;
  bookingCode: string | null;
  bookingDate: string | null;
  bookingTime: string | null;
  equipmentId: string | null;
  equipmentName: string | null;
  productId: string | null;
  price: number;
  rentalPrice: number;
  status: RentalStatus;
  paymentStatus: RentalPaymentStatus;
  quantity: number;
  quantityDay: number;
  rentalDate: string | null;
  rentalToolCode: string | null;
  refundStatus: RentalRefundStatus;
  depositAmount: number;
  cancelledAt: string | null;
}

export interface RentalToolListResponse {
  rentals: RentalToolDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

/**
 * Loose shape for VNPay callback payloads — the same endpoint covers both
 * booking and rental flows, so most fields are optional.
 */
export interface VnpayCallbackData {
  type?: string;
  status?: string;
  bookingId?: number;
  bookingCode?: string;
  rentalToolId?: number;
  rentalCode?: string;
}
