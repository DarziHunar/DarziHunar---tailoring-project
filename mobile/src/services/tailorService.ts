import { apiRequest } from './api';

export type TailorProfile = {
  id: number;
  userId: number;
  fullName?: string | null;
  shopName: string;
  bio?: string | null;
  categories: string[];
  experienceYears?: number | null;
  specialization?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  distanceMeters?: number;
  verified: boolean;
  rating: number;
  startingPrice: number;
  acceptingOrders: boolean;
  createdAt?: string;
  updatedAt?: string;
  user?: { fullName?: string | null };
};

export type TailorProfilePayload = {
  shopName: string;
  bio?: string;
  categories: string[];
  experienceYears?: number;
  specialization?: string;
  startingPrice?: number;
  acceptingOrders?: boolean;
  latitude?: number;
  longitude?: number;
};

export const tailorService = {
  list() {
    return apiRequest<TailorProfile[]>('/tailors');
  },
  getCategories() {
    return apiRequest<string[]>('/tailors/categories');
  },
  getByCategory(category: string) {
    return apiRequest<TailorProfile[]>(`/tailors/by-category?category=${encodeURIComponent(category)}`);
  },
  getById(id: number) {
    return apiRequest<TailorProfile>(`/tailors/${id}`);
  },
  findNearby(latitude: number, longitude: number, radiusMeters = 4000) {
    const query = new URLSearchParams({ lat: String(latitude), lng: String(longitude), radius: String(radiusMeters), acceptingOrders: 'true', limit: '50', sort: 'nearest' });
    return apiRequest<{ data: TailorProfile[]; pagination: { total: number; limit: number; offset: number; hasMore: boolean } }>(`/tailors/nearby?${query.toString()}`);
  },
  getMine(token: string) {
    return apiRequest<TailorProfile>('/tailors/me', { token });
  },
  create(payload: TailorProfilePayload, token: string) {
    return apiRequest<TailorProfile>('/tailors', { method: 'POST', token, body: payload });
  },
  update(id: number, payload: Partial<TailorProfilePayload>, token: string) {
    return apiRequest<TailorProfile>(`/tailors/${id}`, { method: 'PATCH', token, body: payload });
  },
};
