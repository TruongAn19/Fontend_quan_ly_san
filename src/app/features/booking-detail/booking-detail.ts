import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import {
  BookingHistoryItem,
  CancelBookingResponse,
  RefundStatus,
  refundStatusLabel,
} from '../../core/models/booking.model';

interface CancelPreview {
  canCancel: boolean;
  reason?: string;
}

/**
 * BookingDetailComponent — `/booking-detail/:id`.
 *
 * Driven entirely by `GET /api/v1/client/bookings/detail/{id}`. The backend
 * remains the only source for cancellation eligibility and refund amounts.
 */
@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-detail.html',
  styleUrls: ['./booking-detail.css'],
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bookingService = inject(BookingService);

  bookingId = signal<number | null>(null);
  booking = signal<BookingHistoryItem | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);

  // cancel modal state
  showCancelModal = signal(false);
  isSubmittingCancel = signal(false);
  cancelReason = signal('');
  // last server response (authoritative — overrides client preview)
  lastCancelResponse = signal<CancelBookingResponse | null>(null);

  // template helpers
  readonly refundStatusLabel = refundStatusLabel;

  cancelPreview = computed<CancelPreview | null>(() => {
    const b = this.booking();
    if (!b) return null;

    // status gate (D0.1)
    const status = (b.status || '').toUpperCase();
    const open = ['CHO_THANH_TOAN', 'CHỜ THANH TOÁN', 'DA_DAT', 'ĐÃ ĐẶT', 'ĐÃ ĐẶT CỌC', 'PENDING', 'DEPOSITED'];
    if (!open.includes(status)) {
      return {
        canCancel: false,
        reason: 'Đơn không ở trạng thái cho phép huỷ.',
      };
    }

    return { canCancel: true };
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || Number.isNaN(id)) {
      this.errorMessage.set('Mã đơn không hợp lệ.');
      return;
    }
    this.bookingId.set(id);
    this.load();
  }

  load(): void {
    const id = this.bookingId();
    if (id == null) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getBookingById(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const booking = res.data ?? null;
        this.booking.set(booking);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Không thể tải chi tiết đặt sân.');
      },
    });
  }

  openCancelModal(): void {
    const preview = this.cancelPreview();
    if (!preview?.canCancel) {
      alert(preview?.reason || 'Không thể huỷ đơn này.');
      return;
    }
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
    const id = this.bookingId();
    if (id == null) return;
    this.isSubmittingCancel.set(true);
    this.bookingService.cancelBooking(id, { reason: this.cancelReason() || undefined }).subscribe({
      next: (res) => {
        this.isSubmittingCancel.set(false);
        this.showCancelModal.set(false);
        this.lastCancelResponse.set(res.data ?? null);
        this.load(); // refresh booking
      },
      error: (err) => {
        this.isSubmittingCancel.set(false);
        alert(err?.error?.message || 'Huỷ không thành công.');
      },
    });
  }

  isCancelled(): boolean {
    const s = (this.booking()?.status || '').toUpperCase();
    return s === 'DA_HUY' || s === 'ĐÃ HỦY' || s === 'CANCELLED';
  }

  rentalStatusLabel(status?: string | null): string {
    switch (status) {
      case 'PENDING': return 'Chờ nhận phụ kiện';
      case 'RENTING': return 'Đang thuê';
      case 'COMPLETED': return 'Đã trả';
      case 'CANCELLED': return 'Đã hủy';
      default: return status || 'Chưa xác định';
    }
  }

  rentalPaymentLabel(status?: string | null): string {
    switch (status) {
      case 'PAID': return 'Đã thanh toán';
      case 'REFUNDED': return 'Đã hoàn tiền';
      case 'UNPAID': return 'Chưa thanh toán';
      default: return status || 'Chưa xác định';
    }
  }

  // For badge colouring
  refundBadgeClass(s?: RefundStatus | null): string {
    switch (s) {
      case 'REFUNDED':       return 'badge-success';
      case 'PENDING_REFUND': return 'badge-warning';
      case 'NOT_APPLICABLE': return 'badge-muted';
      default:               return 'badge-muted';
    }
  }

  goBack(): void {
    this.router.navigate(['/booking-history']);
  }
}
