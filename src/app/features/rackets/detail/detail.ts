import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { ProductService } from '../../../core/services/product.service';

@Component({
  selector: 'app-racket-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './detail.html',
  styleUrls: ['./detail.css']
})
export class RacketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private router = inject(Router);

  racketId = signal<number | null>(null);
  racketDetail = signal<any>(null);
  stockCount = signal<number | null>(null);

  isLoading = signal<boolean>(false);
  isCheckingStock = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  stockMessage = signal<string | null>(null);

  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.racketId.set(+id);
      this.loadDetail();
      this.checkStock();
    } else {
      this.errorMessage.set('Không tìm thấy mã sản phẩm.');
    }
  }

  loadDetail(): void {
    this.isLoading.set(true);
    this.productService.getRacketDetail(this.racketId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res?.data || res;
        if (data) {
          data.imageUrl = data.image ? (data.image.startsWith('http') ? data.image : `http://localhost:8080/resources/images/racket/${data.image}`) : 'assets/img/default-racket.png';
          data.rentalPrice = data.rentalPricePerDay || data.rentalPricePerPlay || data.price;
        }
        this.racketDetail.set(data);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải chi tiết vợt.');
      }
    });
  }

  onDateChange(event: any): void {
    this.selectedDate.set(event.target.value);
    this.checkStock();
  }

  checkStock(): void {
    if (!this.racketId()) return;

    this.isCheckingStock.set(true);
    this.stockMessage.set(null);

    this.productService.checkRacketStock({
      racketId: this.racketId()!,
      date: this.selectedDate()
    }).subscribe({
      next: (res) => {
        this.isCheckingStock.set(false);
        const stock = res.availableStock !== undefined ? res.availableStock : res.quantity;
        this.stockCount.set(stock);
      },
      error: (err) => {
        this.isCheckingStock.set(false);
        this.stockMessage.set('Không thể kiểm tra tồn kho.');
      }
    });
  }

  goToRental(): void {
    if (this.racketId()) {
      this.router.navigate(['/rentals', this.racketId()]);
    }
  }
}
