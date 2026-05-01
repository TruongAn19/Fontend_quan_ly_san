export interface ProductResponseDTO {
  id: number;
  name: string;
  description?: string;
  price: number;
  discountPrice?: number;
  address?: string;
  imageUrl?: string;
}

export interface ProductListResponse {
  products: ProductResponseDTO[];
  currentPage: number;
  totalPages: number;
  totalElements?: number;
}
