import { Component, ElementRef, ViewChild, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIService } from '../../../core/services/ai.service';

interface Message {
  role: 'user' | 'ai';
  content: string;
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.css']
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  isOpen = false;
  userInput = '';
  isTyping = false;
  messages: Message[] = [
    { role: 'ai', content: 'Chào bạn! Tôi là trợ lý ảo của hệ thống đặt sân. Tôi có thể giúp gì cho bạn?' }
  ];
  chatId = 'session-' + Math.random().toString(36).substr(2, 9);

  constructor(private aiService: AIService) {}

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  sendMessage() {
    if (!this.userInput.trim()) return;

    const userMessage = this.userInput.trim();
    this.messages.push({ role: 'user', content: userMessage });
    this.userInput = '';
    this.isTyping = true;

    let aiMessage = { role: 'ai' as const, content: '' };
    this.messages.push(aiMessage);

    this.aiService.chatStream(userMessage, this.chatId).subscribe({
      next: (chunk: string) => {
        aiMessage.content += chunk;
        this.scrollToBottom();
      },
      error: (err: any) => {
        console.error('AI Error:', err);
        aiMessage.content = 'Xin lỗi, có lỗi xảy ra khi kết nối với AI.';
        this.isTyping = false;
      },
      complete: () => {
        this.isTyping = false;
      }
    });
  }

  private scrollToBottom(): void {
    try {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    } catch (err) {}
  }
}
