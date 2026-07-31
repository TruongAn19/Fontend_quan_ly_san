import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { HomeResponse } from '../../core/models/product.model';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  homeData = signal<HomeResponse | null>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  featuredProducts = computed(() => {
    const data = this.homeData();
    return data?.topProducts || [];
  });

  ngOnInit(): void {
    this.loadHomeData();
  }

  loadHomeData(): void {
    this.isLoading.set(true);
    this.productService.getHomeData().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.homeData.set(res.data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải dữ liệu trang chủ.');
      }
    });
  }

  productImageUrl(image: string | null): string {
    return resolveMediaUrl(image, 'product');
  }
}
