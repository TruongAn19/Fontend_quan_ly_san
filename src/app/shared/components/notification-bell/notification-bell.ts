import { Component, Input, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../../core/services/notification.service';
import { NotificationDTO, notificationTitle } from '../../../core/models/notification.model';

/**
 * Bell icon with unread badge + dropdown of recent notifications.
 *
 * <p>Listens to the shared {@link NotificationService.notifications$} stream
 * so pushes from the WS connection arrive without an HTTP refresh. The badge
 * count is the service signal (debounced via fetchUnread on focus).
 */
@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-bell.html',
  styleUrls: ['./notification-bell.css'],
})
export class NotificationBellComponent implements OnInit, OnDestroy {
  /** When true, also subscribe to /topic/staff-notifications (admin/staff). */
  @Input() forAdmin = false;

  private notificationService = inject(NotificationService);
  private router = inject(Router);

  isOpen = signal(false);
  isLoading = signal(false);
  items = signal<NotificationDTO[]>([]);

  unread = computed(() => this.notificationService.unreadCount());

  private sub?: Subscription;
  private clickListener = (e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('.notif-bell-host')) {
      this.isOpen.set(false);
    }
  };

  ngOnInit(): void {
    this.notificationService.connect(this.forAdmin);
    this.notificationService.refreshUnread(this.forAdmin);

    // Streamed pushes — prepend to the top-10 list if dropdown is open
    this.sub = this.notificationService.notifications$.subscribe((dto) => {
      this.items.update((list) => [dto, ...list].slice(0, 10));
    });

    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    document.removeEventListener('click', this.clickListener);
  }

  toggle(): void {
    const next = !this.isOpen();
    this.isOpen.set(next);
    if (next) this.loadList();
  }

  loadList(): void {
    this.isLoading.set(true);
    const obs = this.forAdmin
      ? this.notificationService.listAdmin(0, 10)
      : this.notificationService.list(0, 10);
    obs.subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.items.set(res.data?.content ?? []);
        this.notificationService.refreshUnread(this.forAdmin);
      },
      error: () => this.isLoading.set(false),
    });
  }

  onItemClick(n: NotificationDTO): void {
    if (!(n.isRead ?? n.read)) {
      const obs = this.forAdmin
        ? this.notificationService.markAdminRead(n.id)
        : this.notificationService.markRead(n.id);
      obs.subscribe({
        next: () => {
          n.isRead = true; n.read = true;
          this.notificationService.unreadCount.update(c => Math.max(0, c - 1));
        },
        error: () => { /* swallow */ },
      });
    }

    // Navigate to the target referenced by the notification
    if (n.refType === 'BOOKING' && n.refId != null) {
      if (this.forAdmin && n.type === 'REFUND_REQUEST') {
        this.router.navigate(['/admin/refund-requests'], { queryParams: { bookingId: n.refId } });
      } else if (!this.forAdmin) {
        this.router.navigate(['/booking-detail', n.refId]);
      }
    }
    if (n.refType === 'RENTAL_TOOL' && n.refId != null) {
      if (this.forAdmin && n.type === 'REFUND_REQUEST') {
        this.router.navigate(['/admin/rental-refunds']);
      } else if (!this.forAdmin) {
        this.router.navigate(['/rental-history']);
      }
    }
    this.isOpen.set(false);
  }

  markAllRead(): void {
    const obs = this.forAdmin
      ? this.notificationService.markAllAdminRead()
      : this.notificationService.markAllRead();
    obs.subscribe({
      next: () => {
        this.items.update(list => list.map(n => ({ ...n, isRead: true, read: true })));
        this.notificationService.unreadCount.set(0);
      },
      error: () => { /* swallow */ },
    });
  }

  title(n: NotificationDTO): string {
    return notificationTitle(n);
  }

  relativeTime(iso?: string): string {
    if (!iso) return '';
    const then = new Date(iso).getTime();
    const diffSec = Math.floor((Date.now() - then) / 1000);
    if (diffSec < 60)         return `${diffSec}s trước`;
    if (diffSec < 3600)       return `${Math.floor(diffSec / 60)} phút trước`;
    if (diffSec < 86400)      return `${Math.floor(diffSec / 3600)} giờ trước`;
    return `${Math.floor(diffSec / 86400)} ngày trước`;
  }
}
