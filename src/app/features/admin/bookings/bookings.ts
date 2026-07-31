import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { AdminBookingDTO } from '../../../core/models/booking.model';

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

  bookings = signal<AdminBookingDTO[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  filterForm: FormGroup = this.fb.group({
    date: [''],
    search: ['']
  });

  statusList = ['Chờ thanh toán', 'Đã đặt cọc', 'Đã thanh toán', 'Đã hủy'];

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
          this.bookings.set(res.data.bookings);
          this.totalPages.set(Math.max(res.data.totalPages, 1));
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

  getStatusLabel(status: string): string {
    const mapping: Record<string, string> = {
      'CHO_THANH_TOAN': 'Chờ thanh toán',
      'DA_DAT': 'Đã đặt cọc',
      'DA_THANH_TOAN': 'Đã thanh toán',
      'DA_HUY': 'Đã hủy',
      // Thêm dự phòng nếu backend trả về chính label
      'Chờ thanh toán': 'Chờ thanh toán',
      'Đã đặt cọc': 'Đã đặt cọc',
      'Đã đặt': 'Đã đặt cọc', // legacy label trước khi đổi tên
      'Đã thanh toán': 'Đã thanh toán',
      'Đã hủy': 'Đã hủy'
    };
    return mapping[status] || status;
  }

  isStatusChangeDisabled(status: string): boolean {
    if (!status) return false;
    const normalized = status.toUpperCase();
    return normalized === 'DA_THANH_TOAN' || normalized === 'DA_HUY' || normalized === 'ĐÃ THANH TOÁN' || normalized === 'ĐÃ HỦY';
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBookings();
    }
  }
}
