import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-rackets',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rackets.html',
  styleUrls: ['./rackets.css']
})
export class AdminRacketsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  rackets = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedRacketId = signal<number | null>(null);
  racketForm!: FormGroup;

  ngOnInit(): void {
    this.loadRackets();
    this.initForm();
  }

  initForm(): void {
    this.racketForm = this.fb.group({
      name: ['', [Validators.required]],
      factory: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['ACTIVE', [Validators.required]],
      rentalPricePerDay: [0, [Validators.required, Validators.min(0)]],
      rentalPricePerPlay: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      bookingStockQuantity: [0, [Validators.required, Validators.min(0)]],
      productId: [null, [Validators.required, Validators.min(1)]],
      available: [true],
      image: ['']
    });
  }

  loadRackets(): void {
    this.isLoading.set(true);
    this.adminService.getRackets(this.currentPage()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.rackets.set(res.rackets || res.data?.rackets || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading rackets:', err);
        this.errorMessage.set(err?.error?.message || err?.message || 'Không thể tải danh sách vợt.');
      }
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedRacketId.set(null);
    this.racketForm.reset({
      price: 0,
      status: 'ACTIVE',
      rentalPricePerDay: 0,
      rentalPricePerPlay: 0,
      quantity: 1,
      bookingStockQuantity: 0,
      productId: null,
      available: true,
      image: ''
    });
    this.showModal.set(true);
  }

  openEditModal(racket: any): void {
    this.adminService.getRacketDetail(racket.id).subscribe({
      next: (res) => {
        const detail = res?.data;
        if (!detail) return;
        this.isEdit.set(true);
        this.selectedRacketId.set(racket.id);
        this.racketForm.patchValue({
          name: detail.name,
          factory: detail.factory,
          price: detail.price,
          status: detail.status || 'ACTIVE',
          rentalPricePerDay: detail.rentalPricePerDay || 0,
          rentalPricePerPlay: detail.rentalPricePerPlay || 0,
          quantity: detail.quantity,
          bookingStockQuantity: detail.bookingStockQuantity,
          productId: detail.product?.id,
          available: detail.available,
          image: detail.image || ''
        });
        this.showModal.set(true);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết vợt.');
      }
    });
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.racketForm.invalid) return;

    const formValue = this.racketForm.value;
    if (formValue.bookingStockQuantity > formValue.quantity) {
      this.errorMessage.set('Tồn kho cho thuê tại sân không được lớn hơn tổng số lượng vợt.');
      return;
    }
    const payload = {
      name: formValue.name,
      factory: formValue.factory,
      price: formValue.price,
      status: formValue.status,
      rentalPricePerDay: formValue.rentalPricePerDay,
      rentalPricePerPlay: formValue.rentalPricePerPlay,
      quantity: formValue.quantity,
      bookingStockQuantity: formValue.bookingStockQuantity,
      available: formValue.available,
      image: formValue.image,
      product: { id: formValue.productId }
    };
    const formData = new FormData();

    formData.append(
      'racket',
      new Blob([JSON.stringify(payload)], { type: 'application/json' })
    );

    const request = this.isEdit()
      ? this.adminService.updateRacket(this.selectedRacketId()!, formData)
      : this.adminService.createRacket(formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadRackets();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Thao tác vợt thất bại.');
      }
    });
  }

  deleteRacket(id: number): void {
    if (!confirm('Bạn có chắc chắn muốn xóa vợt này?')) return;
    this.adminService.deleteRacket(id).subscribe({
      next: () => this.loadRackets(),
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Xóa vợt thất bại.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadRackets();
    }
  }
}
