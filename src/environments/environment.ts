const origin = window.location.origin;
const wsOrigin = origin.replace(/^http/, 'ws');

export const environment = {
  production: false,
  apiBaseUrl: '/api/v1',
  wsBaseUrl: `${wsOrigin}/ws`,
  /** SockJS HTTP-fallback endpoint - proxied to Spring's STOMP /ws. */
  stompSockJsUrl: `${origin}/ws`,
  sseBaseUrl: '/api/v1/ntfy-sse',
  vnpayReturnUrl: `${origin}/payments/vnpay-callback`,
  contact: {
    hotline: '0123456789',
    email: 'admin@badmintonhub.vn'
  },
  features: {
    enableRealtimeChat: false,
    enableRealtimeNotifications: true
  }
};