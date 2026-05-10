import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

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

  equipments = signal<any[]>([]);
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
    this.initForm();
  }

  initForm(): void {
    this.equipmentForm = this.fb.group({
      name: ['', [Validators.required]],
      factory: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      status: ['ACTIVE', [Validators.required]],
      rentalPricePerPlay: [0, [Validators.required, Validators.min(0)]]
    });
  }

  loadEquipments(): void {
    this.isLoading.set(true);
    this.adminService.getEquipments(this.currentPage()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.equipments.set(res.equipments || res.data?.equipments || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading equipments:', err);
        this.errorMessage.set(err?.error?.message || err?.message || 'Không thể tải danh sách thiết bị.');
      }
    });
  }

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedEquipmentId.set(null);
    this.selectedFile = null;
    this.equipmentForm.reset({ price: 0, status: 'ACTIVE', rentalPricePerPlay: 0 });
    this.showModal.set(true);
  }

  openEditModal(equipment: any): void {
    this.isEdit.set(true);
    this.selectedEquipmentId.set(equipment.id);
    this.selectedFile = null;
    this.equipmentForm.patchValue({
      name: equipment.name,
      factory: equipment.factory,
      price: equipment.price,
      status: equipment.status || 'ACTIVE',
      rentalPricePerPlay: equipment.rentalPricePerPlay || 0
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
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
}
