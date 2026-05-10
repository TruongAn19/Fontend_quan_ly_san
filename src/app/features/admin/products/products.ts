import { Component, inject, signal, OnInit } from '@angular/core';
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

  showModal = signal<boolean>(false);
  isEdit = signal<boolean>(false);
  selectedProductId = signal<number | null>(null);
  productForm!: FormGroup;
  selectedFile: File | null = null;

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
      subPitchNames: [''],
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

  onFileSelected(event: any): void {
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  openCreateModal(): void {
    this.isEdit.set(false);
    this.selectedProductId.set(null);
    this.selectedFile = null;
    this.productForm.reset({ price: 0, depositPrice: 0, sale: 0, quantity: 1, subPitchNames: '', image: '' });
    this.showModal.set(true);
  }

  openEditModal(product: any): void {
    this.isEdit.set(true);
    this.selectedProductId.set(product.id);
    this.selectedFile = null;
    this.productForm.patchValue({
      name: product.name,
      detailDesc: product.detailDesc,
      price: product.price,
      depositPrice: product.depositPrice || 0,
      address: product.address,
      addressDetail: product.addressDetail || '',
      shortDesc: product.shortDesc || '',
      sale: product.sale || 0,
      quantity: product.quantity || 1,
      subPitchNames: product.subPitchNames || '',
      image: product.image || ''
    });
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
  }

  onSubmit(): void {
    if (this.productForm.invalid) return;

    const formValue = this.productForm.value;
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
