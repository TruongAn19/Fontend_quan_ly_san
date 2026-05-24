import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';

type BookingTab = 'ONE_TIME' | 'WEEKLY_RECURRING';

@Component({
  selector: 'app-booking-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  activeTab = signal<BookingTab>('ONE_TIME');

  ngOnInit(): void {
    this.loadHistory();
  }

  switchTab(tab: BookingTab): void {
    if (this.activeTab() === tab) return;
    this.activeTab.set(tab);
    this.currentPage.set(1);
    this.loadHistory();
  }

  loadHistory(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const apiPage = this.currentPage() - 1;

    this.bookingService.getBookingHistory(apiPage, this.activeTab()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data && res.data.bookings) {
          this.bookings.set(res.data.bookings);
          this.totalPages.set(res.data.totalPages || 1);
        } else {
          this.bookings.set([]);
          this.totalPages.set(1);
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
}
