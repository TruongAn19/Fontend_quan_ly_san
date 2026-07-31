import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { ProductResponseDTO } from '../../../core/models/product.model';
import { SubPitchDTO } from '../../../core/models/booking.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class AdminProductsComponent implements OnInit {
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  products = signal<ProductResponseDTO[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);
  productForm!: FormGroup;
  selectedFile: File | null = null;

  // Sub-pitch management panel
  expandedProductId = signal<number | null>(null);
  subPitches = signal<SubPitchDTO[]>([]);
  subPitchLoading = signal<boolean>(false);
  showSubPitchModal = signal<boolean>(false);
  isEditSubPitch = signal<boolean>(false);
  selectedSubPitchId = signal<number | null>(null);
  subPitchForm!: FormGroup;

  ngOnInit(): void {
    this.loadProducts();
    this.initForm();
    this.subPitchForm = this.fb.group({
      name: ['', [Validators.required]],
      pitchType: ['FIVE_ASIDE', [Validators.required]]
    });
  }

  toggleSubPitches(productId: number): void {
    if (this.expandedProductId() === productId) {
      this.expandedProductId.set(null);
      this.subPitches.set([]);
      return;
    }
    this.expandedProductId.set(productId);
    this.subPitchLoading.set(true);
    this.adminService.getSubPitches(productId).subscribe({
      next: (res) => {
        this.subPitchLoading.set(false);
        this.subPitches.set(res.data || []);
      },
      error: () => {
        this.subPitchLoading.set(false);
        this.subPitches.set([]);
      }
    });
  }

  openCreateSubPitchModal(): void {
    this.isEditSubPitch.set(false);
    this.selectedSubPitchId.set(null);
    this.subPitchForm.reset({ name: '', pitchType: 'FIVE_ASIDE' });
    this.showSubPitchModal.set(true);
  }

  openEditSubPitchModal(sp: SubPitchDTO): void {
    this.isEditSubPitch.set(true);
    this.selectedSubPitchId.set(sp.id);
    this.subPitchForm.patchValue({ name: sp.name, pitchType: sp.pitchType || 'FIVE_ASIDE' });
    this.showSubPitchModal.set(true);
  }

  closeSubPitchModal(): void {
    this.showSubPitchModal.set(false);
  }

  submitSubPitch(): void {
    if (this.subPitchForm.invalid) return;
    const productId = this.expandedProductId();
    if (productId == null) return;

    const v = this.subPitchForm.value;
    const req$ = this.isEditSubPitch()
      ? this.adminService.updateSubPitch(this.selectedSubPitchId()!, v)
      : this.adminService.createSubPitch({ productId, name: v.name, pitchType: v.pitchType });

    req$.subscribe({
      next: () => {
        this.closeSubPitchModal();
        this.adminService.getSubPitches(productId).subscribe({
          next: (res) => this.subPitches.set(res.data || [])
        });
      },
      error: (err) => this.errorMessage.set(err?.error?.message || 'Lưu sân con thất bại.')
    });
  }

  deleteSubPitch(id: number): void {
    if (!confirm('Xóa sân con này?')) return;
    const productId = this.expandedProductId();
    this.adminService.deleteSubPitch(id).subscribe({
      next: () => {
        if (productId != null) {
          this.adminService.getSubPitches(productId).subscribe({
            next: (res) => this.subPitches.set(res.data || [])
          });
        }
      },
      error: (err) => this.errorMessage.set(err?.error?.message || 'Xóa sân con thất bại.')
    });
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      detailDesc: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      address: ['', [Validators.required]],
      addressDetail: ['', [Validators.required]],
      shortDesc: ['', [Validators.required]],
      sale: [0, [Validators.min(0), Validators.max(100)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      pitchType: ['FIVE_ASIDE', [Validators.required]],
      image: ['']
    });
  }

  /**
   * Deposit is auto-computed BE-side as price × (1 − sale/100) × 0.5.
   * We mirror it here so the admin sees the live preview as they type.
   */
  computedDeposit(): number {
    const v = this.productForm?.value;
    if (!v) return 0;
    const price = +(v.price ?? 0);
    const sale = +(v.sale ?? 0);
    return price * (1 - sale / 100) * 0.5;
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.adminService.getProducts(this.currentPage()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.products.set(res.data.products);
          this.totalPages.set(Math.max(res.data.totalPages, 1));
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading products:', err);
        this.errorMessage.set(err?.error?.message || err?.message || 'Không thể tải danh sách sản phẩm.');
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
    this.selectedProductId.set(null);
    this.selectedFile = null;
    this.productForm.get('quantity')?.enable({ emitEvent: false });
    this.productForm.reset({ price: 0, sale: 0, quantity: 1, pitchType: 'FIVE_ASIDE', image: '' });
    this.showModal.set(true);
  }

  openEditModal(product: ProductResponseDTO): void {
    this.isEdit.set(true);
    this.selectedProductId.set(product.id);
    this.selectedFile = null;
    this.productForm.patchValue({
      name: product.name,
      detailDesc: product.detailDesc,
      price: product.price,
      address: product.address,
      addressDetail: product.addressDetail || '',
      shortDesc: product.shortDesc || '',
      sale: product.sale,
      quantity: product.quantity,
      pitchType: product.pitchType,
      image: product.image || ''
    });
    this.productForm.get('quantity')?.disable({ emitEvent: false });
    this.showModal.set(true);
  }

  pitchTypeLabel(t: string | undefined | null): string {
    return t === 'SEVEN_ASIDE' ? 'Sân 7 người' : 'Sân 5 người';
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const formValue = this.productForm.getRawValue();
    const formData = new FormData();

    formData.append(
      'product',
      new Blob([JSON.stringify(formValue)], { type: 'application/json' })
    );

    if (this.selectedFile) {
      formData.append('productImg', this.selectedFile);
    }

    const request = this.isEdit() 
      ? this.adminService.updateProduct(this.selectedProductId()!, formData)
      : this.adminService.createProduct(formData);

    request.subscribe({
      next: () => {
        this.closeModal();
        this.loadProducts();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Thao tác sản phẩm thất bại.');
      }
    });
  }

  deleteProduct(id: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      this.adminService.deleteProduct(id).subscribe({
        next: () => this.loadProducts(),
        error: (err) => this.errorMessage.set(err.error?.message || 'Xóa sản phẩm thất bại.')
      });
    }
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }
}
