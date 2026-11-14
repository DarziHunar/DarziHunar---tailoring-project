import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { ordersService, type CustomerOrder } from '../services/ordersService';
import { measurementsService, type MeasurementProfile, type MeasurementGarmentType } from '../services/measurementsService';
import { paymentsService } from '../services/paymentsService';
import RazorpayCheckout from 'react-native-razorpay';
import { C } from '../theme/colors';
import type { MainTab } from '../types/navigation';

type CategoryItem = { name: string; detail: string };
type TailorItem = { name: string; rating: number | string; distance: string };
type CreationItem = { name: string; category: string; price: string; image: string };

type FrameProps = React.PropsWithChildren<{
  title: string;
  subtitle?: string;
  onBack: () => void;
  activeTab: MainTab;
  onNavigate: (tab: MainTab) => void;
}>;

const palette = {
  ink: '#302326',
  wine: C.wine,
  muted: C.muted,
  white: '#FFFFFF',
  border: '#E8DED6',
  soft: '#F3E9DC',
};

function PageFrame({ title, subtitle, onBack, activeTab, onNavigate, children }: FrameProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 14 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={{ padding: 8, marginRight: 8 }}>
          <Text style={{ color: C.wine, fontSize: 30, lineHeight: 32 }}>‹</Text>
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.wine, fontSize: 21, fontWeight: '800' }}>{title}</Text>
          {!!subtitle && <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>}
        </View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
      <BottomNavigation activeTab={activeTab} onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

function SectionTitle({ children }: React.PropsWithChildren) {
  return <Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800', marginTop: 12, marginBottom: 12 }}>{children}</Text>;
}

function InfoCard({ title, description, onPress }: { title: string; description?: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ backgroundColor: palette.white, borderWidth: 1, borderColor: palette.border, borderRadius: 18, padding: 17, marginBottom: 11 }}
    >
      <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '700' }}>{title}</Text>
      {!!description && <Text style={{ color: palette.muted, fontSize: 13, marginTop: 6, lineHeight: 19 }}>{description}</Text>}
      {!!onPress && <Text style={{ color: C.wine, fontSize: 13, fontWeight: '700', marginTop: 9 }}>View details →</Text>}
    </Pressable>
  );
}

export function CategoryPage({
  category,
  onBack,
  onSelectGarment,
  onNavigate,
}: {
  category: CategoryItem;
  onBack: () => void;
  onSelectGarment: (garment: string) => void;
  onNavigate: (tab: MainTab) => void;
}) {
  const choices: Record<string, string[]> = {
    Women: ['Sarees', 'Salwar Suits', 'Kurtas', 'Dresses', 'Lehengas', 'Blouses'],
    Men: ['Shirts', 'Kurtas', 'Trousers', 'Blazers', 'Sherwanis'],
    Teenagers: ['Casual Wear', 'Party Wear', 'Traditional Wear', 'Custom Outfits'],
    Children: ['Frocks', 'Kids Kurtas', 'Birthday Outfits', 'School Wear'],
  };
  const garments = choices[category.name] ?? ['Custom Outfits', 'Traditional Wear', 'Casual Wear'];

  return (
    <PageFrame title={category.name} subtitle={category.detail} onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
      <Text style={{ color: palette.muted, lineHeight: 21, marginBottom: 8 }}>
        Choose the garment you would like to get stitched. You can explore designs and find a tailor in the next step.
      </Text>
      <SectionTitle>Choose a garment</SectionTitle>
      {garments.map((item) => <InfoCard key={item} title={item} description="Explore styles and tailoring options" onPress={() => onSelectGarment(item)} />)}
    </PageFrame>
  );
}

export function TailorsPage({
  tailors,
  onBack,
  onSelect,
  onNavigate,
}: {
  tailors: TailorItem[];
  onBack: () => void;
  onSelect: (tailor: TailorItem) => void;
  onNavigate: (tab: MainTab) => void;
}) {
  return (
    <PageFrame title="Tailor Masters" subtitle="Meet the hands behind the craft" onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
      <Text style={{ color: palette.muted, fontSize: 13, marginBottom: 14 }}>These are sample profiles for the current frontend preview, not live backend listings.</Text>
      {tailors.map((tailor, index) => (
        <Pressable key={`${tailor.name}-${index}`} onPress={() => onSelect(tailor)} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: palette.white, borderColor: palette.border, borderWidth: 1, borderRadius: 18, padding: 15, marginBottom: 12 }}>
          <View style={{ width: 58, height: 58, borderRadius: 17, backgroundColor: palette.soft, alignItems: 'center', justifyContent: 'center', marginRight: 13 }}>
            <Text style={{ fontSize: 27, color: C.wine }}>✂</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: palette.ink, fontSize: 16, fontWeight: '800' }}>{tailor.name}</Text>
            <Text style={{ color: C.wine, marginTop: 5 }}>★ {tailor.rating} · {tailor.distance}</Text>
            <Text style={{ color: palette.muted, fontSize: 12, marginTop: 4 }}>Sample profile</Text>
          </View>
          <Text style={{ color: C.wine, fontSize: 25 }}>›</Text>
        </Pressable>
      ))}
      {tailors.length === 0 && <EmptyState title="No tailors to show" body="Tailor profiles will appear here when they are available." />}
    </PageFrame>
  );
}

export function TailorDetailPage({
  tailor,
  onBack,
  onBrowseDesigns,
  onNavigate,
}: {
  tailor: TailorItem;
  onBack: () => void;
  onBrowseDesigns: () => void;
  onNavigate: (tab: MainTab) => void;
}) {
  return (
    <PageFrame title="Tailor Profile" subtitle="Tailor information" onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
      <View style={{ backgroundColor: palette.white, borderRadius: 22, borderWidth: 1, borderColor: palette.border, padding: 22, alignItems: 'center', marginTop: 4 }}>
        <View style={{ width: 94, height: 94, borderRadius: 28, backgroundColor: palette.soft, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 43, color: C.wine }}>✂</Text>
        </View>
        <Text style={{ color: palette.ink, fontSize: 22, fontWeight: '800', marginTop: 15 }}>{tailor.name}</Text>
        <Text style={{ color: C.wine, marginTop: 7 }}>★ {tailor.rating} · {tailor.distance}</Text>
        <Text style={{ color: palette.muted, fontSize: 12, textAlign: 'center', marginTop: 12 }}>Sample profile · Live tailor details will be connected to the backend later.</Text>
      </View>
      <SectionTitle>About this tailor</SectionTitle>
      <InfoCard title="Services" description="Custom stitching and design consultation details will appear here once live tailor profiles are connected." />
      <InfoCard title="Availability" description="Working hours and appointment availability are not connected yet." />
      <Pressable onPress={onBrowseDesigns} style={{ backgroundColor: C.wine, borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 8 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Browse designs</Text>
      </Pressable>
    </PageFrame>
  );
}

export function CreationDetailPage({
  creation,
  onBack,
  onFindTailor,
  onNavigate,
}: {
  creation: CreationItem;
  onBack: () => void;
  onFindTailor: () => void;
  onNavigate: (tab: MainTab) => void;
}) {
  return (
    <PageFrame title="Design Details" subtitle="Inspiration for your next outfit" onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
      <View style={{ backgroundColor: palette.white, borderRadius: 22, borderWidth: 1, borderColor: palette.border, overflow: 'hidden' }}>
        <Image source={{ uri: creation.image }} resizeMode="cover" style={{ width: '100%', height: 360, backgroundColor: palette.soft }} />
        <View style={{ padding: 17 }}>
          <Text style={{ color: palette.ink, fontSize: 21, fontWeight: '800' }}>{creation.name}</Text>
          <Text style={{ color: palette.muted, marginTop: 7 }}>{creation.category}</Text>
          <Text style={{ color: C.wine, fontSize: 17, fontWeight: '800', marginTop: 11 }}>{creation.price}</Text>
        </View>
      </View>
      <Text style={{ color: palette.muted, lineHeight: 21, marginTop: 16 }}>
        This is an inspiration listing. Final pricing, fabric, measurements and delivery details should be confirmed with the selected tailor.
      </Text>
      <Pressable onPress={onFindTailor} style={{ backgroundColor: C.wine, borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 20 }}>
        <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Find a tailor for this design</Text>
      </Pressable>
    </PageFrame>
  );
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={{ backgroundColor: palette.white, borderRadius: 20, borderColor: palette.border, borderWidth: 1, padding: 25, alignItems: 'center', marginTop: 20 }}>
      <Text style={{ fontSize: 36, color: C.wine }}>✳</Text>
      <Text style={{ color: palette.ink, fontSize: 18, fontWeight: '800', marginTop: 10 }}>{title}</Text>
      <Text style={{ color: palette.muted, lineHeight: 20, textAlign: 'center', marginTop: 7 }}>{body}</Text>
    </View>
  );
}

export function FavoritesPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (tab: MainTab) => void }) {
  return <PageFrame title="Favorites" subtitle="Your saved styles and tailors" onBack={onBack} activeTab="favorites" onNavigate={onNavigate}>
    <EmptyState title="No favorites yet" body="Save a design or tailor you love, and it will be available here." />
  </PageFrame>;
}

export function OrdersPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (tab: MainTab) => void }) {
  const { accessToken, user } = useAuth();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [pendingOrders, setPendingOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [retryingId, setRetryingId] = useState<number | null>(null);

  const loadOrders = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const [paid, pending] = await Promise.all([
        ordersService.list(accessToken),
        ordersService.pendingPayment(accessToken),
      ]);
      setOrders(Array.isArray(paid) ? paid : []);
      setPendingOrders(Array.isArray(pending) ? pending : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadOrders(); }, [accessToken]);

  const retryPayment = async (order: CustomerOrder) => {
    if (!accessToken) return;
    setRetryingId(order.id);
    try {
      const paymentOrder = await paymentsService.createRazorpayOrder(order.id, 'RAZORPAY', accessToken);
      const result = await RazorpayCheckout.open({
        key: paymentOrder.keyId,
        amount: paymentOrder.amountPaise,
        currency: paymentOrder.currency,
        name: 'DarziHunar',
        description: `Order #${order.id} · ${order.items?.[0]?.garmentType || 'Custom tailoring'}`,
        order_id: paymentOrder.providerOrderId,
        prefill: { email: user?.email || '', name: user?.fullName || '' },
        theme: { color: '#5B1F32' },
      });
      await paymentsService.verifyRazorpayPayment({
        razorpay_order_id: result.razorpay_order_id,
        razorpay_payment_id: result.razorpay_payment_id,
        razorpay_signature: result.razorpay_signature,
      }, accessToken);
      await loadOrders();
      Alert.alert('Payment successful', `Order #${order.id} is now visible in your orders.`);
    } catch (err) {
      Alert.alert('Payment not completed', err instanceof Error ? err.message : 'You can retry payment later from My Orders.');
    } finally {
      setRetryingId(null);
    }
  };

  return <PageFrame title="My Orders" subtitle="Track your tailoring requests" onBack={onBack} activeTab="orders" onNavigate={onNavigate}>
    {loading ? <ActivityIndicator color={C.wine} style={{ marginTop: 35 }} /> : error ? <EmptyState title="Could not load orders" body={error} /> : <>
      {pendingOrders.length > 0 && <>
        <SectionTitle>Awaiting payment</SectionTitle>
        {pendingOrders.map((order) => <View key={order.id} style={{ backgroundColor: '#FFF7E8', borderRadius: 18, borderWidth: 1, borderColor: '#E8D7B6', padding: 16, marginTop: 4, marginBottom: 10 }}>
          <Text style={{ color: C.wine, fontWeight: '900' }}>Order #{order.id} · Payment pending</Text>
          <Text style={{ color: C.text, marginTop: 7, fontWeight: '700' }}>{order.tailor?.shopName || 'Selected tailor'}</Text>
          {!!order.deliveryDetails && <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Deliver to: {order.deliveryDetails.fullName}, {order.deliveryDetails.addressLine1}, {order.deliveryDetails.city} {order.deliveryDetails.postalCode}</Text>}
          <Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{order.items?.map((item) => item.garmentType).join(', ') || 'Custom tailoring'}</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <Text style={{ color: C.wine, fontWeight: '900' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
            <Pressable disabled={retryingId !== null} onPress={() => { void retryPayment(order); }} style={{ backgroundColor: C.wine, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, opacity: retryingId !== null ? 0.6 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{retryingId === order.id ? 'Opening…' : 'Retry payment'}</Text></Pressable>
          </View>
        </View>)}
      </>}
      <SectionTitle>Paid orders</SectionTitle>
      {orders.length === 0 ? <EmptyState title="No paid orders yet" body={pendingOrders.length ? 'Complete one of your pending payments above to submit it to your tailor.' : 'Your paid tailoring orders will appear here.'} /> : orders.map((order) => (
        <View key={order.id} style={{ backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: C.wine, fontSize: 16, fontWeight: '900' }}>Order #{order.id}</Text>
            <Text style={{ color: C.gold, fontWeight: '800', fontSize: 12 }}>{order.status.replace(/_/g, ' ')}</Text>
          </View>
          <Text style={{ color: C.text, marginTop: 8, fontWeight: '700' }}>{order.tailor?.shopName || 'Selected tailor'}</Text>
          {!!order.deliveryDetails && <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Deliver to: {order.deliveryDetails.fullName}, {order.deliveryDetails.addressLine1}, {order.deliveryDetails.city} {order.deliveryDetails.postalCode}</Text>}
          {(order.items || []).map((item) => <View key={item.id} style={{ marginTop: 8 }}>
            <Text style={{ color: C.text }}>{item.garmentType}{item.fabric ? ` · ${item.fabric}` : ''}{item.sizeLabel ? ` · ${item.sizeLabel}` : ''}</Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{Object.keys(item.measurements || {}).length} measurements · {item.measurementUnit || 'cm'}</Text>
          </View>)}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 13, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border }}>
            <Text style={{ color: C.muted, fontSize: 12 }}>{new Date(order.createdAt).toLocaleDateString()}</Text>
            <Text style={{ color: C.wine, fontWeight: '900' }}>₹{Number(order.totalAmount).toLocaleString('en-IN')}</Text>
          </View>
        </View>
      ))}
    </>}
  </PageFrame>;
}

export function ExplorePage({
  categories,
  tailors,
  onBack,
  onOpenCategory,
  onViewAllTailors,
  onSelectTailor,
  onNavigate,
}: {
  categories: CategoryItem[];
  tailors: TailorItem[];
  onBack: () => void;
  onOpenCategory: (category: CategoryItem) => void;
  onViewAllTailors: () => void;
  onSelectTailor: (tailor: TailorItem) => void;
  onNavigate: (tab: MainTab) => void;
}) {
  return <PageFrame title="Explore" subtitle="Discover styles and tailoring" onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
    <SectionTitle>Browse by category</SectionTitle>
    {categories.map((category) => <InfoCard key={category.name} title={category.name} description={category.detail} onPress={() => onOpenCategory(category)} />)}
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 }}>
      <Text style={{ color: palette.ink, fontSize: 19, fontWeight: '800' }}>Tailor Masters</Text>
      <Pressable onPress={onViewAllTailors}><Text style={{ color: C.wine, fontWeight: '700' }}>View all →</Text></Pressable>
    </View>
    {tailors.slice(0, 3).map((tailor, index) => <InfoCard key={`${tailor.name}-${index}`} title={tailor.name} description={`★ ${tailor.rating} · ${tailor.distance}`} onPress={() => onSelectTailor(tailor)} />)}
  </PageFrame>;
}

const measurementDefinitions: Record<MeasurementGarmentType, Array<{ key: string; label: string }>> = {
  SHIRT: [{ key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'sleeveLength', label: 'Sleeve length' }, { key: 'shirtLength', label: 'Shirt length' }, { key: 'neck', label: 'Neck' }],
  TROUSERS: [{ key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }, { key: 'inseam', label: 'Inseam' }, { key: 'outseam', label: 'Outseam' }, { key: 'thigh', label: 'Thigh' }, { key: 'ankle', label: 'Ankle' }],
  KURTA: [{ key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'sleeveLength', label: 'Sleeve length' }, { key: 'kurtaLength', label: 'Kurta length' }],
  SHERWANI: [{ key: 'chest', label: 'Chest' }, { key: 'waist', label: 'Waist' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'sleeveLength', label: 'Sleeve length' }, { key: 'sherwaniLength', label: 'Sherwani length' }],
  DRESS: [{ key: 'bust', label: 'Bust' }, { key: 'waist', label: 'Waist' }, { key: 'hip', label: 'Hip' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'sleeveLength', label: 'Sleeve length' }, { key: 'dressLength', label: 'Dress length' }],
  BLOUSE: [{ key: 'bust', label: 'Bust' }, { key: 'underBust', label: 'Under bust' }, { key: 'waist', label: 'Waist' }, { key: 'shoulder', label: 'Shoulder' }, { key: 'blouseLength', label: 'Blouse length' }, { key: 'sleeveLength', label: 'Sleeve length' }],
};
const measurementGarments: MeasurementGarmentType[] = ['SHIRT', 'TROUSERS', 'KURTA', 'SHERWANI', 'DRESS', 'BLOUSE'];

export function MeasurementsPage({ onBack, onNavigate }: { onBack: () => void; onNavigate: (tab: MainTab) => void }) {
  const { accessToken } = useAuth();
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [garmentType, setGarmentType] = useState<MeasurementGarmentType>('SHIRT');
  const [values, setValues] = useState<Record<string, string>>({});

  const loadProfiles = async () => {
    if (!accessToken) return;
    setLoading(true);
    setError('');
    try {
      const result = await measurementsService.list(accessToken);
      setProfiles(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load saved measurements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadProfiles(); }, [accessToken]);

  const openNew = () => {
    setEditingId(null);
    setName('');
    setGarmentType('SHIRT');
    setValues({});
    setFormOpen(true);
  };

  const openEdit = (profile: MeasurementProfile) => {
    setEditingId(profile.id);
    setName(profile.name);
    setGarmentType(profile.garmentType);
    setValues(Object.fromEntries(Object.entries(profile.measurements).map(([key, value]) => [key, String(value)])));
    setFormOpen(true);
  };

  const saveProfile = async () => {
    if (!accessToken) return;
    if (!name.trim()) { Alert.alert('Name required', 'Give this measurement profile a name, such as My shirt measurements.'); return; }
    const fields = measurementDefinitions[garmentType];
    const numbers: Record<string, number> = {};
    for (const field of fields) {
      const value = Number(values[field.key]);
      if (!values[field.key]?.trim() || !Number.isFinite(value) || value <= 0 || value > 500) {
        Alert.alert('Measurements incomplete', `Enter a valid ${field.label.toLowerCase()} (greater than 0 and at most 500 cm).`);
        return;
      }
      numbers[field.key] = value;
    }
    setSaving(true);
    try {
      if (editingId === null) await measurementsService.create({ name: name.trim(), garmentType, measurements: numbers, unit: 'cm' }, accessToken);
      else await measurementsService.update(editingId, { name: name.trim(), garmentType, measurements: numbers, unit: 'cm' }, accessToken);
      setFormOpen(false);
      await loadProfiles();
      Alert.alert('Saved', 'Your measurement profile has been saved. You can select it when preparing a future order.');
    } catch (err) {
      Alert.alert('Could not save measurements', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = (profile: MeasurementProfile) => {
    if (!accessToken) return;
    Alert.alert('Delete measurement profile?', `Delete “${profile.name}”? Existing order measurement snapshots will not be changed.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await measurementsService.remove(profile.id, accessToken); await loadProfiles(); }
        catch (err) { Alert.alert('Could not delete profile', err instanceof Error ? err.message : 'Please try again.'); }
      } },
    ]);
  };

  return <PageFrame title="Measurements" subtitle="Save reusable fit profiles" onBack={onBack} activeTab="measurements" onNavigate={onNavigate}>
    <Text style={{ color: palette.muted, lineHeight: 21, marginTop: 4 }}>Save your own measurements by garment type. You can load a matching profile when placing an order. Measurements attached to an already confirmed order remain a separate, locked snapshot.</Text>
    <Pressable onPress={openNew} style={{ backgroundColor: C.wine, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 16 }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>+ Add measurement profile</Text></Pressable>

    {formOpen && <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15, marginTop: 14 }}>
      <Text style={{ color: C.wine, fontSize: 17, fontWeight: '900' }}>{editingId === null ? 'New measurement profile' : 'Edit measurement profile'}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>PROFILE NAME</Text>
      <TextInput value={name} onChangeText={setName} placeholder="e.g. My regular shirt fit" placeholderTextColor={C.muted} style={{ backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, borderRadius: 11, padding: 12, color: C.text, marginTop: 6 }} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 14 }}>GARMENT TYPE</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>{measurementGarments.map((item) => <Pressable key={item} onPress={() => { setGarmentType(item); setValues({}); }} style={{ borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: garmentType === item ? C.wine : palette.soft }}><Text style={{ color: garmentType === item ? '#FFFFFF' : C.wine, fontWeight: '800', fontSize: 11 }}>{item.replace('_', ' ')}</Text></Pressable>)}</View>
      {measurementDefinitions[garmentType].map((field) => <View key={field.key} style={{ marginTop: 10 }}><Text style={{ color: C.muted, fontSize: 11 }}>{field.label.toUpperCase()} (CM)</Text><TextInput value={values[field.key] || ''} onChangeText={(value) => setValues((current) => ({ ...current, [field.key]: value.replace(/[^0-9.]/g, '') }))} keyboardType="decimal-pad" placeholder={`Enter ${field.label.toLowerCase()}`} placeholderTextColor={C.muted} style={{ backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, borderRadius: 11, padding: 12, color: C.text, marginTop: 5 }} /></View>)}
      <Pressable disabled={saving} onPress={() => { void saveProfile(); }} style={{ backgroundColor: C.wine, borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16, opacity: saving ? 0.6 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{saving ? 'Saving…' : 'Save profile'}</Text></Pressable>
      <Pressable disabled={saving} onPress={() => setFormOpen(false)} style={{ padding: 12, alignItems: 'center' }}><Text style={{ color: C.wine, fontWeight: '800' }}>Cancel</Text></Pressable>
    </View>}

    <SectionTitle>Saved measurement profiles</SectionTitle>
    {loading ? <ActivityIndicator color={C.wine} style={{ marginTop: 25 }} /> : error ? <EmptyState title="Could not load measurements" body={error} /> : profiles.length === 0 ? <EmptyState title="No saved measurements" body="Add a profile above to reuse your measurements on future orders." /> : profiles.map((profile) => <View key={profile.id} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 11 }}>
      <Text style={{ color: C.wine, fontSize: 16, fontWeight: '900' }}>{profile.name}</Text>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{profile.garmentType} · {profile.unit}</Text>
      <Text style={{ color: C.text, lineHeight: 20, fontSize: 12, marginTop: 9 }}>{Object.entries(profile.measurements).map(([key, value]) => `${key.replace(/([A-Z])/g, ' $1')}: ${value} ${profile.unit}`).join('  ·  ')}</Text>
      <View style={{ flexDirection: 'row', gap: 18, marginTop: 12 }}><Pressable onPress={() => openEdit(profile)}><Text style={{ color: C.wine, fontWeight: '900' }}>Edit</Text></Pressable><Pressable onPress={() => deleteProfile(profile)}><Text style={{ color: '#B42318', fontWeight: '900' }}>Delete</Text></Pressable></View>
    </View>)}
  </PageFrame>;
}

export function SearchPage({
  initialQuery,
  categories,
  tailors,
  onBack,
  onOpenCategory,
  onSelectTailor,
  onNavigate,
}: {
  initialQuery: string;
  categories: CategoryItem[];
  tailors: TailorItem[];
  onBack: () => void;
  onOpenCategory: (category: CategoryItem) => void;
  onSelectTailor: (tailor: TailorItem) => void;
  onNavigate: (tab: MainTab) => void;
}) {
  const [query, setQuery] = useState(initialQuery);
  const normalized = query.trim().toLowerCase();
  const matchedCategories = useMemo(() => categories.filter((item) => `${item.name} ${item.detail}`.toLowerCase().includes(normalized)), [categories, normalized]);
  const matchedTailors = useMemo(() => tailors.filter((item) => item.name.toLowerCase().includes(normalized)), [tailors, normalized]);

  return <PageFrame title="Search" subtitle="Find styles, garments and tailors" onBack={onBack} activeTab="explore" onNavigate={onNavigate}>
    <TextInput value={query} onChangeText={setQuery} placeholder="Search outfits, styles, tailors..." placeholderTextColor={C.muted} autoFocus returnKeyType="search" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 14, color: palette.ink, fontSize: 15 }} />
    {!normalized ? <EmptyState title="Start exploring" body="Type a garment, category or tailor name to see matching sample results." /> : <>
      <SectionTitle>Categories</SectionTitle>
      {matchedCategories.map((item) => <InfoCard key={item.name} title={item.name} description={item.detail} onPress={() => onOpenCategory(item)} />)}
      <SectionTitle>Tailors</SectionTitle>
      {matchedTailors.map((item, index) => <InfoCard key={`${item.name}-${index}`} title={item.name} description={`★ ${item.rating} · ${item.distance}`} onPress={() => onSelectTailor(item)} />)}
      {matchedCategories.length === 0 && matchedTailors.length === 0 && <EmptyState title="No matches found" body="Try a different search term." />}
    </>}
  </PageFrame>;
}

export function LocationPage({ onBack, onSave, onNavigate }: { onBack: () => void; onSave: (location: string) => void; onNavigate: (tab: MainTab) => void }) {
  const [location, setLocation] = useState('');
  return <PageFrame title="Choose Location" subtitle="Enter your area or PIN code" onBack={onBack} activeTab="home" onNavigate={onNavigate}>
    <Text style={{ color: palette.muted, lineHeight: 21, marginBottom: 15 }}>Add a location to personalize nearby tailor discovery. Location is stored only in this app session for now.</Text>
    <TextInput value={location} onChangeText={setLocation} placeholder="City, area or PIN code" placeholderTextColor={C.muted} autoCapitalize="words" returnKeyType="done" style={{ backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: palette.border, borderRadius: 15, paddingHorizontal: 16, paddingVertical: 14, color: palette.ink, fontSize: 15 }} />
    <Pressable disabled={!location.trim()} onPress={() => onSave(location.trim())} style={{ backgroundColor: location.trim() ? C.wine : '#B9A8AA', borderRadius: 15, padding: 16, alignItems: 'center', marginTop: 16 }}>
      <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>Save location</Text>
    </Pressable>
  </PageFrame>;
}
