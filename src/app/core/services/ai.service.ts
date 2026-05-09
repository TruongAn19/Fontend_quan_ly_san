import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AIService {
  private apiUrl = `${environment.apiBaseUrl}/ai/chat`;

  constructor(private http: HttpClient) {}

  /**
   * Send a message and get a streaming response
   */
  chatStream(message: string, chatId: string = 'default'): Observable<string> {
    const resultSubject = new Subject<string>();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('access_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(this.apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({ message, chatId }),
    }).then(response => {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        resultSubject.error('Cannot read response body');
        return;
      }

      const push = () => {
        reader.read().then(({ done, value }) => {
          if (done) {
            resultSubject.complete();
            return;
          }
          const chunk = decoder.decode(value, { stream: true });
          // SSE format often prefix with 'data:'
          const lines = chunk.split('\n');
          lines.forEach(line => {
            if (line.startsWith('data:')) {
              // Extract the data content without trimming to preserve spaces
              const content = line.substring(5);
              if (content) {
                resultSubject.next(content);
              }
            } else if (line !== '') {
              resultSubject.next(line);
            }
          });
          push();
        });
      };
      push();
    }).catch(err => {
      resultSubject.error(err);
    });

    return resultSubject.asObservable();
  }
}
