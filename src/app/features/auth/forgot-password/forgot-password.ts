import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  forgotForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.authService.forgotPassword(this.forgotForm.value.email).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Đã gửi link đặt lại mật khẩu vào email của bạn!');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
      }
    });
  }
}
