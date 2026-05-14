import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './booking-history.html',
  styleUrls: ['./booking-history.css']
})
export class BookingHistoryComponent implements OnInit {
  private bookingService = inject(BookingService);

  bookings = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

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

  onCancelBooking(bookingId: number): void {
    if (confirm('Bạn có chắc chắn muốn hủy lịch đặt sân này? (Thao tác này sẽ giải phóng sân cho người khác và không thể hoàn tác)')) {
      this.isLoading.set(true);
      this.bookingService.cancelBooking(bookingId).subscribe({
        next: (res) => {
          this.isLoading.set(false);
          alert(res.message || 'Đã hủy lịch thành công.');
          this.loadHistory();
        },
        error: (err) => {
          this.isLoading.set(false);
          alert(err.error?.message || 'Không thể hủy lịch. Vui lòng thử lại sau.');
        }
      });
    }
  }

  getStatusLabel(status: string): string {
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
        return 'Đã cọc';
      default: return status;
    }
  }

  isCancellable(status: string): boolean {
    if (!status) return false;
    const s = status.toUpperCase();
    return s === 'DA_DAT' || s === 'ĐÃ ĐẶT' || s === 'DEPOSITED' || s === 'ĐÃ CỌC' ||
           s === 'CHO_THANH_TOAN' || s === 'CHỜ THANH TOÁN' || s === 'PENDING';
  }
}
