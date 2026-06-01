export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080/api/v1',
  wsBaseUrl: 'ws://localhost:8080/ws',
  sseBaseUrl: 'http://localhost:8080/api/v1/ntfy-sse',
  vnpayReturnUrl: 'http://localhost:4200/payment/result',
  contact: {
    hotline: '0123456789',
    email: 'admin@badmintonhub.vn'
  },
  features: {
    enableRealtimeChat: false,
    enableRealtimeNotifications: false
  }
};
