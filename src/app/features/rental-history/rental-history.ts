import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalService } from '../../core/services/rental.service';

@Component({
  selector: 'app-rental-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-history.html',
  styleUrls: ['./rental-history.css']
})
export class RentalHistoryComponent implements OnInit {
  private rentalService = inject(RentalService);

  rentals = signal<any[]>([]);
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

    this.rentalService.getRentalHistory(apiPage).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data && res.data.rentals) {
          this.rentals.set(res.data.rentals);
          this.totalPages.set(res.data.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải lịch sử thuê dụng cụ.');
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
