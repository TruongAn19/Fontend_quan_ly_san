import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class RentalService {
  private readonly API_URL = `${environment.apiBaseUrl}`;

  constructor(private http: HttpClient) {}

  createRental(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/rentals`, payload);
  }

  payRental(rentalId: number, payload: { paymentMethod: string }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.API_URL}/rentals/${rentalId}/pay`, payload);
  }

  vnpayCallback(params: any): Observable<ApiResponse<any>> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.set(key, params[key].toString());
      }
    });
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/payments/vnpay-callback`, { params: httpParams });
  }

  getRentalHistory(page: number = 0): Observable<any> {
    const params = new HttpParams().set('page', page.toString()).set('size', '5');
    return this.http.get<any>(`${this.API_URL}/client/rental-history`, { params });
  }

  getRentalDetail(id: number): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/client/rental-history/${id}`);
  }
}
