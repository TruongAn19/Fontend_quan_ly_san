import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiBaseUrl}/client/bookings`;

  constructor(private http: HttpClient) {}

  getRecommendSlots(productId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/recommend/${productId}`);
  }

  getBookingInfo(productId: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/${productId}/info`);
  }

  /** Danh sách vợt của sân còn cho thuê theo booking (bundled rental). */
  getRacketsByProduct(productId: number): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/products/${productId}/rackets`);
  }

  getAvailableTimes(date: string, courtId: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('date', date).set('courtId', courtId.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.API_URL}/available-times`, { params });
  }

  holdSlot(payload: { subCourtId: number; availableTimeId: number; bookingDate: string }): Observable<ApiResponse<{ remainingTime: number }>> {
    return this.http.post<ApiResponse<{ remainingTime: number }>>(`${this.API_URL}/hold`, payload);
  }

  placeBooking(payload: any): Observable<ApiResponse<{ bookingId: number; bookingCode: string; paymentUrl: string }>> {
    return this.http.post<ApiResponse<{ bookingId: number; bookingCode: string; paymentUrl: string }>>(`${this.API_URL}/place`, payload);
  }

  getBookingHistory(page: number = 0, size: number = 5): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<any>(`${environment.apiBaseUrl}/client/booking-history`, { params });
  }

  /** Huỷ đặt sân (Nhóm 2). Trả về refund summary. */
  cancelBooking(id: number, reason?: string): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/${id}/cancel`, { reason });
  }

  /** Chi tiết 1 booking (kèm rentalTools) từ booking-history. */
  getBookingDetail(id: number): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${environment.apiBaseUrl}/client/booking-history/${id}`);
  }
}
