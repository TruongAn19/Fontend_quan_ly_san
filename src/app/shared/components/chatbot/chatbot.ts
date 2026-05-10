import { Component, signal, inject, ViewChild, ElementRef, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../../core/services/ai.service';

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

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = signal(false);
  isProcessing = signal(false);
  userInput = '';
  chatId = 'session-' + Math.random().toString(36).substr(2, 9);

  messages = signal<Message[]>([
    { role: 'assistant', content: 'Chào mừng bạn đến với hệ thống đặt sân bóng đá! Tôi là trợ lý AI SoccerHub, tôi có thể giúp gì cho bạn?' }
  ]);

  suggestions = signal<string[]>([
    'Cách đặt sân cỏ nhân tạo',
    'Giá thuê sân 7 người',
    'Dịch vụ cho thuê giày bóng đá'
  ]);

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
