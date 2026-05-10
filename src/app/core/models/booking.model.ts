export interface AvailableTimeDTO {
  id: number;
  time: string;
  available?: boolean;
}

export interface HoldBookingRequest {
  subPitchId: number;
  availableTimeId: number;
  bookingDate: string;
}

export interface PlaceBookingRequest {
  receiverName: string;
  receiverAddress: string;
  receiverPhone: string;
  productId: number;
  availableTimeId: number;
  subPitchId: number;
  bookingDate: string;
  bookingType: 'ONE_TIME' | 'WEEKLY_RECURRING';
  recurringEndDate?: string | null;
}

export interface BookingResponseDTO {
  bookingId?: number;
  bookingCode?: string;
  paymentUrl?: string;
}
