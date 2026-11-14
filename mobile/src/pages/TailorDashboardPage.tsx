import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import { tailorService } from '../services/tailorService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';

type OrderSummary = {
  id: number;
  status: string;
  totalAmount: number;
  createdAt?: string;
  customer?: { email?: string };
  items?: Array<{ garmentType: string; quantity: number }>;
};

type Props = {
  onProfile: () => void;
  onBusinessProfile: () => void;
  onOrders: () => void;
  onSignOut: () => void;
};

const statusColor = (status: string) => status === 'PENDING' ? '#A66A16' : status === 'COMPLETED' ? '#287A4B' : C.wine;

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <View style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, minWidth: '28%' }}>
      <Text style={{ color: C.muted, fontSize: 11 }}>{label}</Text>
      <Text style={{ color: C.wine, fontSize: 24, fontWeight: '800', marginTop: 5 }}>{value}</Text>
    </View>
  );
}

export default function TailorDashboardPage({ onProfile, onBusinessProfile, onOrders, onSignOut }: Props) {
  const { user, accessToken } = useAuth();
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setError('');
    try {
      const [tailorResult, orderResult] = await Promise.all([
        tailorService.getMine(accessToken),
        apiRequest<OrderSummary[]>('/orders', { token: accessToken }),
      ]);
      setProfile(tailorResult);
      setOrders(Array.isArray(orderResult) ? orderResult : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Could not load the tailor dashboard.';
      if (message.toLowerCase().includes('tailor profile not found') || message.toLowerCase().includes('not found')) {
        setProfile(null);
        try {
          const orderResult = await apiRequest<OrderSummary[]>('/orders', { token: accessToken });
          setOrders(Array.isArray(orderResult) ? orderResult : []);
        } catch { /* keep the onboarding state visible */ }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  const pending = orders.filter((order) => order.status === 'PENDING').length;
  const active = orders.filter((order) => ['ACCEPTED', 'IN_PROGRESS', 'READY'].includes(order.status)).length;
  const completed = orders.filter((order) => order.status === 'COMPLETED').length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 36 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); void load(); }} />}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: C.wine, fontSize: 25, fontWeight: '900' }}>DarziHunar.</Text>
            <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 1.3, marginTop: 3 }}>TAILOR WORKSPACE</Text>
          </View>
          <Pressable onPress={onProfile} style={{ width: 46, height: 46, backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: C.wine, fontSize: 23 }}>♙</Text>
          </Pressable>
        </View>

        <View style={{ backgroundColor: C.wine, borderRadius: 22, padding: 21, marginBottom: 20 }}>
          <Text style={{ color: C.cream, fontSize: 10, letterSpacing: 1.6 }}>WELCOME BACK</Text>
          <Text style={{ color: '#FFF8EF', fontSize: 25, fontWeight: '900', marginTop: 8 }}>{user?.fullName || profile?.fullName || 'Tailor'}</Text>
          <Text style={{ color: '#F0E2D9', fontSize: 13, lineHeight: 19, marginTop: 6 }}>
            Manage your tailoring business, respond to customer orders and keep your portfolio up to date.
          </Text>
          <Pressable onPress={onBusinessProfile} style={{ alignSelf: 'flex-start', borderColor: C.gold, borderWidth: 1, borderRadius: 22, paddingHorizontal: 14, paddingVertical: 9, marginTop: 15 }}>
            <Text style={{ color: '#FFF8EF', fontWeight: '700', fontSize: 12 }}>{profile ? 'Manage business profile' : 'Set up business profile'} →</Text>
          </Pressable>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 35, alignItems: 'center' }}><ActivityIndicator color={C.wine} size="large" /><Text style={{ color: C.muted, marginTop: 10 }}>Loading your workspace...</Text></View>
        ) : error ? (
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 17 }}>
            <Text style={{ color: '#B42318', fontWeight: '700' }}>Could not load dashboard</Text>
            <Text style={{ color: C.muted, marginTop: 7 }}>{error}</Text>
            <Pressable onPress={() => { setLoading(true); void load(); }} style={{ marginTop: 12 }}><Text style={{ color: C.wine, fontWeight: '800' }}>Try again</Text></Pressable>
          </View>
        ) : !profile ? (
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 18, padding: 19 }}>
            <Text style={{ color: C.wine, fontSize: 18, fontWeight: '800' }}>Complete your tailor profile</Text>
            <Text style={{ color: C.muted, lineHeight: 20, marginTop: 8 }}>
              Your account is registered, but a business profile has not been created yet. Add your shop name, services and starting price to become discoverable to customers.
            </Text>
            <Pressable onPress={onBusinessProfile} style={{ backgroundColor: C.wine, borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 16 }}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Create Business Profile</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 17, marginBottom: 17 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: C.wine, fontWeight: '800', fontSize: 17 }}>{profile.shopName}</Text>
                <View style={{ backgroundColor: profile.acceptingOrders ? '#E4F3E9' : '#FCE9E7', borderRadius: 18, paddingHorizontal: 10, paddingVertical: 5 }}>
                  <Text style={{ color: profile.acceptingOrders ? '#287A4B' : '#B42318', fontSize: 10, fontWeight: '800' }}>{profile.acceptingOrders ? 'ACCEPTING ORDERS' : 'NOT ACCEPTING'}</Text>
                </View>
              </View>
              {!!profile.specialization && <Text style={{ color: C.muted, marginTop: 6 }}>{profile.specialization}</Text>}
              <Text style={{ color: C.muted, marginTop: 8, fontSize: 12 }}>★ {Number(profile.rating || 0).toFixed(1)} · {profile.verified ? 'Verified tailor' : 'Verification pending'}</Text>
              <Text style={{ color: C.text, fontWeight: '700', marginTop: 7 }}>Starting price: ₹{Number(profile.startingPrice || 0).toLocaleString('en-IN')}</Text>
              <Pressable onPress={onBusinessProfile} style={{ marginTop: 12 }}><Text style={{ color: C.wine, fontWeight: '800' }}>Edit business details →</Text></Pressable>
            </View>

            <Text style={{ color: C.text, fontSize: 19, fontWeight: '900', marginBottom: 12 }}>Order overview</Text>
            <View style={{ flexDirection: 'row', gap: 9, marginBottom: 18 }}>
              <StatCard label="Pending" value={pending} />
              <StatCard label="Active" value={active} />
              <StatCard label="Completed" value={completed} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
              <Text style={{ color: C.text, fontSize: 19, fontWeight: '900' }}>Recent orders</Text>
              <Pressable onPress={onOrders}><Text style={{ color: C.wine, fontWeight: '800' }}>View all →</Text></Pressable>
            </View>
            {orders.length === 0 ? (
              <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 17 }}><Text style={{ color: C.muted }}>No customer orders yet. New requests will appear here.</Text></View>
            ) : orders.slice(0, 3).map((order) => (
              <Pressable key={order.id} onPress={onOrders} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 15, padding: 15, marginBottom: 9 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: C.text, fontWeight: '800' }}>Order #{order.id}</Text>
                  <Text style={{ color: statusColor(order.status), fontSize: 11, fontWeight: '800' }}>{order.status.replace('_', ' ')}</Text>
                </View>
                <Text style={{ color: C.muted, marginTop: 5, fontSize: 12 }}>{order.items?.map((item) => `${item.garmentType} × ${item.quantity}`).join(', ') || 'Custom tailoring order'}</Text>
                <Text style={{ color: C.wine, fontWeight: '800', marginTop: 7 }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
              </Pressable>
            ))}
          </>
        )}

        <Pressable onPress={onSignOut} style={{ alignItems: 'center', padding: 15, marginTop: 18 }}>
          <Text style={{ color: C.muted, fontWeight: '700' }}>Log out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
