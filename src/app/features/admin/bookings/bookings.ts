import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-bookings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './bookings.html',
  styleUrls: ['./bookings.css']
})
export class AdminBookingsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  bookings = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  filterForm: FormGroup = this.fb.group({
    date: [''],
    search: ['']
  });

  statusList = ['Đang giữ chỗ', 'Đã đặt', 'Đã thanh toán', 'Đã hủy', 'Đang sử dụng', 'Đã kết thúc'];

  ngOnInit(): void {
    this.loadBookings();
  }

  loadBookings(): void {
    this.isLoading.set(true);
    const filters = {
      ...this.filterForm.value,
      page: this.currentPage(),
      size: 5
    };

    this.adminService.getBookings(filters).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.bookings.set(res.bookings || res.data?.bookings || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách đặt sân.');
      }
    });
  }

  onFilterSubmit(): void {
    this.currentPage.set(1);
    this.loadBookings();
  }

  updateStatus(bookingId: number, status: string): void {
    this.adminService.updateBookingStatus(bookingId, status).subscribe({
      next: () => this.loadBookings(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Cập nhật trạng thái thất bại.')
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBookings();
    }
  }
}
