import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RentalService } from '../../core/services/rental.service';
import { RentalHistoryItem } from '../../core/models/rental.model';

@Component({
  selector: 'app-rental-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-history.html',
  styleUrls: ['./rental-history.css']
})
export class RentalHistoryComponent implements OnInit {
  private rentalService = inject(RentalService);

  rentals = signal<RentalHistoryItem[]>([]);
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

  onRetryPayment(rentalId: number): void {
    this.isLoading.set(true);
    this.rentalService.payRental(rentalId, { paymentMethod: 'VNPAY' }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res && res.data && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          this.loadHistory();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || 'Không thể tiến hành thanh toán lại.');
      }
    });
  }

  onCancelRental(rentalId: number): void {
    if (!confirm('Bạn có chắc muốn huỷ đơn thuê này?')) {
      return;
    }
    this.isLoading.set(true);
    this.rentalService.cancelRental(rentalId).subscribe({
      next: (res) => {
        const msg = res?.message ?? '';
        if (msg && msg.toLowerCase().includes('hoàn')) {
          alert(msg);
        }
        this.loadHistory();
      },
      error: (err) => {
        this.isLoading.set(false);
        alert(err.error?.message || 'Không thể huỷ đơn thuê.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadHistory();
    }
  }

  getStatusLabel(status?: string | null): string {
    if (!status) return 'Không xác định';
    const s = status.toUpperCase();
    switch (s) {
      case 'PAID': 
      case 'DA_THANH_TOAN':
        return 'Đã thanh toán';
      case 'COMPLETED': 
      case 'RETURNED':
        return 'Đã trả đồ';
      case 'PENDING': 
      case 'CHO_THANH_TOAN':
        return 'Chờ thanh toán';
      case 'CANCELLED': 
      case 'DA_HUY':
        return 'Đã hủy';
      case 'DEPOSITED':
      case 'DA_DAT_COC':
        return 'Đã đặt cọc';
      default: return status;
    }
  }

  getTypeLabel(type?: string | null): string {
    if (!type) return 'Không xác định';
    const t = type.toUpperCase();
    switch (t) {
      case 'DAILY': return 'Thuê theo ngày';
      case 'ON_SITE': return 'Thuê tại sân';
      default: return type;
    }
  }
}
