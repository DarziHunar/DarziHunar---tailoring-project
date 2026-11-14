import { apiRequest } from './api';
import type { Audience } from './stylesService';

export type DeliveryDetails = {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export type CreateCustomerOrderPayload = {
  tailorId: number;
  deliveryDetails: DeliveryDetails;
  items: Array<{
    garmentType: string;
    audience: Audience;
    fabric: string;
    sizeLabel: string;
    measurementMethod: 'MANUAL' | 'CAMERA_ASSISTED';
    measurementUnit: 'cm' | 'in';
    measurements: Record<string, number>;
    notes?: string;
    referenceImages?: string[];
    quantity: number;
  }>;
};

export type CustomerOrder = {
  id: number; status: string; totalAmount: number; createdAt: string;
  deliveryDetails?: DeliveryDetails | null;
  items: Array<{ id: number; garmentType: string; measurements: Record<string, unknown>; fabric?: string | null; sizeLabel?: string | null; measurementUnit?: string; notes?: string | null; referenceImages?: string[] }>;
  tailor?: { id: number; shopName: string; startingPrice?: number };
};

export const ordersService = {
  create(payload: CreateCustomerOrderPayload, token: string) {
    return apiRequest<CustomerOrder>('/orders', { method: 'POST', token, body: payload });
  },
  list(token: string) {
    return apiRequest<CustomerOrder[]>('/orders', { token });
  },
  pendingPayment(token: string) {
    return apiRequest<CustomerOrder[]>('/orders/pending-payment', { token });
  },
};
