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
  bookingStats = signal<any>(null);

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  // Chart configuration
  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          color: '#655d70',
          maxRotation: 0,
          minRotation: 0,
          autoSkip: false,
          font: { size: 10 },
          // Tên dài (vd "Selkirk LUXX Control Air Invikta") tự ngắt thành nhiều
          // dòng để nằm ngang mà không đè lên nhau.
          callback: function (this: any, value: any): string | string[] {
            const label = String(this.getLabelForValue(value));
            const words = label.split(' ');
            const lines: string[] = [];
            let current = '';
            for (const word of words) {
              if ((current + ' ' + word).trim().length > 14) {
                if (current) lines.push(current.trim());
                current = word;
              } else {
                current = (current + ' ' + word).trim();
              }
            }
            if (current) lines.push(current.trim());
            return lines.length ? lines : label;
          }
        }
      },
      y: {
        min: 0,
        grid: { color: 'rgba(111, 79, 163, 0.10)' },
        ticks: {
          color: '#655d70',
          stepSize: 1,
          precision: 0
        }
      }
    },
    plugins: {
      legend: { display: true, labels: { color: '#4d4358', font: { family: 'Inter' } } },
    }
  };
  public barChartType: ChartType = 'bar';
  public barChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Lượt thuê', backgroundColor: '#6f4fa3', borderRadius: 8 }
    ]
  };

  // Chart số đơn đặt sân theo trạng thái
  public bookingChartData: ChartData<'bar'> = {
    labels: [],
    datasets: [
      { data: [], label: 'Số đơn', backgroundColor: '#d88968', borderRadius: 8 }
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
        this.loadBookingStats();
        this.loadRevenue();
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thống kê tổng quan.');
      }
    });
  }

  loadBookingStats(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];

    this.adminService.getBookingStats(start, end).subscribe({
      next: (res) => {
        const data = res.data || res;
        this.bookingStats.set(data);

        const countByStatus = data.countByStatus || {};
        const labels = Object.keys(countByStatus);
        if (labels.length > 0) {
          this.bookingChartData = {
            labels,
            datasets: [
              { data: Object.values(countByStatus) as number[], label: 'Số đơn', backgroundColor: '#d88968', borderRadius: 8 }
            ]
          };
        }
      },
      error: () => { /* giữ dashboard hiển thị, bỏ qua lỗi thống kê booking */ }
    });
  }

  loadRevenue(): void {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const end = now.toISOString().split('T')[0];

    this.adminService.getRevenueStats(start, end).subscribe({
      next: (res) => {
        const monthlyRevenueMap = res.data || {};
        const monthlyTotal = Object.values(monthlyRevenueMap).reduce((sum: number, val: any) => sum + (val || 0), 0);

        this.stats.update(currentStats => {
          if (!currentStats) currentStats = {};
          return {
            ...currentStats,
            revenueMonth: monthlyTotal
          };
        });

        this.adminService.getRevenueStats(end, end).subscribe({
          next: (todayRes) => {
            const todayRevenueMap = todayRes.data || {};
            const todayTotal = Object.values(todayRevenueMap).reduce((sum: number, val: any) => sum + (val || 0), 0);

            this.stats.update(currentStats => {
              if (!currentStats) currentStats = {};
              return {
                ...currentStats,
                revenueToday: todayTotal
              };
            });

            this.loadRackets();
          },
          error: () => {
            this.loadRackets();
          }
        });
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
        const popularRackets = data.topRackets || data.popularRackets || [];
        if (popularRackets && popularRackets.length > 0) {
          this.barChartData = {
            labels: popularRackets.map((r: any) => r.name || r.racketName),
            datasets: [
              { data: popularRackets.map((r: any) => r.rentalStock !== undefined ? r.rentalStock : r.rentalCount), label: 'Lượt thuê', backgroundColor: '#6f4fa3', borderRadius: 8 }
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
