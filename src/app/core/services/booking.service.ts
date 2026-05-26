import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  AvailableTimeDTO,
  BookingHistoryResponse,
  BookingInfoResponse,
  EstimatePriceRequest,
  EstimatePriceResponse,
  HoldBookingRequest,
  HoldBookingResponse,
  PlaceBookingRequest,
  PlaceBookingResponse,
} from '../models/booking.model';

@Injectable({
  providedIn: 'root'
})
export class BookingService {
  private readonly API_URL = `${environment.apiBaseUrl}/client/bookings`;

  constructor(private http: HttpClient) {}

  getRecommendSlots(productId: number): Observable<ApiResponse<AvailableTimeDTO[]>> {
    return this.http.get<ApiResponse<AvailableTimeDTO[]>>(`${this.API_URL}/recommend/${productId}`);
  }

  getBookingInfo(productId: number): Observable<ApiResponse<BookingInfoResponse>> {
    return this.http.get<ApiResponse<BookingInfoResponse>>(`${this.API_URL}/${productId}/info`);
  }

  getAvailableTimes(date: string, courtId: number): Observable<ApiResponse<AvailableTimeDTO[]>> {
    const params = new HttpParams().set('date', date).set('courtId', courtId.toString());
    return this.http.get<ApiResponse<AvailableTimeDTO[]>>(`${this.API_URL}/available-times`, { params });
  }

  holdSlot(payload: HoldBookingRequest): Observable<ApiResponse<HoldBookingResponse>> {
    return this.http.post<ApiResponse<HoldBookingResponse>>(`${this.API_URL}/hold`, payload);
  }

  estimatePrice(payload: EstimatePriceRequest): Observable<ApiResponse<EstimatePriceResponse>> {
    return this.http.post<ApiResponse<EstimatePriceResponse>>(`${this.API_URL}/estimate`, payload);
  }

  placeBooking(payload: PlaceBookingRequest): Observable<ApiResponse<PlaceBookingResponse>> {
    return this.http.post<ApiResponse<PlaceBookingResponse>>(`${this.API_URL}/place`, payload);
  }

  getBookingHistory(page: number = 0): Observable<ApiResponse<BookingHistoryResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', '5');
    return this.http.get<ApiResponse<BookingHistoryResponse>>(
      `${environment.apiBaseUrl}/client/booking-history`, { params });
  }

  cancelBooking(bookingId: number): Observable<ApiResponse<void>> {
    return this.http.delete<ApiResponse<void>>(`${this.API_URL}/${bookingId}`);
  }
}
