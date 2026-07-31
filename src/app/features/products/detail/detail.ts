import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';
import { ProductDetailResponse } from '../../../core/models/product.model';
import { resolveMediaUrl } from '../../../core/utils/media-url.util';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.css']
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);

  productId = signal<number | null>(null);
  productDetail = signal<ProductDetailResponse | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productId.set(+id);
      this.loadDetail();
    } else {
      this.errorMessage.set('Không tìm thấy mã sản phẩm.');
    }
  }

  loadDetail(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.productService.getProductDetail(this.productId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.productDetail.set(res.data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải chi tiết sản phẩm.');
      }
    });
  }

  productImageUrl(image: string | null): string {
    return resolveMediaUrl(image, 'product');
  }
}
