import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-detail.html',
  styleUrls: ['./booking-detail.css']
})
export class BookingDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private bookingService = inject(BookingService);

  booking = signal<any>(null);
  bookingDetails = signal<any[]>([]);
  rentalTools = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Cancel UX state
  showCancelModal = signal<boolean>(false);
  isCancelling = signal<boolean>(false);
  cancelError = signal<string | null>(null);
  cancelReason = signal<string>('');

  // Contact info — sẽ lấy từ response cancel hoặc fallback hard-code
  contactHotline = signal<string>('0123456789');
  contactEmail = signal<string>('admin@badmintonhub.vn');

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Mã booking không hợp lệ.');
      return;
    }
    this.load(+id);
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getBookingDetail(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data;
        if (data) {
          this.booking.set(data.booking);
          this.bookingDetails.set(data.bookingDetails ?? []);
          this.rentalTools.set(data.rentalTools ?? []);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Không thể tải chi tiết đơn đặt.');
      }
    });
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const map: Record<string, string> = {
      CHO_THANH_TOAN: 'Chờ thanh toán',
      DA_DAT: 'Đặt cọc',
      DA_THANH_TOAN: 'Đã thanh toán',
      DA_HUY: 'Đã hủy',
    };
    return map[status] ?? status;
  }

  refundStatusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const map: Record<string, string> = {
      PENDING_REFUND: 'Chờ hoàn cọc',
      REFUNDED: 'Đã hoàn cọc',
      NOT_APPLICABLE: 'Không áp dụng',
    };
    return map[status] ?? status;
  }

  rentalStatusLabel(status: string | null | undefined): string {
    if (!status) return '—';
    const map: Record<string, string> = {
      PENDING: 'Chờ bàn giao',
      IN_USE: 'Đang thuê',
      COMPLETED: 'Đã trả',
      CANCELLED: 'Hủy bỏ',
    };
    return map[status] ?? 'Không xác định';
  }

  rentalTotal(): number {
    return this.rentalTools().reduce((sum, rt) => sum + (rt.price ?? 0), 0);
  }

  // ===== Cancel flow =====

  /** Booking đang ở trạng thái cho phép user huỷ. */
  canCancel = computed(() => {
    const b = this.booking();
    if (!b) return false;
    return b.status === 'CHO_THANH_TOAN' || b.status === 'DA_DAT';
  });

  /** Thông tin xem trước số tiền hoàn — tính ở FE để hiện trong modal trước khi confirm. */
  cancelPreview = computed(() => {
    const b = this.booking();
    if (!b) return { allowed: false, refund: 0, used: 0, total: 0, note: '' };

    if (b.bookingType === 'WEEKLY_RECURRING') {
      const details = this.bookingDetails() ?? [];
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const total = details.length;
      const used = details.filter(d => d.date && new Date(d.date) < today).length;
      const remaining = total - used;
      const refund = total > 0 ? Math.round((b.depositPrice ?? 0) * remaining / total) : 0;
      return {
        allowed: true,
        refund,
        used,
        total,
        note: total === 0
          ? 'Không tính được số tiền hoàn (không có buổi đặt).'
          : `Đã sử dụng ${used}/${total} buổi. Hoàn cọc cho ${remaining} buổi còn lại.`
      };
    }

    // ONE_TIME — kiểm tra điều kiện 2h
    if (b.bookingDate && b.time) {
      const [h, m] = (b.time as string).split(':').map(Number);
      const playStart = new Date(b.bookingDate);
      playStart.setHours(h || 0, m || 0, 0, 0);
      const now = new Date();
      const diffMs = playStart.getTime() - now.getTime();
      const diffH = diffMs / (1000 * 60 * 60);
      if (diffH < 2) {
        return {
          allowed: false,
          refund: 0,
          used: 0,
          total: 0,
          note: `Bạn không thể huỷ trong vòng 2 tiếng trước giờ bắt đầu (còn ${Math.max(0, Math.round(diffH * 60))} phút).`
        };
      }
    }
    return {
      allowed: true,
      refund: b.depositPrice ?? 0,
      used: 0,
      total: 0,
      note: 'Bạn sẽ được hoàn toàn bộ tiền cọc.'
    };
  });

  openCancelModal(): void {
    this.cancelError.set(null);
    this.cancelReason.set('');
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    if (this.isCancelling()) return;
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
    const b = this.booking();
    if (!b) return;
    this.isCancelling.set(true);
    this.cancelError.set(null);

    this.bookingService.cancelBooking(b.id, this.cancelReason() || undefined).subscribe({
      next: (res) => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
        const data = res?.data;
        if (data) {
          if (data.contactHotline) this.contactHotline.set(data.contactHotline);
          if (data.contactEmail) this.contactEmail.set(data.contactEmail);
        }
        // Reload booking detail để hiển thị trạng thái mới
        this.load(b.id);
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.cancelError.set(err?.error?.message ?? 'Huỷ đặt sân thất bại.');
      }
    });
  }
}
