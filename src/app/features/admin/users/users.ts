import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrls: ['./users.css']
})
export class AdminUsersComponent implements OnInit {
  private readonly adminService = inject(AdminService);
  private readonly fb = inject(FormBuilder);

  users = signal<any[]>([]);
  isLoading = signal(false);
  isSaving = signal(false);
  errorMessage = signal<string | null>(null);
  currentPage = signal(0);
  totalPages = signal(0);
  totalElements = signal(0);
  readonly pageSize = 10;
  selectedUser = signal<any | null>(null);
  modalMode = signal<'create' | 'edit' | 'detail' | 'role' | 'password' | null>(null);

  userForm: FormGroup = this.fb.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: [''],
    phone: ['', Validators.required],
    address: [''],
    role: ['USER', Validators.required]
  });

  roleForm: FormGroup = this.fb.group({
    role: ['', Validators.required]
  });

  passwordForm: FormGroup = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(72)]],
    confirmPassword: ['', Validators.required]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);
    this.adminService.getUsers(this.currentPage(), this.pageSize).subscribe({
      next: (res) => {
        const pageData = res.data;
        this.users.set(pageData?.content || []);
        this.totalPages.set(pageData?.totalPages || 0);
        this.totalElements.set(pageData?.totalElements || 0);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải danh sách người dùng.');
      }
    });
  }

  goToPage(page: number): void {
    if (page < 0 || page >= this.totalPages() || page === this.currentPage()) return;
    this.currentPage.set(page);
    this.loadUsers();
  }

  openCreateModal(): void {
    this.selectedUser.set(null);
    this.userForm.reset({ role: 'USER' });
    this.userForm.get('email')?.enable();
    this.userForm.get('password')?.setValidators([Validators.required, Validators.minLength(3)]);
    this.userForm.get('password')?.updateValueAndValidity();
    this.modalMode.set('create');
  }

  openEditModal(user: any): void {
    this.selectedUser.set(user);
    this.userForm.reset({
      fullName: user.fullName,
      email: user.email,
      password: '',
      phone: user.phone,
      address: user.address,
      role: user.roleName
    });
    this.userForm.get('email')?.disable();
    this.userForm.get('password')?.clearValidators();
    this.userForm.get('password')?.updateValueAndValidity();
    this.modalMode.set('edit');
  }

  openDetailModal(user: any): void {
    this.selectedUser.set(user);
    this.modalMode.set('detail');
  }

  openRoleModal(user: any): void {
    this.selectedUser.set(user);
    this.roleForm.patchValue({ role: user.roleName });
    this.modalMode.set('role');
  }

  openPasswordModal(user: any): void {
    this.selectedUser.set(user);
    this.passwordForm.reset();
    this.modalMode.set('password');
  }

  closeModal(): void {
    this.modalMode.set(null);
    this.selectedUser.set(null);
  }

  saveUser(): void {
    if (this.userForm.invalid || this.isSaving()) {
      this.userForm.markAllAsTouched();
      return;
    }

    const mode = this.modalMode();
    const value = this.userForm.getRawValue();
    const user = {
      fullName: value.fullName,
      email: value.email,
      password: mode === 'create' ? value.password : 'unchanged',
      phone: value.phone,
      address: value.address,
      role: { name: value.role }
    };
    const payload = new FormData();
    payload.append('user', new Blob([JSON.stringify(user)], { type: 'application/json' }));

    this.isSaving.set(true);
    this.errorMessage.set(null);
    const request$ = mode === 'create'
      ? this.adminService.createUser(payload)
      : this.adminService.updateUser(this.selectedUser().id, payload);

    request$.subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể lưu người dùng.');
      }
    });
  }

  updateRole(): void {
    if (this.roleForm.invalid || !this.selectedUser() || this.isSaving()) return;
    this.isSaving.set(true);
    this.adminService.updateUserRole(this.selectedUser().id, this.roleForm.value.role).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
        this.loadUsers();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Cập nhật quyền thất bại.');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid || !this.selectedUser() || this.isSaving()) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    const { newPassword, confirmPassword } = this.passwordForm.value;
    if (newPassword !== confirmPassword) {
      this.errorMessage.set('Mật khẩu xác nhận không khớp.');
      return;
    }
    this.isSaving.set(true);
    this.errorMessage.set(null);
    this.adminService.changeUserPassword(this.selectedUser().id, newPassword).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.closeModal();
      },
      error: (err) => {
        this.isSaving.set(false);
        this.errorMessage.set(err.error?.message || 'Đổi mật khẩu thất bại.');
      }
    });
  }

  deleteUser(user: any): void {
    if (!confirm(`Bạn có chắc chắn muốn xóa người dùng "${user.fullName}"?`)) return;
    this.adminService.deleteUser(user.id).subscribe({
      next: () => this.loadUsers(),
      error: (err) => this.errorMessage.set(err.error?.message || 'Xóa người dùng thất bại.')
    });
  }
}
