import { Alert } from '../utils/appAlert';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { tailorService } from '../services/tailorService';
import { getCurrentCoordinates } from '../services/locationService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';

type Props = { onBack: () => void; onSaved: () => void };
type Audience = 'WOMEN' | 'MEN' | 'TEENAGERS' | 'CHILDREN';
const audienceOptions: { value: Audience; label: string }[] = [
  { value: 'WOMEN', label: 'Women' }, { value: 'MEN', label: 'Men' },
  { value: 'TEENAGERS', label: 'Teenagers' }, { value: 'CHILDREN', label: 'Children' },
];

const AUDIENCE_VALUES: Audience[] = ['WOMEN', 'MEN', 'TEENAGERS', 'CHILDREN'];

/** Accept API arrays, comma-separated legacy values, or enum-like objects safely. */
function normalizeAudiences(value: unknown): Audience[] {
  let rawValues: unknown[] = [];

  if (Array.isArray(value)) {
    rawValues = value;
  } else if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed.startsWith('[')) {
      try {
        const parsed: unknown = JSON.parse(trimmed);
        rawValues = Array.isArray(parsed) ? parsed : [];
      } catch {
        rawValues = trimmed.split(/[,;|]/);
      }
    } else {
      rawValues = trimmed.split(/[,;|]/);
    }
  } else if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    rawValues = Object.entries(record)
      .filter(([key, item]) => item === true && AUDIENCE_VALUES.includes(key.toUpperCase() as Audience))
      .map(([key]) => key);
    if (rawValues.length === 0) rawValues = Object.values(record);
  }

  const normalized = rawValues
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is Audience => AUDIENCE_VALUES.includes(item as Audience));

  return Array.from(new Set(normalized));
}

/** Backward compatibility for profiles where audiences were typed into specialization. */
function inferAudiencesFromSpecialization(value: string): Audience[] {
  const text = value.toUpperCase();
  const inferred: Audience[] = [];
  if (/\bWOMEN\b|\bWOMAN\b|\bLADIES\b/.test(text)) inferred.push('WOMEN');
  if (/\bMEN\b|\bMAN\b|\bGENTS\b/.test(text)) inferred.push('MEN');
  if (/\bTEEN(?:AGER)?S?\b/.test(text)) inferred.push('TEENAGERS');
  if (/\bCHILD(?:REN)?\b|\bKIDS?\b/.test(text)) inferred.push('CHILDREN');
  return inferred;
}
const fieldStyle = { backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, paddingVertical: 12, color: C.text, fontSize: 14, marginTop: 7 } as const;

export default function TailorBusinessProfilePage({ onBack, onSaved }: Props) {
  const { accessToken } = useAuth();
  const [profile, setProfile] = useState<TailorProfile | null>(null);
  const [shopName, setShopName] = useState('');
  const [bio, setBio] = useState('');
  const [categoriesText, setCategoriesText] = useState('');
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [experienceYears, setExperienceYears] = useState('');
  const [specialization, setSpecialization] = useState('');
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
      const savedAudiences = normalizeAudiences(result.audiences);
      setAudiences(savedAudiences.length ? savedAudiences : inferAudiencesFromSpecialization(result.specialization ?? ''));
      setExperienceYears(result.experienceYears == null ? '' : String(result.experienceYears));
      setSpecialization(result.specialization ?? '');
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
    // Use explicit chip selections first. For older profiles that stored audience
    // words in the specialization field, infer them once so the profile can be saved.
    const audiencesToSave = normalizeAudiences(audiences).length
      ? normalizeAudiences(audiences)
      : inferAudiencesFromSpecialization(specialization);
    if (audiencesToSave.length === 0) {
      Alert.alert('Choose your customers', 'Tap at least one audience chip (Women, Men, Teenagers or Children). Do not enter these values in Specialization.');
      return;
    }
    setAudiences(audiencesToSave);
    const exp = experienceYears.trim() ? Number(experienceYears) : undefined;
    if (exp !== undefined && (!Number.isInteger(exp) || exp < 0 || exp > 80)) {
      Alert.alert('Invalid experience', 'Enter a whole number between 0 and 80.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        shopName: shopName.trim(),
        bio: bio.trim() || undefined,
        categories,
        audiences: audiencesToSave,
        experienceYears: exp,
        specialization: specialization.trim() || undefined,
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
        <Text style={{ color: C.muted, lineHeight: 20, marginTop: 7, marginBottom: 19 }}>These details help customers understand your services, customer groups and availability.</Text>

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

            <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 16 }}>CUSTOMER AUDIENCES * </Text>
            <Text style={{ color: C.muted, fontSize: 11, marginTop: 5 }}>Select only the groups you actually stitch for. Customers will see your profile only in these categories.</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
              {audienceOptions.map((item) => {
                const selected = audiences.includes(item.value);
                return <Pressable key={item.value} onPress={() => setAudiences((current) => selected ? current.filter((value) => value !== item.value) : [...current, item.value])} style={{ paddingHorizontal: 14, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: selected ? C.wine : C.border, backgroundColor: selected ? C.wine : C.card }}>
                  <Text style={{ color: selected ? '#FFFFFF' : C.wine, fontWeight: '800', fontSize: 12 }}>{item.label} {selected ? '✓' : '+'}</Text>
                </Pressable>;
              })}
            </View>

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
