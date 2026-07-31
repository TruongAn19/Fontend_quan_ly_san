export interface UserResponseDTO {
  id: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  roleName: string;
  active: boolean;
}
