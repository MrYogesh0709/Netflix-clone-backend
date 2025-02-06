interface UserType {
  id: unknown;
  email: string;
  password: string;
  refreshToken?: string;
}

export interface AuthRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: Omit<UserType, 'password' | 'refreshToken'>;
}
