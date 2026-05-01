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
}
