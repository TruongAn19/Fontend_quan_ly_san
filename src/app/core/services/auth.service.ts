import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtAuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;

  currentUser = signal<string | null>(localStorage.getItem('email'));
  role = signal<string | null>(localStorage.getItem('role'));
  
  isLoggedIn = computed(() => !!this.currentUser());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<ApiResponse<JwtAuthResponse>> {
    return this.http.post<ApiResponse<JwtAuthResponse>>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        if (response.data && response.data.accessToken) {
          localStorage.setItem('accessToken', response.data.accessToken);
          localStorage.setItem('email', response.data.email);
          localStorage.setItem('role', response.data.role);
          
          this.currentUser.set(response.data.email);
          this.role.set(response.data.role);
        }
      })
    );
  }

  register(data: RegisterRequest): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/register`, data);
  }

  forgotPassword(email: string): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/forgot-password`, { email });
  }

  resetPassword(data: { token: string; password?: string }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/reset-password`, data);
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('email');
    localStorage.removeItem('role');
    
    this.currentUser.set(null);
    this.role.set(null);
    
    this.router.navigate(['/login']);
  }
}
