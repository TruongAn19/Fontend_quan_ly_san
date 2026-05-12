import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminService } from '../../../core/services/admin.service';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class AdminDashboardComponent implements OnInit {
  private adminService = inject(AdminService);

  stats = signal<any>(null);
  revenue = signal<any>(null);
  racketStats = signal<any>(null);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Chart configuration
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    scales: {
      x: {},
      y: { min: 0 }
    },
    plugins: {
      legend: { display: true },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Lượt thuê', backgroundColor: '#16a34a' }
    ]
  };

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
        this.loadRackets();
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }

  loadRackets(): void {
    this.adminService.getRacketStats().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res.data || res;
        this.racketStats.set(data);
        
        // Update chart data
        if (data.popularRackets && data.popularRackets.length > 0) {
          this.barChartData = {
            labels: data.popularRackets.map((r: any) => r.racketName),
            datasets: [
              { data: data.popularRackets.map((r: any) => r.rentalCount), label: 'Lượt thuê', backgroundColor: '#22c55e' }
            ]
          };
        }
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}
