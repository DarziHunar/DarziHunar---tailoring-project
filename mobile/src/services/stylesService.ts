import { apiRequest } from './api';

export type Audience = 'WOMEN' | 'MEN' | 'TEENAGERS' | 'CHILDREN';
export type MeasurementField = { key: string; label: string };
export type GarmentStyle = {
  id: string; audience: Audience; name: string; description: string;
  garmentType: string; measurementFields: MeasurementField[]; imageUrl?: string; modelUrl?: string;
};

export const stylesService = {
  list(audience: Audience) {
    return apiRequest<GarmentStyle[]>(`/styles?audience=${audience}`);
  },
};
