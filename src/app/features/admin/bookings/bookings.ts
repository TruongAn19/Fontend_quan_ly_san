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
  selectedDetail = signal<any | null>(null);
  isLoadingDetail = signal<boolean>(false);

  filterForm: FormGroup = this.fb.group({
    date: [''],
    search: ['']
  });

  statusList = ['Đang giữ chỗ', 'Đặt cọc', 'Đã thanh toán', 'Đã hủy', 'Đang sử dụng', 'Đã kết thúc'];

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

  openDetailModal(item: any): void {
    this.isLoadingDetail.set(true);
    this.errorMessage.set(null);
    this.adminService.getBookingDetail(item.id).subscribe({
      next: (res) => {
        this.selectedDetail.set(res?.data || { booking: item, rentalTools: [] });
        this.isLoadingDetail.set(false);
      },
      error: (err) => {
        this.isLoadingDetail.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết đơn đặt sân.');
      }
    });
  }

  closeDetailModal(): void {
    this.selectedDetail.set(null);
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const map: Record<string, string> = {
      CHO_THANH_TOAN: 'Chờ thanh toán',
      DA_DAT: 'Đặt cọc',
      DA_THANH_TOAN: 'Đã thanh toán',
      DA_HUY: 'Đã hủy',
    };
    return map[status] ?? status;
  }

  /** Booking đã ở trạng thái "đóng" (đã thanh toán hoặc đã hủy) — không cho phép đổi nữa. */
  isStatusLocked(status: string | null | undefined): boolean {
    return status === 'DA_THANH_TOAN' || status === 'DA_HUY';
  }
}
