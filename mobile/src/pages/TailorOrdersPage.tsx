import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { C } from '../theme/colors';

type OrderRecord = {
  id: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
  totalAmount: number;
  createdAt: string;
  items?: Array<{ id: number; garmentType: string; quantity: number; notes?: string | null }>;
  customer?: { id: number; email: string };
};

type Props = { onBack: () => void };
const transitions: Partial<Record<OrderRecord['status'], Array<{ label: string; status: OrderRecord['status'] }>>> = {
  PENDING: [{ label: 'Accept', status: 'ACCEPTED' }, { label: 'Reject', status: 'REJECTED' }],
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
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 7 }}>Customer: {order.customer?.email || 'Customer'}</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{order.items?.map((item) => `${item.garmentType} × ${item.quantity}`).join(', ') || 'Custom tailoring'}</Text>
            {order.items?.some((item) => item.notes) && <Text style={{ color: C.text, fontSize: 12, lineHeight: 18, marginTop: 7 }}>Notes: {order.items.filter((item) => item.notes).map((item) => item.notes).join(' · ')}</Text>}
            <Text style={{ color: C.wine, fontSize: 16, fontWeight: '900', marginTop: 9 }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
            {!!transitions[order.status]?.length && (
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
