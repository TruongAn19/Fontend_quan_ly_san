import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Equipment } from '../../core/models/equipment.model';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-equipments',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './equipments.html',
  styleUrls: ['./equipments.css']
})
export class EquipmentsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(ProductService);

  filterForm: FormGroup = this.fb.group({
    factory: [''],
    price: [''],
    sort: ['']
  });

  equipments = signal<Equipment[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadEquipments();
  }

  loadEquipments(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = {
      page: this.currentPage(),
      ...this.filterForm.value
    };

    this.productService.getEquipments(filters).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.equipments.set(res.data.equipments);
        this.totalPages.set(Math.max(res.data.totalPages, 1));
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách thiết bị.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadEquipments();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadEquipments();
    }
  }

  equipmentImageUrl(image: string | null): string {
    return resolveMediaUrl(image, 'equipment');
  }
}
