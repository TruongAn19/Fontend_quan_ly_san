import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, finalize, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { JwtAuthResponse, LoginRequest, RegisterRequest } from '../models/auth.model';
import { ApiResponse } from '../models/api-response.model';

/**
 * Token lives in an httpOnly cookie set by the backend on /login (FIX-S1).
 * The frontend only tracks identity (email + role) for UI gating; the cookie
 * itself is invisible to JS, so XSS can't lift the credential.
 *
 * localStorage is used only for non-sensitive identity bits so a hard reload
 * doesn't drop the logged-in state before the next request validates the cookie.
 */
const STORAGE_KEY_EMAIL = 'email';
const STORAGE_KEY_ROLE = 'role';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = `${environment.apiBaseUrl}/auth`;

  currentUser = signal<string | null>(localStorage.getItem(STORAGE_KEY_EMAIL));
  role = signal<string | null>(localStorage.getItem(STORAGE_KEY_ROLE));

  isLoggedIn = computed(() => !!this.currentUser());

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  login(credentials: LoginRequest): Observable<ApiResponse<JwtAuthResponse>> {
    // withCredentials so the browser stores the Set-Cookie response.
    return this.http.post<ApiResponse<JwtAuthResponse>>(`${this.API_URL}/login`, credentials, {
      withCredentials: true,
    }).pipe(
      tap(response => {
        if (response.data) {
          localStorage.setItem(STORAGE_KEY_EMAIL, response.data.email);
          localStorage.setItem(STORAGE_KEY_ROLE, response.data.role);

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

  resetPassword(data: { token: string; password: string }): Observable<ApiResponse<null>> {
    return this.http.post<ApiResponse<null>>(`${this.API_URL}/reset-password`, data);
  }

  /**
   * Ask the BE to clear the httpOnly cookie, then clear local UI state.
   * We don't gate the local clear on the server response — the user wants out,
   * worst case the cookie is gone client-side anyway thanks to Max-Age=0.
   */
  logout(): void {
    this.http.post<ApiResponse<void>>(`${this.API_URL}/logout`, {}, { withCredentials: true })
      .pipe(finalize(() => {
        localStorage.removeItem(STORAGE_KEY_EMAIL);
        localStorage.removeItem(STORAGE_KEY_ROLE);
        this.currentUser.set(null);
        this.role.set(null);
        this.router.navigate(['/login']);
      }))
      .subscribe({ error: () => { /* ignore — finalize still runs */ } });
  }
}
