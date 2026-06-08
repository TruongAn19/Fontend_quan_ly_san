import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-rentals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rentals.html',
  styleUrls: ['./rentals.css']
})
export class AdminRentalsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  rentals = signal<any[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  confirmingId = signal<number | null>(null);

  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  statusList = ['Chờ bàn giao', 'Đang thuê', 'Đã trả', 'Hủy bỏ'];

  ngOnInit(): void {
    this.loadRentals();
  }

  loadRentals(): void {
    this.isLoading.set(true);
    const searchVal = this.searchForm.get('search')?.value || '';

    this.adminService.getRentals(this.currentPage(), searchVal).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.rentals.set(res.rentals || res.data?.rentals || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách thuê dụng cụ.');
      }
    });
  }

  onSearch(): void {
    this.currentPage.set(0);
    this.loadRentals();
  }

  updateStatus(rentalId: number, status: string): void {
    this.adminService.updateRentalStatus(rentalId, status).subscribe({
      next: () => this.loadRentals(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Cập nhật trạng thái thất bại.')
    });
  }

  /** Admin xác nhận đã hoàn cọc cho đơn đã huỷ đang chờ hoàn (CANCELLED + PENDING_REFUND). */
  confirmRefund(item: any): void {
    if (item.refundStatus !== 'PENDING_REFUND') return;
    this.confirmingId.set(item.id);
    this.errorMessage.set(null);
    this.adminService.confirmRentalRefund(item.id).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.loadRentals();
      },
      error: (err) => {
        this.confirmingId.set(null);
        this.errorMessage.set(err.error?.message || 'Xác nhận hoàn cọc thất bại.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadRentals();
    }
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const map: Record<string, string> = {
      PENDING: 'Chờ bàn giao',
      IN_USE: 'Đang thuê',
      COMPLETED: 'Đã trả',
      CANCELLED: 'Hủy bỏ',
    };
    return map[status] ?? status;
  }

  typeLabel(type: string | null | undefined): string {
    if (!type) return '';
    const map: Record<string, string> = {
      DAILY: 'Thuê theo ngày',
      ON_SITE: 'Thuê kèm theo sân',
    };
    return map[type] ?? type;
  }

  /** Đơn thuê đã đóng (đã trả hoặc đã hủy) — không cho phép đổi nữa. */
  isStatusLocked(status: string | null | undefined): boolean {
    return status === 'COMPLETED' || status === 'CANCELLED';
  }
}
