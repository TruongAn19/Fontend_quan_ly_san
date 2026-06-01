import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingService } from '../../core/services/booking.service';
import { ProfileService } from '../../core/services/profile.service';
import { StompService } from '../../core/services/stomp.service';
import { Subscription } from 'rxjs';

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
  private stompService = inject(StompService);

  private stompSubscription?: Subscription;

  productId = signal<number | null>(null);
  bookingInfo = signal<any>(null);
  availableTimes = signal<any[]>([]);

  bookingForm!: FormGroup;
  priceEstimate = signal<any>(null);

  isLoading = signal<boolean>(false);
  isHolding = signal<boolean>(false);
  isPlacing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  holdTimeLeft = signal<number>(0);
  holdTimer: any;
  isHeld = signal<boolean>(false);

  selectedDate = signal<string>('');
  selectedCourtId = signal<number | null>(null);

  // --- Bundled rental (thuê vợt kèm khi đặt sân) ---
  rentRackets = signal<boolean>(false);
  racketsLoaded = signal<boolean>(false);
  isLoadingRackets = signal<boolean>(false);
  availableRackets = signal<any[]>([]);
  // racketId -> số lượng đã chọn
  racketQty = signal<Record<number, number>>({});

  /** Tổng tiền thuê vợt = sum(rentalPricePerPlay * quantity). */
  rentalTotal = computed(() => {
    const qty = this.racketQty();
    return this.availableRackets().reduce((sum, r) => {
      const q = qty[r.id] || 0;
      return sum + (r.rentalPricePerPlay || 0) * q;
    }, 0);
  });

  /** Tổng cọc hiển thị = cọc sân + tiền vợt (chỉ ONE_TIME mới có tiền vợt). */
  totalDeposit = computed(() => {
    const est = this.priceEstimate();
    const courtDeposit = est?.depositPrice || 0;
    return courtDeposit + (this.rentRackets() ? this.rentalTotal() : 0);
  });

  weekDays = [
    { label: 'T2', value: 1 },
    { label: 'T3', value: 2 },
    { label: 'T4', value: 3 },
    { label: 'T5', value: 4 },
    { label: 'T6', value: 5 },
    { label: 'T7', value: 6 },
    { label: 'CN', value: 0 }
  ];

  selectedDays: number[] = [];

  private profileService = inject(ProfileService);

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
    this.stompService.initStomp();
    this.selectedDate.set(this.toLocalDateString(new Date()));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.initForm();
      this.loadBookingInfo();
      this.loadUserProfile(); // Tự động điền thông tin người dùng
    } else {
      this.showError('Mã sản phẩm không hợp lệ.');
    }
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
    if (this.stompSubscription) {
      this.stompSubscription.unsubscribe();
    }
    this.stompService.deactivate();
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      receiverName: ['', [Validators.required]],
      receiverAddress: ['', [Validators.required]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^0[35789][0-9]{8}$/)]],
      availableTimeId: ['', [Validators.required]],
      bookingType: ['ONE_TIME', [Validators.required]],
      durationMonths: [1],
    });

    this.bookingForm.valueChanges.subscribe(() => {
      this.calculatePriceEstimate();
      // Đặt tháng không hỗ trợ thuê vợt — tự động reset khi rời ONE_TIME
      if (this.bookingForm.get('bookingType')?.value !== 'ONE_TIME' && this.rentRackets()) {
        this.resetRackets();
      }
    });
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        if (res && res.data) {
          this.bookingForm.patchValue({
            receiverName: res.data.fullName,
            receiverPhone: res.data.phone,
            receiverAddress: res.data.address
          });
        }
      }
    });
  }

  toggleDay(day: number): void {
    const idx = this.selectedDays.indexOf(day);
    if (idx === -1) {
      this.selectedDays.push(day);
    } else {
      this.selectedDays.splice(idx, 1);
    }
    this.calculatePriceEstimate();
  }

  isDaySelected(day: number): boolean {
    return this.selectedDays.includes(day);
  }

  // --- Bundled rental methods ---
  isOneTime(): boolean {
    return this.bookingForm?.get('bookingType')?.value === 'ONE_TIME';
  }

  /** Reset lựa chọn vợt (gọi khi tắt toggle hoặc chuyển sang đặt tháng). */
  private resetRackets(): void {
    this.rentRackets.set(false);
    this.racketQty.set({});
  }

  toggleRentRackets(): void {
    const next = !this.rentRackets();
    this.rentRackets.set(next);
    if (next) {
      if (!this.racketsLoaded()) {
        this.loadRackets();
      }
    } else {
      this.racketQty.set({});
    }
  }

  loadRackets(): void {
    const pid = this.productId();
    if (!pid) return;
    this.isLoadingRackets.set(true);
    this.bookingService.getRacketsByProduct(pid).subscribe({
      next: (res) => {
        this.isLoadingRackets.set(false);
        this.availableRackets.set(res?.data || []);
        this.racketsLoaded.set(true);
      },
      error: () => {
        this.isLoadingRackets.set(false);
        this.showError('Không thể tải danh sách vợt của sân.');
      }
    });
  }

  getRacketQty(racketId: number): number {
    return this.racketQty()[racketId] || 0;
  }

  incRacket(racket: any): void {
    const current = this.getRacketQty(racket.id);
    if (current >= racket.bookingStockQuantity) return;
    this.racketQty.update(q => ({ ...q, [racket.id]: current + 1 }));
  }

  decRacket(racket: any): void {
    const current = this.getRacketQty(racket.id);
    if (current <= 0) return;
    this.racketQty.update(q => ({ ...q, [racket.id]: current - 1 }));
  }

  /** Payload rackets gửi lên BE: chỉ những vợt có quantity > 0. */
  selectedRacketItems(): { racketId: number; quantity: number }[] {
    const qty = this.racketQty();
    return Object.keys(qty)
      .map(id => ({ racketId: +id, quantity: qty[+id] }))
      .filter(item => item.quantity > 0);
  }

  calculatePriceEstimate(): void {
    const type = this.bookingForm.get('bookingType')?.value;
    const info = this.bookingInfo();
    if (!info) return;

    const basePrice = info.product?.price || 0;
    const sale = info.product?.sale || 0;
    const priceAfterSale = basePrice - (basePrice * sale / 100);
    const depositPricePerSlot = info.product?.depositPrice || 0;

    if (type === 'ONE_TIME') {
      this.priceEstimate.set({
        sessions: 1,
        totalPrice: priceAfterSale,
        depositPrice: depositPricePerSlot,
        discountRate: 0,
        savings: 0
      });
    } else {
      const months = this.bookingForm.get('durationMonths')?.value || 1;
      const daysInWeek = this.selectedDays.length;
      if (daysInWeek === 0) {
        this.priceEstimate.set(null);
        return;
      }

      const totalSessions = Math.round(daysInWeek * 4.3 * months);
      let recurringDiscount = 0;
      if (months === 1) recurringDiscount = 5;
      else if (months === 2) recurringDiscount = 8;
      else if (months >= 3) recurringDiscount = 10;

      const totalPriceBeforeRecurring = priceAfterSale * totalSessions;
      const savings = (totalPriceBeforeRecurring * recurringDiscount / 100);
      const finalTotalPrice = totalPriceBeforeRecurring - savings;
      const finalDepositPrice = depositPricePerSlot * totalSessions;

      this.priceEstimate.set({
        sessions: totalSessions,
        totalPrice: finalTotalPrice,
        depositPrice: finalDepositPrice,
        discountRate: recurringDiscount,
        savings: savings
      });
    }
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
          this.calculatePriceEstimate();
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
          this.subscribeToRealtimeSlots();
        }
      }
    });
  }

  private subscribeToRealtimeSlots(): void {
    if (this.stompSubscription) {
      this.stompSubscription.unsubscribe();
    }
    const topic = `/topic/slots.${this.selectedCourtId()}.${this.selectedDate()}`;
    this.stompSubscription = this.stompService.watch(topic).subscribe(message => {
      const event = JSON.parse(message.body);
      this.handleRealtimeEvent(event);
    });
  }

  private handleRealtimeEvent(event: any): void {
    const currentTimes = [...this.availableTimes()];
    const index = currentTimes.findIndex(t => t.id === event.timeId);
    if (index !== -1) {
      if (event.status === 'RELEASE') {
        currentTimes[index].status = null;
      } else {
        currentTimes[index].status = event.status;
        if (this.bookingForm.get('availableTimeId')?.value === event.timeId) {
            this.showError('Rất tiếc, khung giờ bạn chọn vừa có người khác thao tác.');
            this.bookingForm.get('availableTimeId')?.setValue('');
        }
      }
      this.availableTimes.set(currentTimes);
    }
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

    const type = this.bookingForm.get('bookingType')?.value;
    if (type === 'WEEKLY_RECURRING' && this.selectedDays.length === 0) {
      this.showError('Vui lòng chọn ít nhất một thứ trong tuần để đặt sân tháng.');
      return;
    }

    this.isPlacing.set(true);
    this.errorMessage.set(null);

    let recurringEndDate = null;
    if (type === 'WEEKLY_RECURRING') {
      const startDate = new Date(this.selectedDate());
      const months = this.bookingForm.get('durationMonths')?.value;
      startDate.setMonth(startDate.getMonth() + months);
      recurringEndDate = this.toLocalDateString(startDate);
    }

    const payload: any = {
      ...this.bookingForm.value,
      selectedDays: this.selectedDays,
      productId: this.productId(),
      courtId: this.selectedCourtId(), // Đổi subCourtId thành courtId cho API /place
      bookingDate: this.selectedDate(),
      availableTimeId: +this.bookingForm.get('availableTimeId')?.value,
      recurringEndDate: recurringEndDate
    };

    // Bundled rental — chỉ gửi khi bật toggle, đang ONE_TIME và có chọn vợt
    if (type === 'ONE_TIME' && this.rentRackets()) {
      const items = this.selectedRacketItems();
      if (items.length > 0) {
        payload.rackets = items;
      }
    }

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
