import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginationAdapter } from '../utils/pagination.adapter';
import { ApiResponse } from '../models/api-response.model';
import {
  HomeResponse,
  ProductDetailResponse,
  ProductListResponse,
} from '../models/product.model';
import {
  Equipment,
  EquipmentListResponse,
  EquipmentStockByDate,
} from '../models/equipment.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getHomeData(page: number = 1): Observable<ApiResponse<HomeResponse>> {
    const apiPage = PaginationAdapter.toApiPage(page, '1-based');
    const params = new HttpParams().set('page', apiPage.toString());
    return this.http.get<ApiResponse<HomeResponse>>(`${this.API_URL}/client/home`, { params });
  }

  getProducts(filters: {
    page: number;
    search?: string;
    address?: string;
    price?: number | null;
    sort?: string;
  }): Observable<ApiResponse<ProductListResponse>> {
    const apiPage = PaginationAdapter.toApiPage(filters.page, '1-based');
    let params = new HttpParams().set('page', apiPage.toString());
    
    if (filters.search) params = params.set('search', filters.search);
    if (filters.address) params = params.set('address', filters.address);
    if (filters.price != null) params = params.set('price', filters.price.toString());
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ApiResponse<ProductListResponse>>(`${this.API_URL}/products`, { params });
  }

  getProductDetail(productId: number): Observable<ApiResponse<ProductDetailResponse>> {
    return this.http.get<ApiResponse<ProductDetailResponse>>(`${this.API_URL}/products/${productId}`);
  }

  getEquipments(
    filters: { page: number; factory?: string; price?: string; sort?: string },
  ): Observable<ApiResponse<EquipmentListResponse>> {
    const apiPage = PaginationAdapter.toApiPage(filters.page, '0-based');
    let params = new HttpParams().set('page', apiPage.toString());

    if (filters.factory) params = params.set('factory', filters.factory);
    if (filters.price) params = params.set('price', filters.price);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<ApiResponse<EquipmentListResponse>>(`${this.API_URL}/equipments`, { params });
  }

  getEquipmentDetail(equipmentId: number): Observable<ApiResponse<Equipment>> {
    return this.http.get<ApiResponse<Equipment>>(`${this.API_URL}/equipments/${equipmentId}`);
  }

  checkEquipmentStock(
    payload: { equipmentId: number; date: string },
  ): Observable<EquipmentStockByDate> {
    return this.http.post<EquipmentStockByDate>(`${this.API_URL}/equipment-stock`, payload);
  }
}
