import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface SlotEvent {
  type: 'SLOT_HELD' | 'SLOT_RELEASED';
  subCourtId: number;
  availableTimeId: number;
  bookingDate: string;
  userId?: number | null;
  holdEndTime?: string | null;
}

@Injectable({ providedIn: 'root' })
export class BookingSocketService {
  private rxStomp: RxStomp | null = null;
  private activated = false;

  private ensureActive(): void {
    if (this.activated) return;

    const token = localStorage.getItem('accessToken') ?? '';
    const httpBase = environment.apiBaseUrl.replace(/\/api\/v1\/?$/, '');
    const wsUrl = `${httpBase}/ws?token=${encodeURIComponent(token)}`;

    this.rxStomp = new RxStomp();
    this.rxStomp.configure({
      webSocketFactory: () => new SockJS(wsUrl) as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
    });
    this.rxStomp.activate();
    this.activated = true;
  }

  watchSlotEvents(subCourtId: number, bookingDate: string): Observable<SlotEvent> {
    this.ensureActive();
    const topic = `/topic/slot-events/${subCourtId}/${bookingDate}`;
    return this.rxStomp!.watch(topic).pipe(
      map(msg => JSON.parse(msg.body) as SlotEvent)
    );
  }

  disconnect(): void {
    if (this.rxStomp && this.activated) {
      this.rxStomp.deactivate();
      this.activated = false;
      this.rxStomp = null;
    }
  }
}
