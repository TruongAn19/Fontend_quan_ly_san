import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';

@Component({
  selector: 'app-rental-history',
  standalone: true,
  imports: [CommonModule, RouterLink],
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
  successMessage = signal<string | null>(null);
  cancellingId = signal<number | null>(null);

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

  canCancel(item: any): boolean {
    return item?.status === 'PENDING' || item?.status === 'IN_USE';
  }

  cancelRental(item: any): void {
    if (!this.canCancel(item)) return;
    if (!confirm('Bạn có chắc muốn hủy đơn thuê vợt này?')) return;

    this.cancellingId.set(item.id);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.rentalService.cancelRental(item.id).subscribe({
      next: (res) => {
        this.cancellingId.set(null);
        const newStatus = res?.data?.status ?? 'CANCELLED';
        this.rentals.set(this.rentals().map(r =>
          r.id === item.id ? { ...r, status: newStatus } : r));
        this.successMessage.set('Đã hủy đơn thuê thành công.');
      },
      error: (err) => {
        this.cancellingId.set(null);
        if (err?.status === 403) {
          this.errorMessage.set('Bạn không có quyền hủy đơn thuê này.');
        } else {
          this.errorMessage.set(err?.error?.message ?? 'Không thể hủy đơn thuê. Vui lòng thử lại.');
        }
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
      PENDING: 'Chờ xử lý',
      IN_USE: 'Đang thuê',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return map[status] ?? status;
  }

  typeLabel(type: string | null | undefined): string {
    if (!type) return '';
    const map: Record<string, string> = {
      DAILY: 'Thuê theo ngày',
      ON_SITE: 'Thuê tại sân',
    };
    return map[type] ?? type;
  }
}
