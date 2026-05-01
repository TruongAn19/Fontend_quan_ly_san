import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PaginationAdapter } from '../utils/pagination.adapter';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private readonly API_URL = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  getHomeData(page: number = 1): Observable<any> {
    const apiPage = PaginationAdapter.toApiPage(page, '1-based');
    const params = new HttpParams().set('page', apiPage.toString());
    return this.http.get<any>(`${this.API_URL}/client/home`, { params });
  }

  getProducts(filters: { page: number; search?: string; address?: string; price?: number; sort?: string }): Observable<any> {
    const apiPage = PaginationAdapter.toApiPage(filters.page, '1-based');
    let params = new HttpParams().set('page', apiPage.toString());
    
    if (filters.search) params = params.set('search', filters.search);
    if (filters.address) params = params.set('address', filters.address);
    if (filters.price) params = params.set('price', filters.price.toString());
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<any>(`${this.API_URL}/products`, { params });
  }

  getProductDetail(productId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/products/${productId}`);
  }

  getRackets(filters: { page: number; factory?: string; price?: string; sort?: string }): Observable<any> {
    const apiPage = PaginationAdapter.toApiPage(filters.page, '0-based');
    let params = new HttpParams().set('page', apiPage.toString());

    if (filters.factory) params = params.set('factory', filters.factory);
    if (filters.price) params = params.set('price', filters.price);
    if (filters.sort) params = params.set('sort', filters.sort);

    return this.http.get<any>(`${this.API_URL}/rackets`, { params });
  }

  getRacketDetail(racketId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/rackets/${racketId}`);
  }

  checkRacketStock(payload: { racketId: number; date: string }): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/racket-stock`, payload);
  }
}
