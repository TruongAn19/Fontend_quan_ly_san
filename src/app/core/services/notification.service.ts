import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RxStomp } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';

export interface AppNotification {
  id: number | null;
  type: 'REFUND_REQUEST' | 'REFUND_DONE' | 'BOOKING_CANCELLED' | 'SYSTEM' | string;
  refType: string | null;
  refId: number | null;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly API_USER = `${environment.apiBaseUrl}/client/notifications`;
  private readonly API_ADMIN = `${environment.apiBaseUrl}/admin/notifications`;

  private rxStomp: RxStomp | null = null;
  private activated = false;

  constructor(private http: HttpClient) {}

  // ----- HTTP -----

  list(forAdmin: boolean = false, page = 0, size = 20): Observable<any> {
    const base = forAdmin ? this.API_ADMIN : this.API_USER;
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<any>(base, { params });
  }

  unreadCount(forAdmin: boolean = false): Observable<number> {
    const base = forAdmin ? this.API_ADMIN : this.API_USER;
    return this.http.get<ApiResponse<{ unreadCount: number }>>(`${base}/unread-count`)
      .pipe(map(res => res?.data?.unreadCount ?? 0));
  }

  markRead(id: number, forAdmin: boolean = false): Observable<any> {
    const base = forAdmin ? this.API_ADMIN : this.API_USER;
    return this.http.put<any>(`${base}/${id}/read`, {});
  }

  markAllRead(forAdmin: boolean = false): Observable<any> {
    const base = forAdmin ? this.API_ADMIN : this.API_USER;
    return this.http.put<any>(`${base}/read-all`, {});
  }

  // ----- WebSocket -----

  private ensureActive(): void {
    if (this.activated) return;
    const token = localStorage.getItem('accessToken') ?? '';
    const httpBase = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const wsUrl = `${httpBase}/ws?token=${encodeURIComponent(token)}`;

    this.rxStomp = new RxStomp();
    this.rxStomp.configure({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
    });
    this.rxStomp.activate();
    this.activated = true;
  }

  /** Notification gửi tới user hiện tại (đã auth qua JWT). */
  watchUserNotifications(): Observable<AppNotification> {
    this.ensureActive();
    return this.rxStomp!.watch('/user/queue/notifications').pipe(
      map(msg => JSON.parse(msg.body) as AppNotification)
    );
  }

  /** Notification broadcast cho mọi admin/staff đang online. */
  watchStaffNotifications(): Observable<AppNotification> {
    this.ensureActive();
    return this.rxStomp!.watch('/topic/staff-notifications').pipe(
      map(msg => JSON.parse(msg.body) as AppNotification)
    );
  }

  disconnect(): void {
    if (this.rxStomp && this.activated) {
      this.rxStomp.deactivate();
      this.activated = false;
      this.rxStomp = null;
    }
  }
}
