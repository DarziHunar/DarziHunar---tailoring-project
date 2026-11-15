import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StatusBar, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
import ChatAssistant from '../components/ChatAssistant';
import { categories, creations } from '../data/homeData';
import { tailorService } from '../services/tailorService';
import type { TailorProfile } from '../services/tailorService';
import type { MainTab } from '../types/navigation';
import { C } from '../theme/colors';
import { homeStyles as s } from './home.styles';

type CategoryItem = (typeof categories)[number];
type TailorItem = TailorProfile;
type CreationItem = (typeof creations)[number];
type Props = {
  displayName?: string | null;
  onOpenCategory: (category: CategoryItem) => void;
  onViewAllTailors: () => void;
  onOpenTailor: (tailor: TailorItem) => void;
  onOpenCreation: (creation: CreationItem) => void;
  onNavigateTab: (tab: MainTab) => void;
};

export default function HomePage({ displayName, onOpenCategory, onViewAllTailors, onOpenTailor, onOpenCreation, onNavigateTab }: Props) {
  const [liveTailors, setLiveTailors] = useState<TailorItem[]>([]);
  const [tailorsLoading, setTailorsLoading] = useState(true);
  const [welcomeVisible, setWelcomeVisible] = useState(true);
  const [chatVisible, setChatVisible] = useState(false);

  useEffect(() => {
    let active = true;
    tailorService.list().then((result) => {
      if (active) setLiveTailors(Array.isArray(result) ? result : []);
    }).catch((error) => {
      console.warn('Could not load live tailors:', error);
      if (active) setLiveTailors([]);
    }).finally(() => { if (active) setTailorsLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.logo}>DarziHunar<Text style={s.dot}>.</Text></Text>
            <Text style={s.tagline}>YOUR STYLE, PERFECTLY STITCHED</Text>
          </View>
          <Pressable style={s.bag} onPress={() => setChatVisible(true)} accessibilityLabel="Open DarziHunar assistant">
            <Text style={s.bagIcon}>✦</Text>
          </Pressable>
        </View>

        {welcomeVisible && <View style={[s.hero, { minHeight: 145, marginBottom: 25 }]}>
          <Pressable onPress={() => setWelcomeVisible(false)} accessibilityLabel="Dismiss welcome message" hitSlop={10} style={{ position: 'absolute', top: 12, right: 14, zIndex: 2, padding: 4 }}>
            <Text style={{ color: '#FFF8EF', fontSize: 25, fontWeight: '400' }}>×</Text>
          </Pressable>
          <Text style={s.heroEyebrow}>WELCOME BACK</Text>
          <Text style={[s.heroTitle, { marginTop: 12 }]}>{displayName?.trim() ? displayName.trim() : 'Welcome to DarziHunar'}</Text>
          <Text style={[s.heroBody, { fontSize: 13, lineHeight: 19, maxWidth: '90%' }]}>Your next favourite outfit starts with your design, your measurements and a skilled tailor.</Text>
        </View>}

        <View style={s.heading}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Choose Your Style</Text>
            <Text style={s.subtitle}>A perfect fit for every wardrobe</Text>
          </View>
        </View>
        <View style={s.grid}>
          {categories.map((item) => (
            <Pressable key={item.name} style={s.category} onPress={() => onOpenCategory(item)}>
              <View style={s.categoryTitleRow}><Text style={s.categoryName}>{item.name}</Text><Text style={s.arrow}>↗</Text></View>
              <Text style={s.categoryDetail}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        <View style={s.heading}>
          <View><Text style={s.title}>Preview Your Design</Text><Text style={s.subtitle}>Explore the craftsmanship</Text></View>
        </View>
        <View style={s.features}>
          <View style={s.feature}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500' }} style={s.featureImage} />
            <Text style={s.featureName}>Custom styling</Text><Text style={s.featureSub}>Choose fabrics and colours</Text>
          </View>
          <View style={s.feature}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500' }} style={s.featureImage} />
            <Text style={s.featureName}>360° garment view</Text><Text style={s.featureSub}>Rotate supported 3D models</Text>
          </View>
        </View>

        <View style={s.heading}>
          <View style={{ flex: 1 }}><Text style={s.title}>Tailor Masters</Text><Text style={s.subtitle}>Meet the hands behind the craft</Text></View>
          <Pressable onPress={onViewAllTailors}><Text style={s.viewAll}>View all ↗</Text></Pressable>
        </View>
        {tailorsLoading ? <Text style={{ color: C.muted, paddingVertical: 16 }}>Loading tailor listings…</Text> : liveTailors.length === 0 ? (
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: C.text, fontWeight: '700' }}>No published tailor listings yet</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Tailors who publish their shop profile and enable orders will appear here.</Text>
          </View>
        ) : liveTailors.slice(0, 4).map((tailor) => (
          <Pressable key={tailor.id} style={s.tailor} onPress={() => onOpenTailor(tailor)} accessibilityRole="button" accessibilityLabel={`View ${tailor.shopName}`}>
            <View style={s.tailorIcon}><Text style={{ fontSize: 26 }}>✂</Text></View>
            <View style={{ flex: 1 }}><Text style={s.tailorName}>{tailor.shopName}</Text><Text style={s.rating}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.verified ? 'Verified' : 'Tailor'}</Text><Text style={s.tailorNote}>{tailor.specialization || (tailor.categories || []).slice(0, 2).join(', ') || 'Custom tailoring'}</Text></View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))}

        <View style={s.heading}><View><Text style={s.title}>Best Creations</Text><Text style={s.subtitle}>Inspiration, crafted with care</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {creations.map((item, index) => (
            <View key={`${item.name}-${index}`} style={s.creation}>
              <Pressable onPress={() => onOpenCreation(item)} accessibilityLabel={`View ${item.name}`}><Image source={{ uri: item.image }} style={s.creationImage} resizeMode="cover" /></Pressable>
              <Text style={s.creationName}>{item.name}</Text><Text style={s.creationHint}>{item.category} · {item.price}</Text>
              <Pressable style={s.detailsButton} onPress={() => onOpenCreation(item)}><Text style={s.detailsButtonText}>Details →</Text></Pressable>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <Pressable style={s.chatButton} onPress={() => setChatVisible(true)} accessibilityLabel="Chat with DarziHunar assistant"><Text style={s.chatButtonText}>💬</Text></Pressable>
      <ChatAssistant visible={chatVisible} onClose={() => setChatVisible(false)} />
      <BottomNavigation activeTab="home" onNavigate={onNavigateTab} />
    </SafeAreaView>
  );
}
