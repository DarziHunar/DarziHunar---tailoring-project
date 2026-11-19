import { apiRequest } from './api';

export type AppNotification = {
    id: number; title: string; body: string; type: string; data?: Record<string, unknown> | null;
    readAt?: string | null; createdAt: string;
};

export const notificationsService = {
    list(token: string) { return apiRequest<AppNotification[]>('/notifications', { token }); },
    markRead(id: number, token: string) { return apiRequest<{ id: number; read: boolean }>(`/notifications/${id}/read`, { method: 'PATCH', token }); },
    markAllRead(token: string) { return apiRequest<{ updated: number }>('/notifications/read-all', { method: 'PATCH', token }); },
};
