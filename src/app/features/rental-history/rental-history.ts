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
      case 'RENTING':
        return 'Đang thuê';
      case 'COMPLETED': 
      case 'RETURNED':
        return 'Đã trả phụ kiện';
      case 'PENDING': 
        return 'Chờ nhận phụ kiện';
      case 'CANCELLED': 
      case 'DA_HUY':
        return 'Đã hủy';
      default: return status;
    }
  }

  getPaymentStatusLabel(status?: string | null): string {
    if (status === 'PAID') return 'Đã thanh toán';
    if (status === 'REFUNDED') return 'Đã hoàn tiền';
    return 'Chưa thanh toán';
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

  isBookingEquipment(item: RentalHistoryItem): boolean {
    return item.type?.toUpperCase() === 'ON_SITE'
      && item.bookingId !== null
      && item.bookingId !== undefined
      && String(item.bookingId).trim().length > 0;
  }
}
