import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { RentalService } from '../../core/services/rental.service';
import { EquipmentService } from '../../core/services/equipment.service';
import {
  CreateRentalRequest,
  RentalPaymentMethod,
  RentalType,
} from '../../core/models/rental.model';
import { EquipmentDetail } from '../../core/models/equipment.model';

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
  private equipmentService = inject(EquipmentService);

  equipmentId = signal<number | null>(null);
  equipmentDetail = signal<EquipmentDetail | null>(null);
  rentalForm!: FormGroup;

  isLoading = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  isPaying = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  createdRentalId = signal<number | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      const equipmentId = +id;
      this.equipmentId.set(equipmentId);
      this.initForm();
      this.loadEquipmentDetail(equipmentId);
    } else {
      this.errorMessage.set('Mã thiết bị không hợp lệ.');
    }
  }

  private loadEquipmentDetail(equipmentId: number): void {
    this.isLoading.set(true);
    this.equipmentService.getEquipmentById(equipmentId).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.equipmentDetail.set(res.data ?? null);
      },
      error: () => {
        // Không chặn form — chỉ thiếu header thông tin thiết bị.
        this.isLoading.set(false);
      },
    });
  }

  initForm(): void {
    this.rentalForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])+([0-9]{8})\b$/)]],
      type: ['DAILY' as RentalType, [Validators.required]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      quantityDay: [1],
      rentalDate: [new Date().toISOString().split('T')[0]],
      bookingCode: [''],
      paymentMethod: ['VNPAY' as RentalPaymentMethod, [Validators.required]]
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

    const equipmentId = this.equipmentId();
    if (equipmentId == null) {
      this.errorMessage.set('Thiếu mã thiết bị.');
      return;
    }

    this.isCreating.set(true);
    this.errorMessage.set(null);

    const formValue = this.rentalForm.value;
    const payload: CreateRentalRequest = {
      fullName: formValue.fullName,
      email: formValue.email,
      phone: formValue.phone,
      type: formValue.type,
      equipmentId,
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
    const rentalId = this.createdRentalId();
    if (!rentalId) return;

    this.isPaying.set(true);
    const paymentMethod = this.rentalForm.get('paymentMethod')?.value as RentalPaymentMethod;

    this.rentalService.payRental(rentalId, { paymentMethod }).subscribe({
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
