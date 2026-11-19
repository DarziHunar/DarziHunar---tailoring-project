import { Alert } from '../utils/appAlert';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { ordersService } from '../services/ordersService';
import { C } from '../theme/colors';

type OrderRecord = {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  payments?: Array<{ status: string }>;
  createdAt: string;
  deliveryDetails?: {
    fullName?: string;
    phone?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
  } | null;
  items?: Array<{
    id: number;
    garmentType: string;
    quantity: number;
    fabric?: string | null;
    sizeLabel?: string | null;
    designType?: string | null;
    measurementUnit?: string;
    measurements?: Record<string, number>;
    notes?: string | null;
  }>;
  customer?: { id: number; email: string };
};

type Props = { onBack: () => void };
const transitions: Partial<Record<OrderRecord['status'], Array<{ label: string; status: OrderRecord['status'] }>>> = {
  PENDING: [{ label: 'Reject', status: 'REJECTED' }],
  ACCEPTED: [{ label: 'Start work', status: 'IN_PROGRESS' }],
  IN_PROGRESS: [{ label: 'Mark ready', status: 'READY' }],
  READY: [{ label: 'Resume work', status: 'IN_PROGRESS' }],
};

export default function TailorOrdersPage({ onBack }: Props) {
  const { accessToken } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [quoteValues, setQuoteValues] = useState<Record<number, string>>({});

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const result = await apiRequest<OrderRecord[]>('/orders', { token: accessToken });
      setOrders(Array.isArray(result) ? result : []);
    } catch (error) {
      Alert.alert('Unable to load orders', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  const updateStatus = async (orderId: number, status: OrderRecord['status']) => {
    if (!accessToken) return;
    setUpdatingId(orderId);
    try {
      await apiRequest(`/orders/${orderId}/status`, { method: 'PATCH', token: accessToken, body: { status } });
      await load();
    } catch (error) {
      Alert.alert('Could not update order', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  const submitQuote = async (orderId: number) => {
    if (!accessToken) return;
    const amount = Number(quoteValues[orderId]);
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 10000000) {
      Alert.alert('Enter a valid quote', 'Enter the final order amount in whole rupees, between ₹1 and ₹1,00,00,000.');
      return;
    }
    setUpdatingId(orderId);
    try {
      await ordersService.setQuote(orderId, amount, accessToken);
      setQuoteValues((current) => { const next = { ...current }; delete next[orderId]; return next; });
      await load();
      Alert.alert('Quote sent', 'The order has been accepted. The customer can now review the quote and pay securely with Razorpay.');
    } catch (error) {
      Alert.alert('Could not send quote', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 22, paddingBottom: 35 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <AuthHeader title="Customer Orders" onBack={onBack} />
        <Text style={{ color: C.wine, fontSize: 23, fontWeight: '900', marginTop: 12 }}>Manage your work</Text>
        <Text style={{ color: C.muted, lineHeight: 20, marginTop: 6, marginBottom: 18 }}>Review new requests and update each order as the stitching progresses.</Text>

        {loading ? <ActivityIndicator size="large" color={C.wine} style={{ marginTop: 40 }} /> : orders.length === 0 ? (
          <View style={{ backgroundColor: C.card, borderRadius: 18, borderColor: C.border, borderWidth: 1, padding: 22, marginTop: 12 }}>
            <Text style={{ color: C.wine, fontSize: 18, fontWeight: '800' }}>No orders yet</Text>
            <Text style={{ color: C.muted, lineHeight: 20, marginTop: 7 }}>New customer requests will appear here when someone books your tailoring service.</Text>
          </View>
        ) : orders.map((order) => (
          <View key={order.id} style={{ backgroundColor: C.card, borderRadius: 17, borderColor: C.border, borderWidth: 1, padding: 16, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '900' }}>Order #{order.id}</Text>
              <Text style={{ color: C.wine, fontSize: 11, fontWeight: '900' }}>{order.status.replace('_', ' ')}</Text>
            </View>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 7 }}>Customer: {order.deliveryDetails?.fullName || order.customer?.email || 'Customer'}</Text>
            {!!order.deliveryDetails?.phone && <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>Phone: {order.deliveryDetails.phone}</Text>}
            {!!order.deliveryDetails?.addressLine1 && <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 3 }}>Delivery: {[order.deliveryDetails.addressLine1, order.deliveryDetails.addressLine2, order.deliveryDetails.city, order.deliveryDetails.state, order.deliveryDetails.postalCode].filter(Boolean).join(', ')}</Text>}
            {order.items?.map((item) => (
              <View key={item.id} style={{ backgroundColor: C.cream, borderRadius: 12, padding: 11, marginTop: 9 }}>
                <Text style={{ color: C.wine, fontWeight: '900', fontSize: 13 }}>{item.garmentType} × {item.quantity}</Text>
                <Text style={{ color: C.text, fontSize: 12, marginTop: 5 }}>Fabric: {item.fabric || 'Not specified'}</Text>
                <Text style={{ color: C.text, fontSize: 12, marginTop: 3 }}>Design: {item.designType || 'Not specified'} · Fit: {item.sizeLabel || 'Made to measure'}</Text>
                {!!item.measurements && <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Measurements ({item.measurementUnit || 'cm'}): {Object.entries(item.measurements).map(([key, value]) => `${key}: ${value}`).join(' · ')}</Text>}
                {!!item.notes && <Text style={{ color: C.text, fontSize: 12, lineHeight: 18, marginTop: 6 }}>Notes: {item.notes}</Text>}
              </View>
            ))}
            {order.status === 'PENDING' && Number(order.totalAmount) <= 0 && (
              <View style={{ backgroundColor: C.cream, borderRadius: 12, padding: 12, marginTop: 12 }}>
                <Text style={{ color: C.wine, fontWeight: '900', fontSize: 13 }}>Send your final quote</Text>
                <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 4 }}>Review the measurements and instructions, then enter the total amount for this order. The customer can pay after you send it.</Text>
                <TextInput value={quoteValues[order.id] || ''} onChangeText={(value) => setQuoteValues((current) => ({ ...current, [order.id]: value.replace(/[^0-9]/g, '') }))} keyboardType="number-pad" placeholder="Final quote in ₹" placeholderTextColor={C.muted} style={{ borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: '#FFFFFF', color: C.text, paddingHorizontal: 12, paddingVertical: 11, marginTop: 10 }} />
                <Pressable disabled={updatingId === order.id} onPress={() => { void submitQuote(order.id); }} style={{ backgroundColor: C.wine, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 9, opacity: updatingId === order.id ? 0.6 : 1 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{updatingId === order.id ? 'Sending quote…' : 'Send quote & accept order'}</Text>
                </Pressable>
              </View>
            )}
            {order.status === 'ACCEPTED' && !order.payments?.some((payment) => payment.status === 'SUCCESS') && (
              <Text style={{ color: '#A66A16', fontSize: 12, marginTop: 11 }}>Quote sent · Waiting for customer payment before work can begin.</Text>
            )}
            {!!transitions[order.status]?.length && (order.status !== 'ACCEPTED' || order.payments?.some((payment) => payment.status === 'SUCCESS')) && (
              <View style={{ flexDirection: 'row', gap: 9, marginTop: 14 }}>
                {transitions[order.status]?.map((action) => (
                  <Pressable key={action.status} disabled={updatingId === order.id} onPress={() => { void updateStatus(order.id, action.status); }} style={{ flex: 1, backgroundColor: action.status === 'REJECTED' ? '#FCE9E7' : C.wine, borderRadius: 11, padding: 12, alignItems: 'center', opacity: updatingId === order.id ? 0.55 : 1 }}>
                    <Text style={{ color: action.status === 'REJECTED' ? '#B42318' : '#FFFFFF', fontWeight: '800', fontSize: 12 }}>{updatingId === order.id ? 'Updating…' : action.label}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}
