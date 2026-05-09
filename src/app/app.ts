import { Component, signal, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

import { ChatbotComponent } from './shared/components/chatbot/chatbot';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatbotComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('fontend-do-an');
  authService = inject(AuthService);

  isAdmin = computed(() => {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'STAFF' || role === 'ROLE_ADMIN' || role === 'ROLE_STAFF';
  });

  onLogout(): void {
    this.authService.logout();
  }
}
