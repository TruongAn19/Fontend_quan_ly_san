import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
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
  products = signal<any[]>([]);  // Danh sách sân (Product) cho dropdown
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  selectedDetail = signal<any | null>(null);
  isLoadingDetail = signal<boolean>(false);

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedRacketId = signal<number | null>(null);
  racketForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.loadRackets();
    this.loadAllProducts();
  }

  initForm(): void {
    // Field names khớp với BE Racket entity. productId chỉ là form control,
    // khi submit sẽ remap thành { product: { id: productId } } cho Jackson bind.
    this.racketForm = this.fb.group({
      name: ['', [Validators.required]],
      factory: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      rentalPricePerDay: [0, [Validators.required, Validators.min(0)]],
      rentalPricePerPlay: [0, [Validators.required, Validators.min(0)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      available: [true],
      productId: [null, [Validators.required]],
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

  /**
   * BE phân trang 4 product/page → để dropdown chọn sân đầy đủ, load page 1 trước rồi
   * forkJoin các page còn lại. Sản phẩm/sân thường ít (<100) nên hợp lý không cần endpoint mới.
   */
  loadAllProducts(): void {
    this.adminService.getProducts(1).subscribe({
      next: (firstRes) => {
        const firstPage = firstRes?.data?.products || firstRes?.products || [];
        const totalPages = firstRes?.data?.totalPages || firstRes?.totalPages || 1;

        if (totalPages <= 1) {
          this.products.set(firstPage);
          return;
        }

        const remaining = [];
        for (let p = 2; p <= totalPages; p++) {
          remaining.push(this.adminService.getProducts(p));
        }
        forkJoin(remaining.length > 0 ? remaining : [of(null)]).subscribe({
          next: (results) => {
            const all = [...firstPage];
            for (const r of results) {
              if (!r) continue;
              const list = r?.data?.products || r?.products || [];
              all.push(...list);
            }
            this.products.set(all);
          },
          error: () => this.products.set(firstPage)
        });
      },
      error: (err) => {
        console.error('Error loading products:', err);
        this.products.set([]);
      }
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedRacketId.set(null);
    this.racketForm.reset({
      name: '',
      factory: '',
      price: 0,
      rentalPricePerDay: 0,
      rentalPricePerPlay: 0,
      quantity: 1,
      available: true,
      productId: null,
      image: ''
    });
    this.showModal.set(true);
  }

  openEditModal(racket: any): void {
    this.isEdit.set(true);
    this.selectedRacketId.set(racket.id);
    this.racketForm.patchValue({
      name: racket.name,
      factory: racket.factory,
      price: racket.price,
      rentalPricePerDay: racket.rentalPricePerDay ?? 0,
      rentalPricePerPlay: racket.rentalPricePerPlay ?? 0,
      quantity: racket.targetQuantity ?? racket.quantity ?? 1,
      available: racket.available ?? true,
      productId: racket.product?.id ?? null,
      image: racket.image || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  openDetailModal(racket: any): void {
    this.isLoadingDetail.set(true);
    this.errorMessage.set(null);
    this.adminService.getRacketDetail(racket.id).subscribe({
      next: (res) => {
        this.selectedDetail.set(res?.data || racket);
        this.isLoadingDetail.set(false);
      },
      error: (err) => {
        this.isLoadingDetail.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết vợt.');
      }
    });
  }

  closeDetailModal(): void {
    this.selectedDetail.set(null);
  }

  deleteRacket(racket: any): void {
    if (!confirm(`Bạn có chắc chắn muốn ngừng sử dụng vợt "${racket.name}"?`)) return;
    this.adminService.deleteRacket(racket.id).subscribe({
      next: () => this.loadRackets(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Xóa vợt thất bại.')
    });
  }

  onSubmit(): void {
    if (this.racketForm.invalid) return;

    const { productId, ...rest } = this.racketForm.value;

    // BE Racket entity có @ManyToOne Product — Jackson bind từ nested object { id: ... }
    const payload = {
      ...rest,
      product: productId != null ? { id: productId } : null
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

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadRackets();
    }
  }
}
