import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';

@Component({
  selector: 'app-rental',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rental.html',
  styleUrls: ['./rental.css']
})
export class RentalComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private rentalService = inject(RentalService);

  racketId = signal<number | null>(null);
  racket = signal<any | null>(null);
  rentalForm!: FormGroup;

  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isPaying = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  createdRentalId = signal<number | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.racketId.set(+id);
      this.loadRacketDetails(+id);
      this.initForm();
    } else {
      this.errorMessage.set('Mã vợt không hợp lệ.');
    }
  }

  loadRacketDetails(id: number): void {
    this.rentalService.getRacketById(id).subscribe({
      next: (res) => {
        this.racket.set(res.data);
      },
      error: () => {
        this.errorMessage.set('Không thể tải thông tin vợt.');
      }
    });
  }

  initForm(): void {
    this.rentalForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^0[0-9]{9}$/)]],
      type: ['DAILY', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      quantityDay: [1, [Validators.required, Validators.min(1)]],
      rentalDate: [new Date().toISOString().split('T')[0], [Validators.required]],
      bookingCode: [''],
      paymentMethod: ['VNPAY', [Validators.required]]
    });

    this.rentalForm.get('type')?.valueChanges.subscribe(type => {
      if (type === 'DAILY') {
        this.rentalForm.get('quantityDay')?.setValidators([Validators.required, Validators.min(1)]);
        this.rentalForm.get('rentalDate')?.setValidators([Validators.required]);
        this.rentalForm.get('bookingCode')?.clearValidators();
      } else {
        this.rentalForm.get('quantityDay')?.clearValidators();
        this.rentalForm.get('rentalDate')?.clearValidators();
        this.rentalForm.get('bookingCode')?.setValidators([Validators.required]);
      }
      this.rentalForm.get('quantityDay')?.updateValueAndValidity();
      this.rentalForm.get('rentalDate')?.updateValueAndValidity();
      this.rentalForm.get('bookingCode')?.updateValueAndValidity();
    });
  }


  get totalPrice(): number {
    const racket = this.racket();
    if (!racket || !this.rentalForm) return 0;
    const formValue = this.rentalForm.value;
    const type = formValue.type;
    const quantity = formValue.quantity || 0;
    const days = formValue.quantityDay || 1;
    const unitPrice = type === 'DAILY' ? racket.rentalPricePerDay : racket.rentalPricePerPlay;
    return unitPrice * quantity * (type === 'DAILY' ? days : 1);
  }

  get depositTotal(): number {
    const racket = this.racket();
    if (!racket || !this.rentalForm) return 0;
    const quantity = this.rentalForm.get('quantity')?.value || 0;
    return (racket.price || 0) * quantity;
  }

  onSubmitRental(): void {
    if (this.rentalForm.invalid) {
      this.rentalForm.markAllAsTouched();
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    const formValue = this.rentalForm.value;
    const payload: any = {
      fullName: formValue.fullName,
      email: formValue.email,
      phone: formValue.phone,
      type: formValue.type,
      racketId: this.racketId(),
      quantity: formValue.quantity
    };

    if (formValue.type === 'DAILY') {
      payload.quantityDay = formValue.quantityDay;
      payload.rentalDate = formValue.rentalDate;
    } else {
      payload.bookingCode = formValue.bookingCode?.trim().toUpperCase();
      payload.quantityDay = 1;
      payload.rentalDate = new Date().toISOString().split('T')[0];
    }

    if (formValue.type === 'ON_SITE') {
      const productId = this.racket()?.product?.id;
      if (!productId) {
        this.isCreating.set(false);
        this.errorMessage.set('Vợt chưa được gắn với sân.');
        return;
      }
      this.rentalService.getRacketsByBooking(payload.bookingCode, productId).subscribe({
        next: (res) => {
          const rackets = res?.data?.rackets || [];
          const selected = rackets.find((item: any) => item.id === this.racketId());
          if (!selected || selected.bookingStockQuantity < payload.quantity) {
            this.isCreating.set(false);
            this.errorMessage.set('Vợt không còn đủ tồn kho tại sân của booking.');
            return;
          }
          this.submitRental(payload, formValue.type);
        },
        error: (err) => {
          this.isCreating.set(false);
          this.errorMessage.set(err.error?.message || 'Không thể kiểm tra vợt tại sân.');
        }
      });
      return;
    }

    this.submitRental(payload, formValue.type);
  }

  private submitRental(payload: any, rentalType: string): void {
    this.rentalService.createRental(payload).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        if (res && res.data) {
          this.createdRentalId.set(res.data.id);
          if (rentalType === 'DAILY') {
            this.proceedToPay();
          } else {
            this.router.navigate(['/rental-success'], {
              state: {
                rentalCode: res.data.rentalToolCode ?? null,
                rentalId: res.data.id,
                message: res.message ?? 'Thuê vợt tại sân thành công!'
              }
            });
          }
        }
      },
      error: (err) => {
        this.isCreating.set(false);
        this.errorMessage.set(err.error?.message || 'Tạo đơn thuê thất bại.');
      }
    });
  }

  proceedToPay(): void {
    if (!this.createdRentalId()) return;

    this.isPaying.set(true);
    const paymentMethod = this.rentalForm.get('paymentMethod')?.value;

    this.rentalService.payRental(this.createdRentalId()!, { paymentMethod }).subscribe({
      next: (res) => {
        this.isPaying.set(false);
        if (res && res.data && res.data.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          this.router.navigate(['/rental-history']);
        }
      },
      error: (err) => {
        this.isPaying.set(false);
        this.errorMessage.set(err.error?.message || 'Thanh toán đơn thuê thất bại.');
      }
    });
  }
}
