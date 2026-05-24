import { Component, inject, signal, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, AppNotification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  /** True nếu hiển thị trong admin layout — sẽ subscribe thêm /topic/staff-notifications. */
  @Input() forAdmin: boolean = false;

  private notificationService = inject(NotificationService);
  private router = inject(Router);

  open = signal<boolean>(false);
  unreadCount = signal<number>(0);
  notifications = signal<AppNotification[]>([]);
  isLoading = signal<boolean>(false);

  private userSub: Subscription | null = null;
  private staffSub: Subscription | null = null;

  ngOnInit(): void {
    this.refreshUnreadCount();
    this.subscribeWebSocket();
  }

  ngOnDestroy(): void {
    this.userSub?.unsubscribe();
    this.staffSub?.unsubscribe();
  }

  toggle(): void {
    const next = !this.open();
    this.open.set(next);
    if (next) this.loadList();
  }

  close(): void {
    this.open.set(false);
  }

  loadList(): void {
    this.isLoading.set(true);
    this.notificationService.list(this.forAdmin, 0, 10).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const items: AppNotification[] = res?.data?.notifications ?? [];
        const unread: number = res?.data?.unreadCount ?? 0;
        this.notifications.set(items);
        this.unreadCount.set(unread);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  refreshUnreadCount(): void {
    this.notificationService.unreadCount(this.forAdmin).subscribe({
      next: (count) => this.unreadCount.set(count),
      error: () => {}
    });
  }

  private subscribeWebSocket(): void {
    // User queue — luôn subscribe để nhận notif của chính mình
    this.userSub = this.notificationService.watchUserNotifications().subscribe({
      next: (notif) => this.handleIncoming(notif),
      error: (err) => console.warn('WS user queue error:', err)
    });

    // Staff broadcast — chỉ subscribe khi đang ở admin context
    if (this.forAdmin) {
      this.staffSub = this.notificationService.watchStaffNotifications().subscribe({
        next: (notif) => this.handleIncoming(notif),
        error: (err) => console.warn('WS staff topic error:', err)
      });
    }
  }

  private handleIncoming(notif: AppNotification): void {
    this.unreadCount.update(n => n + 1);
    // Prepend vào list nếu dropdown đang mở
    if (this.open()) {
      this.notifications.update(list => [notif, ...list].slice(0, 10));
    }
  }

  onClickItem(item: AppNotification): void {
    if (item.id != null && !item.read) {
      this.notificationService.markRead(item.id, this.forAdmin).subscribe({
        next: () => {
          this.notifications.update(list =>
            list.map(n => n.id === item.id ? { ...n, read: true } : n)
          );
          this.unreadCount.update(n => Math.max(0, n - 1));
        },
        error: () => {}
      });
    }
    this.navigateForNotification(item);
    this.close();
  }

  markAllRead(event: Event): void {
    event.stopPropagation();
    this.notificationService.markAllRead(this.forAdmin).subscribe({
      next: () => {
        this.notifications.update(list => list.map(n => ({ ...n, read: true })));
        this.unreadCount.set(0);
      },
      error: () => {}
    });
  }

  private navigateForNotification(item: AppNotification): void {
    if (item.refType !== 'BOOKING' || !item.refId) return;

    if (this.forAdmin) {
      // REFUND_REQUEST → page hoàn cọc; còn lại → admin bookings list
      if (item.type === 'REFUND_REQUEST') {
        this.router.navigate(['/admin/refund-requests']);
      } else {
        this.router.navigate(['/admin/bookings']);
      }
    } else {
      this.router.navigate(['/booking-detail', item.refId]);
    }
  }

  relativeTime(iso: string | null | undefined): string {
    if (!iso) return '';
    const date = new Date(iso);
    const diffMs = Date.now() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'vừa xong';
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `${diffH} giờ trước`;
    const diffD = Math.floor(diffH / 24);
    if (diffD < 7) return `${diffD} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  }
}
