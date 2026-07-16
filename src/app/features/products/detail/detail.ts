import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';

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
  productDetail = signal<any>(null);
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
        const data = res?.data || res;
        if (data && data.product) {
          data.product.imageUrl = data.product.image ? (data.product.image.startsWith('http') ? data.product.image : `/resources/images/product/${data.product.image}`) : 'assets/img/default-pitch.png';
          data.product.pricePerHour = data.product.pricePerHour || data.product.price;
        }
        this.productDetail.set(data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải chi tiết sản phẩm.');
      }
    });
  }
}
