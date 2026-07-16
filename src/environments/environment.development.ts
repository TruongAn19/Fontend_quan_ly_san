const origin = window.location.origin;
const wsOrigin = origin.replace(/^http/, 'ws');

export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  wsBaseUrl: `${wsOrigin}/ws`,
  stompSockJsUrl: `${origin}/ws`,
  sseBaseUrl: '/api/v1/ntfy-sse',
  vnpayReturnUrl: `${origin}/payments/vnpay-callback`,
  features: {
    enableRealtimeChat: false,
    enableRealtimeNotifications: false
  }
};