import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-admin-ntfy',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ntfy.html',
  styleUrls: ['./ntfy.css']
})
export class AdminNtfyComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  topic = signal<string>('admin-alerts');
  messages = signal<string[]>([]);
  eventSource: EventSource | null = null;

  notifyForm: FormGroup = this.fb.group({
    message: ['', [Validators.required]]
  });

  isSending = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.connectSSE();
  }

  ngOnDestroy(): void {
    this.disconnectSSE();
  }

  connectSSE(): void {
    this.disconnectSSE();
    
    const url = `${environment.apiBaseUrl}/ntfy-sse/${this.topic()}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      if (event.data) {
        this.messages.update(msgs => [event.data, ...msgs]);
      }
    };

    this.eventSource.onerror = () => {
      this.errorMessage.set('Mất kết nối SSE. Đang thử kết nối lại...');
    };
  }

  disconnectSSE(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  changeTopic(newTopic: string): void {
    if (!newTopic.trim()) return;
    this.topic.set(newTopic.trim());
    this.messages.set([]);
    this.connectSSE();
  }

  onSubmit(): void {
    if (this.notifyForm.invalid) return;

    this.isSending.set(true);
    this.errorMessage.set(null);

    const payload = this.notifyForm.get('message')?.value;

    this.http.post(`${environment.apiBaseUrl}/notify`, payload, { responseType: 'text' }).subscribe({
      next: () => {
        this.isSending.set(false);
        this.notifyForm.reset();
      },
      error: (err) => {
        this.isSending.set(false);
        this.errorMessage.set(err.error || 'Không thể gửi thông báo.');
      }
    });
  }
}
