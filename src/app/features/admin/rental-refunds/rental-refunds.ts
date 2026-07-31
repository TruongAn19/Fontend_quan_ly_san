import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { RefundStatus, refundStatusLabel } from '../../../core/models/booking.model';
import { RentalToolDTO } from '../../../core/models/rental.model';

type Tab = 'PENDING_REFUND' | 'REFUNDED' | 'ALL';

@Component({
  selector: 'app-admin-rental-refunds',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rental-refunds.html',
  styleUrls: ['./rental-refunds.css'],
})
export class AdminRentalRefundsComponent implements OnInit {
  private adminService = inject(AdminService);

  rentals = signal<RentalToolDTO[]>([]);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(1);
  tab = signal<Tab>('PENDING_REFUND');

  modalRental = signal<RentalToolDTO | null>(null);
  isSubmitting = signal(false);

  readonly refundStatusLabel = refundStatusLabel;

  ngOnInit(): void {
    this.load();
  }

  setTab(t: Tab): void {
    this.tab.set(t);
    this.currentPage.set(0);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    const selectedTab = this.tab();
    const filter = selectedTab === 'ALL' ? null : selectedTab;
    this.adminService.getRentalRefunds(filter, this.currentPage(), 10).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.rentals.set(res.data.rentals);
        this.totalPages.set(Math.max(res.data.totalPages, 1));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message || 'Không thể tải danh sách hoàn cọc.');
      },
    });
  }

  changePage(p: number): void {
    if (p < 0 || p >= this.totalPages()) return;
    this.currentPage.set(p);
    this.load();
  }

  openDetail(r: RentalToolDTO): void {
    this.modalRental.set(r);
  }

  closeDetail(): void {
    this.modalRental.set(null);
  }

  confirmRefund(): void {
    const r = this.modalRental();
    if (!r) return;
    if (r.refundStatus !== 'PENDING_REFUND') {
      this.closeDetail();
      return;
    }
    this.isSubmitting.set(true);
    this.adminService.confirmRentalRefund(r.id).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closeDetail();
        this.load();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        alert(err?.error?.message || 'Không thể xác nhận hoàn cọc.');
      },
    });
  }

  badgeClass(s?: RefundStatus | string | null): string {
    if (s === 'REFUNDED') return 'pill pill-success';
    if (s === 'PENDING_REFUND') return 'pill pill-warning';
    return 'pill pill-muted';
  }
}
