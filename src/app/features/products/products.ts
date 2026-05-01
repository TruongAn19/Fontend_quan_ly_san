import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';

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
    price: [''],
    sort: ['']
  });

  products = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
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
        const rawData = res?.data?.products || res?.products || [];
        const pages = res?.data?.totalPages || res?.totalPages || 1;
        
        const mappedData = rawData.map((item: any) => ({
          ...item,
          imageUrl: item.image ? (item.image.startsWith('http') ? item.image : `http://localhost:8080/resources/images/product/${item.image}`) : 'assets/img/default-court.png',
          pricePerHour: item.pricePerHour || item.price
        }));

        this.products.set(mappedData);
        this.totalPages.set(pages);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách sản phẩm.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadProducts();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadProducts();
    }
  }
}
