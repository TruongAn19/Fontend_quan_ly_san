import { Component, signal, inject, ViewChild, ElementRef, effect, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../../core/services/ai.service';
import { AuthService } from '../../../core/services/auth.service';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.html',
  styleUrl: './chatbot.css'
})
export class ChatbotComponent {
  private aiService = inject(AIService);
  private authService = inject(AuthService);

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  isProcessing = signal(false);
  userInput = '';
  chatId = 'session-' + Math.random().toString(36).substr(2, 9);

  messages = signal<Message[]>([
    { role: 'assistant', content: 'Chào mừng bạn đến với hệ thống đặt sân cầu lông! Tôi là trợ lý AI Antigravity, tôi có thể giúp gì cho bạn?' }
  ]);
  hasUserMessage = computed(() => this.messages().some(message => message.role === 'user'));

  private isAdmin = computed(() => {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'ROLE_ADMIN';
  });

  /** Gợi ý dành riêng cho admin (vd báo cáo doanh thu) — ẩn cho user thường. */
  suggestions = computed<string[]>(() => {
    const base = [
      'Kiểm tra sân trống chiều nay',
      'Địa chỉ sân ở đâu?',
      'Cách cầm vợt đúng'
    ];
    return this.isAdmin() ? [...base, 'Báo cáo doanh thu tuần này'] : base;
  });

  constructor() {
    effect(() => {
      this.messages();
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  async sendMessage(event?: Event) {
    if (event) event.preventDefault();
    const text = this.userInput.trim();
    if (!text || this.isProcessing()) return;

    this.messages.update(msgs => [...msgs, { role: 'user', content: text }]);
    this.userInput = '';
    this.isProcessing.set(true);

    let aiResponse = '';
    const aiMsgIndex = this.messages().length;
    this.messages.update(msgs => [...msgs, { role: 'assistant', content: '', isTyping: true }]);

    this.aiService.chatStream(text, this.chatId).subscribe({
      next: (chunk) => {
        aiResponse += chunk;
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = { role: 'assistant', content: aiResponse, isTyping: true };
          return updated;
        });
      },
      error: (err) => {
        console.error('Lỗi chat AI:', err);
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = { role: 'assistant', content: 'Rất tiếc, đã có lỗi xảy ra. Vui lòng thử lại sau.' };
          return updated;
        });
        this.isProcessing.set(false);
      },
      complete: () => {
        this.messages.update(msgs => {
          const updated = [...msgs];
          updated[aiMsgIndex] = { role: 'assistant', content: aiResponse, isTyping: false };
          return updated;
        });
        this.isProcessing.set(false);
      }
    });
  }

  sendPreset(text: string) {
    this.userInput = text;
    this.sendMessage();
  }

  private scrollToBottom(): void {
    if (this.scrollContainer) {
      const el = this.scrollContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }
}
