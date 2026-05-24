import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly API_URL = `${environment.apiBaseUrl}/admin`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/dashboard`);
  }

  getRevenueStats(startDate: string, endDate: string): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/products/statistics/revenue`, { params });
  }

  getRacketStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/racket-statistics`);
  }

  getUsers(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/users`);
  }

  createUser(payload: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/users`, payload);
  }

  updateUser(userId: number, payload: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/users/${userId}`, payload);
  }

  deleteUser(userId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/users/${userId}`);
  }

  updateUserRole(userId: number, role: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/users/${userId}/role`, { role });
  }

  getProducts(page: number = 1, search: string = ''): Observable<any> {
    let params = new HttpParams().set('page', page.toString());
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.API_URL}/products`, { params });
  }

  createProduct(payload: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/products`, payload);
  }

  updateProduct(productId: number, payload: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/products/${productId}`, payload);
  }

  deleteProduct(productId: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/products/${productId}`);
  }

  getRackets(page: number = 1): Observable<any> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<any>(`${this.API_URL}/rackets`, { params });
  }

  createRacket(payload: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/rackets`, payload);
  }

  updateRacket(racketId: number, payload: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/rackets/${racketId}`, payload);
  }

  getBookings(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(key => {
      if (filters[key]) params = params.set(key, filters[key].toString());
    });
    return this.http.get<any>(`${this.API_URL}/bookings`, { params });
  }

  updateBookingStatus(bookingId: number, status: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/bookings/${bookingId}/status`, { status });
  }

  confirmRefund(bookingId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/bookings/${bookingId}/refund`, {});
  }

  getBookingDetail(bookingId: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/bookings/${bookingId}`);
  }

  getRentals(page: number = 0, search: string = ''): Observable<any> {
    let params = new HttpParams().set('page', page.toString()).set('size', '5');
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.API_URL}/rentals`, { params });
  }

  updateRentalStatus(rentalId: number, status: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/rentals/${rentalId}/status`, { status });
  }
}
