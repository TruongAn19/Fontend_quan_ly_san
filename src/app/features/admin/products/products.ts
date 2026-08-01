import { Component, effect, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

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

  products = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  private toastTimer?: ReturnType<typeof setTimeout>;

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);
  productForm!: FormGroup;

  constructor() {
    effect(() => {
      if (!this.errorMessage()) return;
      if (this.toastTimer) clearTimeout(this.toastTimer);
      this.toastTimer = setTimeout(() => this.errorMessage.set(null), 4000);
    });
  }

  ngOnInit(): void {
    this.loadProducts();
    this.initForm();
  }

  initForm(): void {
    this.productForm = this.fb.group({
      name: ['', [Validators.required]],
      detailDesc: ['', [Validators.required]],
      price: [0, [Validators.required, Validators.min(0)]],
      depositPrice: [0, [Validators.required, Validators.min(0)]],
      address: ['', [Validators.required]],
      addressDetail: ['', [Validators.required]],
      shortDesc: ['', [Validators.required]],
      sale: [0, [Validators.min(0), Validators.max(100)]],
      quantity: [1, [Validators.required, Validators.min(1)]],
      subCourtNames: [''],
      image: ['']
    });
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.adminService.getProducts(this.currentPage()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.products.set(res.products || res.data?.products || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Error loading products:', err);
        this.errorMessage.set(err?.error?.message || err?.message || 'Không thể tải danh sách sản phẩm.');
      }
    });
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedProductId.set(null);
    this.productForm.get('quantity')?.enable();
    this.productForm.reset({ price: 0, depositPrice: 0, sale: 0, quantity: 1, subCourtNames: '', image: '' });
    this.showModal.set(true);
  }

  openEditModal(product: any): void {
    this.adminService.getProductDetail(product.id).subscribe({
      next: (res) => {
        const detail = res?.data;
        if (!detail) return;
        this.isEdit.set(true);
        this.selectedProductId.set(product.id);
        this.productForm.patchValue({
          name: detail.name,
          detailDesc: detail.detailDesc,
          price: detail.price,
          depositPrice: detail.depositPrice || 0,
          address: detail.address,
          addressDetail: detail.addressDetail || '',
          shortDesc: detail.shortDesc || '',
          sale: detail.sale || 0,
          quantity: detail.quantity || 1,
          subCourtNames: detail.subCourtNames || '',
          image: detail.image || ''
        });
        this.productForm.get('quantity')?.disable();
        this.showModal.set(true);
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết sân.');
      }
    });
  }

  private showSuccessToast(message: string): void {
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.errorMessage.set(null);
    this.successMessage.set(message);
    this.toastTimer = setTimeout(() => this.successMessage.set(null), 4000);
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

    const request = this.isEdit() 
      ? this.adminService.updateProduct(this.selectedProductId()!, formData)
      : this.adminService.createProduct(formData);

    request.subscribe({
      next: () => {
        const message = this.isEdit() ? 'Cập nhật sân thành công.' : 'Tạo sân thành công.';
        this.closeModal();
        this.loadProducts();
        this.showSuccessToast(message);
      },
      error: (err) => {
        const validationMessage = Object.values(err?.error?.data || {}).filter(Boolean).join('. ');
        if (validationMessage) {
          this.errorMessage.set(validationMessage);
          return;
        }
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
