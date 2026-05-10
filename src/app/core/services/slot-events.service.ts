import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SlotHeldEvent {
  action: 'HELD' | 'RELEASED';
  subPitchId: number;
  availableTimeId: number;
  bookingDate: string;
  holderUserId: number;
  holderEmail: string;
}

@Injectable({ providedIn: 'root' })
export class SlotEventsService {
  private eventSource: EventSource | null = null;
  private currentTopic: string | null = null;
  private events$ = new Subject<SlotHeldEvent>();

  readonly stream = this.events$.asObservable();

  subscribe(subPitchId: number, bookingDate: string): void {
    const topic = `slot-${subPitchId}-${bookingDate}`;
    if (this.currentTopic === topic && this.eventSource) return;

    this.disconnect();
    this.currentTopic = topic;

    const url = `${environment.apiBaseUrl}/ntfy-sse/${topic}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onmessage = (event) => {
      const parsed = this.parseEvent(event.data);
      if (parsed) this.events$.next(parsed);
    };

    this.eventSource.onerror = (err) => {
      console.warn('[SlotEvents] SSE error', err);
    };
  }

  disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.currentTopic = null;
  }

  private parseEvent(raw: string): SlotHeldEvent | null {
    try {
      const outer = JSON.parse(raw);
      const body = typeof outer?.message === 'string' ? outer.message : raw;
      const inner = JSON.parse(body);
      if (!inner || !inner.action) return null;
      return inner as SlotHeldEvent;
    } catch {
      return null;
    }
  }
}
