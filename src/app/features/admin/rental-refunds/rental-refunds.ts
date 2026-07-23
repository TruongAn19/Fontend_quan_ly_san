import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-rental-refunds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-refunds.html',
  styleUrls: ['./rental-refunds.css']
})
export class AdminRentalRefundsComponent implements OnInit {
  private adminService = inject(AdminService);

  rentals = signal<any[]>([]);
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
    // Reuse getRentalRefunds — filter ở FE theo status (CANCELLED) & refundStatus.
    this.adminService.getRentalRefunds().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const all = res?.data?.rentals || res?.rentals || [];
        const filter = this.filterStatus();
        const filtered = all.filter((r: any) => {
          if (r.status !== 'CANCELLED') return false;
          if (filter === 'ALL') return true;
          return r.refundStatus === filter;
        });
        this.rentals.set(filtered);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách hoàn cọc thuê vợt.');
      }
    });
  }

  changeFilter(value: 'PENDING_REFUND' | 'REFUNDED' | 'ALL'): void {
    this.filterStatus.set(value);
    this.load();
  }

  openDetail(rental: any): void {
    this.selected.set(rental);
  }

  closeDetail(): void {
    if (this.isConfirming()) return;
    this.selected.set(null);
  }

  confirmRefund(): void {
    const r = this.selected();
    if (!r) return;
    this.isConfirming.set(true);
    this.adminService.confirmRentalRefund(r.id).subscribe({
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

  typeLabel(type: string | null | undefined): string {
    const map: Record<string, string> = {
      DAILY: 'Thuê theo ngày',
      ON_SITE: 'Thuê kèm theo sân',
    };
    return map[type ?? ''] ?? type ?? '';
  }

  refundStatusLabel(s: string | null | undefined): string {
    const map: Record<string, string> = {
      PENDING_REFUND: 'Chờ hoàn cọc',
      REFUNDED: 'Đã hoàn cọc',
      NOT_APPLICABLE: 'Không áp dụng',
    };
    return map[s ?? ''] ?? s ?? '';
  }
}
