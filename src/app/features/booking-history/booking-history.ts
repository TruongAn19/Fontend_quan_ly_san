import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { BookingHistoryItem, CancelBookingResponse, refundStatusLabel } from '../../core/models/booking.model';

interface CancelModalState {
  bookingId: number;
  refundAmount?: number;
  loading?: boolean;
}

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-history.html',
  styleUrls: ['./booking-history.css']
})
export class BookingHistoryComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookings = signal<BookingHistoryItem[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showCancelModal = signal<CancelModalState | null>(null);
  cancelResult = signal<CancelBookingResponse | null>(null);
  cancelError = signal<string | null>(null);

  ngOnInit(): void {
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const apiPage = this.currentPage() - 1;

    this.bookingService.getBookingHistory(apiPage).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data && res.data.bookings) {
          this.bookings.set(res.data.bookings);
          this.totalPages.set(res.data.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải lịch sử đặt sân.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  /**
   * Mở modal xác nhận huỷ. Fetch booking detail trước để có depositPrice
   * hiển thị "số tiền hoàn dự kiến" (BE sẽ trả refundAmount thực tế sau khi
   * confirm — có thể khác do gate 2h / WEEKLY pro-rate).
   */
  onCancelBooking(bookingId: number): void {
    this.showCancelModal.set({ bookingId, loading: true });
    this.cancelError.set(null);

    this.bookingService.getBookingById(bookingId).subscribe({
      next: (res) => {
        this.showCancelModal.set({
          bookingId,
          refundAmount: res.data?.depositPrice,
          loading: false,
        });
      },
      error: () => {
        // Vẫn cho phép huỷ — chỉ không hiển thị được preview.
        this.showCancelModal.set({ bookingId, loading: false });
      },
    });
  }

  confirmCancel(): void {
    const modal = this.showCancelModal();
    if (!modal || modal.loading) return;

    this.showCancelModal.set({ ...modal, loading: true });
    this.bookingService.cancelBooking(modal.bookingId).subscribe({
      next: (res) => {
        this.showCancelModal.set(null);
        if (res.data) {
          this.cancelResult.set(res.data);
        }
        this.loadHistory();
      },
      error: (err) => {
        this.showCancelModal.set({ ...modal, loading: false });
        this.cancelError.set(err.error?.message || 'Không thể hủy lịch. Vui lòng thử lại sau.');
      },
    });
  }

  closeCancelModal(): void {
    if (this.showCancelModal()?.loading) return;
    this.showCancelModal.set(null);
    this.cancelError.set(null);
  }

  dismissCancelResult(): void {
    this.cancelResult.set(null);
  }

  getStatusLabel(status?: string | null): string {
    if (!status) return 'Không xác định';
    const s = status.toUpperCase();
    switch (s) {
      case 'PAID': 
      case 'DA_THANH_TOAN':
      case 'ĐÃ THANH TOÁN':
        return 'Đã thanh toán';
      case 'COMPLETED': 
      case 'RETURNED':
        return 'Đã trả đồ';
      case 'PENDING': 
      case 'CHO_THANH_TOAN':
      case 'CHỜ THANH TOÁN':
        return 'Chờ thanh toán';
      case 'CANCELLED': 
      case 'DA_HUY':
      case 'ĐÃ HỦY':
        return 'Đã hủy';
      case 'DEPOSITED':
      case 'DA_DAT':
      case 'ĐÃ ĐẶT':
      case 'ĐÃ CỌC':
      case 'ĐÃ ĐẶT CỌC':
        return 'Đã đặt cọc';
      default: return status;
    }
  }

  isCancellable(status?: string | null): boolean {
    if (!status) return false;
    const s = status.toUpperCase();
    return s === 'DA_DAT' || s === 'ĐÃ ĐẶT' || s === 'DEPOSITED' || s === 'ĐÃ CỌC' || s === 'ĐÃ ĐẶT CỌC' ||
           s === 'CHO_THANH_TOAN' || s === 'CHỜ THANH TOÁN' || s === 'PENDING';
  }

  // CANCEL_BOOKING_FEATURE — refund badge in cancelled rows (S5.4)
  readonly refundStatusLabel = refundStatusLabel;

  refundBadgeClass(s?: string | null): string {
    if (s === 'REFUNDED') return 'refund-badge refunded';
    if (s === 'PENDING_REFUND') return 'refund-badge pending';
    return 'refund-badge';
  }
}
