import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

interface Tab {
  key: string;        // '' = tất cả
  label: string;
}

@Component({
  selector: 'app-admin-refund-requests',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './refund-requests.html',
  styleUrls: ['./refund-requests.css']
})
export class RefundRequestsComponent implements OnInit {
  private adminService = inject(AdminService);

  tabs: Tab[] = [
    { key: 'PENDING_REFUND', label: 'Chờ hoàn cọc' },
    { key: 'REFUNDED', label: 'Đã hoàn cọc' },
    { key: '', label: 'Tất cả' }
  ];
  activeTab = signal<string>('PENDING_REFUND');

  items = signal<any[]>([]);
  currentPage = signal<number>(0);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  selected = signal<any>(null);
  isConfirming = signal<boolean>(false);

  ngOnInit(): void {
    this.load();
  }

  selectTab(key: string): void {
    if (this.activeTab() === key) return;
    this.activeTab.set(key);
    this.currentPage.set(0);
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminService.getRefundRequests(this.activeTab() || undefined, this.currentPage(), 10).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        this.items.set(data?.items || []);
        this.totalPages.set(data?.totalPages || 1);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải danh sách hoàn cọc.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.currentPage.set(page);
      this.load();
    }
  }

  openDetail(item: any): void {
    this.selected.set(item);
  }

  closeDetail(): void {
    this.selected.set(null);
  }

  confirmRefund(item: any): void {
    this.isConfirming.set(true);
    this.adminService.confirmRefund(item.id).subscribe({
      next: () => {
        this.isConfirming.set(false);
        this.selected.set(null);
        this.load();
      },
      error: (err) => {
        this.isConfirming.set(false);
        this.errorMessage.set(err.error?.message || 'Xác nhận hoàn cọc thất bại.');
      }
    });
  }

  isPending(item: any): boolean {
    return (item?.refundStatus || '').toUpperCase() === 'PENDING_REFUND';
  }

  refundStatusText(rs: string): string {
    switch ((rs || '').toUpperCase()) {
      case 'PENDING_REFUND': return 'Chờ hoàn cọc';
      case 'REFUNDED': return 'Đã hoàn cọc';
      case 'NOT_APPLICABLE': return 'Không hoàn cọc';
      default: return rs || '-';
    }
  }
}
