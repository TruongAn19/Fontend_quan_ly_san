import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { RentalStatus, RentalToolDTO } from '../../../core/models/rental.model';

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

  rentals = signal<RentalToolDTO[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  statusList = [
    { value: 'PENDING', label: 'Chờ nhận phụ kiện' },
    { value: 'RENTING', label: 'Đang thuê' },
    { value: 'COMPLETED', label: 'Đã trả phụ kiện' },
    { value: 'CANCELLED', label: 'Đã hủy' }
  ];

  getStatusLabel(status: string): string {
    const found = this.statusList.find(s => s.value === status);
    return found ? found.label : (status || 'Không xác định');
  }

  getPaymentStatusLabel(status?: string): string {
    if (status === 'PAID') return 'Đã thanh toán';
    if (status === 'REFUNDED') return 'Đã hoàn tiền';
    return 'Chưa thanh toán';
  }

  getAllowedStatusTransitions(status?: RentalStatus) {
    if (status === 'PENDING') {
      return this.statusList.filter(item => item.value === 'RENTING' || item.value === 'CANCELLED');
    }
    if (status === 'RENTING') {
      return this.statusList.filter(item => item.value === 'COMPLETED');
    }
    return [];
  }

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
          this.rentals.set(res.data.rentals);
          this.totalPages.set(Math.max(res.data.totalPages, 1));
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

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadRentals();
    }
  }
}
