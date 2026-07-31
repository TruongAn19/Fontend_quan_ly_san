import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../core/services/admin.service';
import {
  DashboardStats,
  EquipmentStatistics,
  RevenueChartPoint,
} from '../../../core/models/admin.model';

type Period = 'week' | 'month';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly revenue = signal<{ daily: RevenueChartPoint[] }>({ daily: [] });
  readonly equipmentStats = signal<EquipmentStatistics | null>(null);
  readonly period = signal<Period>('week');
  readonly isLoading = signal(true);
  readonly errorMessage = signal<string | null>(null);

  readonly totalWeeklyRevenue = computed(() =>
    this.revenue().daily.reduce((sum, day) => sum + day.value, 0)
  );

  readonly chartMax = computed(() => Math.max(...this.revenue().daily.map(day => day.value), 1));

  ngOnInit(): void {
    this.loadDashboard();
  }

  setPeriod(period: Period): void {
    if (this.period() === period) return;
    this.period.set(period);
    this.loadRevenue();
  }

  loadDashboard(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    forkJoin({
      dashboard: this.adminService.getDashboardStats(),
      equipment: this.adminService.getEquipmentStats()
    }).subscribe({
      next: ({ dashboard, equipment }) => {
        this.stats.set(dashboard.data);
        this.equipmentStats.set(equipment.data);
        this.isLoading.set(false);
        this.loadRevenue();
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải dữ liệu tổng quan. Vui lòng thử lại.');
      }
    });
  }

  loadRevenue(): void {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - (this.period() === 'week' ? 6 : 29));

    this.adminService.getRevenueStats(this.toDateString(start), this.toDateString(end)).subscribe({
      next: (res) => {
        const rawData = res.data;
        const today = this.toDateString(new Date());
        const labels = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
        const daily = Array.from({ length: this.period() === 'week' ? 7 : 30 }, (_, index) => {
          const parsedDate = new Date(start);
          parsedDate.setDate(start.getDate() + index);
          const date = this.toDateString(parsedDate);
          return {
            date,
            label: this.period() === 'week' ? labels[parsedDate.getDay()] : `${parsedDate.getDate()}/${parsedDate.getMonth() + 1}`,
            value: Number(rawData[date] ?? 0),
            isToday: date === today
          };
        });
        this.revenue.set({ daily });
      },
      error: () => this.revenue.set({ daily: [] })
    });
  }

  private toDateString(date: Date): string {
    const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
    return local.toISOString().slice(0, 10);
  }
}
