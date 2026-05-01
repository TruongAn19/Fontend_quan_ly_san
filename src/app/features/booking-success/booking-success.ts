import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-booking-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './booking-success.html',
  styleUrls: ['./booking-success.css']
})
export class BookingSuccessComponent implements OnInit {
  private router = inject(Router);

  bookingCode = signal<string | null>(null);
  bookingId = signal<number | null>(null);
  message = signal<string>('Đặt sân thành công!');

  ngOnInit(): void {
    const state = history.state as { bookingCode?: string; bookingId?: number; message?: string };
    if (state?.bookingCode) {
      this.bookingCode.set(state.bookingCode);
      this.bookingId.set(state.bookingId ?? null);
      this.message.set(state.message || 'Đặt sân thành công!');
    } else {
      this.router.navigate(['/']);
    }
  }
}
