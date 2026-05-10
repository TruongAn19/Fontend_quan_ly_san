import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  loginRequest = {
    email: '',
    password: ''
  };

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onLogin(): void {
    if (!this.loginRequest.email || !this.loginRequest.password) {
      this.errorMessage.set('Vui lòng nhập đầy đủ email và mật khẩu.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login(this.loginRequest).subscribe({
      next: () => {
        this.isLoading.set(false);
        const role = this.authService.role();
        if (role === 'ADMIN' || role === 'STAFF' || role === 'ROLE_ADMIN' || role === 'ROLE_STAFF') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Đăng nhập thất bại. Vui lòng thử lại!');
      }
    });
  }
}
