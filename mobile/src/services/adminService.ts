import { apiRequest } from './api';

export type AdminRole = 'CUSTOMER' | 'TAILOR' | 'ADMIN';
export type AdminSection = 'overview' | 'users' | 'orders' | 'tailors' | 'reviews' | 'measurements';
export const adminService = {
  users: (token: string) => apiRequest<any[]>('/admin/users', { token }),
  orders: (token: string) => apiRequest<any[]>('/admin/orders', { token }),
  tailors: (token: string) => apiRequest<any[]>('/admin/tailors', { token }),
  reviews: (token: string) => apiRequest<any[]>('/admin/reviews', { token }),
  measurements: (token: string) => apiRequest<any[]>('/admin/measurements', { token }),
  updateUserRole: (id: number, role: AdminRole, token: string) => apiRequest<any>(`/admin/users/${id}/role`, { method: 'PATCH', token, body: { role } }),
  deleteUser: (id: number, token: string) => apiRequest<any>(`/admin/users/${id}`, { method: 'DELETE', token }),
  updateOrderStatus: (id: number, status: string, token: string) => apiRequest<any>(`/admin/orders/${id}/status`, { method: 'PATCH', token, body: { status } }),
  updateTailorModeration: (id: number, values: { verified?: boolean; acceptingOrders?: boolean }, token: string) => apiRequest<any>(`/admin/tailors/${id}/moderation`, { method: 'PATCH', token, body: values }),
  deleteTailor: (id: number, token: string) => apiRequest<any>(`/admin/tailors/${id}`, { method: 'DELETE', token }),
  deleteReview: (id: number, token: string) => apiRequest<any>(`/admin/reviews/${id}`, { method: 'DELETE', token }),
  deleteMeasurement: (id: number, token: string) => apiRequest<any>(`/admin/measurements/${id}`, { method: 'DELETE', token }),
};
