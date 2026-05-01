import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatchService } from '../../core/services/match.service';

@Component({
  selector: 'app-match-post-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './match-post-create.html',
  styleUrls: ['./match-post-create.css']
})
export class MatchPostCreateComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private matchService = inject(MatchService);

  createForm: FormGroup = this.fb.group({
    playDate: [new Date().toISOString().split('T')[0], [Validators.required]],
    area: ['', [Validators.required]],
    timeSlot: ['', [Validators.required]],
    skillLevel: ['Intermediate', [Validators.required]],
    description: ['', [Validators.required]],
    maxParticipants: [4, [Validators.required, Validators.min(2)]]
  });

  isSubmitting = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  onSubmit(): void {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.matchService.createMatchPost(this.createForm.value).subscribe({
      next: (res) => {
        this.isSubmitting.set(false);
        this.router.navigate(['/match-posts']);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể tạo bài đăng.');
      }
    });
  }
}
