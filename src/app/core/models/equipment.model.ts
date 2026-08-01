export interface Equipment {
  id: number;
  name: string;
  price: number;
  available: boolean;
  factory: string | null;
  image: string | null;
  rentalPricePerDay: number;
  rentalPricePerPlay: number;
  bookingStockQuantity: number;
  quantity: number;
  status: string | null;
  product: {
    id: number;
    name: string;
  } | null;
}

export type EquipmentDetail = Equipment;

export interface EquipmentStockByDate {
  equipmentId: number;
  date: string;
  availableStock: number;
  reservedStock: number;
  rentalStock: number;
  totalStock: number;
}

export interface EquipmentListResponse {
  equipments: Equipment[];
  currentPage: number;
  totalPages: number;
  totalElements?: number;
}

/** Equipment available for an existing booking's pitch cluster. */
export interface BookingEquipmentResponse {
  equipments: Equipment[];
  bookingCode: string;
}
