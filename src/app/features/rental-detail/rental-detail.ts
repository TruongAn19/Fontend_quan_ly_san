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
