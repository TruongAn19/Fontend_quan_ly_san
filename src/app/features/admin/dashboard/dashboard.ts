import { Component, computed, inject, signal, OnInit } from '@angular/core';
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
  racketStats = signal<any>(null);
  totalRackets = signal<number>(0);
  racketMonth = signal<string>(this.toMonthValue(new Date()));
  racketCourtId = signal<number | null>(null);
  racketTrend = computed(() => {
    const dailyRevenue = this.racketStats()?.dailyRevenueByMonth || {};
    const onSiteRevenue = this.racketStats()?.onSiteRevenueByMonth || {};
    const dailyOrders = this.racketStats()?.dailyOrdersByMonth || {};
    const onSiteOrders = this.racketStats()?.onSiteOrdersByMonth || {};
    return Array.from(new Set([...Object.keys(dailyRevenue), ...Object.keys(onSiteRevenue)])).sort().map(month => ({
      month,
      dailyRevenue: Number(dailyRevenue[month]) || 0,
      onSiteRevenue: Number(onSiteRevenue[month]) || 0,
      revenue: (Number(dailyRevenue[month]) || 0) + (Number(onSiteRevenue[month]) || 0),
      orders: (Number(dailyOrders[month]) || 0) + (Number(onSiteOrders[month]) || 0)
    }));
  });
  maxRacketTrendRevenue = computed(() => Math.max(...this.racketTrend().map(item => item.revenue), 1));
  selectedMonth = signal<string>(this.toMonthValue(new Date()));
  courtRevenueEntries = computed(() => {
    const data = this.revenue() || {};
    return Object.entries(data)
      .map(([name, value]) => ({ name, value: Number(value) || 0 }))
      .sort((a, b) => b.value - a.value);
  });
  totalCourtRevenue = computed(() => this.courtRevenueEntries().reduce((sum, item) => sum + item.value, 0));
  maxCourtRevenue = computed(() => Math.max(...this.courtRevenueEntries().map(item => item.value), 1));

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
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;

    this.adminService.getRevenueStats(start, end).subscribe({
      next: (res) => {
        this.revenue.set(res.data || res);
        this.loadRackets();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (!value) return;
    this.selectedMonth.set(value);
    this.loadRevenueOnly();
  }

  loadRevenueOnly(): void {
    const [year, month] = this.selectedMonth().split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    this.adminService.getRevenueStats(start, end).subscribe({
      next: (res) => this.revenue.set(res.data || res),
      error: () => this.errorMessage.set('Không thể tải doanh thu sân theo tháng.')
    });
  }

  revenueBarWidth(value: number): number {
    return value <= 0 ? 0 : Math.max((value / this.maxCourtRevenue()) * 100, 2);
  }

  private toMonthValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  loadRackets(): void {
    const [year, month] = this.racketMonth().split('-').map(Number);
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const end = `${year}-${String(month).padStart(2, '0')}-${new Date(year, month, 0).getDate()}`;
    this.adminService.getRacketStats(start, end, this.racketCourtId()).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res.data || res;
        this.racketStats.set(data);
        if (this.racketCourtId() == null) this.totalRackets.set(data.totalRackets || 0);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  onRacketMonthChange(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    if (value) { this.racketMonth.set(value); this.loadRackets(); }
  }

  onRacketCourtChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.racketCourtId.set(value ? Number(value) : null);
    this.loadRackets();
  }

  racketTrendWidth(value: number): number {
    return value <= 0 ? 0 : Math.max((value / this.maxRacketTrendRevenue()) * 100, 3);
  }
}
