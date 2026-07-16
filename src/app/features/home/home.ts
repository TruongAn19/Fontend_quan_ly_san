import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  private productService = inject(ProductService);

  homeData = signal<any>(null);
  isLoading = signal<boolean>(true);
  errorMessage = signal<string | null>(null);

  // Computed signal to match the 'featuredProducts()' call in the template
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
        const data = res?.data || res;
        
        if (data) {
          if (data.products) {
            data.products = data.products.map((p: any) => ({
              ...p,
              imageUrl: p.image ? (p.image.startsWith('http') ? p.image : `/resources/images/product/${p.image}`) : 'assets/img/default-pitch.png',
              pricePerHour: p.pricePerHour || p.price
            }));
          }
          if (data.equipments) {
            data.equipments = data.equipments.map((r: any) => ({
              ...r,
              imageUrl: r.image ? (r.image.startsWith('http') ? r.image : `/resources/images/equipment/${r.image}`) : 'assets/img/default-equipment.png',
              rentalPrice: r.rentalPricePerDay || r.rentalPricePerPlay || r.price
            }));
          }
          if (data.topProducts) {
            data.topProducts = data.topProducts.map((p: any) => ({
              ...p,
              imageUrl: p.image ? (p.image.startsWith('http') ? p.image : `/resources/images/product/${p.image}`) : 'assets/img/default-pitch.png',
              pricePerHour: p.pricePerHour || p.price
            }));
          }
          if (data.topEquipments) {
            data.topEquipments = data.topEquipments.map((r: any) => ({
              ...r,
              imageUrl: r.image ? (r.image.startsWith('http') ? r.image : `/resources/images/equipment/${r.image}`) : 'assets/img/default-equipment.png',
              rentalPrice: r.rentalPricePerDay || r.rentalPricePerPlay || r.price
            }));
          }
        }
        
        this.homeData.set(data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải dữ liệu trang chủ.');
      }
    });
  }
}
