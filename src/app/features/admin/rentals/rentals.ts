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
  selectedDetail = signal<any | null>(null);

  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  statusMap: { [key: string]: string } = {
    'PENDING': 'Chờ thanh toán',
    'PAID': 'Đã thanh toán',
    'RENTING': 'Đang thuê',
    'RETURNED': 'Đã trả vợt',
    'COMPLETED': 'Hoàn thành',
    'CANCELLED': 'Đã hủy'
  };

  statusList = Object.keys(this.statusMap);

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
          const data = res.rentals || res.data?.rentals || [];
          this.rentals.set(data);
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

  updateStatus(rentalId: number, select: HTMLSelectElement, currentStatus?: string): void {
    const status = select.value;
    if (!status || this.isActionLocked(currentStatus)) return;
    this.errorMessage.set(null);
    this.adminService.updateRentalStatus(rentalId, status).subscribe({
      next: () => this.loadRentals(),
      error: (err) => {
        select.value = currentStatus || '';
        this.errorMessage.set(this.getFriendlyRentalError(err, 'Cập nhật trạng thái thất bại.'));
      }
    });
  }

  isStatusOptionEnabled(currentStatus: string | undefined, targetStatus: string): boolean {
    if (!currentStatus) return false;

    const current = currentStatus.trim().toUpperCase();
    const target = targetStatus.trim().toUpperCase();
    if (current === target) return true;

    const transitions: Record<string, string[]> = {
      PENDING: ['CANCELLED'],
      PAID: ['RENTING', 'RETURNED', 'COMPLETED', 'CANCELLED'],
      RENTING: ['RETURNED', 'COMPLETED', 'CANCELLED'],
      RETURNED: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: []
    };

    return transitions[current]?.includes(target) ?? false;
  }

  viewDetail(rentalId: number): void {
    this.adminService.getRentalDetail(rentalId).subscribe({
      next: (res) => this.selectedDetail.set(res?.data || null),
      error: (err) => this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết đơn thuê.')
    });
  }

  closeDetail(): void {
    this.selectedDetail.set(null);
  }

  getStatusDisplay(status: string): string {
    return this.statusMap[status] || status;
  }

  private getFriendlyRentalError(error: any, fallback: string): string {
    const message = error?.error?.message;
    if (!message) return fallback;

    const apiLabelMap: Record<string, string> = {
      DAILY: 'theo ngày',
      ON_SITE: 'tại sân',
      PENDING: 'Chờ thanh toán',
      PAID: 'Đã thanh toán',
      RENTING: 'Đang thuê',
      RETURNED: 'Đã trả vợt',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy'
    };

    return message.replace(
      /\b(DAILY|ON_SITE|PENDING|PAID|RENTING|RETURNED|COMPLETED|CANCELLED)\b/g,
      (value: string) => apiLabelMap[value] || value
    );
  }

  isActionLocked(status?: string): boolean {
    if (!status) return false;
    const normalized = status.trim().toUpperCase();
    return normalized === 'COMPLETED'
      || normalized === 'CANCELLED'
      || normalized === 'HOÀN THÀNH'
      || normalized === 'ĐÃ HỦY';
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadRentals();
    }
  }
}
