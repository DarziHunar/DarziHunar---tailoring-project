import { apiRequest } from './api';

export type RazorpayPaymentMethod = 'RAZORPAY';
export type RazorpayOrderResponse = {
  id: number;
  orderId: number;
  amount: number;
  amountPaise: number;
  currency: 'INR';
  method: RazorpayPaymentMethod;
  status: 'PENDING';
  keyId: string;
  providerOrderId: string;
};

export const paymentsService = {
  createRazorpayOrder(orderId: number, method: RazorpayPaymentMethod, token: string) {
    return apiRequest<RazorpayOrderResponse>('/payments/razorpay/order', {
      method: 'POST', token, body: { orderId, method },
    });
  },
  verifyRazorpayPayment(payload: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }, token: string) {
    return apiRequest<{ success: boolean; payment?: { id: number; orderId: number; status: string } }>('/payments/razorpay/verify', {
      method: 'POST', token, body: payload,
    });
  },
};
