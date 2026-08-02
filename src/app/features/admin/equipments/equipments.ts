import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { Equipment } from '../../../core/models/equipment.model';
import { ProductResponseDTO } from '../../../core/models/product.model';

@Component({
  selector: 'app-admin-equipments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './equipments.html',
  styleUrls: ['./equipments.css']
})
export class AdminEquipmentsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  equipments = signal<Equipment[]>([]);
  products = signal<ProductResponseDTO[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedEquipmentId = signal<number | null>(null);
  equipmentForm!: FormGroup;
  selectedFile: File | null = null;

  ngOnInit(): void {
    this.loadEquipments();
    this.loadProductOptions();
    this.initForm();
  }

  initForm(): void {
    this.equipmentForm = this.fb.group({
      name: ['', [Validators.required]],
      factory: ['', [Validators.required]],
      image: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['ACTIVE', [Validators.required]],
      available: [true, [Validators.required]],
      rentalPricePerDay: [0, [Validators.required, Validators.min(0)]],
      rentalPricePerPlay: [0, [Validators.required, Validators.min(0)]],
      bookingStockQuantity: [0, [Validators.required, Validators.min(0)]],
      quantity: [0, [Validators.required, Validators.min(0)]],
      productId: [null, [Validators.required]]
    });
  }

  loadProductOptions(): void {
    this.adminService.getProductOptions().subscribe({
      next: (res) => this.products.set(res.data),
      error: (err) => {
        this.errorMessage.set(err?.error?.message || 'Không thể tải danh sách sân.');
      }
    });
  }

  loadEquipments(): void {
    this.isLoading.set(true);
    this.adminService.getEquipments(this.currentPage()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.equipments.set(res.data.equipments);
          this.totalPages.set(Math.max(res.data.totalPages, 1));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading equipments:', err);
        this.errorMessage.set(err?.error?.message || err?.message || 'Không thể tải danh sách thiết bị.');
      }
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedEquipmentId.set(null);
    this.selectedFile = null;
    this.equipmentForm.reset({
      image: '',
      price: 0,
      status: 'ACTIVE',
      available: true,
      rentalPricePerDay: 0,
      rentalPricePerPlay: 0,
      bookingStockQuantity: 0,
      quantity: 0,
      productId: null
    });
    this.showModal.set(true);
  }

  openEditModal(equipment: Equipment): void {
    this.isEdit.set(true);
    this.selectedEquipmentId.set(equipment.id);
    this.selectedFile = null;
    this.equipmentForm.patchValue({
      name: equipment.name,
      factory: equipment.factory,
      image: equipment.image ?? '',
      price: equipment.price,
      status: equipment.status,
      available: equipment.available,
      rentalPricePerDay: equipment.rentalPricePerDay,
      rentalPricePerPlay: equipment.rentalPricePerPlay,
      bookingStockQuantity: equipment.bookingStockQuantity,
      quantity: equipment.quantity,
      productId: equipment.product?.id ?? null
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] ?? null;
  }

  onSubmit(): void {
    if (this.equipmentForm.invalid) return;

    const formValue = this.equipmentForm.value;
    const formData = new FormData();

    formData.append(
      'equipment',
      new Blob([JSON.stringify(formValue)], { type: 'application/json' })
    );

    if (this.selectedFile) {
      formData.append('equipmentImg', this.selectedFile);
    }

    const request = this.isEdit()
      ? this.adminService.updateEquipment(this.selectedEquipmentId()!, formData)
      : this.adminService.createEquipment(formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadEquipments();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Thao tác thiết bị thất bại.');
      }
    });
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEquipments();
    }
  }

  statusLabel(status: string | null): string {
    if (status === 'ACTIVE') return 'Sẵn sàng';
    if (status === 'MAINTENANCE') return 'Bảo trì';
    if (status === 'INACTIVE') return 'Ngừng dùng';
    return status || 'Không xác định';
  }

  statusClass(status: string | null): string {
    return status?.toLowerCase() || 'unknown';
  }
}
