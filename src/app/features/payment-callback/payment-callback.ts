import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';

@Component({
  selector: 'app-payment-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payment-callback.html',
  styleUrls: ['./payment-callback.css']
})
export class PaymentCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private rentalService = inject(RentalService);

  isLoading = signal<boolean>(true);
  paymentStatus = signal<'SUCCESS' | 'FAILED' | null>(null);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params && Object.keys(params).length > 0) {
        this.verifyPayment(params);
      } else {
        this.isLoading.set(false);
        this.errorMessage.set('Không nhận được thông tin thanh toán.');
      }
    });
  }

  verifyPayment(params: any): void {
    this.rentalService.vnpayCallback(params).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data;
        const isSuccess =
          data?.status === 'SUCCESS' ||
          data?.status === 'IN_USE' ||
          data?.bookingCode ||
          data?.rentalCode;

        if (isSuccess) {
          if (data?.bookingCode) {
            this.router.navigate(['/booking-success'], {
              state: {
                bookingCode: data.bookingCode,
                bookingId: data.bookingId ?? null,
                message: res?.message ?? 'Thanh toán đặt sân thành công!'
              }
            });
          } else if (data?.rentalCode) {
            this.router.navigate(['/rental-success'], {
              state: {
                rentalCode: data.rentalCode,
                rentalId: data.rentalToolId ?? null,
                message: res?.message ?? 'Thanh toán thuê vợt thành công!'
              }
            });
          } else {
            this.paymentStatus.set('SUCCESS');
          }
        } else {
          this.paymentStatus.set('FAILED');
          this.errorMessage.set('Giao dịch không thành công hoặc đã bị hủy.');
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.paymentStatus.set('FAILED');
        this.errorMessage.set(err.error?.message || 'Lỗi xác minh thanh toán.');
      }
    });
  }
}
