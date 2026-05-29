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

  getEquipmentStats(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/equipment-statistics`);
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

  getSubPitches(productId: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('productId', productId.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/sub-pitches`, { params });
  }

  createSubPitch(payload: { productId: number; name: string; pitchType: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/sub-pitches`, payload);
  }

  updateSubPitch(id: number, payload: { name?: string; pitchType?: string }): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/sub-pitches/${id}`, payload);
  }

  deleteSubPitch(id: number): Observable<ApiResponse<null>> {
    return this.http.delete<ApiResponse<null>>(`${this.API_URL}/sub-pitches/${id}`);
  }

  getEquipments(page: number = 1): Observable<any> {
    const params = new HttpParams().set('page', page.toString());
    return this.http.get<any>(`${this.API_URL}/equipments`, { params });
  }

  createEquipment(payload: FormData): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/equipments`, payload);
  }

  updateEquipment(equipmentId: number, payload: FormData): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/equipments/${equipmentId}`, payload);
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

  getRentals(page: number = 0, search: string = ''): Observable<any> {
    let params = new HttpParams().set('page', page.toString()).set('size', '5');
    if (search) params = params.set('search', search);
    return this.http.get<any>(`${this.API_URL}/rentals`, { params });
  }

  updateRentalStatus(rentalId: number, status: string): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/rentals/${rentalId}/status`, { status });
  }

  // ---- CANCEL_BOOKING_FEATURE — admin refund management ----

  /**
   * List bookings filtered by refund status (admin refund-requests page).
   * Pass {@code status='PENDING_REFUND'|'REFUNDED'} or omit for all DA_HUY.
   */
  getRefundRequests(status?: 'PENDING_REFUND' | 'REFUNDED' | null, page = 0, size = 10): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (status) params = params.set('status', status);
    return this.http.get<any>(`${this.API_URL}/bookings/refund-requests`, { params });
  }

  /** Mark a booking's deposit as refunded — fires REFUND_DONE notification BE-side. */
  confirmRefund(bookingId: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.API_URL}/bookings/${bookingId}/refund`, {});
  }

  // ---- RentalTool refund management ----

  getRentalRefunds(refundStatus?: 'PENDING_REFUND' | 'REFUNDED' | null, page = 0, size = 10): Observable<any> {
    let params = new HttpParams().set('page', page).set('size', size);
    if (refundStatus) params = params.set('refundStatus', refundStatus);
    return this.http.get<any>(`${this.API_URL}/rentals/refunds`, { params });
  }

  confirmRentalRefund(rentalId: number): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/rentals/${rentalId}/confirm-refund`, {});
  }
}
