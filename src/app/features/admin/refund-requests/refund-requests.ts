import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-refund-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refund-requests.html',
  styleUrls: ['./refund-requests.css']
})
export class AdminRefundRequestsComponent implements OnInit {
  private adminService = inject(AdminService);
  private router = inject(Router);

  bookings = signal<any[]>([]);
  selected = signal<any | null>(null);
  isLoading = signal<boolean>(false);
  isConfirming = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  filterStatus = signal<'PENDING_REFUND' | 'REFUNDED' | 'ALL'>('PENDING_REFUND');

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    // Reuse getBookings — sau đó filter ở FE theo status & refundStatus.
    // Có thể tối ưu sau bằng cách thêm BE filter, hiện tạm fetch nhiều rồi filter.
    this.adminService.getBookings({ page: 1, size: 50 }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const all = res?.bookings || res?.data?.bookings || [];
        const filter = this.filterStatus();
        const filtered = all.filter((b: any) => {
          if (b.status !== 'DA_HUY') return false;
          if (filter === 'ALL') return true;
          return b.refundStatus === filter;
        });
        this.bookings.set(filtered);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách yêu cầu hoàn cọc.');
      }
    });
  }

  changeFilter(value: 'PENDING_REFUND' | 'REFUNDED' | 'ALL'): void {
    this.filterStatus.set(value);
    this.load();
  }

  openDetail(booking: any): void {
    this.selected.set(booking);
  }

  closeDetail(): void {
    if (this.isConfirming()) return;
    this.selected.set(null);
  }

  confirmRefund(): void {
    const b = this.selected();
    if (!b) return;
    this.isConfirming.set(true);
    this.adminService.confirmRefund(b.id).subscribe({
      next: () => {
        this.isConfirming.set(false);
        this.selected.set(null);
        this.load();
      },
      error: (err) => {
        this.isConfirming.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Xác nhận hoàn cọc thất bại.');
      }
    });
  }

  statusLabel(status: string | null | undefined): string {
    const map: Record<string, string> = {
      DA_HUY: 'Đã hủy',
      DA_DAT: 'Đặt cọc',
      DA_THANH_TOAN: 'Đã thanh toán',
      CHO_THANH_TOAN: 'Chờ thanh toán',
    };
    return map[status ?? ''] ?? status ?? '';
  }

  refundStatusLabel(s: string | null | undefined): string {
    const map: Record<string, string> = {
      PENDING_REFUND: 'Chờ hoàn cọc',
      REFUNDED: 'Đã hoàn cọc',
      NOT_APPLICABLE: 'Không hoàn cọc',
    };
    return map[s ?? ''] ?? s ?? '';
  }
}
