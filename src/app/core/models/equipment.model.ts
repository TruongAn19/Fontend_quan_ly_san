export interface Equipment {
  id: number;
  name: string;
  factory?: string;
  price: number;
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
