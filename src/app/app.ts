import { Component, signal, inject, computed } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';

import { ChatbotComponent } from './shared/components/chatbot/chatbot';
import { NotificationBellComponent } from './shared/components/notification-bell/notification-bell';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ChatbotComponent, NotificationBellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  protected readonly title = signal('fontend-do-an');
  authService = inject(AuthService);
  private notifService = inject(NotificationService);
  private router = inject(Router);

  isAuthPage(): boolean {
    const path = this.router.url.split(/[?#]/)[0];
    return path === '/login' || path === '/register';
  }

  isAdmin = computed(() => {
    const role = this.authService.role();
    return role === 'ADMIN' || role === 'STAFF' || role === 'ROLE_ADMIN' || role === 'ROLE_STAFF';
  });

  onLogout(): void {
    this.notifService.disconnect();
    this.authService.logout();
  }
}
