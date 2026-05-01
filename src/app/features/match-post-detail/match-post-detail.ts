import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { MatchService } from '../../core/services/match.service';

@Component({
  selector: 'app-match-post-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './match-post-detail.html',
  styleUrls: ['./match-post-detail.css']
})
export class MatchPostDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private matchService = inject(MatchService);

  postId = signal<number | null>(null);
  postDetail = signal<any>(null);
  messages = signal<any[]>([]);
  participants = signal<any[]>([]);
  
  alreadyJoined = signal<boolean>(false);
  isOwner = signal<boolean>(false);

  isLoading = signal<boolean>(false);
  isActionRunning = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postId.set(+id);
      this.loadDetail();
    } else {
      this.errorMessage.set('Mã bài đăng không hợp lệ.');
    }
  }

  loadDetail(): void {
    this.isLoading.set(true);
    this.matchService.getMatchPostDetail(this.postId()!).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        const data = res.data ? res.data : res;
        this.postDetail.set(data.post);
        this.messages.set(data.messages || []);
        this.participants.set(data.participants || []);
        this.alreadyJoined.set(data.alreadyJoined || false);
        
        if (data.post && data.currentUserId) {
          this.isOwner.set(data.post.creatorId === data.currentUserId);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Không thể tải chi tiết bài đăng.');
      }
    });
  }

  joinPost(): void {
    this.isActionRunning.set(true);
    this.matchService.joinMatchPost(this.postId()!).subscribe({
      next: () => {
        this.isActionRunning.set(false);
        this.loadDetail();
      },
      error: (err) => {
        this.isActionRunning.set(false);
        this.errorMessage.set(err.error?.message || 'Tham gia bài đăng thất bại.');
      }
    });
  }

  leavePost(): void {
    this.isActionRunning.set(true);
    this.matchService.leaveMatchPost(this.postId()!).subscribe({
      next: () => {
        this.isActionRunning.set(false);
        this.loadDetail();
      },
      error: (err) => {
        this.isActionRunning.set(false);
        this.errorMessage.set(err.error?.message || 'Rời khỏi bài đăng thất bại.');
      }
    });
  }

  kickParticipant(userId: number): void {
    this.isActionRunning.set(true);
    this.matchService.kickUser(this.postId()!, userId).subscribe({
      next: () => {
        this.isActionRunning.set(false);
        this.loadDetail();
      },
      error: (err) => {
        this.isActionRunning.set(false);
        this.errorMessage.set(err.error?.message || 'Không thể kick người dùng.');
      }
    });
  }
}
