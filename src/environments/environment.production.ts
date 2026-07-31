export const environment = {
  production: true,
  apiBaseUrl: '/api/v1',
  wsBaseUrl: '/ws',
  sseBaseUrl: '/api/v1/ntfy-sse',
  vnpayReturnUrl: '/payments/vnpay-callback',
  contact: {
    hotline: '0123456789',
    email: 'admin@badmintonhub.vn'
  },
  features: {
    enableRealtimeChat: false,
    enableRealtimeNotifications: false
  }
};
