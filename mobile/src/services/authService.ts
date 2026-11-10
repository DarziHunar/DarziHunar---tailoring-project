import { apiRequest } from './api';
import type { AuthUser, LoginResponse, SignupResponse } from '../types/auth';

export type SignupPayload = {
  fullName: string;
  email: string;
  phoneNumber: string;
  password: string;
  role: 'CUSTOMER' | 'TAILOR';
  shopName?: string;
  experience?: number;
  specialization?: string;
};

export const authService = {
  signup(payload: SignupPayload) {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: payload,
    });
  },

  login(email: string, password: string) {
    return apiRequest<LoginResponse>('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  getCurrentUser(userId: number, token: string) {
    return apiRequest<AuthUser>(`/users/${userId}`, { token });
  },
};