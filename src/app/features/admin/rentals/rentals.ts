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

  searchForm: FormGroup = this.fb.group({
    search: ['']
  });

  statusList = ['Chờ thanh toán', 'Đã thanh toán', 'Đã trả', 'Đã hủy'];

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

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.loadRentals();
    }
  }
}
