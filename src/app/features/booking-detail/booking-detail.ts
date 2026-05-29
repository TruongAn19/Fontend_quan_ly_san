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
  reason?: string;        // why blocked (when canCancel=false)
  refundAmount: number;
  usedSessions: number;
  totalSessions: number;
}

/**
 * BookingDetailComponent — `/booking-detail/:id`.
 *
 * Driven entirely by `GET /api/v1/client/bookings/detail/{id}`. Pre-computes the
 * refund preview client-side so the modal can show the user what they'll get
 * back before they commit, then calls `POST /{id}/cancel` which returns the
 * authoritative refund summary.
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

  /**
   * Client-side cancel preview (C5.4) — runs over the current booking signal.
   * Mirrors BookingService.cancelByUser server-side logic so the modal shows
   * the expected refund before the user commits.
   */
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
        refundAmount: 0, usedSessions: 0, totalSessions: 0,
      };
    }

    const deposit = b.depositPrice ?? 0;
    const type = b.bookingType ?? 'ONE_TIME';

    if (type === 'WEEKLY_RECURRING') {
      // The booking-history endpoint doesn't return BookingDetail rows for
      // each session today, so we can only show an approximation when missing.
      // FE shows deposit verbatim — server is the source of truth.
      return {
        canCancel: true,
        refundAmount: deposit,
        usedSessions: 0,
        totalSessions: 0,
      };
    }

    // ONE_TIME: 2h gate (E3)
    if (b.bookingDate && b.time) {
      const slotStart = new Date(`${b.bookingDate}T${b.time}`);
      const twoHoursBefore = new Date(slotStart.getTime() - 2 * 60 * 60 * 1000);
      if (new Date() > twoHoursBefore) {
        const minutes = Math.max(0, Math.floor((slotStart.getTime() - Date.now()) / 60000));
        return {
          canCancel: false,
          reason: `Không thể huỷ trong vòng 2 tiếng trước giờ bắt đầu (còn ${minutes} phút).`,
          refundAmount: 0, usedSessions: 0, totalSessions: 1,
        };
      }
    }

    return {
      canCancel: true,
      refundAmount: deposit,
      usedSessions: 0,
      totalSessions: 1,
    };
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
        this.booking.set(res.data ?? null);
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
