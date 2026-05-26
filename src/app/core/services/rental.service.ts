import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import {
  CreateRentalRequest,
  PayRentalRequest,
  PayRentalResponse,
  RentalCreatedResponse,
  RentalHistoryResponse,
  VnpayCallbackData,
} from '../models/rental.model';

interface VnpayCallbackParams {
  [key: string]: string | number | boolean | null | undefined;
}

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private readonly API_URL = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  createRental(payload: CreateRentalRequest): Observable<ApiResponse<RentalCreatedResponse>> {
    return this.http.post<ApiResponse<RentalCreatedResponse>>(`${this.API_URL}/rentals`, payload);
  }

  payRental(rentalId: number, payload: PayRentalRequest): Observable<ApiResponse<PayRentalResponse>> {
    return this.http.post<ApiResponse<PayRentalResponse>>(`${this.API_URL}/rentals/${rentalId}/pay`, payload);
  }

  vnpayCallback(params: VnpayCallbackParams): Observable<ApiResponse<VnpayCallbackData>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, value.toString());
      }
    });
    return this.http.get<ApiResponse<VnpayCallbackData>>(`${this.API_URL}/payments/vnpay-callback`, { params: httpParams });
  }

  getRentalHistory(page: number = 0): Observable<ApiResponse<RentalHistoryResponse>> {
    const params = new HttpParams().set('page', page.toString()).set('size', '5');
    return this.http.get<ApiResponse<RentalHistoryResponse>>(`${this.API_URL}/client/rental-history`, { params });
  }
}
