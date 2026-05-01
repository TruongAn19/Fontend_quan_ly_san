export interface UserResponseDTO {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatarUrl?: string;
  role: string;
}
