import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { ProductResponseDTO } from '../../core/models/product.model';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './products.html',
  styleUrls: ['./products.css']
})
export class ProductsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  filterForm: FormGroup = this.fb.group({
    search: [''],
    address: [''],
    price: [null],
    sort: ['']
  });

  products = signal<ProductResponseDTO[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  totalProductCount = signal<number>(0);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = {
      page: this.currentPage(),
      ...this.filterForm.value
    };

    if ((filters.address || filters.price) && !filters.sort) {
      filters.sort = 'pricePerHour,asc';
    }

    this.productService.getProducts(filters).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.products.set(res.data.products);
        this.totalPages.set(Math.max(res.data.totalPages, 1));
        this.totalProductCount.set(res.data.totalElements);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách sản phẩm.');
      }
    });
  }

  onSearch(event: any): void {
    const value = event.target.value;
    this.filterForm.patchValue({ search: value });
    this.applyFilters();
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  resetFilters(): void {
    this.filterForm.reset({
      search: '',
      address: '',
      price: null,
      sort: ''
    });
    this.applyFilters();
  }

  onSortChange(event: Event): void {
    const sort = (event.target as HTMLSelectElement).value;
    this.filterForm.patchValue({ sort });
    this.applyFilters();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }

  productImageUrl(image: string | null): string {
    return resolveMediaUrl(image, 'product');
  }
}
