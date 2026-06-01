import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { environment } from '../../../environments/environment';

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

  bookingId = signal<number | null>(null);
  booking = signal<any>(null);
  bookingDetails = signal<any[]>([]);
  rentalTools = signal<any[]>([]);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Cancel flow
  showCancelModal = signal<boolean>(false);
  isCancelling = signal<boolean>(false);
  cancelResult = signal<any>(null);

  contact = environment.contact;

  isWeekly = computed(() => this.bookingDetails().length > 1);

  isCancelled = computed(() => this.statusOf() === 'DA_HUY');

  canCancel = computed(() => {
    const s = this.statusOf();
    return s === 'CHO_THANH_TOAN' || s === 'DA_DAT' || s === 'DA_DAT_COC';
  });

  /** Tổng tiền thuê vợt (loại trừ rental đã huỷ). */
  rentalTotal = computed(() =>
    this.rentalTools()
      .filter(rt => (rt.status || '').toUpperCase() !== 'CANCELLED')
      .reduce((sum, rt) => sum + (rt.rentalPrice || 0), 0));

  /** Tiền cọc sân = tổng cọc - tiền vợt. */
  courtDeposit = computed(() => {
    const dep = this.booking()?.depositPrice || 0;
    return Math.max(0, dep - this.rentalTotal());
  });

  /** Còn bao nhiêu phút tới giờ bắt đầu (ONE_TIME). */
  private minutesToStart(): number | null {
    const b = this.booking();
    if (!b || !b.bookingDate || !b.time) return null;
    const start = new Date(`${b.bookingDate}T${this.normalizeTime(b.time)}`);
    if (isNaN(start.getTime())) return null;
    return Math.floor((start.getTime() - Date.now()) / 60000);
  }

  /** ONE_TIME trong vòng 2h trước giờ bắt đầu → không cho huỷ. */
  within2h = computed(() => {
    if (this.isWeekly()) return false;
    const mins = this.minutesToStart();
    return mins !== null && mins < 120;
  });

  /** Preview tiền hoàn dự kiến để hiển thị trong modal. */
  cancelPreview = computed(() => {
    const b = this.booking();
    if (!b) return { refund: 0, used: 0, total: 1 };
    if (this.isWeekly()) {
      const total = this.bookingDetails().length;
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const used = this.bookingDetails().filter(d => {
        const dt = new Date(d.date);
        return !isNaN(dt.getTime()) && dt < today;
      }).length;
      const remaining = total - used;
      const refund = total > 0 ? (b.depositPrice || 0) * remaining / total : 0;
      return { refund, used, total };
    }
    return { refund: b.depositPrice || 0, used: 0, total: 1 };
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.bookingId.set(+id);
      this.loadDetail();
    } else {
      this.errorMessage.set('Mã đặt sân không hợp lệ.');
    }
  }

  loadDetail(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.bookingService.getBookingDetail(this.bookingId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        this.booking.set(data?.booking || null);
        this.bookingDetails.set(data?.bookingDetails || data?.booking?.bookingDetails || []);
        this.rentalTools.set(data?.rentalTools || []);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết đặt sân.');
      }
    });
  }

  openCancelModal(): void {
    if (this.within2h()) return;
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancel(): void {
    this.isCancelling.set(true);
    this.bookingService.cancelBooking(this.bookingId()!).subscribe({
      next: (res) => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
        this.cancelResult.set(res?.data || null);
        this.loadDetail();
      },
      error: (err) => {
        this.isCancelling.set(false);
        this.showCancelModal.set(false);
        this.errorMessage.set(err.error?.message || 'Huỷ đặt sân thất bại.');
      }
    });
  }

  statusOf(): string {
    return (this.booking()?.status || '').toUpperCase();
  }

  statusText(): string {
    switch (this.statusOf()) {
      case 'DA_THANH_TOAN': return 'Đã thanh toán';
      case 'DA_DAT_COC': return 'Đã đặt cọc';
      case 'DA_DAT': return 'Đã giữ sân';
      case 'CHO_THANH_TOAN': return 'Chờ thanh toán';
      case 'DA_HUY': return 'Đã huỷ';
      default: return this.booking()?.status || '';
    }
  }

  refundStatusText(rs: string): string {
    switch ((rs || '').toUpperCase()) {
      case 'PENDING_REFUND': return 'Chờ hoàn cọc';
      case 'REFUNDED': return 'Đã hoàn cọc';
      case 'NOT_APPLICABLE': return 'Không hoàn cọc';
      default: return 'Không áp dụng';
    }
  }

  /** Số tiền hoàn lấy từ kết quả huỷ vừa rồi hoặc từ booking đã lưu. */
  refundAmount(): number {
    return this.cancelResult()?.refundAmount ?? this.booking()?.refundAmount ?? 0;
  }

  contactHotline(): string {
    return this.cancelResult()?.hotline ?? this.contact?.hotline ?? '';
  }

  contactEmail(): string {
    return this.cancelResult()?.email ?? this.contact?.email ?? '';
  }

  rentalUnitPrice(rt: any): number {
    const qty = rt.quantity || 1;
    return qty > 0 ? (rt.rentalPrice || 0) / qty : (rt.rentalPrice || 0);
  }

  private normalizeTime(time: string): string {
    // "14:00" -> "14:00:00", giữ nguyên nếu đã có giây
    const parts = time.split(':');
    if (parts.length === 2) return `${time}:00`;
    return time;
  }
}
