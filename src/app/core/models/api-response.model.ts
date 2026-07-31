export interface ApiResponse<T> {
  status: number;
  message: string;
  errorCode?: string;
  path?: string;
  timestamp: string;
  data: T;
}
