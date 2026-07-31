export interface UserResponseDTO {
  id: number;
  fullName: string;
  email: string;
  phone: string | null;
  address: string | null;
  avatar: string | null;
  roleName: string | null;
}
