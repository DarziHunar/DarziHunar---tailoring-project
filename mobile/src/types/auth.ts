export type AuthUser = {
  id: number;
  fullName?: string | null;
  email: string;
  phoneNumber?: string | null;
  role: 'CUSTOMER' | 'TAILOR' | 'ADMIN';
};

export type SignupResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};

export type LoginResponse = {
  message: string;
  accessToken: string;
  user: AuthUser;
};