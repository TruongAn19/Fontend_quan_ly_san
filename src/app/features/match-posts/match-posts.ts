import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MatchService } from '../../core/services/match.service';

@Component({
  selector: 'app-match-posts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './match-posts.html',
  styleUrls: ['./match-posts.css']
})
export class MatchPostsComponent implements OnInit {
  private fb = inject(FormBuilder);
  private matchService = inject(MatchService);

  filterForm: FormGroup = this.fb.group({
    area: [''],
    playDate: [''],
    skillLevel: ['']
  });

  posts = signal<any[]>([]);
  currentPage = signal<number>(1);
  totalPages = signal<number>(1);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts(): void {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const filters = {
      page: this.currentPage() - 1,
      size: 6,
      ...this.filterForm.value
    };

    this.matchService.getMatchPosts(filters).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        if (res) {
          this.posts.set(res.posts || res.data?.posts || []);
          this.totalPages.set(res.totalPages || res.data?.totalPages || 1);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải danh sách tìm người chơi.');
      }
    });
  }

  applyFilters(): void {
    this.currentPage.set(1);
    this.loadPosts();
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
      this.loadPosts();
    }
  }
}
