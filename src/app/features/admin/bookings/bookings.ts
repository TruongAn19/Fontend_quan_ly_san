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

  statusMap: { [key: string]: string } = {
    'CHO_THANH_TOAN': 'Chờ thanh toán',
    'DA_DAT': 'Đã đặt',
    'DA_DAT_COC': 'Đã đặt cọc',
    'DA_THANH_TOAN': 'Đã thanh toán',
    'DA_HUY': 'Đã hủy'
  };

  statusList = Object.keys(this.statusMap);

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
          const data = res.bookings || res.data?.bookings || [];
          this.bookings.set(data);
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
    if (!status) return;
    this.adminService.updateBookingStatus(bookingId, status).subscribe({
      next: () => this.loadBookings(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Cập nhật trạng thái thất bại.')
    });
  }

  getStatusDisplay(status: string): string {
    return this.statusMap[status] || status;
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadBookings();
    }
  }
}
