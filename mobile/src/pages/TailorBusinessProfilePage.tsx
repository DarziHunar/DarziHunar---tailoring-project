import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { tailorService } from '../services/tailorService';
import { getCurrentCoordinates } from '../services/locationService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';

type Props = { onBack: () => void; onSaved: () => void };
const fieldStyle = { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginTop: 7 } as const;

export default function TailorBusinessProfilePage({ onBack, onSaved }: Props) {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [shopName, setShopName] = useState('');
  const [bio, setBio] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [startingPrice, setStartingPrice] = useState('');
  const [acceptingOrders, setAcceptingOrders] = useState(true);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [capturingLocation, setCapturingLocation] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');

  const load = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setLoadError('');
    try {
      const result = await tailorService.getMine(accessToken);
      setProfile(result);
      setShopName(result.shopName ?? '');
      setBio(result.bio ?? '');
      setCategoriesText((result.categories ?? []).join(', '));
      setExperienceYears(result.experienceYears == null ? '' : String(result.experienceYears));
      setSpecialization(result.specialization ?? '');
      setStartingPrice(String(result.startingPrice ?? 0));
      setAcceptingOrders(result.acceptingOrders ?? true);
      setLatitude(result.latitude ?? null);
      setLongitude(result.longitude ?? null);
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        setProfile(null);
      } else {
        setLoadError(error instanceof Error ? error.message : 'Could not load your business profile.');
      }
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => { void load(); }, [load]);

  const handleSave = async () => {
    if (!accessToken) return;
    if (!shopName.trim()) {
      Alert.alert('Shop name required', 'Enter your tailoring shop or business name.');
      return;
    }
    const categories = Array.from(new Set(categoriesText.split(',').map((item) => item.trim()).filter(Boolean)));
    if (categories.length === 0) {
      Alert.alert('Add at least one service', 'Enter categories separated by commas, such as Saree Blouse, Kurta, Shirts.');
      return;
    }
    const exp = experienceYears.trim() ? Number(experienceYears) : undefined;
    const price = startingPrice.trim() ? Number(startingPrice) : 0;
    if (exp !== undefined && (!Number.isInteger(exp) || exp < 0 || exp > 80)) {
      Alert.alert('Invalid experience', 'Enter a whole number between 0 and 80.');
      return;
    }
    if (!Number.isFinite(price) || price < 0) {
      Alert.alert('Invalid starting price', 'Enter a valid non-negative amount.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shopName: shopName.trim(),
        bio: bio.trim() || undefined,
        categories,
        experienceYears: exp,
        specialization: specialization.trim() || undefined,
        startingPrice: price,
        acceptingOrders,
        ...(latitude !== null && longitude !== null ? { latitude, longitude } : {}),
      };
      if (profile) await tailorService.update(profile.id, payload, accessToken);
      else await tailorService.create(payload, accessToken);
      Alert.alert('Saved', 'Your tailor business profile has been saved.');
      onSaved();
    } catch (error) {
      Alert.alert('Could not save profile', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <AuthHeader title="Business Profile" onBack={onBack} />
        <Text style={{ color: C.wine, fontSize: 24, fontWeight: '900', marginTop: 10 }}>{profile ? 'Edit your shop details' : 'Set up your shop'}</Text>
        <Text style={{ color: C.muted, lineHeight: 20, marginTop: 7, marginBottom: 19 }}>These details help customers understand what you make and whether you are accepting new orders.</Text>

        {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 35 }} /> : loadError ? (
          <View style={{ backgroundColor: C.card, borderRadius: 15, padding: 16, borderColor: C.border, borderWidth: 1 }}>
            <Text style={{ color: '#B42318' }}>{loadError}</Text>
            <Pressable onPress={() => { void load(); }} style={{ marginTop: 12 }}><Text style={{ color: C.wine, fontWeight: '800' }}>Retry</Text></Pressable>
          </View>
        ) : (
          <>
            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700' }}>SHOP / BUSINESS NAME *</Text>
            <TextInput value={shopName} onChangeText={setShopName} placeholder="e.g. Darzi House" placeholderTextColor={C.muted} style={fieldStyle} />

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>ABOUT YOUR BUSINESS</Text>
            <TextInput value={bio} onChangeText={setBio} multiline textAlignVertical="top" placeholder="Describe your tailoring services" placeholderTextColor={C.muted} style={[fieldStyle, { minHeight: 90 }]} />

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>SERVICES / GARMENT CATEGORIES *</Text>
            <TextInput value={categoriesText} onChangeText={setCategoriesText} placeholder="Saree Blouse, Kurta, Shirts" placeholderTextColor={C.muted} style={fieldStyle} />
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>Separate each service with a comma. These names appear in the customer catalogue.</Text>

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>YEARS OF EXPERIENCE</Text>
            <TextInput value={experienceYears} onChangeText={setExperienceYears} keyboardType="number-pad" placeholder="e.g. 5" placeholderTextColor={C.muted} style={fieldStyle} />

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>SPECIALIZATION</Text>
            <TextInput value={specialization} onChangeText={setSpecialization} placeholder="e.g. Bridal, Men's Wear" placeholderTextColor={C.muted} style={fieldStyle} />

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>SHOP LOCATION (REQUIRED FOR NEARBY SEARCH)</Text>
            <Pressable
              disabled={capturingLocation}
              onPress={async () => {
                setCapturingLocation(true);
                try {
                  const current = await getCurrentCoordinates();
                  setLatitude(current.latitude);
                  setLongitude(current.longitude);
                  Alert.alert('Location saved', 'Your current location will be used as the map pin for your shop. You can update it whenever you move.');
                } catch (error) {
                  Alert.alert('Could not get location', error instanceof Error ? error.message : 'Enable location permission and try again.');
                } finally {
                  setCapturingLocation(false);
                }
              }}
              style={{ backgroundColor: C.cream, borderRadius: 12, padding: 13, marginTop: 8, alignItems: 'center', opacity: capturingLocation ? 0.6 : 1 }}
            >
              <Text style={{ color: C.wine, fontWeight: '800' }}>{capturingLocation ? 'Getting location…' : latitude !== null && longitude !== null ? 'Update shop location' : 'Use current shop location'}</Text>
            </Pressable>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 6 }}>{latitude !== null && longitude !== null ? `Saved coordinates: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}` : 'Your shop will not appear in nearby tailor results until a location is saved.'}</Text>

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>STARTING PRICE (₹)</Text>
            <TextInput value={startingPrice} onChangeText={setStartingPrice} keyboardType="number-pad" placeholder="e.g. 500" placeholderTextColor={C.muted} style={fieldStyle} />

            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 13, padding: 14, marginTop: 17 }}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={{ color: C.text, fontWeight: '800' }}>Accepting new orders</Text>
                <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Customers can discover your profile when enabled.</Text>
              </View>
              <Switch value={acceptingOrders} onValueChange={setAcceptingOrders} trackColor={{ true: C.wine, false: '#CFC6C1' }} />
            </View>

            <Pressable disabled={saving} onPress={handleSave} style={{ backgroundColor: C.wine, borderRadius: 14, alignItems: 'center', padding: 16, marginTop: 22, opacity: saving ? 0.65 : 1 }}>
              {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={{ color: '#FFFFFF', fontWeight: '900' }}>{profile ? 'Save Business Profile' : 'Create Business Profile'}</Text>}
            </Pressable>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
