import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { RxStomp } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { AuthService } from './auth.service';

export interface NotificationItem {
  id: number;
  type: string;
  refType: string;
  refId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly CLIENT_URL = `${environment.apiBaseUrl}/client/notifications`;

  private rxStomp?: RxStomp;
  private activated = false;

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ---------------- HTTP ----------------

  getNotifications(page = 0, size = 10): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<ApiResponse<any>>(this.CLIENT_URL, { params });
  }

  getUnreadCount(): Observable<ApiResponse<number>> {
    return this.http.get<ApiResponse<number>>(`${this.CLIENT_URL}/unread-count`);
  }

  markRead(id: number): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.CLIENT_URL}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<any>> {
    return this.http.put<ApiResponse<any>>(`${this.CLIENT_URL}/read-all`, {});
  }

  // ---------------- WebSocket (RxStomp) ----------------

  private ensureConnected(): RxStomp {
    if (!this.rxStomp) {
      this.rxStomp = new RxStomp();
      this.rxStomp.configure({
        webSocketFactory: () => new SockJS(environment.wsBaseUrl.replace(/^ws/, 'http')),
        connectHeaders: {
          Authorization: `Bearer ${this.authService.getToken()}`
        },
        heartbeatIncoming: 0,
        heartbeatOutgoing: 20000,
        reconnectDelay: 5000,
        debug: () => { /* silent */ }
      });
    }
    if (!this.activated) {
      this.rxStomp.activate();
      this.activated = true;
    }
    return this.rxStomp;
  }

  /** Notification dành riêng cho user hiện tại (/user/queue/notifications). */
  watchUserNotifications(): Observable<NotificationItem> {
    return this.ensureConnected()
      .watch('/user/queue/notifications')
      .pipe(map(msg => JSON.parse(msg.body) as NotificationItem));
  }

  /** Notification broadcast cho staff/admin (/topic/staff-notifications). */
  watchStaffNotifications(): Observable<NotificationItem> {
    return this.ensureConnected()
      .watch('/topic/staff-notifications')
      .pipe(map(msg => JSON.parse(msg.body) as NotificationItem));
  }

  disconnect(): void {
    if (this.rxStomp && this.activated) {
      this.rxStomp.deactivate();
      this.activated = false;
    }
  }
}
