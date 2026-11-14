import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import { tailorService } from '../services/tailorService';
import type { TailorProfile } from '../services/tailorService';
import { C } from '../theme/colors';
import type { MainTab } from '../types/navigation';

type StyleCategory = { name: string; detail: string };
type FrameProps = React.PropsWithChildren<{ title: string; subtitle?: string; onBack: () => void; activeTab?: MainTab; onNavigate: (tab: MainTab) => void }>;

function Frame({ title, subtitle, onBack, activeTab = 'explore', onNavigate, children }: FrameProps) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 7, paddingBottom: 13 }}>
        <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Go back" style={{ padding: 8, marginRight: 6 }}><Text style={{ color: C.wine, fontSize: 30 }}>‹</Text></Pressable>
        <View style={{ flex: 1 }}><Text style={{ color: C.wine, fontSize: 21, fontWeight: '900' }}>{title}</Text>{!!subtitle && <Text style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>{subtitle}</Text>}</View>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 25 }} showsVerticalScrollIndicator={false}>{children}</ScrollView>
      <BottomNavigation activeTab={activeTab} onNavigate={onNavigate} />
    </SafeAreaView>
  );
}

function Empty({ title, message }: { title: string; message: string }) {
  return <View style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 22, alignItems: 'center', marginTop: 15 }}>
    <Text style={{ color: C.gold, fontSize: 31 }}>✳</Text>
    <Text style={{ color: C.wine, fontSize: 17, fontWeight: '800', marginTop: 9 }}>{title}</Text>
    <Text style={{ color: C.muted, textAlign: 'center', lineHeight: 20, marginTop: 6 }}>{message}</Text>
  </View>;
}

export function BackendCategoriesPage({ styleCategory, onBack, onSelect, onNavigate }: { styleCategory: StyleCategory; onBack: () => void; onSelect: (category: string) => void; onNavigate: (tab: MainTab) => void }) {
  const [items, setItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    tailorService.getCategories().then((result) => { if (active) setItems(Array.isArray(result) ? result : []); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load tailor categories.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <Frame title={styleCategory.name} subtitle={styleCategory.detail} onBack={onBack} onNavigate={onNavigate}>
    <Text style={{ color: C.muted, lineHeight: 20, marginTop: 3 }}>Choose a service currently published by DarziHunar tailors. These options are loaded from tailor business profiles, not hardcoded garment lists.</Text>
    <Text style={{ color: C.text, fontWeight: '900', fontSize: 18, marginTop: 20, marginBottom: 10 }}>Available tailor services</Text>
    {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 30 }} /> : error ? <Empty title="Could not load services" message={error} /> : items.length === 0 ? <Empty title="No services published yet" message="When tailors add their garment categories to their business profiles, those services will appear here." /> : items.map((item) => (
      <Pressable key={item} onPress={() => onSelect(item)} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 17, marginBottom: 10, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', marginRight: 12 }}><Text style={{ fontSize: 20, color: C.wine }}>✂</Text></View>
        <View style={{ flex: 1 }}><Text style={{ color: C.text, fontSize: 15, fontWeight: '800' }}>{item}</Text><Text style={{ color: C.muted, fontSize: 11, marginTop: 4 }}>Find tailors offering this service</Text></View>
        <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
      </Pressable>
    ))}
    <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 8 }}>Note: your current database stores tailor service names as a single categories array. It does not yet link a garment to a specific style group such as Women or Men.</Text>
  </Frame>;
}

export function BackendAllTailorsPage({ onBack, onSelect, onNavigate }: { onBack: () => void; onSelect: (tailor: TailorProfile) => void; onNavigate: (tab: MainTab) => void }) {
  const [items, setItems] = useState<TailorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    tailorService.list().then((result) => { if (active) setItems(Array.isArray(result) ? result : []); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load tailors.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  return <Frame title="Tailor Masters" subtitle="Live business profiles on DarziHunar" onBack={onBack} onNavigate={onNavigate}>
    {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 35 }} /> : error ? <Empty title="Could not load tailors" message={error} /> : items.length === 0 ? <Empty title="No live tailors yet" message="Tailor profiles appear here after their owners publish a business profile and enable accepting orders." /> : items.map((tailor) => (
      <Pressable key={tailor.id} onPress={() => onSelect(tailor)} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><Text style={{ fontSize: 25, color: C.wine }}>✂</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>{tailor.shopName}</Text>
          {!!tailor.user?.fullName && <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>By {tailor.user.fullName}</Text>}
          <Text style={{ color: C.wine, fontSize: 11, marginTop: 5 }}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.verified ? 'Verified' : 'New tailor'}</Text>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>From ₹{Number(tailor.startingPrice || 0).toLocaleString('en-IN')}</Text>
        </View>
        <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
      </Pressable>
    ))}
  </Frame>;
}

export function BackendTailorsPage({ category, onBack, onSelect, onNavigate }: { category: string; onBack: () => void; onSelect: (tailor: TailorProfile) => void; onNavigate: (tab: MainTab) => void }) {
  const [items, setItems] = useState<TailorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    tailorService.getByCategory(category).then((result) => { if (active) setItems(Array.isArray(result) ? result : []); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load tailors.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [category]);

  return <Frame title={category} subtitle="Tailors offering this service" onBack={onBack} onNavigate={onNavigate}>
    {loading ? <ActivityIndicator color={C.wine} size="large" style={{ marginTop: 35 }} /> : error ? <Empty title="Could not load tailors" message={error} /> : items.length === 0 ? <Empty title="No tailors found" message="No active tailor profile currently lists this service. Try another service or check back later." /> : items.map((tailor) => (
      <Pressable key={tailor.id} onPress={() => onSelect(tailor)} style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 17, padding: 15, marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: C.cream, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}><Text style={{ fontSize: 25, color: C.wine }}>✂</Text></View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: C.text, fontSize: 15, fontWeight: '900' }}>{tailor.shopName}</Text>
          {!!tailor.user?.fullName && <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>By {tailor.user.fullName}</Text>}
          <Text style={{ color: C.wine, fontSize: 11, marginTop: 5 }}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.verified ? 'Verified' : 'New tailor'}</Text>
          <Text style={{ color: C.muted, fontSize: 11, marginTop: 3 }}>Starting at ₹{Number(tailor.startingPrice || 0).toLocaleString('en-IN')}</Text>
        </View>
        <Text style={{ color: C.wine, fontSize: 24 }}>›</Text>
      </Pressable>
    ))}
  </Frame>;
}

export function BackendTailorDetailPage({ tailor, onBack, onNavigate }: { tailor: TailorProfile; onBack: () => void; onNavigate: (tab: MainTab) => void }) {
  const [details, setDetails] = useState<TailorProfile>(tailor);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    tailorService.getById(tailor.id).then((result) => { if (active) setDetails(result); })
      .catch((err) => { if (active) setError(err instanceof Error ? err.message : 'Could not load tailor details.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tailor.id]);

  return <Frame title="Tailor Profile" subtitle="Business information" onBack={onBack} onNavigate={onNavigate}>
    <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 20, padding: 20, alignItems: 'center', marginTop: 5 }}>
      <View style={{ width: 82, height: 82, borderRadius: 25, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 38, color: C.wine }}>✂</Text></View>
      <Text style={{ color: C.wine, fontSize: 21, fontWeight: '900', marginTop: 13 }}>{details.shopName}</Text>
      {!!details.fullName && <Text style={{ color: C.muted, marginTop: 4 }}>Managed by {details.fullName}</Text>}
      <Text style={{ color: C.wine, marginTop: 8 }}>★ {Number(details.rating || 0).toFixed(1)} · {details.verified ? 'Verified tailor' : 'Verification pending'}</Text>
      {loading && <ActivityIndicator color={C.wine} style={{ marginTop: 13 }} />}
      {!!error && <Text style={{ color: '#B42318', marginTop: 10 }}>{error}</Text>}
    </View>
    {!!details.bio && <><Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginTop: 19, marginBottom: 8 }}>About</Text><Text style={{ color: C.muted, lineHeight: 21 }}>{details.bio}</Text></>}
    <Text style={{ color: C.text, fontSize: 18, fontWeight: '900', marginTop: 20, marginBottom: 9 }}>Services</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{(details.categories || []).map((item) => <View key={item} style={{ backgroundColor: C.cream, borderRadius: 20, paddingVertical: 8, paddingHorizontal: 12 }}><Text style={{ color: C.wine, fontSize: 12, fontWeight: '700' }}>{item}</Text></View>)}</View>
    <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, marginTop: 18 }}>
      <Text style={{ color: C.muted, fontSize: 12 }}>Starting price</Text><Text style={{ color: C.wine, fontSize: 22, fontWeight: '900', marginTop: 4 }}>₹{Number(details.startingPrice || 0).toLocaleString('en-IN')}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Experience</Text><Text style={{ color: C.text, fontWeight: '700', marginTop: 4 }}>{details.experienceYears != null ? `${details.experienceYears} years` : 'Not provided'}</Text>
      <Text style={{ color: C.muted, fontSize: 12, marginTop: 12 }}>Specialization</Text><Text style={{ color: C.text, fontWeight: '700', marginTop: 4 }}>{details.specialization || 'General tailoring'}</Text>
    </View>
  </Frame>;
}
