import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';
import { UserResponseDTO } from '../../../core/models/user.model';

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

  users = signal<UserResponseDTO[]>([]);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  selectedUser = signal<UserResponseDTO | null>(null);
  detailUser = signal<UserResponseDTO | null>(null);
  isDetailOpen = signal<boolean>(false);
  isDetailLoading = signal<boolean>(false);
  roleForm: FormGroup = this.fb.group({
    role: ['', [Validators.required]]
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.isLoading.set(true);
    this.adminService.getUsers().subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.users.set(res.data);
      },
      error: () => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách người dùng.');
      }
    });
  }

  openRoleModal(user: UserResponseDTO): void {
    this.selectedUser.set(user);
    this.roleForm.patchValue({ role: user.roleName });
  }

  closeRoleModal(): void {
    this.selectedUser.set(null);
  }

  openDetailModal(userId: number): void {
    this.isDetailOpen.set(true);
    this.isDetailLoading.set(true);
    this.detailUser.set(null);
    this.errorMessage.set(null);

    this.adminService.getUserDetail(userId).subscribe({
      next: (res) => {
        this.detailUser.set(res.data);
        this.isDetailLoading.set(false);
      },
      error: (err) => {
        this.isDetailLoading.set(false);
        this.isDetailOpen.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tải chi tiết người dùng.');
      }
    });
  }

  closeDetailModal(): void {
    this.isDetailOpen.set(false);
    this.detailUser.set(null);
  }

  onUpdateRole(): void {
    if (this.roleForm.invalid || !this.selectedUser()) return;

    const userId = this.selectedUser()!.id;
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
