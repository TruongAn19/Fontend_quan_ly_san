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
  selectedFile: File | null = null;

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
      rentalPricePerDay: [0, [Validators.required, Validators.min(0)]]
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

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedRacketId.set(null);
    this.selectedFile = null;
    this.racketForm.reset({ price: 0, status: 'ACTIVE', rentalPricePerDay: 0 });
    this.showModal.set(true);
  }

  openEditModal(racket: any): void {
    this.isEdit.set(true);
    this.selectedRacketId.set(racket.id);
    this.selectedFile = null;
    this.racketForm.patchValue({
      name: racket.name,
      factory: racket.factory,
      price: racket.price,
      status: racket.status || 'ACTIVE',
      rentalPricePerDay: racket.rentalPricePerDay || 0
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.racketForm.invalid) return;

    const formValue = this.racketForm.value;
    const formData = new FormData();

    formData.append(
      'racket',
      new Blob([JSON.stringify(formValue)], { type: 'application/json' })
    );

    if (this.selectedFile) {
      formData.append('racketImg', this.selectedFile);
    }

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

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadRackets();
    }
  }
}
