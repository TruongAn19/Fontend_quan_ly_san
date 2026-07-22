import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private apiUrl = `${environment.apiBaseUrl}/ai/chat`;

  /**
   * Send a message and get a streaming response
   */
  chatStream(message: string, chatId: string = 'default'): Observable<string> {
    return new Observable<string>(subscriber => {
      const controller = new AbortController();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const run = async () => {
        try {
          const response = await fetch(this.apiUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ message, chatId }),
            signal: controller.signal
          });

          if (!response.ok) {
            let errorMessage = `Yêu cầu AI thất bại (HTTP ${response.status}).`;
            try {
              const errorBody = await response.json();
              errorMessage = errorBody?.message || errorMessage;
            } catch {
              const text = await response.text();
              if (text) errorMessage = text;
            }
            throw new Error(errorMessage);
          }

          if (!response.body) throw new Error('Phản hồi AI không có nội dung.');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let finished = false;

          const emitEvent = (eventBlock: string) => {
            const data = eventBlock
              .split(/\r?\n/)
              .filter(line => line.startsWith('data:'))
              .map(line => line.slice(5).replace(/^ /, ''))
              .join('\n');
            if (!data) return;
            if (data === '[DONE]') {
              finished = true;
              return;
            }
            subscriber.next(data);
          };

          while (!finished) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const events = buffer.split(/\r?\n\r?\n/);
            buffer = events.pop() || '';
            events.forEach(emitEvent);
          }

          buffer += decoder.decode();
          if (buffer.trim() && !finished) emitEvent(buffer);
          subscriber.complete();
        } catch (error) {
          if (!controller.signal.aborted) subscriber.error(error);
        }
      };

      void run();
      return () => {
        controller.abort();
      };
    });
  }
}
