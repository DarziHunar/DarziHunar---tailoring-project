import { showLocalNotification } from '../utils/localNotification';
import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import SelectField from '../components/SelectField';
import { getCurrentCoordinates } from '../services/locationService';
import BottomNavigation from '../components/BottomNavigation';
import { useAuth } from '../context/AuthContext';
import { mediaService } from '../services/mediaService';
import { ordersService } from '../services/ordersService';
import { measurementsService, type MeasurementProfile } from '../services/measurementsService';
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

const designTypes = [
  'Classic', 'Modern', 'Traditional', 'Contemporary', 'Minimal', 'Embroidered',
  'Printed', 'Floral', 'A-line', 'Straight cut', 'Anarkali', 'Fusion',
  'Casual', 'Formal', 'Festive', 'Bridal / Occasion', 'Party wear', 'Layered', 'Pleated',
];
const fabricOptions = ['Cotton', 'Linen', 'Silk', 'Rayon', 'Georgette', 'Chiffon', 'Velvet', 'Denim', 'Wool', 'Other'];
const sizeFitOptions = ['Made to measure', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'Slim fit', 'Regular fit', 'Relaxed fit', 'Other / Custom'];

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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadNearby = async () => {
    setLoading(true);
    setError('');
    try {
      const coordinates = await getCurrentCoordinates();
      const response = await tailorService.findNearby(coordinates.latitude, coordinates.longitude, 4000, audience);
      // Category eligibility is enforced by the backend against Tailor.audiences.
      setTailors(response.data.filter((tailor) => tailor.acceptingOrders));
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
      <Text style={{ color: C.muted, fontSize: 11, marginTop: 9 }}>Showing accepting tailors within 4 km who have selected the {audienceLabel[audience]} audience in their business profile.</Text>
      <Pressable onPress={() => { void loadNearby(); }} style={{ alignSelf: 'flex-start', marginTop: 11, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 20, backgroundColor: C.cream }}><Text style={{ color: C.wine, fontWeight: '800', fontSize: 12 }}>Refresh nearby tailors</Text></Pressable>
    </Card>
    {/* Loading indicator */}
    {loading ? (
      <ActivityIndicator
        color={C.wine}
        size="large"
        style={{ marginTop: 35 }}
      />
    ) : error ? (
      <Card>
        <Text style={{ color: '#B42318' }}>{error}</Text>
        <ActionButton
          title="Try again"
          onPress={() => {
            void loadNearby();
          }}
        />
      </Card>
    ) : tailors.length === 0 ? (
      <Card>
        <Text style={{ color: C.wine, fontWeight: '800' }}>
          No matching tailors within 4 km
        </Text>
        <Text style={{ color: C.muted, marginTop: 5 }}>
          Try again later, or choose another style. Tailors must save
          their shop location and select this audience in their
          business profile to appear here.
        </Text>
      </Card>
    ) : (
      tailors.map((tailor) => (
        <Pressable
          key={tailor.id}
          onPress={() => onSelect(tailor)}
          style={{
            backgroundColor: C.card,
            borderColor: C.border,
            borderWidth: 1,
            borderRadius: 17,
            padding: 15,
            marginTop: 11,
            flexDirection: 'row',
            alignItems: 'center',
          }}
        >
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              backgroundColor: C.cream,
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: C.wine, fontSize: 25 }}>✂</Text>
          </View>

          <View style={{ flex: 1 }}>
            <Text style={{ color: C.text, fontWeight: '900', fontSize: 15 }}>
              {tailor.shopName}
            </Text>

            <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>
              {tailor.specialization ||
                (tailor.categories || []).join(', ') ||
                'Custom tailoring'}
            </Text>

            <Text style={{ color: C.wine, fontWeight: '800', fontSize: 12, marginTop: 5 }}>
              ★ {Number(tailor.rating || 0).toFixed(1)}
              {' · '}
              {tailor.distanceMeters != null
                ? `${(tailor.distanceMeters / 1000).toFixed(1)} km away`
                : 'Nearby'}

            </Text>
          </View>

          <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
        </Pressable>
      ))
    )}
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
  const [customFabric, setCustomFabric] = useState('');
  const [sizeLabel, setSizeLabel] = useState('Made to measure');
  const [customSizeLabel, setCustomSizeLabel] = useState('');
  const [designType, setDesignType] = useState('Classic');
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [selectedMeasurementProfileId, setSelectedMeasurementProfileId] = useState<number | null>(null);
  const effectiveFabric = fabric === 'Other' ? customFabric.trim() : fabric;
  const effectiveSizeLabel = sizeLabel === 'Other / Custom' ? customSizeLabel.trim() : sizeLabel;
  const [unit, setUnit] = useState<'cm' | 'in'>('cm');
  const [method, setMethod] = useState<'MANUAL' | 'CAMERA_ASSISTED'>('MANUAL');
  const [measurementValues, setMeasurementValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dialog, setDialog] = useState<{ kind: 'confirm' | 'success' | 'error' | 'info'; title: string; message: string; orderId?: number } | null>(null);
  const [savedMeasurementProfiles, setSavedMeasurementProfiles] = useState<MeasurementProfile[]>([]);
  const measurementRecord = useMemo(() => Object.fromEntries(style.measurementFields.map((field) => [field.key, Number(measurementValues[field.key])])), [measurementValues, style.measurementFields]);
  const matchingMeasurementProfiles = savedMeasurementProfiles.filter((profile) => profile.garmentType === style.garmentType);

  const populateAddressFromLocation = async (askPermission: boolean) => {
    setResolvingAddress(true);
    try {
      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted && askPermission) permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) throw new Error('Location permission is not enabled. You can enter your delivery address manually.');
      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const result = (await Location.reverseGeocodeAsync({ latitude: position.coords.latitude, longitude: position.coords.longitude }))[0];
      if (!result) throw new Error('Could not resolve an address from these coordinates. Please enter it manually.');
      const streetLine = [result.streetNumber, result.street || result.name].filter(Boolean).join(' ').trim();
      setDelivery((current) => ({
        ...current,
        addressLine1: current.addressLine1.trim() ? current.addressLine1 : streetLine,
        addressLine2: current.addressLine2.trim() ? current.addressLine2 : (result.district || result.subregion || ''),
        city: current.city.trim() ? current.city : (result.city || result.subregion || ''),
        state: current.state.trim() ? current.state : (result.region || ''),
        postalCode: current.postalCode.trim() ? current.postalCode : (result.postalCode || ''),
        country: current.country.trim() ? current.country : (result.country || 'India'),
      }));
      setDialog({ kind: 'info', title: 'Address suggested', message: 'We filled the address using your current location. Please verify the house number, street and PIN code before sending your request.' });
    } catch (error) {
      setDialog({ kind: 'error', title: 'Could not get delivery address', message: error instanceof Error ? error.message : 'Please enter your address manually.' });
    } finally { setResolvingAddress(false); }
  };

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    measurementsService.list(accessToken)
      .then((profiles) => {
        if (!active) return;
        setSavedMeasurementProfiles(profiles);
        const matching = profiles
          .filter((profile) => profile.garmentType === style.garmentType)
          .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        const best = matching.find((profile) => style.measurementFields.some((field) => profile.measurements[field.key] !== undefined));
        if (best) {
          setSelectedMeasurementProfileId(best.id);
          setMeasurementValues((current) => Object.keys(current).length ? current : Object.fromEntries(style.measurementFields
            .filter((field) => best.measurements[field.key] !== undefined)
            .map((field) => [field.key, String(best.measurements[field.key])])));
          setUnit(best.unit || 'cm');
        }
      })
      .catch(() => { if (active) setSavedMeasurementProfiles([]); });
    return () => { active = false; };
  }, [accessToken, style.garmentType, style.measurementFields]);

  useEffect(() => {
    let active = true;
    Location.getForegroundPermissionsAsync().then((permission) => {
      if (active && permission.granted && !delivery.addressLine1 && !delivery.city) void populateAddressFromLocation(false);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const applyMeasurementProfile = (profile: MeasurementProfile) => {
    setSelectedMeasurementProfileId(profile.id);
    const missing = style.measurementFields.filter((field) => profile.measurements[field.key] === undefined);
    if (missing.length) {
      setDialog({ kind: 'info', title: 'Measurement profile needs review', message: `This saved profile is missing: ${missing.map((field) => field.label).join(', ')}. Fill those fields manually before sending the request.` });
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
      setDialog({ kind: 'error', title: 'Camera permission required', message: 'Allow camera access to take a reference photo for your tailor, or continue with manual measurements.' });
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.75, allowsEditing: false });
    if (result.canceled || !result.assets[0]) return;
    setUploadingPhoto(true);
    try {
      const key = await mediaService.uploadOrderReference(result.assets[0], accessToken);
      setReferenceImages((current) => [...current, key]);
      setMethod('CAMERA_ASSISTED');
      setDialog({ kind: 'info', title: 'Reference photo saved', message: 'The photo will be attached to your request. Please still enter and verify your body measurements manually.' });
    } catch (error) {
      setDialog({ kind: 'error', title: 'Photo upload failed', message: error instanceof Error ? error.message : 'Please try again.' });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitOrder = () => {
    if (!accessToken) return;
    if (!delivery.fullName.trim() || !/^\+?[0-9][0-9\s-]{7,15}$/.test(delivery.phone.trim()) || !delivery.addressLine1.trim() || !delivery.city.trim() || !delivery.state.trim() || !/^[A-Za-z0-9 -]{3,12}$/.test(delivery.postalCode.trim())) {
      setDialog({ kind: 'error', title: 'Delivery details needed', message: 'Please add a valid name, phone number and complete delivery address so the tailor can review your request.' });
      return;
    }
    if (!effectiveFabric) { setDialog({ kind: 'error', title: 'Choose a fabric', message: 'Select a fabric or enter the fabric name under Other.' }); return; }
    if (!effectiveSizeLabel) { setDialog({ kind: 'error', title: 'Choose a size or fit', message: 'Select a size/fit or enter your custom details.' }); return; }
    const missing = style.measurementFields.filter((field) => !measurementValues[field.key]?.trim() || !Number.isFinite(Number(measurementValues[field.key])) || Number(measurementValues[field.key]) <= 0);
    if (missing.length) { setDialog({ kind: 'error', title: 'Measurements incomplete', message: `Please enter valid ${missing.map((field) => field.label).join(', ')} measurements before sending your request.` }); return; }
    if (method === 'CAMERA_ASSISTED' && referenceImages.length === 0) {
      setDialog({ kind: 'error', title: 'Add a reference photo', message: 'Capture a reference photo or switch to manual measurement entry before continuing.' });
      return;
    }
    const measurementSummary = style.measurementFields.map((field) => `${field.label}: ${measurementValues[field.key]} ${unit}`).join('\n');
    const summary = `${style.name}\nTailor: ${tailor.shopName}\nDeliver to: ${delivery.fullName}, ${delivery.phone}\n${delivery.addressLine1}${delivery.addressLine2 ? `, ${delivery.addressLine2}` : ''}, ${delivery.city}, ${delivery.state} ${delivery.postalCode}, ${delivery.country}\nFabric: ${effectiveFabric}\nDesign: ${designType}\nSize: ${effectiveSizeLabel}\n\nMeasurements\n${measurementSummary}`;
    setDialog({ kind: 'confirm', title: 'Review your order request', message: `${summary}\n\nYour measurements will be saved with this request. The tailor will review the details and send a final quote. You can pay securely with Razorpay after the quote is ready.` });
  };

  const confirmOrder = async () => {
    if (!accessToken || submitting) return;
    setSubmitting(true);
    setDialog(null);
    try {
      const order = await ordersService.create({
        tailorId: tailor.id,
        deliveryDetails: { ...delivery, addressLine2: delivery.addressLine2.trim() || undefined },
        items: [{
          garmentType: style.name,
          audience,
          fabric: effectiveFabric,
          sizeLabel: effectiveSizeLabel,
          designType,
          measurementMethod: method,
          measurementUnit: unit,
          measurements: measurementRecord,
          notes: notes.trim() || undefined,
          referenceImages,
          quantity: 1,
        }],
      }, accessToken);
      const notificationBody = `Your request #${order.id} has been sent to ${tailor.shopName}. The tailor will review it and send a final quote.`;
      void showLocalNotification('Order request placed', notificationBody, { orderId: order.id });
      setDialog({ kind: 'success', title: 'Order request placed', message: notificationBody + ' You can follow updates in Notifications and My Orders.', orderId: order.id });
    } catch (error) {
      setDialog({ kind: 'error', title: 'Could not send your request', message: error instanceof Error ? error.message : 'Please check your connection and try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  return <>
  <PageFrame title="Order details" subtitle={`${style.name} · ${tailor.shopName}`} onBack={onBack} onNavigate={onNavigate}>
    <Card>
      <Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Choose design type</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Select the style direction that best matches what you have in mind. You can add more specific instructions below.</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
        {designTypes.map((item) => <Pressable key={item} onPress={() => setDesignType(item)} disabled={submitting} style={{ borderWidth: 1, borderColor: designType === item ? C.wine : C.border, backgroundColor: designType === item ? C.cream : '#FFFFFF', paddingHorizontal: 13, paddingVertical: 9, borderRadius: 22 }}>
          <Text style={{ color: C.wine, fontWeight: '800', fontSize: 12 }}>{item}</Text>
        </Pressable>)}
      </View>
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Delivery details</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 10 }}>FULL NAME</Text><TextInput value={delivery.fullName} onChangeText={(v) => updateDelivery('fullName', v)} editable={!submitting} placeholder="Recipient full name" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>PHONE NUMBER</Text><TextInput value={delivery.phone} onChangeText={(v) => updateDelivery('phone', v)} editable={!submitting} keyboardType="phone-pad" placeholder="+91 98765 43210" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>ADDRESS</Text>
      <Pressable disabled={submitting || resolvingAddress} onPress={() => { void populateAddressFromLocation(true); }} style={{ alignSelf: 'flex-start', backgroundColor: C.cream, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 18, marginTop: 8, opacity: resolvingAddress ? 0.6 : 1 }}><Text style={{ color: C.wine, fontSize: 11, fontWeight: '800' }}>{resolvingAddress ? 'Finding address…' : 'Use my current location'}</Text></Pressable>
      <Text style={{ color: C.muted, fontSize: 10, marginTop: 5 }}>Address is suggested from your coordinates. Verify and edit it before confirming.</Text>
      <TextInput value={delivery.addressLine1} onChangeText={(v) => updateDelivery('addressLine1', v)} editable={!submitting} placeholder="House / flat, street, building" placeholderTextColor={C.muted} style={fieldStyle} />
      <TextInput value={delivery.addressLine2} onChangeText={(v) => updateDelivery('addressLine2', v)} editable={!submitting} placeholder="Landmark / area (optional)" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>CITY</Text><TextInput value={delivery.city} onChangeText={(v) => updateDelivery('city', v)} editable={!submitting} placeholder="City" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>STATE</Text><TextInput value={delivery.state} onChangeText={(v) => updateDelivery('state', v)} editable={!submitting} placeholder="State" placeholderTextColor={C.muted} style={fieldStyle} />
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>PIN / POSTAL CODE</Text><TextInput value={delivery.postalCode} onChangeText={(v) => updateDelivery('postalCode', v)} editable={!submitting} keyboardType="number-pad" placeholder="PIN code" placeholderTextColor={C.muted} style={fieldStyle} />
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Fabric & size</Text>
      <SelectField label="Fabric" value={fabric} options={fabricOptions} onChange={setFabric} disabled={submitting} />
      {fabric === 'Other' && <TextInput value={customFabric} onChangeText={setCustomFabric} editable={!submitting} placeholder="Enter fabric name" placeholderTextColor={C.muted} style={fieldStyle} />}
      <SelectField label="Size / fit" value={sizeLabel} options={sizeFitOptions} onChange={setSizeLabel} disabled={submitting} />
      {sizeLabel === 'Other / Custom' && <TextInput value={customSizeLabel} onChangeText={setCustomSizeLabel} editable={!submitting} placeholder="Enter size or fit details" placeholderTextColor={C.muted} style={fieldStyle} />}
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 13 }}>MEASUREMENT UNIT</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{(['cm', 'in'] as const).map((value) => <Pressable key={value} onPress={() => { setUnit(value); }} disabled={submitting} style={{ backgroundColor: unit === value ? C.wine : C.cream, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 }}><Text style={{ color: unit === value ? '#FFFFFF' : C.wine, fontWeight: '800' }}>{value}</Text></Pressable>)}</View>
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>How would you like to provide measurements?</Text>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 13 }}>
        {([{ value: 'MANUAL', label: 'Enter manually' }, { value: 'CAMERA_ASSISTED', label: 'Use camera' }] as const).map((item) => <Pressable key={item.value} onPress={() => { setMethod(item.value); }} disabled={submitting} style={{ flex: 1, borderWidth: 1, borderColor: method === item.value ? C.wine : C.border, backgroundColor: method === item.value ? C.cream : '#FFFFFF', borderRadius: 12, padding: 12, alignItems: 'center' }}><Text style={{ color: C.wine, fontWeight: '800', fontSize: 12 }}>{item.label}</Text></Pressable>)}
      </View>
      {method === 'CAMERA_ASSISTED' && <View style={{ backgroundColor: '#FFF7E8', borderRadius: 12, padding: 12, marginTop: 12 }}><Text style={{ color: C.text, fontWeight: '800' }}>Camera-assisted reference</Text><Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 5 }}>Capture a reference photo for your tailor. This camera flow does not calculate body dimensions yet; enter and verify every measurement manually with a measuring tape. Do not rely on a photo as a measurement.</Text><Pressable onPress={captureReferencePhoto} disabled={uploadingPhoto || submitting} style={{ backgroundColor: C.wine, borderRadius: 10, padding: 12, alignItems: 'center', marginTop: 10, opacity: uploadingPhoto ? 0.6 : 1 }}><Text style={{ color: '#FFFFFF', fontWeight: '800' }}>{uploadingPhoto ? 'Uploading…' : 'Open camera & add reference photo'}</Text></Pressable><Text style={{ color: C.muted, fontSize: 11, marginTop: 7 }}>{referenceImages.length} reference photo(s) added</Text></View>}
      {matchingMeasurementProfiles.length > 0 && <View style={{ marginTop: 16, padding: 12, borderRadius: 12, backgroundColor: C.cream }}>
        <Text style={{ color: C.wine, fontWeight: '900' }}>Use a saved measurement profile</Text>
        <Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Only profiles for {style.garmentType} are shown. Review each value before confirming.</Text>
        {matchingMeasurementProfiles.map((profile) => <Pressable key={profile.id} onPress={() => applyMeasurementProfile(profile)} disabled={submitting} style={{ padding: 10, marginTop: 8, backgroundColor: '#FFFFFF', borderRadius: 9, borderWidth: selectedMeasurementProfileId === profile.id ? 1 : 0, borderColor: C.wine }}><View style={{ flexDirection: 'row', justifyContent: 'space-between' }}><Text style={{ color: C.wine, fontWeight: '800' }}>{profile.name}</Text><Text style={{ color: C.wine, fontSize: 11, fontWeight: '800' }}>{selectedMeasurementProfileId === profile.id ? 'Selected ✓' : 'Use profile'}</Text></View><Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>{Object.keys(profile.measurements).length} saved values · {profile.unit}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 6 }}>{style.measurementFields.filter((field) => profile.measurements[field.key] !== undefined).map((field) => <Text key={field.key} style={{ color: C.text, fontSize: 10 }}>{field.label}: {profile.measurements[field.key]} {profile.unit}</Text>)}</View></Pressable>)}
      </View>}
      <Text style={{ color: C.wine, fontWeight: '900', marginTop: 17 }}>Enter measurements ({unit})</Text>
      {style.measurementFields.map((field) => <View key={field.key} style={{ marginTop: 12 }}><Text style={{ color: C.muted, fontSize: 12 }}>{field.label.toUpperCase()}</Text><TextInput value={measurementValues[field.key] || ''} onChangeText={(value) => setMeasurementValues((current) => ({ ...current, [field.key]: value.replace(/[^0-9.]/g, '') }))} editable={!submitting} keyboardType="decimal-pad" placeholder={`Enter ${field.label.toLowerCase()}`} placeholderTextColor={C.muted} style={fieldStyle} /></View>)}
    </Card>
    <Card><Text style={{ color: C.wine, fontWeight: '900', fontSize: 16 }}>Additional instructions</Text><TextInput value={notes} onChangeText={setNotes} editable={!submitting} multiline placeholder="Preferred fit, design details, lining, buttons, or anything else the tailor should know" placeholderTextColor={C.muted} style={[fieldStyle, { minHeight: 90, textAlignVertical: 'top' }]} /></Card>
    <View style={{ backgroundColor: C.cream, borderRadius: 15, padding: 15, marginTop: 14 }}>
      <Text style={{ color: C.wine, fontWeight: '900' }}>What happens next?</Text>
      <Text style={{ color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 6 }}>Your request goes to {tailor.shopName}. The tailor reviews your fabric choice, design and measurements, then sends a final quote. Razorpay payment becomes available in My Orders after the quote is shared.</Text>
    </View>
    <ActionButton title={submitting ? 'Sending request…' : 'Confirm & send order request'} onPress={submitOrder} disabled={submitting || uploadingPhoto} />
  </PageFrame>
  <Modal transparent visible={dialog !== null} animationType="fade" onRequestClose={() => { if (!submitting) setDialog(null); }}>
    <View style={{ flex: 1, backgroundColor: 'rgba(28, 16, 20, 0.55)', justifyContent: 'center', padding: 24 }}>
      <View style={{ backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, padding: 20, maxHeight: '82%' }}>
        <View style={{ width: 42, height: 4, borderRadius: 4, backgroundColor: C.gold, marginBottom: 15 }} />
        <Text style={{ color: C.wine, fontSize: 19, fontWeight: '900' }}>{dialog?.title || ''}</Text>
        <ScrollView style={{ marginTop: 10 }} showsVerticalScrollIndicator={false}>
          <Text style={{ color: C.text, fontSize: 13, lineHeight: 21 }}>{dialog?.message || ''}</Text>
        </ScrollView>
        <Pressable disabled={submitting} onPress={() => {
          if (dialog?.kind === 'confirm') { void confirmOrder(); return; }
          if (dialog?.kind === 'success') { setDialog(null); onOrderPlaced(); return; }
          setDialog(null);
        }} style={{ backgroundColor: C.wine, borderRadius: 13, padding: 14, alignItems: 'center', marginTop: 17, opacity: submitting ? 0.6 : 1 }}>
          <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{dialog?.kind === 'confirm' ? 'Confirm request' : dialog?.kind === 'success' ? 'Go to My Orders' : 'Understood'}</Text>
        </Pressable>
        {dialog?.kind === 'confirm' && <Pressable onPress={() => setDialog(null)} disabled={submitting} style={{ padding: 12, alignItems: 'center', marginTop: 4 }}><Text style={{ color: C.muted, fontWeight: '700' }}>Review details again</Text></Pressable>}
      </View>
    </View>
  </Modal>
  </>;
}

const fieldStyle = {
  backgroundColor: '#FFFFFF', borderColor: C.border, borderWidth: 1, borderRadius: 12,
  paddingHorizontal: 13, paddingVertical: 12, color: C.text, marginTop: 7,
};
