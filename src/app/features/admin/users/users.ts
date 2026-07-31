import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  private adminService = inject(AdminService);
  private fb = inject(FormBuilder);

  users = signal<any[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  selectedUser = signal<any | null>(null);
  showUserModal = signal<boolean>(false);
  isEditingUser = signal<boolean>(false);
  editingUserId = signal<number | null>(null);

  userForm: FormGroup = this.fb.group({
    fullName: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', [Validators.required]],
    address: [''],
    password: [''],
    roleName: ['USER', [Validators.required]]
  });

  roleForm: FormGroup = this.fb.group({
    role: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  openCreateUser(): void {
    this.isEditingUser.set(false);
    this.editingUserId.set(null);
    this.userForm.reset({ roleName: 'USER' });
    this.userForm.get('email')?.enable();
    this.showUserModal.set(true);
  }

  openEditUser(userId: number): void {
    this.adminService.getUserDetail(userId).subscribe({
      next: (res) => {
        const user = res?.data;
        if (!user) return;
        this.isEditingUser.set(true);
        this.editingUserId.set(userId);
        this.userForm.reset({
          fullName: user.fullName,
          email: user.email,
          phone: user.phone,
          address: user.address,
          password: '',
          roleName: user.roleName
        });
        this.userForm.get('email')?.disable();
        this.showUserModal.set(true);
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết người dùng.')
    });
  }

  closeUserModal(): void {
    this.showUserModal.set(false);
    this.userForm.get('email')?.enable();
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }
    const value = this.userForm.getRawValue();
    if (!this.isEditingUser() && !value.password) {
      this.errorMessage.set('Mật khẩu không được để trống khi tạo người dùng.');
      return;
    }

    const userPayload: any = {
      fullName: value.fullName,
      email: value.email,
      phone: value.phone,
      address: value.address
    };
    if (!this.isEditingUser()) {
      userPayload.password = value.password;
      userPayload.role = { name: value.roleName };
    }

    const formData = new FormData();
    formData.append('user', new Blob(
      [JSON.stringify(userPayload)], { type: 'application/json' }
    ));
    const request = this.isEditingUser()
      ? this.adminService.updateUser(this.editingUserId()!, formData)
      : this.adminService.createUser(formData);
    request.subscribe({
      next: () => {
        this.closeUserModal();
        this.loadUsers();
      },
      error: (err) => this.errorMessage.set(err.error?.message || 'Lưu người dùng thất bại.')
    });
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.users.set(res.data || res || []);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách người dùng.');
      }
    });
  }

  openRoleModal(user: any): void {
    this.selectedUser.set(user);
    this.roleForm.patchValue({ role: user.roleName });
  }

  closeRoleModal(): void {
    this.selectedUser.set(null);
  }

  onUpdateRole(): void {
    if (this.roleForm.invalid || !this.selectedUser()) return;

    const userId = this.selectedUser().id;
    const newRole = this.roleForm.get('role')?.value;

    this.adminService.updateUserRole(userId, newRole).subscribe({
      next: () => {
        this.closeRoleModal();
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage.set(err.error?.message || 'Cập nhật quyền thất bại.');
      }
    });
  }

  deleteUser(userId: number): void {
    if (confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => this.loadUsers(),
        error: (err) => this.errorMessage.set(err.error?.message || 'Xóa người dùng thất bại.')
      });
    }
  }
}
