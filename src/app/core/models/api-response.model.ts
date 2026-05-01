export interface ApiResponse<T> {
  status: number;
  message: string;
  errorCode: string | null;
  path: string | null;
  timestamp: string;
  data: T;
}
