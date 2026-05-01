import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './reset-password.html',
  styleUrls: ['./reset-password.css']
})
export class ResetPasswordComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  resetForm: FormGroup = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  token = signal<string | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.token.set(this.route.snapshot.queryParamMap.get('token'));
    if (!this.token()) {
      this.errorMessage.set('Token đặt lại mật khẩu không tồn tại!');
    }
  }

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('password')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  onSubmit(): void {
    if (this.resetForm.invalid || !this.token()) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const payload = {
      token: this.token()!,
      password: this.resetForm.value.password
    };

    this.authService.resetPassword(payload).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('Đặt lại mật khẩu thành công!');
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!');
      }
    });
  }
}
