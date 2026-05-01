export interface Racket {
  id: number;
  name: string;
  factory?: string;
  price: number;
  imageUrl?: string;
}

export interface RacketStockByDate {
  racketId: number;
  date: string;
  availableCount: number;
}

export interface RacketListResponse {
  rackets: Racket[];
  currentPage: number;
  totalPages: number;
  totalElements?: number;
}
