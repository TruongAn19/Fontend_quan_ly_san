import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { BookingSocketService, SlotEvent } from '../../core/services/booking-socket.service';
import { ProfileService } from '../../core/services/profile.service';

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
  private bookingSocket = inject(BookingSocketService);
  private profileService = inject(ProfileService);

  productId = signal<number | null>(null);
  bookingInfo = signal<any>(null);
  availableTimes = signal<any[]>([]);

  bookingForm!: FormGroup;

  isLoading = signal<boolean>(false);
  isHolding = signal<boolean>(false);
  isPlacing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  notice = signal<string | null>(null);

  holdTimeLeft = signal<number>(0);
  holdTimer: any;
  isHeld = signal<boolean>(false);
  heldTimeId = signal<number | null>(null);

  selectedDate = signal<string>('');
  selectedCourtId = signal<number | null>(null);

  // Bundled racket rental (chỉ áp dụng cho ONE_TIME — xem D0.1)
  rentRackets = signal<boolean>(false);
  rackets = signal<any[]>([]);
  racketQuantities = signal<Record<number, number>>({});
  isLoadingRackets = signal<boolean>(false);

  selectedRacketItems = computed(() =>
    Object.entries(this.racketQuantities())
      .filter(([, qty]) => qty > 0)
      .map(([racketId, quantity]) => ({ racketId: +racketId, quantity }))
  );

  rentalTotal = computed(() => {
    const qtyMap = this.racketQuantities();
    return this.rackets().reduce((sum, r) => sum + (qtyMap[r.id] ?? 0) * (r.rentalPricePerPlay ?? 0), 0);
  });

  courtDepositTotal = computed(() => {
    const info = this.bookingInfo();
    if (!info?.product?.depositPrice) return 0;
    return info.product.depositPrice;
  });

  totalDeposit = computed(() => this.courtDepositTotal() + this.rentalTotal());

  private socketSub: Subscription | null = null;

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private showNotice(msg: string): void {
    this.notice.set(msg);
    setTimeout(() => this.notice.set(null), 5000);
  }

  private toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /** Cộng số tháng vào bookingDate để ra recurringEndDate (yyyy-MM-dd). */
  private computeRecurringEndDate(startDateStr: string, months: number): string {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const end = new Date(y, m - 1, d);
    end.setMonth(end.getMonth() + (months ?? 1));
    return this.toLocalDateString(end);
  }

  ngOnInit(): void {
    this.selectedDate.set(this.toLocalDateString(new Date()));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.initForm();
      this.prefillFromProfile();
      this.loadBookingInfo();
    } else {
      this.showError('Mã sản phẩm không hợp lệ.');
    }
  }

  /**
   * Auto-fill receiver fields với thông tin user đang đăng nhập (route đã có authGuard).
   * Field vẫn editable — user có thể sửa để đặt hộ người khác.
   * Lỗi tải profile không chặn flow đặt sân (form vẫn dùng được, chỉ là không prefill).
   */
  private prefillFromProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        const u = res?.data;
        if (!u) return;
        this.bookingForm.patchValue({
          receiverName: u.fullName ?? '',
          receiverAddress: u.address ?? '',
          receiverPhone: u.phone ?? ''
        });
      },
      error: (err) => {
        console.warn('Không thể prefill profile cho booking form:', err?.message);
      }
    });
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
    this.unsubscribeSlotEvents();
  }

  readonly weekDays = [
    { value: 1, label: 'Thứ 2' },
    { value: 2, label: 'Thứ 3' },
    { value: 3, label: 'Thứ 4' },
    { value: 4, label: 'Thứ 5' },
    { value: 5, label: 'Thứ 6' },
    { value: 6, label: 'Thứ 7' },
    { value: 7, label: 'Chủ Nhật' }
  ];

  selectedWeekdays = signal<number[]>([]);

  toggleWeekday(dayValue: number) {
    const current = this.selectedWeekdays();
    if (current.includes(dayValue)) {
      this.selectedWeekdays.set(current.filter(d => d !== dayValue));
    } else {
      this.selectedWeekdays.set([...current, dayValue]);
    }
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      receiverName: ['', [Validators.required]],
      receiverAddress: ['', [Validators.required]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^0[35789][0-9]{8}$/)]],
      bookingType: ['ONE_TIME', [Validators.required]],
      durationMonths: [1],
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

  isOneTime(): boolean {
    return this.bookingForm?.get('bookingType')?.value === 'ONE_TIME';
  }

  toggleRentRackets(value: boolean): void {
    this.rentRackets.set(value);
    if (value && this.rackets().length === 0 && this.productId()) {
      this.loadRackets();
    }
    if (!value) {
      this.racketQuantities.set({});
    }
  }

  onBookingTypeChange(): void {
    // WEEKLY_RECURRING không cho thuê vợt (D0.1) — reset state
    if (!this.isOneTime()) {
      this.rentRackets.set(false);
      this.racketQuantities.set({});
    }
  }

  loadRackets(): void {
    if (!this.productId()) return;
    this.isLoadingRackets.set(true);
    this.bookingService.getRacketsByProduct(this.productId()!).subscribe({
      next: (res) => {
        this.isLoadingRackets.set(false);
        if (res?.data) {
          this.rackets.set(res.data);
        }
      },
      error: () => {
        this.isLoadingRackets.set(false);
        this.showError('Không thể tải danh sách vợt của sân.');
      }
    });
  }

  qtyFor(racketId: number): number {
    const map = this.racketQuantities() as Record<number, number | undefined>;
    return map[racketId] ?? 0;
  }

  incrementRacket(racket: any): void {
    const current = this.qtyFor(racket.id);
    const max = (racket.bookingStockQuantity as number | undefined) ?? 0;
    if (current >= max) return;
    this.racketQuantities.update(map => ({ ...map, [racket.id]: current + 1 }));
  }

  decrementRacket(racket: any): void {
    const current = this.qtyFor(racket.id);
    if (current <= 0) return;
    this.racketQuantities.update(map => ({ ...map, [racket.id]: current - 1 }));
  }

  loadAvailableTimes(): void {
    if (!this.selectedCourtId() || !this.selectedDate()) return;

    this.bookingService.getAvailableTimes(this.selectedDate(), this.selectedCourtId()!).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.availableTimes.set(res.data);
          this.subscribeSlotEvents();
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
    // Mark ownership BEFORE the HTTP call so the SLOT_HELD broadcast (which may arrive
    // over WebSocket before the HTTP response) is recognised as our own and skipped.
    this.heldTimeId.set(+timeId);

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
        this.heldTimeId.set(null);
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
        this.heldTimeId.set(null);
        this.showError('Thời gian giữ chỗ đã hết hạn. Vui lòng thực hiện lại.');
      }
    }, 1000);
  }

  clearHoldTimer(): void {
    if (this.holdTimer) {
      clearInterval(this.holdTimer);
    }
  }

  private subscribeSlotEvents(): void {
    this.unsubscribeSlotEvents();
    const courtId = this.selectedCourtId();
    const date = this.selectedDate();
    if (!courtId || !date) return;

    this.socketSub = this.bookingSocket.watchSlotEvents(courtId, date).subscribe({
      next: (event) => this.handleSlotEvent(event),
      error: (err) => console.error('Slot socket error:', err),
    });
  }

  private unsubscribeSlotEvents(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
      this.socketSub = null;
    }
  }

  private handleSlotEvent(event: SlotEvent): void {
    if (event.subCourtId !== this.selectedCourtId() || event.bookingDate !== this.selectedDate()) {
      return;
    }

    if (event.type === 'SLOT_HELD') {
      // Own hold (pending or confirmed) — heldTimeId is set before the HTTP request,
      // so this check works even if the WS event races ahead of the HTTP response.
      if (this.heldTimeId() === event.availableTimeId) {
        return;
      }

      const selectedTimeId = +(this.bookingForm.get('availableTimeId')?.value ?? 0);
      const stealsMySelection = selectedTimeId === event.availableTimeId && !this.isHeld();

      this.availableTimes.update(times => times.filter(t => t.id !== event.availableTimeId));

      if (stealsMySelection) {
        this.bookingForm.patchValue({ availableTimeId: '' });
        this.showNotice('Khung giờ bạn đang chọn vừa được người khác giữ. Vui lòng chọn khung giờ khác.');
      } else {
        this.showNotice('Có người vừa giữ một khung giờ khác.');
      }
      return;
    }

    if (event.type === 'SLOT_RELEASED') {
      this.bookingService.getAvailableTimes(this.selectedDate(), this.selectedCourtId()!).subscribe({
        next: (res) => {
          if (res && res.data) {
            this.availableTimes.set(res.data);
          }
        }
      });
    }
  }

  onPlaceBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.showError('Vui lòng điền đầy đủ và đúng thông tin người đặt.');
      return;
    }

    if (this.bookingForm.get('bookingType')?.value === 'WEEKLY_RECURRING' && this.selectedWeekdays().length === 0) {
      this.showError('Vui lòng chọn ít nhất một thứ trong tuần.');
      return;
    }

    this.isPlacing.set(true);
    this.errorMessage.set(null);

    const formValue = this.bookingForm.value;
    const isWeekly = formValue.bookingType === 'WEEKLY_RECURRING';
    const payload = {
      ...formValue,
      weekdays: isWeekly ? this.selectedWeekdays() : null,
      durationMonths: isWeekly ? formValue.durationMonths : null,
      recurringEndDate: isWeekly ? this.computeRecurringEndDate(this.selectedDate(), +formValue.durationMonths) : null,
      productId: this.productId(),
      courtId: this.selectedCourtId(),
      bookingDate: this.selectedDate(),
      availableTimeId: +this.bookingForm.get('availableTimeId')?.value,
      rackets: this.isOneTime() && this.rentRackets() ? this.selectedRacketItems() : null
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
