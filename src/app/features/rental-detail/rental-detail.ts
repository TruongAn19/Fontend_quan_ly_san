import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';

@Component({
  selector: 'app-rental-detail',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './rental-detail.html',
  styleUrls: ['./rental-detail.css']
})
export class RentalDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private rentalService = inject(RentalService);

  rental = signal<any>(null);
  booking = signal<any>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  isCancelling = signal<boolean>(false);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.errorMessage.set('Mã đơn thuê không hợp lệ.');
      return;
    }
    this.load(+id);
  }

  load(id: number): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.rentalService.getRentalDetail(id).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data;
        if (data) {
          this.rental.set(data.rental);
          this.booking.set(data.booking ?? null);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err?.error?.message ?? 'Không thể tải chi tiết đơn thuê.');
      }
    });
  }

  canCancel(): boolean {
    const s = this.rental()?.status;
    return s === 'PENDING' || s === 'IN_USE';
  }

  cancelRental(): void {
    const r = this.rental();
    if (!r || !this.canCancel()) return;
    if (!confirm('Bạn có chắc muốn hủy đơn thuê vợt này?')) return;

    this.isCancelling.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);
    this.rentalService.cancelRental(r.id).subscribe({
      next: (res) => {
        this.isCancelling.set(false);
        // Flip badge ngay sang "Đã hủy"
        this.rental.set({ ...r, status: res?.data?.status ?? 'CANCELLED' });
        this.successMessage.set(res?.message ?? 'Đã hủy đơn thuê thành công.');
      },
      error: (err) => {
        this.isCancelling.set(false);
        if (err?.status === 403) {
          this.errorMessage.set('Bạn không có quyền hủy đơn thuê này.');
        } else {
          // 409 (đơn đã hoàn thành), 404... → message từ backend
          this.errorMessage.set(err?.error?.message ?? 'Không thể hủy đơn thuê. Vui lòng thử lại.');
        }
      }
    });
  }

  statusLabel(status: string | null | undefined): string {
    if (!status) return '';
    const map: Record<string, string> = {
      PENDING: 'Chờ xử lý',
      IN_USE: 'Đang thuê',
      COMPLETED: 'Hoàn thành',
      CANCELLED: 'Đã hủy',
    };
    return map[status] ?? status;
  }

  typeLabel(type: string | null | undefined): string {
    if (!type) return '';
    const map: Record<string, string> = {
      DAILY: 'Thuê theo ngày',
      ON_SITE: 'Thuê kèm theo sân',
    };
    return map[type] ?? type;
  }
}
