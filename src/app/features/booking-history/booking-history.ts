import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './booking-history.html',
  styleUrls: ['./booking-history.css']
})
export class BookingHistoryComponent implements OnInit {
  private bookingService = inject(BookingService);

  allValidBookings = signal<any[]>([]);
  displayBookings = signal<any[]>([]);
  pageSize = 5;

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

    // Tải 1000 đơn để tự phân trang ở Frontend nhằm tránh bị gãy trang khi lọc
    this.bookingService.getBookingHistory(0, 1000).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const rawData = res.data?.bookings || res.bookings || [];
        
        // Đơn hợp lệ + đơn đã huỷ (để user xem trạng thái hoàn cọc)
        const valid = rawData.filter((b: any) =>
          ['PAID', 'DA_THANH_TOAN', 'BOOKED', 'DA_DAT', 'DA_DAT_COC', 'DA_HUY', 'CANCELLED'].includes(b.status?.toUpperCase())
        );
        
        this.allValidBookings.set(valid);
        this.updateDisplay();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải lịch sử đặt sân.');
      }
    });
  }

  updateDisplay(): void {
    const total = this.allValidBookings().length;
    this.totalPages.set(Math.ceil(total / this.pageSize) || 1);

    // Cắt mảng theo trang hiện tại
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayBookings.set(this.allValidBookings().slice(start, end));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateDisplay();
    }
  }

  getStatusText(status: string): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'DA_THANH_TOAN':
      case 'PAID':
      case 'DA_DAT_COC':
        return 'Đã đặt cọc';
      case 'CHO_THANH_TOAN':
      case 'PENDING':
        return 'Chờ đặt cọc';
      case 'DA_HUY':
      case 'CANCELLED':
        return 'Đã huỷ';
      case 'DA_DAT':
      case 'BOOKED':
        return 'Đã giữ sân';
      default:
        return status;
    }
  }

  refundBadge(refundStatus: string): string {
    switch ((refundStatus || '').toUpperCase()) {
      case 'PENDING_REFUND': return '🟡 Chờ hoàn cọc';
      case 'REFUNDED': return '🟢 Đã hoàn cọc';
      default: return '';
    }
  }
}
