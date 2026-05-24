import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';
import { ProfileService } from '../../core/services/profile.service';

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
  private profileService = inject(ProfileService);

  racketId = signal<number | null>(null);
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
      this.initForm();
      this.prefillFromProfile();
    } else {
      this.errorMessage.set('Mã vợt không hợp lệ.');
    }
  }

  /**
   * Auto-fill fullName/email/phone với thông tin user đang đăng nhập (route có authGuard).
   * Field vẫn editable. Lỗi tải profile không chặn flow.
   */
  private prefillFromProfile(): void {
    this.profileService.getProfile().subscribe({
      next: (res) => {
        const u = res?.data;
        if (!u) return;
        this.rentalForm.patchValue({
          fullName: u.fullName ?? '',
          email: u.email ?? '',
          phone: u.phone ?? ''
        });
      },
      error: (err) => {
        console.warn('Không thể prefill profile cho rental form:', err?.message);
      }
    });
  }

  initForm(): void {
    this.rentalForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])+([0-9]{8})\b$/)]],
      type: ['DAILY', [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      quantityDay: [1],
      rentalDate: [new Date().toISOString().split('T')[0]],
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
      payload.bookingCode = formValue.bookingCode;
    }

    this.rentalService.createRental(payload).subscribe({
      next: (res) => {
        this.isCreating.set(false);
        if (res && res.data) {
          this.createdRentalId.set(res.data.id);
          this.proceedToPay();
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
