export interface JwtAuthResponse {
  /**
   * @deprecated Token is now delivered via an httpOnly cookie set by the BE.
   * Field kept for backward compatibility; will be `null` from the server.
   */
  accessToken?: string | null;
  tokenType?: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password?: string; // Optional just in case
}

export interface RegisterRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  phone?: string;
}
