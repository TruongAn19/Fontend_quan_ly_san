import { Component, Input, inject, signal, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, NotificationItem } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css']
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  @Input() forAdmin = false;

  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal<boolean>(false);
  unreadCount = signal<number>(0);
  notifications = signal<NotificationItem[]>([]);

  private subs: Subscription[] = [];

  ngOnInit(): void {
    this.loadUnreadCount();
    this.loadNotifications();

    this.subs.push(
      this.notificationService.watchUserNotifications().subscribe(n => this.onIncoming(n))
    );
    if (this.forAdmin) {
      this.subs.push(
        this.notificationService.watchStaffNotifications().subscribe(n => this.onIncoming(n))
      );
    }
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
    this.notificationService.disconnect();
  }

  private onIncoming(n: NotificationItem): void {
    // Tránh trùng (cùng id) khi vừa có WS vừa reload
    if (n.id && this.notifications().some(x => x.id === n.id)) return;
    this.notifications.update(list => [n, ...list].slice(0, 10));
    if (!n.isRead) {
      this.unreadCount.update(c => c + 1);
    }
  }

  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: res => this.unreadCount.set(res?.data ?? 0)
    });
  }

  loadNotifications(): void {
    const request = this.forAdmin
      ? this.notificationService.getAdminNotifications(0, 10)
      : this.notificationService.getNotifications(0, 10);
    request.subscribe({
      next: res => {
        const content = res?.data?.content ?? res?.data ?? [];
        this.notifications.set(content);
      }
    });
  }

  toggleDropdown(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) {
      this.loadNotifications();
      this.loadUnreadCount();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (this.isOpen() && !target.closest('.notification-bell')) {
      this.isOpen.set(false);
    }
  }

  onNotificationClick(n: NotificationItem): void {
    if (!n.isRead && n.id) {
      this.notificationService.markRead(n.id).subscribe({
        next: () => {
          this.notifications.update(list =>
            list.map(x => x.id === n.id ? { ...x, isRead: true } : x));
          this.unreadCount.update(c => Math.max(0, c - 1));
        }
      });
    }
    this.isOpen.set(false);
    this.navigateFor(n);
  }

  private navigateFor(n: NotificationItem): void {
    switch (n.type) {
      case 'REFUND_REQUEST':
        this.router.navigate(['/admin/refund-requests']);
        break;
      case 'BOOKING_CANCELLED':
      case 'REFUND_DONE':
        if (n.refId) this.router.navigate(['/booking-detail', n.refId]);
        break;
      default:
        break;
    }
  }

  markAllRead(): void {
    this.notificationService.markAllRead().subscribe({
      next: () => {
        this.notifications.update(list => list.map(x => ({ ...x, isRead: true })));
        this.unreadCount.set(0);
      }
    });
  }

  relativeTime(createdAt: string): string {
    if (!createdAt) return '';
    const then = new Date(createdAt).getTime();
    const diffSec = Math.floor((Date.now() - then) / 1000);
    if (diffSec < 60) return 'Vừa xong';
    const min = Math.floor(diffSec / 60);
    if (min < 60) return `${min} phút trước`;
    const hour = Math.floor(min / 60);
    if (hour < 24) return `${hour} giờ trước`;
    const day = Math.floor(hour / 24);
    if (day < 30) return `${day} ngày trước`;
    return new Date(createdAt).toLocaleDateString('vi-VN');
  }
}
