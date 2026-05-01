export interface JwtAuthResponse {
  accessToken: string;
  tokenType: string;
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
