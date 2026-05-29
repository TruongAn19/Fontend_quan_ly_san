export type NotificationType = 'REFUND_REQUEST' | 'REFUND_DONE' | 'BOOKING_CANCELLED' | 'SYSTEM';

export interface NotificationDTO {
  id: number;
  type: NotificationType;
  title?: string;
  message?: string;
  refType?: string;
  refId?: number;
  isRead?: boolean;
  read?: boolean;       // some Jackson serialisers expose `read` for `isRead`
  createdAt?: string;
}

export interface NotificationPage {
  content: NotificationDTO[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
}

/** Friendly label for the bell row. */
export function notificationTitle(n: NotificationDTO): string {
  return n.title || (n.type === 'REFUND_REQUEST' ? 'Yêu cầu hoàn cọc'
       : n.type === 'REFUND_DONE'     ? 'Đã hoàn cọc'
       : n.type === 'BOOKING_CANCELLED' ? 'Huỷ đặt sân thành công'
       : 'Thông báo');
}
