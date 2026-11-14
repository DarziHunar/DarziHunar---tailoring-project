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

export type UpdateUserPayload = {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  password?: string;
};

export const authService = {
  signup(payload: SignupPayload) {
    return apiRequest<SignupResponse>('/auth/signup', {
      method: 'POST',
      body: payload,
    });
  },

  loginWithCognito(idToken: string, role: 'CUSTOMER' | 'TAILOR' = 'CUSTOMER') {
    return apiRequest<LoginResponse>('/auth/cognito', { method: 'POST', body: { idToken, role } });
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

  updateUser(userId: number, token: string, payload: UpdateUserPayload) {
    return apiRequest<AuthUser>(`/users/${userId}`, {
      method: 'PATCH',
      token,
      body: payload,
    });
  },

  deleteUser(userId: number, token: string) {
    return apiRequest<{ message: string }>(`/users/${userId}`, {
      method: 'DELETE',
      token,
    });
  },
};
