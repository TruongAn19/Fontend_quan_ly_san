export interface Equipment {
  id: number;
  name: string;
  factory?: string;
  price: number;
  imageUrl?: string;
}

/**
 * Detail shape used by rental form header. `image` từ BE được đổi alias
 * sang `imageUrl` cho nhất quán với phần còn lại của FE; `description`
 * hiện chưa có trên BE — sẽ undefined cho tới khi backend bổ sung.
 */
export interface EquipmentDetail {
  id: number;
  name: string;
  price: number;
  rentalPricePerDay?: number;
  description?: string;
  imageUrl?: string;
}

export interface EquipmentStockByDate {
  equipmentId: number;
  date: string;
  availableCount: number;
}

export interface EquipmentListResponse {
  equipments: Equipment[];
  currentPage: number;
  totalPages: number;
  totalElements?: number;
}
