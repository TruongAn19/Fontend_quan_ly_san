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
        this.loadEquipments();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thống kê tổng quan.');
      }
    });
  }

  loadRevenue(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6); // Last 7 days

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    this.adminService.getRevenueStats(startStr, endStr).subscribe({
      next: (res) => {
        const rawData = res.data || res;
        // Transform Map<String, Double> to daily array format
        const dailyArr = Object.entries(rawData).map(([date, value]) => {
          const d = new Date(date);
          const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return {
            date: date,
            label: labels[d.getDay()],
            value: Number(value),
            isToday: date === new Date().toISOString().split('T')[0]
          };
        }).sort((a, b) => a.date.localeCompare(b.date));

        // Calculate percentages for bars
        const maxVal = Math.max(...dailyArr.map(d => d.value), 1);
        const daily = dailyArr.map(d => ({
          ...d,
          percent: (d.value / maxVal) * 100
        }));

        this.revenue.set({ daily });
      },
      error: () => {
        console.error('Không thể tải dữ liệu doanh thu đồ thị');
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
