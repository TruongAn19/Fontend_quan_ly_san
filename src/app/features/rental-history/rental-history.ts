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

  allValidRentals = signal<any[]>([]);
  displayRentals = signal<any[]>([]);
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
    this.rentalService.getRentalHistory(0, 1000).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const rawData = res.data?.rentals || res.rentals || [];
        
        // Chỉ lấy các đơn đã thanh toán, đã đặt, đang thuê hoặc đã trả
        const valid = rawData.filter((r: any) => 
          ['PAID', 'DA_THANH_TOAN', 'SUCCESS', 'BOOKED', 'DA_DAT', 'RENTING', 'DANG_THUE', 'RETURNED', 'DA_TRA'].includes(r.status?.toUpperCase())
        );
        
        this.allValidRentals.set(valid);
        this.updateDisplay();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải lịch sử thuê dụng cụ.');
      }
    });
  }

  updateDisplay(): void {
    const total = this.allValidRentals().length;
    this.totalPages.set(Math.ceil(total / this.pageSize) || 1);

    // Cắt mảng theo trang hiện tại
    const start = (this.currentPage() - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayRentals.set(this.allValidRentals().slice(start, end));
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.updateDisplay();
    }
  }

  getTypeDisplay(type: string): string {
    if (!type) return '';
    return type === 'DAILY' ? 'Thuê theo ngày' : 'Thuê tại sân';
  }

  getStatusText(status: string): string {
    if (!status) return '';
    switch (status.toUpperCase()) {
      case 'DA_THANH_TOAN':
      case 'PAID':
        return 'Đã thanh toán';
      case 'RENTING':
      case 'DANG_THUE':
        return 'Đang thuê';
      case 'RETURNED':
      case 'DA_TRA':
        return 'Đã trả vợt';
      case 'CHO_THANH_TOAN':
      case 'PENDING':
        return 'Chờ thanh toán';
      case 'DA_HUY':
      case 'CANCELLED':
        return 'Đã huỷ';
      case 'BOOKED':
      case 'DA_DAT':
        return 'Đã đặt';
      default:
        return status;
    }
  }
}
