import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { ProfileService } from '../../core/services/profile.service';
import { SlotEventsService, SlotHeldEvent } from '../../core/services/slot-events.service';
import { AuthService } from '../../core/services/auth.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import {
  AvailableTimeDTO,
  BookingInfoResponse,
  EstimatePriceRequest,
  EstimatePriceResponse,
  PlaceBookingRequest,
  pitchTypeLabel,
} from '../../core/models/booking.model';

type TimerHandle = ReturnType<typeof setInterval>;

@Component({
  selector: 'app-booking',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './booking.html',
  styleUrls: ['./booking.css']
})
export class BookingComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private bookingService = inject(BookingService);
  private profileService = inject(ProfileService);
  private slotEvents = inject(SlotEventsService);
  private authService = inject(AuthService);

  productId = signal<number | null>(null);
  productDetail = signal<BookingInfoResponse | null>(null);
  availableTimes = signal<AvailableTimeDTO[]>([]);

  bookingForm!: FormGroup;

  isLoading = signal<boolean>(false);
  isHolding = signal<boolean>(false);
  isPlacing = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  holdTimeLeft = signal<number>(0);
  holdTimer: TimerHandle | null = null;
  isHeld = signal<boolean>(false);

  selectedDate = signal<string>('');
  selectedPitchId = signal<number | null>(null);

  /** Template helper — label for a SubPitch's PitchType. */
  readonly pitchTypeLabel = pitchTypeLabel;
  readonly productImageUrl = (image: string | null) => resolveMediaUrl(image, 'product');

  // Popup xác nhận
  showConfirmPopup = signal<boolean>(false);
  isEstimating = signal<boolean>(false);
  priceEstimate = signal<EstimatePriceResponse | null>(null);
  estimateWarning = signal<string | null>(null);
  pendingPayload: PlaceBookingRequest | null = null;
  includeEquipments = signal(false);
  equipmentQuantities = signal<Record<number, number>>({});
  availableBookingEquipments = computed(() =>
    (this.productDetail()?.equipments ?? []).filter(
      equipment => equipment.available
        && equipment.rentalPricePerPlay > 0
        && equipment.bookingStockQuantity > 0,
    ),
  );
  selectedEquipmentRentalPrice = computed(() =>
    this.availableBookingEquipments().reduce(
      (total, equipment) => total
        + (this.equipmentQuantities()[equipment.id] ?? 0) * equipment.rentalPricePerPlay,
      0,
    ),
  );
  paymentAmount = computed(() =>
    (this.priceEstimate()?.depositPrice ?? 0) + this.selectedEquipmentRentalPrice(),
  );

  // Realtime slot conflict
  conflictToast = signal<{ timeName: string; visible: boolean } | null>(null);
  blockedTimeIds = signal<Set<number>>(new Set());
  private slotEventsSub?: Subscription;
  private conflictToastTimer: TimerHandle | null = null;

  today = new Date();

  weekDays = [
    { label: 'Thứ 2', value: 1 },
    { label: 'Thứ 3', value: 2 },
    { label: 'Thứ 4', value: 3 },
    { label: 'Thứ 5', value: 4 },
    { label: 'Thứ 6', value: 5 },
    { label: 'Thứ 7', value: 6 },
    { label: 'CN', value: 7 }
  ];
  selectedDays: number[] = [];

  private showError(msg: string): void {
    this.errorMessage.set(msg);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toLocalDateString(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  getSelectedTimeName(): string {
    const id = this.bookingForm?.get('availableTimeId')?.value;
    if (!id) return 'Chưa chọn';
    const t = this.availableTimes().find((x) => x.id === +id);
    return t ? t.time : 'Chưa chọn';
  }

  isCurrentSlotBlocked(): boolean {
    const id = +this.bookingForm?.get('availableTimeId')?.value;
    if (!id) return false;
    return this.blockedTimeIds().has(id);
  }

  ngOnInit(): void {
    this.selectedDate.set(this.toLocalDateString(new Date()));
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.initForm();
      this.loadBookingInfo();
      this.loadUserProfile();
      this.subscribeSlotEvents();
    } else {
      this.showError('Mã sản phẩm không hợp lệ.');
    }
  }

  ngOnDestroy(): void {
    this.clearHoldTimer();
    this.slotEventsSub?.unsubscribe();
    this.slotEvents.disconnect();
    if (this.conflictToastTimer) clearTimeout(this.conflictToastTimer);
  }

  private subscribeSlotEvents(): void {
    this.slotEventsSub = this.slotEvents.stream.subscribe((evt: SlotHeldEvent) => {
      if (evt.action !== 'HELD') return;

      const myEmail = this.authService.currentUser();
      if (myEmail && evt.holderEmail && evt.holderEmail === myEmail) return;

      const sameContext =
        evt.subPitchId === this.selectedPitchId() &&
        evt.bookingDate === this.selectedDate();
      if (!sameContext) return;

      const selectedTimeId = +this.bookingForm?.get('availableTimeId')?.value;
      const isMySelectedSlot = evt.availableTimeId === selectedTimeId;

      const heldTime = this.availableTimes().find((t) => t.id === evt.availableTimeId);
      const heldTimeName = heldTime?.time || 'khung giờ này';

      this.blockedTimeIds.update(set => {
        const next = new Set(set);
        next.add(evt.availableTimeId);
        return next;
      });

      if (isMySelectedSlot && !this.isHeld()) {
        this.showConflictToast(heldTimeName);
        this.bookingForm.patchValue({ availableTimeId: '' });
        this.loadAvailableTimes({ autoSelectFirst: false, resetBlocked: false });
      } else {
        this.loadAvailableTimes({ autoSelectFirst: false, resetBlocked: false });
      }
    });
  }

  private reconnectSlotEvents(): void {
    const pitchId = this.selectedPitchId();
    const date = this.selectedDate();
    if (pitchId && date) {
      this.slotEvents.subscribe(pitchId, date);
    }
  }

  private showConflictToast(timeName: string): void {
    this.conflictToast.set({ timeName, visible: true });
    if (this.conflictToastTimer) clearTimeout(this.conflictToastTimer);
    this.conflictToastTimer = setTimeout(() => this.conflictToast.set(null), 6000);
  }

  dismissConflictToast(): void {
    this.conflictToast.set(null);
    if (this.conflictToastTimer) clearTimeout(this.conflictToastTimer);
  }

  initForm(): void {
    this.bookingForm = this.fb.group({
      receiverName: ['', [Validators.required]],
      receiverAddress: ['', [Validators.required]],
      receiverPhone: ['', [Validators.required, Validators.pattern(/^0[35789][0-9]{8}$/)]],
      availableTimeId: ['', [Validators.required]],
      bookingType: ['ONE_TIME', [Validators.required]],
      recurringEndDate: [null],
      durationMonths: [1]
    });
  }

  toggleDay(dayValue: number): void {
    const idx = this.selectedDays.indexOf(dayValue);
    if (idx > -1) {
      this.selectedDays.splice(idx, 1);
    } else {
      this.selectedDays.push(dayValue);
    }
  }

  isDaySelected(dayValue: number): boolean {
    return this.selectedDays.includes(dayValue);
  }

  loadUserProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        const user = res?.data;
        if (user) {
          this.bookingForm.patchValue({
            receiverName: user.fullName || '',
            receiverPhone: user.phone || '',
            receiverAddress: user.address || ''
          });
        }
      },
      error: (err) => console.error('Failed to load profile', err)
    });
  }

  loadBookingInfo(): void {
    this.isLoading.set(true);
    this.bookingService.getBookingInfo(this.productId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = (res?.data ?? res) as BookingInfoResponse;
        this.productDetail.set(data);
        if (data && data.courts && data.courts.length > 0) {
          this.selectedPitchId.set(data.courts[0].id);
          this.loadAvailableTimes();
          this.reconnectSlotEvents();
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.showError(err.error?.message || 'Không thể tải thông tin đặt sân.');
      }
    });
  }

  loadAvailableTimes(opts: { autoSelectFirst?: boolean; resetBlocked?: boolean } = {}): void {
    const { autoSelectFirst = true, resetBlocked = true } = opts;
    if (!this.selectedPitchId() || !this.selectedDate()) return;

    this.bookingService.getAvailableTimes(this.selectedDate(), this.selectedPitchId()!).subscribe({
      next: (res) => {
        if (res && res.data) {
          this.availableTimes.set(res.data);
          // Server đã filter out held slots → list này là source of truth.
          // Reset blockedTimeIds để không giữ entries stale (vd: slot đã free
          // trong lúc SSE disconnect). KHÔNG reset khi call do SSE event vừa
          // add slot vào set ngay trước đó — sẽ xoá mất overlay realtime.
          if (resetBlocked) {
            this.blockedTimeIds.set(new Set());
          }
          if (res.data.length > 0) {
            const currentId = this.bookingForm.get('availableTimeId')?.value;
            const exists = res.data.some((t) => t.id === +currentId);
            if (!exists) {
              const next = autoSelectFirst ? res.data[0].id : '';
              this.bookingForm.patchValue({ availableTimeId: next });
            }
          } else {
            this.bookingForm.patchValue({ availableTimeId: '' });
          }
        }
      },
      error: (err) => console.error('Failed to load available times', err)
    });
  }

  onDateChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.selectedDate.set(target.value);
    this.blockedTimeIds.set(new Set());
    this.loadAvailableTimes();
    this.reconnectSlotEvents();
  }

  onPitchChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedPitchId.set(+target.value);
    this.blockedTimeIds.set(new Set());
    this.loadAvailableTimes();
    this.reconnectSlotEvents();
  }

  onHoldSlot(): void {
    const timeId = this.bookingForm.get('availableTimeId')?.value;
    if (!timeId || !this.selectedPitchId()) {
      this.showError('Vui lòng chọn sân và khung giờ.');
      return;
    }

    if (this.blockedTimeIds().has(+timeId)) {
      this.showError('Khung giờ này vừa bị người khác giữ. Vui lòng chọn khung giờ khác.');
      return;
    }

    this.isHolding.set(true);
    this.errorMessage.set(null);

    const payload = {
      subPitchId: this.selectedPitchId()!,
      availableTimeId: +timeId,
      bookingDate: this.selectedDate()
    };

    this.bookingService.holdSlot(payload).subscribe({
      next: (res) => {
        this.isHolding.set(false);
        this.isHeld.set(true);
        const remaining = res?.data?.remainingTime ?? 180;
        this.startHoldTimer(remaining);
      },
      error: (err) => {
        this.isHolding.set(false);
        this.showError(err.error?.message || 'Không thể giữ chỗ khung giờ này.');
      }
    });
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
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
      this.holdTimer = null;
    }
  }

  onPlaceBooking(): void {
    if (this.bookingForm.invalid) {
      this.bookingForm.markAllAsTouched();
      this.showError('Vui lòng điền đầy đủ và đúng định dạng thông tin người đặt.');
      return;
    }

    if (!this.isHeld()) {
      this.showError('Vui lòng giữ chỗ trước khi thanh toán.');
      return;
    }

    this.errorMessage.set(null);
    this.isEstimating.set(true);

    const productId = this.productId();
    const courtId = this.selectedPitchId();
    if (productId == null || courtId == null) {
      this.isEstimating.set(false);
      this.showError('Thiếu thông tin sân.');
      return;
    }

    const formValue = this.bookingForm.value;
    const payload: PlaceBookingRequest = {
      receiverName: formValue.receiverName,
      receiverAddress: formValue.receiverAddress,
      receiverPhone: formValue.receiverPhone,
      productId,
      courtId,
      bookingDate: this.selectedDate(),
      availableTimeId: +this.bookingForm.get('availableTimeId')?.value,
      bookingType: formValue.bookingType,
      recurringEndDate: formValue.recurringEndDate,
      daysOfWeek: this.selectedDays,
      durationMonths: formValue.durationMonths
    };

    this.pendingPayload = payload;

    const estimateReq: EstimatePriceRequest = {
      productId: payload.productId,
      availableTimeId: payload.availableTimeId,
      bookingDate: payload.bookingDate,
      bookingType: payload.bookingType,
      recurringEndDate: payload.recurringEndDate,
      daysOfWeek: payload.daysOfWeek,
      durationMonths: payload.durationMonths,
    };
    this.bookingService.estimatePrice(estimateReq).subscribe({
      next: (res) => {
        this.isEstimating.set(false);
        this.priceEstimate.set(res.data);
        this.estimateWarning.set(null);
        this.includeEquipments.set(false);
        this.equipmentQuantities.set({});
        this.showConfirmPopup.set(true);
      },
      error: () => {
        this.isEstimating.set(false);
        // Estimate fail nhưng vẫn cho tiếp tục — popup sẽ render warning banner
        // để user biết phần thông tin giá đang thiếu trước khi confirm.
        this.priceEstimate.set(null);
        this.estimateWarning.set('Không thể tải thông tin giá. Kiểm tra kỹ trước khi xác nhận.');
        this.showConfirmPopup.set(true);
      }
    });
  }

  cancelPopup(): void {
    this.showConfirmPopup.set(false);
    this.priceEstimate.set(null);
    this.estimateWarning.set(null);
    this.pendingPayload = null;
    this.includeEquipments.set(false);
    this.equipmentQuantities.set({});
  }

  toggleEquipmentChoice(): void {
    this.includeEquipments.update(value => !value);
    if (!this.includeEquipments()) {
      this.equipmentQuantities.set({});
    }
  }

  equipmentQuantity(equipmentId: number): number {
    return this.equipmentQuantities()[equipmentId] ?? 0;
  }

  changeEquipmentQuantity(equipmentId: number, delta: number, max: number): void {
    const current = this.equipmentQuantity(equipmentId);
    const next = Math.max(0, Math.min(max, current + delta));
    this.equipmentQuantities.update(quantities => ({ ...quantities, [equipmentId]: next }));
  }

  confirmBooking(): void {
    this.showConfirmPopup.set(false);
    this.estimateWarning.set(null);
    this.isPlacing.set(true);

    if (!this.pendingPayload) {
      this.isPlacing.set(false);
      return;
    }

    this.pendingPayload = {
      ...this.pendingPayload,
      equipments: this.includeEquipments()
        ? this.availableBookingEquipments()
            .map(equipment => ({
              equipmentId: equipment.id,
              quantity: this.equipmentQuantity(equipment.id),
            }))
            .filter(selection => selection.quantity > 0)
        : [],
    };

    this.bookingService.placeBooking(this.pendingPayload).subscribe({
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
        this.showError(err.error?.message || 'Đặt sân thất bại. Vui lòng kiểm tra lại thông tin.');
      }
    });
  }
}
