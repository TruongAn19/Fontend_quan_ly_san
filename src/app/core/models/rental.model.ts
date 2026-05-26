export type RentalType = 'DAILY' | 'ON_SITE';

export type RentalPaymentMethod = 'VNPAY' | 'CASH';

export type RentalStatus =
  | 'PENDING'
  | 'PAID'
  | 'COMPLETED'
  | 'CANCELLED';

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
}

export interface RentalHistoryResponse {
  rentals: RentalHistoryItem[];
  currentPage?: number;
  totalPages: number;
  totalElements?: number;
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
