import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<any>(null);
  revenue = signal<any>(null);
  equipmentStats = signal<any>(null);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.adminService.getDashboardStats().subscribe({
      next: (res) => {
        this.stats.set(res.data || res);
        this.loadRevenue();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thống kê tổng quan.');
      }
    });
  }

  loadRevenue(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];

    this.adminService.getRevenueStats(start, end).subscribe({
      next: (res) => {
        this.revenue.set(res.data || res);
        this.loadEquipments();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadEquipments(): void {
    this.adminService.getEquipmentStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.equipmentStats.set(res.data || res);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
