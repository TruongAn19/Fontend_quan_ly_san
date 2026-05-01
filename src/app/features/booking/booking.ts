import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);

  productId = signal<number | null>(null);
  bookingInfo = signal<any>(null);
  availableTimes = signal<any[]>([]);

  bookingForm!: FormGroup;

  isLoading = signal<boolean>(false);
  isHolding = signal<boolean>(false);
  isPlacing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  holdTimeLeft = signal<number>(0);
  holdTimer: any;
  isHeld = signal<boolean>(false);

  selectedDate = signal<string>('');
  selectedCourtId = signal<number | null>(null);

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  ngOnInit(): void {
    this.selectedDate.set(this.toLocalDateString(new Date()));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.initForm();
      this.loadBookingInfo();
    } else {
      this.showError('Mã sản phẩm không hợp lệ.');
    }
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      receiverName: ['', [Validators.required]],
      receiverAddress: ['', [Validators.required]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^0[35789][0-9]{8}$/)]],
      bookingType: ['ONE_TIME', [Validators.required]],
      recurringEndDate: [null],
      availableTimeId: ['', [Validators.required]]
    });
  }

  loadBookingInfo(): void {
    this.isLoading.set(true);
    this.bookingService.getBookingInfo(this.productId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        this.bookingInfo.set(data);
        if (data && data.courts && data.courts.length > 0) {
          this.selectedCourtId.set(data.courts[0].id);
          this.loadAvailableTimes();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showError(err.error?.message || 'Không thể tải thông tin đặt sân.');
      }
    });
  }

  loadAvailableTimes(): void {
    if (!this.selectedCourtId() || !this.selectedDate()) return;

    this.bookingService.getAvailableTimes(this.selectedDate(), this.selectedCourtId()!).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.availableTimes.set(res.data);
        }
      }
    });
  }

  onDateChange(event: any): void {
    this.selectedDate.set(event.target.value);
    this.loadAvailableTimes();
  }

  onCourtChange(event: any): void {
    this.selectedCourtId.set(+event.target.value);
    this.loadAvailableTimes();
  }

  onHoldSlot(): void {
    const timeId = this.bookingForm.get('availableTimeId')?.value;
    if (!timeId || !this.selectedCourtId()) {
      this.showError('Vui lòng chọn sân và khung giờ.');
      return;
    }

    this.isHolding.set(true);
    this.errorMessage.set(null);

    const payload = {
      subCourtId: this.selectedCourtId()!,
      availableTimeId: +timeId,
      bookingDate: this.selectedDate()
    };

    this.bookingService.holdSlot(payload).subscribe({
      next: () => {
        this.isHolding.set(false);
        this.isHeld.set(true);
        this.startHoldTimer(180);
      },
      error: (err) => {
        this.isHolding.set(false);
        this.showError(err.error?.message || 'Không thể giữ chỗ khung giờ này.');
      }
    });
  }

  startHoldTimer(seconds: number): void {
    this.clearHoldTimer();
    this.holdTimeLeft.set(seconds);
    this.holdTimer = setInterval(() => {
      if (this.holdTimeLeft() > 0) {
        this.holdTimeLeft.update(t => t - 1);
      } else {
        this.clearHoldTimer();
        this.isHeld.set(false);
        this.showError('Thời gian giữ chỗ đã hết hạn. Vui lòng thực hiện lại.');
      }
    }, 1000);
  }

  clearHoldTimer(): void {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
    }
  }

  onPlaceBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.showError('Vui lòng điền đầy đủ và đúng thông tin người đặt.');
      return;
    }

    this.isPlacing.set(true);
    this.errorMessage.set(null);

    const payload = {
      ...this.bookingForm.value,
      productId: this.productId(),
      courtId: this.selectedCourtId(),
      bookingDate: this.selectedDate(),
      availableTimeId: +this.bookingForm.get('availableTimeId')?.value
    };

    this.bookingService.placeBooking(payload).subscribe({
      next: (res) => {
        this.isPlacing.set(false);
        this.clearHoldTimer();
        if (res && res.data && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          this.router.navigate(['/booking-success'], {
            state: {
              bookingCode: res?.data?.bookingCode ?? null,
              bookingId: res?.data?.bookingId ?? null,
              message: res?.message ?? 'Đặt sân thành công!'
            }
          });
        }
      },
      error: (err) => {
        this.isPlacing.set(false);
        this.showError(err.error?.message || 'Đặt sân thất bại.');
      }
    });
  }
}
