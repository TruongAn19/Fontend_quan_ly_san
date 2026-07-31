import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ProfileService } from '../../core/services/profile.service';
import { AuthService } from '../../core/services/auth.service';
import { FormDataHelper } from '../../core/utils/form-data.helper';
import { UserResponseDTO } from '../../core/models/user.model';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private authService = inject(AuthService);

  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  profileData = signal<UserResponseDTO | null>(null);
  selectedFile: File | null = null;
  avatarPreview = signal<string | null>(null);

  isLoading = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  isChangingPassword = signal<boolean>(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.initForms();
    this.loadProfile();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^(0[3|5|7|8|9])+([0-9]{8})\b$/)]],
      address: ['']
    });

    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const pass = g.get('newPassword')?.value;
    const confirm = g.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  loadProfile(): void {
    this.isLoading.set(true);
    this.profileService.getProfile().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res.data) {
          this.profileData.set(res.data);
          this.profileForm.patchValue({
            fullName: res.data.fullName,
            email: res.data.email,
            phone: res.data.phone,
            address: res.data.address
          });
          if (res.data.avatar) {
            this.avatarPreview.set(resolveMediaUrl(res.data.avatar, 'avatar'));
          }
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải thông tin người dùng.');
      }
    });
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.avatarPreview.set(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const formData = FormDataHelper.createMultipartData(
      'user',
      this.profileForm.value,
      'avatarFile',
      this.selectedFile || undefined
    );

    this.profileService.updateProfile(formData).subscribe({
      next: (res) => {
        this.isSaving.set(false);
        this.successMessage.set('Cập nhật thông tin thành công!');
        if (res.data) {
          this.profileData.set(res.data);
          if (res.data.email !== this.authService.currentUser()) {
            this.authService.logout();
          }
        }
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Cập nhật thất bại.');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    this.isChangingPassword.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.profileService.changePassword(this.passwordForm.value).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.successMessage.set('Đổi mật khẩu thành công! Đang đăng xuất...');
        setTimeout(() => {
          this.authService.logout();
        }, 2000);
      },
      error: (err) => {
        this.isChangingPassword.set(false);
        this.errorMessage.set(err.error?.message || 'Đổi mật khẩu thất bại.');
      }
    });
  }
}
