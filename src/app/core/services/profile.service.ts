import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { UserResponseDTO } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly API_URL = `${environment.apiBaseUrl}/client`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<ApiResponse<UserResponseDTO>> {
    return this.http.get<ApiResponse<UserResponseDTO>>(`${this.API_URL}/profile`);
  }

  updateProfile(formData: FormData): Observable<ApiResponse<UserResponseDTO>> {
    return this.http.put<ApiResponse<UserResponseDTO>>(`${this.API_URL}/profile`, formData);
  }

  changePassword(params: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Observable<ApiResponse<null>> {
    let httpParams = new HttpParams()
      .set('oldPassword', params.oldPassword)
      .set('newPassword', params.newPassword)
      .set('confirmPassword', params.confirmPassword);

    return this.http.put<ApiResponse<null>>(`${this.API_URL}/change-password`, null, { params: httpParams });
  }
}
