import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import {
  AdminBookingDTO,
  RefundStatus,
  refundStatusLabel,
} from '../../../core/models/booking.model';

type Tab = 'PENDING_REFUND' | 'REFUNDED' | 'ALL';

@Component({
  selector: 'app-admin-refund-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refund-requests.html',
  styleUrls: ['./refund-requests.css'],
})
export class AdminRefundRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private route = inject(ActivatedRoute);

  bookings = signal<AdminBookingDTO[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(1);
  tab = signal<Tab>('PENDING_REFUND');

  // Modal state for the "confirm refund" action
  modalBooking = signal<AdminBookingDTO | null>(null);
  isSubmitting = signal(false);

  readonly refundStatusLabel = refundStatusLabel;

  ngOnInit(): void {
    this.load();

    // If navigated from a notification with ?bookingId=X, open that modal on load
    this.route.queryParamMap.subscribe(qp => {
      const id = qp.get('bookingId');
      if (id) {
        const num = Number(id);
        // Wait one tick so the list has loaded — best-effort
        setTimeout(() => {
          const found = this.bookings().find(b => b.id === num);
          if (found) this.openDetail(found);
        }, 300);
      }
    });
  }

  setTab(t: Tab): void {
    this.tab.set(t);
    this.currentPage.set(0);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const selectedTab = this.tab();
    const filter = selectedTab === 'ALL' ? null : selectedTab;
    this.adminService.getRefundRequests(filter, this.currentPage(), 10).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.bookings.set(res.data.bookings);
        this.totalPages.set(Math.max(res.data.totalPages, 1));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Không thể tải danh sách hoàn cọc.');
      },
    });
  }

  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.currentPage.set(p);
    this.load();
  }

  openDetail(b: AdminBookingDTO): void {
    this.modalBooking.set(b);
  }

  closeDetail(): void {
    this.modalBooking.set(null);
  }

  confirmRefund(): void {
    const b = this.modalBooking();
    if (!b) return;
    if (b.refundStatus !== 'PENDING_REFUND') {
      this.closeDetail();
      return;
    }
    this.isSubmitting.set(true);
    this.adminService.confirmRefund(b.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDetail();
        this.load();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err?.error?.message || 'Không thể xác nhận hoàn cọc.');
      },
    });
  }

  badgeClass(s?: RefundStatus | null): string {
    if (s === 'REFUNDED') return 'pill pill-success';
    if (s === 'PENDING_REFUND') return 'pill pill-warning';
    return 'pill pill-muted';
  }
}
