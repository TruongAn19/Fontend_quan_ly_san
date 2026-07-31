import { Equipment } from './equipment.model';

export type PitchType = 'FIVE_ASIDE' | 'SEVEN_ASIDE';

/** Exact response shape of the backend ProductResponseDTO. */
export interface ProductResponseDTO {
  id: number;
  name: string;
  price: number;
  image: string | null;
  detailDesc: string | null;
  shortDesc: string | null;
  quantity: number;
  sale: number;
  address: string | null;
  addressDetail: string | null;
  depositPrice: number;
  status: string | null;
  ownerName: string | null;
  pitchType: PitchType | null;
}

export interface ProductListResponse {
  products: ProductResponseDTO[];
  currentPage: number;
  totalPages: number;
  totalElements: number;
}

export interface ProductAvailableTime {
  id: number;
  time: string;
}

export interface ProductDetailResponse {
  product: ProductResponseDTO;
  availableTime: ProductAvailableTime[];
  discountPrice: number;
  equipments: Equipment[];
}

export interface HomeResponse {
  products: ProductResponseDTO[];
  equipments: Equipment[];
  topProducts: ProductResponseDTO[];
  topEquipments: Equipment[];
  currentPage: number;
  totalPages: number;
}
