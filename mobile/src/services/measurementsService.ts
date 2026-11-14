import { apiRequest } from './api';

export type MeasurementGarmentType = 'SHIRT' | 'TROUSERS' | 'KURTA' | 'SHERWANI' | 'DRESS' | 'BLOUSE';
export type MeasurementProfile = {
  id: number;
  userId: number;
  name: string;
  garmentType: MeasurementGarmentType;
  measurements: Record<string, number>;
  unit: 'cm';
  createdAt: string;
  updatedAt: string;
};
export type MeasurementProfilePayload = {
  name: string;
  garmentType: MeasurementGarmentType;
  measurements: Record<string, number>;
  unit?: 'cm';
};

export const measurementsService = {
  list(token: string) {
    return apiRequest<MeasurementProfile[]>('/measurements', { token });
  },
  create(payload: MeasurementProfilePayload, token: string) {
    return apiRequest<MeasurementProfile>('/measurements', { method: 'POST', token, body: payload });
  },
  update(id: number, payload: Partial<MeasurementProfilePayload>, token: string) {
    return apiRequest<MeasurementProfile>(`/measurements/${id}`, { method: 'PATCH', token, body: payload });
  },
  remove(id: number, token: string) {
    return apiRequest<{ success: boolean; message: string }>(`/measurements/${id}`, { method: 'DELETE', token });
  },
};
