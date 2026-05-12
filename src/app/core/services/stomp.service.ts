import { Injectable } from '@angular/core';
import { RxStomp } from '@stomp/rx-stomp';
import SockJS from 'sockjs-client';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class StompService extends RxStomp {
  constructor(private authService: AuthService) {
    super();
  }

  public initStomp() {
    this.configure({
      webSocketFactory: () => {
        const url = environment.wsBaseUrl.replace(/^ws/, 'http');
        return new SockJS(url);
      },
      connectHeaders: {
        Authorization: `Bearer ${this.authService.getToken()}`
      },
      heartbeatIncoming: 0,
      heartbeatOutgoing: 20000,
      reconnectDelay: 5000,
      debug: (msg: string): void => {
        // console.log(new Date(), msg);
      }
    });

    this.activate();
  }
}
