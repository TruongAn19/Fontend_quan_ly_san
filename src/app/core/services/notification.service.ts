import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { RxStomp, RxStompConfig } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api-response.model';
import { NotificationDTO, NotificationPage } from '../models/notification.model';
import { AuthService } from './auth.service';

/**
 * One-stop shop for notification HTTP + STOMP/SockJS for both client and admin
 * surfaces. The HTTP and WS halves are independent — you can use either.
 *
 * <p>WS topics (set up in BE WebSocketConfig):
 * <ul>
 *   <li><code>/user/queue/notifications</code> — per-user push (resolved by
 *       the BE from the auth principal); the FE just subscribes to the
 *       relative destination.</li>
 *   <li><code>/topic/staff-notifications</code> — broadcast to admin/staff.</li>
 * </ul>
 *
 * <p>A single RxStomp instance multiplexes both. We re-activate on auth state
 * changes so a fresh login picks up the new principal.
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);

  private readonly CLIENT_URL = `${environment.apiBaseUrl}/client/notifications`;
  private readonly ADMIN_URL  = `${environment.apiBaseUrl}/admin/notifications`;

  private rxStomp: RxStomp | null = null;

  /** Unread badge — kept in sync by HTTP refresh + WS pushes. */
  unreadCount = signal<number>(0);

  /** Hot stream of incoming notifications (any source — user or staff). */
  private incoming$ = new Subject<NotificationDTO>();
  notifications$ = this.incoming$.asObservable();

  // ---- HTTP (client surface) ----

  list(page = 0, size = 10): Observable<ApiResponse<NotificationPage>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<NotificationPage>>(this.CLIENT_URL, { params });
  }

  fetchUnreadCount(): Observable<ApiResponse<{ unread: number }>> {
    return this.http.get<ApiResponse<{ unread: number }>>(`${this.CLIENT_URL}/unread-count`);
  }

  markRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.CLIENT_URL}/${id}/read`, {});
  }

  markAllRead(): Observable<ApiResponse<{ updated: number }>> {
    return this.http.put<ApiResponse<{ updated: number }>>(`${this.CLIENT_URL}/read-all`, {});
  }

  // ---- HTTP (admin surface) ----

  listAdmin(page = 0, size = 10): Observable<ApiResponse<NotificationPage>> {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<ApiResponse<NotificationPage>>(this.ADMIN_URL, { params });
  }

  fetchAdminUnreadCount(): Observable<ApiResponse<{ unread: number }>> {
    return this.http.get<ApiResponse<{ unread: number }>>(`${this.ADMIN_URL}/unread-count`);
  }

  markAdminRead(id: number): Observable<ApiResponse<void>> {
    return this.http.put<ApiResponse<void>>(`${this.ADMIN_URL}/${id}/read`, {});
  }

  markAllAdminRead(): Observable<ApiResponse<{ updated: number }>> {
    return this.http.put<ApiResponse<{ updated: number }>>(`${this.ADMIN_URL}/read-all`, {});
  }

  /** Initial badge sync. Call after login. */
  refreshUnread(isAdmin: boolean): void {
    const obs = isAdmin ? this.fetchAdminUnreadCount() : this.fetchUnreadCount();
    obs.subscribe({
      next: (res) => this.unreadCount.set(res.data?.unread ?? 0),
      error: () => { /* keep prior value */ },
    });
  }

  // ---- STOMP/SockJS ----

  /**
   * Spin up the STOMP connection. Subscribes the per-user queue automatically;
   * pass {@code forAdmin=true} to also subscribe to the staff broadcast topic.
   */
  connect(forAdmin: boolean): void {
    if (this.rxStomp?.connected()) return;
    if (!this.auth.isLoggedIn()) return;
    if (!environment.features.enableRealtimeNotifications) return;

    const cfg: RxStompConfig = {
      webSocketFactory: () => new SockJS(environment.stompSockJsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: () => {},
    };

    const rx = new RxStomp();
    rx.configure(cfg);
    rx.activate();
    this.rxStomp = rx;

    rx.watch('/user/queue/notifications').subscribe((msg) => {
      this.handleIncoming(msg.body);
    });

    if (forAdmin) {
      rx.watch('/topic/staff-notifications').subscribe((msg) => {
        this.handleIncoming(msg.body);
      });
    }
  }

  disconnect(): void {
    if (this.rxStomp) {
      this.rxStomp.deactivate().catch(() => {});
      this.rxStomp = null;
    }
  }

  private handleIncoming(raw: string): void {
    try {
      const dto: NotificationDTO = JSON.parse(raw);
      this.incoming$.next(dto);
      // Optimistic badge bump — pessimistic reconcile happens via fetchUnreadCount.
      this.unreadCount.update(n => n + 1);
    } catch {
      /* ignore malformed frame */
    }
  }
}
