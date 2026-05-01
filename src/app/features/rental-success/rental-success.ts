import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-rental-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './rental-success.html',
  styleUrls: ['./rental-success.css']
})
export class RentalSuccessComponent implements OnInit {
  private router = inject(Router);

  rentalCode = signal<string | null>(null);
  rentalId = signal<number | null>(null);
  message = signal<string>('Thuê vợt thành công!');

  ngOnInit(): void {
    const state = history.state as { rentalCode?: string; rentalId?: number; message?: string };
    if (state?.rentalCode) {
      this.rentalCode.set(state.rentalCode);
      this.rentalId.set(state.rentalId ?? null);
      this.message.set(state.message || 'Thuê vợt thành công!');
    } else {
      this.router.navigate(['/']);
    }
  }
}
