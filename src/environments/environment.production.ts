export const environment = {
  production: true,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  wsBaseUrl: 'ws://localhost:8080/ws',
  stompSockJsUrl: 'http://localhost:8080/ws',
  sseBaseUrl: 'http://localhost:8080/api/v1/ntfy-sse',
  vnpayReturnUrl: 'http://localhost:4200/payment/result',
  features: {
    enableRealtimeChat: false,
    enableRealtimeNotifications: false
  }
};
