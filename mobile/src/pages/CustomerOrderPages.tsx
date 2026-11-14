import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import NearbyTailorsMap from '../components/NearbyTailorsMap';
import Garment360Viewer from '../components/Garment360Viewer';
import { getCurrentCoordinates, type Coordinates } from '../services/locationService';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { mediaService } from '../services/mediaService';
import { ordersService } from '../services/ordersService';
import { paymentsService } from '../services/paymentsService';
import { measurementsService, type MeasurementProfile } from '../services/measurementsService';
import RazorpayCheckout from 'react-native-razorpay';
import { stylesService, type Audience, type GarmentStyle } from '../services/stylesService';
import { tailorService, type TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';
import type { MainTab } from '../types/navigation';

type PageProps = { onBack: () => void; onNavigate: (tab: MainTab) => void };

function PageFrame({ title, subtitle, onBack, onNavigate, children }: React.PropsWithChildren<PageProps & { title: string; subtitle?: string }>) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 7, paddingBottom: 13 }}>
        <Pressable onPress={onBack} accessibilityRole="button" style={{ padding: 8, marginRight: 6 }}><Text style={{ color: C.wine, fontSize: 30 }}>‹</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={{ color: C.wine, fontSize: 21, fontWeight: '900' }}>{title}</Text>{!!subtitle && <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>}</View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 30 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView>
      <BottomNavigation activeTab="explore" onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

function Card({ children }: React.PropsWithChildren) {
  return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, marginTop: 11 }}>{children}</View>;
}

function ActionButton({ title, onPress, disabled = false }: { title: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable onPress={onPress} disabled={disabled} style={{ backgroundColor: C.wine, borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 16, opacity: disabled ? 0.5 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{title}</Text></Pressable>;
}

const audienceLabel: Record<Audience, string> = {
  WOMEN: 'Women', MEN: 'Men', TEENAGERS: 'Teenagers', CHILDREN: 'Children',
};

export function CustomerStylesPage({ audience, onBack, onNavigate, onSelect }: PageProps & { audience: Audience; onSelect: (style: GarmentStyle) => void }) {
  const [styles, setStyles] = useState<GarmentStyle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    stylesService.list(audience).then((items) => { if (active) setStyles(items); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Unable to load styles.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [audience]);
  return <PageFrame title={`${audienceLabel[audience]} styles`} subtitle={`Garments designed for ${audienceLabel[audience].toLowerCase()}`} onBack={onBack} onNavigate={onNavigate}>
    <Text style={{ color: C.muted, lineHeight: 20, marginTop: 4 }}>Only styles for {audienceLabel[audience].toLowerCase()} are shown in this section.</Text>
    {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 35 }} /> : error ? <Card><Text style={{ color: '#B42318' }}>{error}</Text></Card> : styles.length === 0 ? <Card><Text style={{ color: C.wine, fontWeight: '800' }}>No styles available</Text><Text style={{ color: C.muted, marginTop: 5 }}>Please check again later.</Text></Card> : styles.map((style) => <Pressable key={style.id} onPress={() => onSelect(style)} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 17, marginTop: 12, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 48, height: 48, borderRadius: 15, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: C.wine, fontSize: 23 }}>✂</Text></View>
      <View style={{ flex: 1 }}><Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>{style.name}</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>{style.description}</Text></View>
      <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
    </Pressable>)}
  </PageFrame>;
}

export function CustomerTailorsPage({ audience, style, onBack, onNavigate, onSelect }: PageProps & { audience: Audience; style: GarmentStyle; onSelect: (tailor: TailorProfile) => void }) {
  const [tailors, setTailors] = useState<TailorProfile[]>([]);
  const [center, setCenter] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const supportsSelectedStyle = (tailor: TailorProfile) => {
    const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/s$/, '');
    const categories = (tailor.categories || []).map(normalize);
    const requested = [audience, style.name, style.garmentType].map(normalize);
    return categories.length > 0 && categories.some((category) => requested.some((value) => category === value || category.includes(value) || value.includes(category)));
  };

  const loadNearby = async () => {
    setLoading(true);
    setError('');
    try {
      const coordinates = await getCurrentCoordinates();
      setCenter(coordinates);
      const response = await tailorService.findNearby(coordinates.latitude, coordinates.longitude, 4000);
      setTailors(response.data.filter((tailor) => tailor.acceptingOrders && supportsSelectedStyle(tailor)));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to find nearby tailors.');
      setTailors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadNearby(); }, [audience, style.id]);

  return <PageFrame title="Choose a tailor" subtitle={`${style.name} · ${audienceLabel[audience]}`} onBack={onBack} onNavigate={onNavigate}>
    <Card>
      <Text style={{ color: C.wine, fontWeight: '900' }}>Your selected category</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 10 }}>
        {(['WOMEN', 'MEN', 'TEENAGERS', 'CHILDREN'] as Audience[]).map((item) => <View key={item} style={{ borderRadius: 20, paddingHorizontal: 11, paddingVertical: 7, backgroundColor: item === audience ? C.wine : C.cream }}><Text style={{ color: item === audience ? '#FFFFFF' : C.wine, fontSize: 11, fontWeight: '800' }}>{audienceLabel[item]}</Text></View>)}
      </View>
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 9 }}>Showing accepting tailors within 4 km who list a matching category or service.</Text>
      <Pressable onPress={() => { void loadNearby(); }} style={{ alignSelf: 'flex-start', marginTop: 11, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, backgroundColor: C.cream }}><Text style={{ color: C.wine, fontWeight: '800', fontSize: 12 }}>Refresh my location</Text></Pressable>
    </Card>
    {center && <NearbyTailorsMap center={center} tailors={tailors} />}
    {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 35 }} /> : error ? <Card><Text style={{ color: '#B42318' }}>{error}</Text><ActionButton title="Try again" onPress={() => { void loadNearby(); }} /></Card> : tailors.length === 0 ? <Card><Text style={{ color: C.wine, fontWeight: '800' }}>No matching tailors within 4 km</Text><Text style={{ color: C.muted, marginTop: 5 }}>Try again later, or choose another style. Tailors must save their shop location and add this service in their business profile to appear here.</Text></Card> : tailors.map((tailor) => <Pressable key={tailor.id} onPress={() => onSelect(tailor)} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginTop: 11, flexDirection: 'row', alignItems: 'center' }}>
      <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ color: C.wine, fontSize: 25 }}>✂</Text></View>
      <View style={{ flex: 1 }}><Text style={{ color: C.text, fontWeight: '900', fontSize: 15 }}>{tailor.shopName}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>{tailor.specialization || (tailor.categories || []).join(', ') || 'Custom tailoring'}</Text><Text style={{ color: C.wine, fontWeight: '800', fontSize: 12, marginTop: 5 }}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.distanceMeters != null ? `${(tailor.distanceMeters / 1000).toFixed(1)} km away` : 'Nearby'} · From ₹{Number(tailor.startingPrice || 0).toLocaleString('en-IN')}</Text></View>
      <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
    </Pressable>)}
  </PageFrame>;
}

export function CustomerTailorDetailPage({ audience, style, tailor, onBack, onNavigate, onContinue }: PageProps & { audience: Audience; style: GarmentStyle; tailor: TailorProfile; onContinue: () => void }) {
  return <PageFrame title="Tailor profile" subtitle="Review the tailor before continuing" onBack={onBack} onNavigate={onNavigate}>
    <Card>
      <View style={{ alignItems: 'center' }}><View style={{ width: 78, height: 78, borderRadius: 24, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 36, color: C.wine }}>✂</Text></View><Text style={{ color: C.wine, fontWeight: '900', fontSize: 21, marginTop: 12 }}>{tailor.shopName}</Text><Text style={{ color: C.muted, marginTop: 5 }}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.verified ? 'Verified tailor' : 'New tailor'}</Text></View>
      <Text style={{ color: C.text, fontWeight: '900', marginTop: 20 }}>Categories this tailor supports</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 }}>
        {(tailor.categories || []).map((category) => <View key={category} style={{ backgroundColor: C.cream, borderRadius: 18, paddingHorizontal: 11, paddingVertical: 7 }}><Text style={{ color: C.wine, fontSize: 11, fontWeight: '800' }}>{category}</Text></View>)}
        {!(tailor.categories || []).length && <Text style={{ color: C.muted }}>Custom tailoring</Text>}
      </View>
      {!!tailor.specialization && <Text style={{ color: C.muted, marginTop: 9 }}>{tailor.specialization}</Text>}
      <Text style={{ color: C.text, fontWeight: '900', marginTop: 15 }}>Order category</Text><Text style={{ color: C.wine, fontWeight: '800', marginTop: 5 }}>{audienceLabel[audience]} · {style.name}</Text>
      <Text style={{ color: C.text, fontWeight: '900', marginTop: 15 }}>Starting price</Text><Text style={{ color: C.wine, fontWeight: '900', fontSize: 20, marginTop: 5 }}>₹{Number(tailor.startingPrice || 0).toLocaleString('en-IN')}</Text>
      {!!tailor.bio && <Text style={{ color: C.muted, lineHeight: 20, marginTop: 14 }}>{tailor.bio}</Text>}
    </Card>
    <ActionButton title="Continue to fabric & measurements" onPress={onContinue} />
  </PageFrame>;
}

export function CustomerOrderDetailsPage({ audience, style, tailor, onBack, onNavigate, onOrderPlaced }: PageProps & { audience: Audience; style: GarmentStyle; tailor: TailorProfile; onOrderPlaced: () => void }) {
  const { accessToken, user } = useAuth();
  const [delivery, setDelivery] = useState({
    fullName: user?.fullName || '', phone: user?.phoneNumber || '',
    addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'India',
  });
  const updateDelivery = (key: keyof typeof delivery, value: string) => setDelivery((current) => ({ ...current, [key]: value }));
  const [fabric, setFabric] = useState('');
  const [sizeLabel, setSizeLabel] = useState('Made to measure');
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [method, setMethod] = useState<'MANUAL' | 'CAMERA_ASSISTED'>('MANUAL');
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);
  const [savedMeasurementProfiles, setSavedMeasurementProfiles] = useState<MeasurementProfile[]>([]);
  const measurementRecord = useMemo(() => Object.fromEntries(style.measurementFields.map((field) => [field.key, Number(measurementValues[field.key])])), [measurementValues, style.measurementFields]);
  const matchingMeasurementProfiles = savedMeasurementProfiles.filter((profile) => profile.garmentType === style.garmentType);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    measurementsService.list(accessToken)
      .then((profiles) => { if (active) setSavedMeasurementProfiles(profiles); })
      .catch(() => { if (active) setSavedMeasurementProfiles([]); });
    return () => { active = false; };
  }, [accessToken]);

  const applyMeasurementProfile = (profile: MeasurementProfile) => {
    const missing = style.measurementFields.filter((field) => profile.measurements[field.key] === undefined);
    if (missing.length) {
      Alert.alert('Profile does not match this style', `This saved profile is missing: ${missing.map((field) => field.label).join(', ')}. You can fill those fields manually.`);
    }
    setMeasurementValues((current) => ({
      ...current,
      ...Object.fromEntries(style.measurementFields
        .filter((field) => profile.measurements[field.key] !== undefined)
        .map((field) => [field.key, String(profile.measurements[field.key])])),
    }));
    setUnit('cm');
  };

  const captureReferencePhoto = async () => {
    if (!accessToken) return;
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Allow camera access to take a reference photo for your tailor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const key = await mediaService.uploadOrderReference(result.assets[0], accessToken);
      setReferenceImages((current) => [...current, key]);
      setMethod('CAMERA_ASSISTED');
      Alert.alert('Reference photo saved', 'The photo will be attached to your order. Please still enter and verify your body measurements manually.');
    } catch (error) {
      Alert.alert('Photo upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitOrder = async () => {
    if (!accessToken) return;
    if (!delivery.fullName.trim() || !/^\+?[0-9][0-9\s-]{7,15}$/.test(delivery.phone.trim()) || !delivery.addressLine1.trim() || !delivery.city.trim() || !delivery.state.trim() || !/^[A-Za-z0-9 -]{3,12}$/.test(delivery.postalCode.trim())) {
      Alert.alert('Delivery details required', 'Enter a valid name, phone number, street address, city, state and PIN/postal code.');
      return;
    }
    if (!fabric.trim()) { Alert.alert('Fabric required', 'Enter the fabric you want to use.'); return; }
    if (!sizeLabel.trim()) { Alert.alert('Size required', 'Enter a size or choose Made to measure.'); return; }
    const missing = style.measurementFields.filter((field) => !measurementValues[field.key]?.trim() || !Number.isFinite(Number(measurementValues[field.key])) || Number(measurementValues[field.key]) <= 0);
    if (missing.length) { Alert.alert('Measurements incomplete', `Please enter valid ${missing.map((field) => field.label).join(', ')} measurements.`); return; }
    if (method === 'CAMERA_ASSISTED' && referenceImages.length === 0) {
      Alert.alert('Add a camera reference', 'Capture a reference photo or switch to manual measurement entry before continuing.');
      return;
    }
    const measurementSummary = style.measurementFields.map((field) => `${field.label}: ${measurementValues[field.key]} ${unit}`).join('\n');
    const summary = `${style.name}\nTailor: ${tailor.shopName}\nDeliver to: ${delivery.fullName}, ${delivery.phone}\n${delivery.addressLine1}${delivery.addressLine2 ? `, ${delivery.addressLine2}` : ''}, ${delivery.city}, ${delivery.state} ${delivery.postalCode}, ${delivery.country}\nFabric: ${fabric}\nSize: ${sizeLabel}\n\nMeasurements\n${measurementSummary}\n\nEstimated starting price: ₹${Number(tailor.startingPrice || 0).toLocaleString('en-IN')}`;
    Alert.alert('Confirm your order', `Please review your details before placing this order.\n\n${summary}\n\nAfter confirmation, these measurements are saved as an order snapshot and cannot be edited. You will proceed to secure Razorpay checkout.`, [
      { text: 'Review again', style: 'cancel' },
      { text: 'Confirm & pay', onPress: () => { void createOrder(); } },
    ]);
  };

  const payForOrder = async (orderId: number) => {
    if (!accessToken) return;
    const paymentOrder = await paymentsService.createRazorpayOrder(orderId, 'RAZORPAY', accessToken);
    const checkoutResult = await RazorpayCheckout.open({
      key: paymentOrder.keyId,
      amount: paymentOrder.amountPaise,
      currency: paymentOrder.currency,
      name: 'DarziHunar',
      description: `${style.name} stitching by ${tailor.shopName}`,
      order_id: paymentOrder.providerOrderId,
      prefill: {
        email: user?.email || '',
        contact: user?.phoneNumber || '',
        name: user?.fullName || '',
      },
      theme: { color: '#5B1F32' },
    });

    await paymentsService.verifyRazorpayPayment({
      razorpay_order_id: checkoutResult.razorpay_order_id,
      razorpay_payment_id: checkoutResult.razorpay_payment_id,
      razorpay_signature: checkoutResult.razorpay_signature,
    }, accessToken);

    setPendingOrderId(null);
    Alert.alert('Payment successful', 'Your measurements are locked with this order. The paid order is now available in My Orders.', [
      { text: 'View my orders', onPress: onOrderPlaced },
    ]);
  };

  const createOrder = async () => {
    if (!accessToken) return;
    setSubmitting(true);
    try {
      let orderId = pendingOrderId;
      if (!orderId) {
        const order = await ordersService.create({
          tailorId: tailor.id,
          deliveryDetails: { ...delivery, addressLine2: delivery.addressLine2.trim() || undefined },
          items: [{
            garmentType: style.name,
            audience,
            fabric: fabric.trim(),
            sizeLabel: sizeLabel.trim(),
            measurementMethod: method,
            measurementUnit: unit,
            measurements: measurementRecord,
            notes: notes.trim() || undefined,
            referenceImages,
            quantity: 1,
          }],
        }, accessToken);
        orderId = order.id;
        setPendingOrderId(orderId);
      }
      await payForOrder(orderId);
    } catch (error) {
      Alert.alert('Checkout not completed', error instanceof Error ? error.message : 'Your order is saved as awaiting payment. You can retry payment below.');
    } finally {
      setSubmitting(false);
    }
  };

  const modelBaseUrl = process.env.EXPO_PUBLIC_GARMENT_3D_BASE_URL?.replace(/\/$/, '');
  const modelUrl = style.modelUrl || (modelBaseUrl ? `${modelBaseUrl}/${encodeURIComponent(style.id)}.glb` : undefined);

  return <PageFrame title="Order details" subtitle={`${style.name} · ${tailor.shopName}`} onBack={onBack} onNavigate={onNavigate}>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>360° design preview</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Rotate the garment model to inspect the design. The 3D preview is separate from body measurement capture.</Text><Garment360Viewer title={style.name} modelUrl={modelUrl} /></Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Delivery details</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>FULL NAME</Text><TextInput value={delivery.fullName} onChangeText={(v) => updateDelivery('fullName', v)} editable={pendingOrderId === null} placeholder="Recipient full name" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>PHONE NUMBER</Text><TextInput value={delivery.phone} onChangeText={(v) => updateDelivery('phone', v)} editable={pendingOrderId === null} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>ADDRESS</Text><TextInput value={delivery.addressLine1} onChangeText={(v) => updateDelivery('addressLine1', v)} editable={pendingOrderId === null} placeholder="House / flat, street, building" placeholderTextColor={C.muted} style={fieldStyle} />
      <TextInput value={delivery.addressLine2} onChangeText={(v) => updateDelivery('addressLine2', v)} editable={pendingOrderId === null} placeholder="Landmark / area (optional)" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>CITY</Text><TextInput value={delivery.city} onChangeText={(v) => updateDelivery('city', v)} editable={pendingOrderId === null} placeholder="City" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>STATE</Text><TextInput value={delivery.state} onChangeText={(v) => updateDelivery('state', v)} editable={pendingOrderId === null} placeholder="State" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>PIN / POSTAL CODE</Text><TextInput value={delivery.postalCode} onChangeText={(v) => updateDelivery('postalCode', v)} editable={pendingOrderId === null} keyboardType="number-pad" placeholder="PIN code" placeholderTextColor={C.muted} style={fieldStyle} />
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Fabric & size</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>FABRIC</Text><TextInput value={fabric} onChangeText={setFabric} editable={pendingOrderId === null} placeholder="e.g. Cotton, linen, silk" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 13 }}>SIZE / FIT</Text><TextInput value={sizeLabel} onChangeText={setSizeLabel} editable={pendingOrderId === null} placeholder="e.g. M, 40, or Made to measure" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 13 }}>MEASUREMENT UNIT</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{(['cm', 'in'] as const).map((value) => <Pressable key={value} onPress={() => { if (pendingOrderId === null) setUnit(value); }} disabled={pendingOrderId !== null} style={{ backgroundColor: unit === value ? C.wine : C.cream, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 }}><Text style={{ color: unit === value ? '#FFFFFF' : C.wine, fontWeight: '800' }}>{value}</Text></Pressable>)}</View>
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>How would you like to provide measurements?</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 13 }}>
        {([{value:'MANUAL',label:'Enter manually'},{value:'CAMERA_ASSISTED',label:'Use camera'}] as const).map((item) => <Pressable key={item.value} onPress={() => { if (pendingOrderId === null) setMethod(item.value); }} disabled={pendingOrderId !== null} style={{ flex: 1, borderWidth: 1, borderColor: method === item.value ? C.wine : C.border, backgroundColor: method === item.value ? C.cream : '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center' }}><Text style={{ color: C.wine, fontWeight: '800', fontSize: 12 }}>{item.label}</Text></Pressable>)}
      </View>
      {method === 'CAMERA_ASSISTED' && <View style={{ backgroundColor: '#FFF7E8', borderRadius: 12, padding: 12, marginTop: 12 }}><Text style={{ color: C.text, fontWeight: '800' }}>Camera-assisted reference</Text><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>Capture a reference photo for your tailor. This camera flow does not calculate body dimensions yet; enter and verify every measurement manually with a measuring tape. Do not rely on a photo as a measurement.</Text><Pressable onPress={captureReferencePhoto} disabled={uploadingPhoto || pendingOrderId !== null} style={{ backgroundColor: C.wine, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10, opacity: uploadingPhoto ? 0.6 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{uploadingPhoto ? 'Uploading…' : 'Open camera & add reference photo'}</Text></Pressable><Text style={{ color: C.muted, fontSize: 11, marginTop: 7 }}>{referenceImages.length} reference photo(s) added</Text></View>}
      {matchingMeasurementProfiles.length > 0 && <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.cream }}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>Use a saved measurement profile</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Only profiles for {style.garmentType} are shown. Review each value before confirming.</Text>
        {matchingMeasurementProfiles.map((profile) => <Pressable key={profile.id} onPress={() => applyMeasurementProfile(profile)} disabled={pendingOrderId !== null} style={{ padding: 10, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 9 }}><Text style={{ color: C.wine, fontWeight: '800' }}>{profile.name}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{Object.keys(profile.measurements).length} saved values · {profile.unit}</Text></Pressable>)}
      </View>}
      <Text style={{ color: C.wine, fontWeight: '900', marginTop: 17 }}>Enter measurements ({unit})</Text>
      {style.measurementFields.map((field) => <View key={field.key} style={{ marginTop: 12 }}><Text style={{ color: C.muted, fontSize: 12 }}>{field.label.toUpperCase()}</Text><TextInput value={measurementValues[field.key] || ''} onChangeText={(value) => setMeasurementValues((current) => ({ ...current, [field.key]: value.replace(/[^0-9.]/g, '') }))} editable={pendingOrderId === null} keyboardType="decimal-pad" placeholder={`Enter ${field.label.toLowerCase()}`} placeholderTextColor={C.muted} style={fieldStyle} /></View>)}
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Additional instructions</Text><TextInput value={notes} onChangeText={setNotes} editable={pendingOrderId === null} multiline placeholder="Preferred fit, design details, lining, buttons, or anything else the tailor should know" placeholderTextColor={C.muted} style={[fieldStyle, { minHeight: 90, textAlignVertical: 'top' }]} /></Card>
    <View style={{ backgroundColor: C.cream, borderRadius: 15, padding: 15, marginTop: 14 }}><Text style={{ color: C.wine, fontWeight: '900' }}>Order estimate</Text><Text style={{ color: C.text, marginTop: 5 }}>{tailor.shopName} · {style.name}</Text><Text style={{ color: C.wine, fontWeight: '900', fontSize: 20, marginTop: 7 }}>Starting at ₹{Number(tailor.startingPrice || 0).toLocaleString('en-IN')}</Text><Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 5 }}>This is the tailor's starting price, not a final quote. Confirm any additional fabric or design charges directly with the tailor.</Text></View>
    {pendingOrderId !== null && <Card><Text style={{ color: C.wine, fontWeight: '900' }}>Order #{pendingOrderId} is awaiting payment</Text><Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Your confirmed measurements have been saved with this order and cannot be edited. Complete payment to submit it to the tailor.</Text><ActionButton title={submitting ? 'Opening Razorpay…' : 'Retry payment'} onPress={() => { void createOrder(); }} disabled={submitting || uploadingPhoto} /></Card>}
    <ActionButton title={submitting ? 'Opening checkout…' : 'Confirm measurements & proceed to payment'} onPress={submitOrder} disabled={submitting || uploadingPhoto || pendingOrderId !== null} />
  </PageFrame>;
}

const fieldStyle = {
  backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, borderRadius: 12,
  paddingHorizontal: 13, paddingVertical: 12, color: C.text, marginTop: 7,
};
