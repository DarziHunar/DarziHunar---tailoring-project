import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNavigation from '../components/BottomNavigation';
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
  onProfile: () => void;
  onOpenCategory: (category: CategoryItem) => void;
  onViewAllTailors: () => void;
  onOpenTailor: (tailor: TailorItem) => void;
  onOpenCreation: (creation: CreationItem) => void;
  onNavigateTab: (tab: MainTab) => void;
  onSearch: (query: string) => void;
  onLocation: () => void;
  locationLabel?: string;
};

export default function HomePage({
  onProfile,
  onOpenCategory,
  onViewAllTailors,
  onOpenTailor,
  onOpenCreation,
  onNavigateTab,
  onSearch,
  onLocation,
  locationLabel,
}: Props) {
  const scrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);
  const [showTopButton, setShowTopButton] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [liveTailors, setLiveTailors] = useState<TailorItem[]>([]);
  const [tailorsLoading, setTailorsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    tailorService.list().then((result) => {
      if (active) setLiveTailors(Array.isArray(result) ? result : []);
    }).catch((error) => {
      console.warn('Could not load live tailors:', error);
      if (active) setLiveTailors([]);
    }).finally(() => {
      if (active) setTailorsLoading(false);
    });
    return () => { active = false; };
  }, []);

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.page}
        onScroll={(event) => setShowTopButton(event.nativeEvent.contentOffset.y > 250)}
        scrollEventThrottle={16}
      >
        {/* Brand header */}
        <View style={s.header}>
          <View>
            <Text style={s.logo}>DarziHunar<Text style={s.dot}>.</Text></Text>
            <Text style={s.tagline}>YOUR STYLE, PERFECTLY STITCHED</Text>
          </View>
          <Pressable style={s.bag} onPress={onProfile} accessibilityLabel="Open Profile">
            <Text style={s.bagIcon}>♙</Text>
          </Pressable>
        </View>

        {/* Location */}
        <Pressable style={s.location} onPress={onLocation} accessibilityRole="button">
          <Text style={s.pin}>⌖</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.eyebrow}>YOUR LOCATION</Text>
            <Text style={s.locationText}>{locationLabel || 'Choose your location'} ⌄</Text>
          </View>
          <Text style={s.chevron}>›</Text>
        </Pressable>

        {/* Search */}
        <View style={s.search}>
          <Text style={s.searchIcon}>⌕</Text>
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            onSubmitEditing={() => onSearch(searchText.trim())}
            onFocus={() => {
              // The search page opens when the user submits a search term.
            }}
            returnKeyType="search"
            placeholder="Search outfits, styles, tailors..."
            placeholderTextColor={C.muted}
            style={s.searchInput}
          />
          {!!searchText.trim() && (
            <Pressable onPress={() => onSearch(searchText.trim())} accessibilityLabel="Submit search">
              <Text style={{ color: C.wine, fontWeight: '700', paddingHorizontal: 8 }}>Go</Text>
            </Pressable>
          )}
        </View>

        {/* Hero */}
        <View style={s.hero}>
          <View style={s.heroTop}>
            <Text style={s.heroEyebrow}>MADE FOR YOUR MOMENTS</Text>
            <Text style={s.heroDecoration}>✳</Text>
          </View>
          <Text style={s.heroTitle}>Every stitch tells your story.</Text>
          <Text style={s.heroBody}>Your design. Your measurements. Your perfect fit.</Text>
          <View style={s.offerPill}>
            <Text style={s.offerText}>Festive offers coming soon</Text>
          </View>
          <Text style={s.heroFlower}>✳</Text>
        </View>

        {/* Categories */}
        <View style={s.heading}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Choose Your Style</Text>
            <Text style={s.subtitle}>A perfect fit for every wardrobe</Text>
          </View>
        </View>
        <View style={s.grid}>
          {categories.map((item) => (
            <Pressable key={item.name} style={s.category} onPress={() => onOpenCategory(item)}>
              <View style={s.categoryTitleRow}>
                <Text style={s.categoryName}>{item.name}</Text>
                <Text style={s.arrow}>↗</Text>
              </View>
              <Text style={s.categoryDetail}>{item.detail}</Text>
            </Pressable>
          ))}
        </View>

        {/* AR and 360 remain unchanged */}
        <View style={s.heading}>
          <View>
            <Text style={s.title}>Preview Your Design</Text>
            <Text style={s.subtitle}>Explore our Features</Text>
          </View>
        </View>
        <View style={s.features}>
          <Pressable
            style={s.feature}
            onPress={() => Alert.alert('AR Preview', 'AR preview integration is coming soon.')}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500' }}
              style={s.featureImage}
            />
            <Text style={s.featureName}>AR Preview</Text>
            <Text style={s.featureSub}>Visualise your style</Text>
          </Pressable>
          <Pressable
            style={s.feature}
            onPress={() => Alert.alert('360° View', '360-degree viewing is coming soon.')}
          >
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=500' }}
              style={s.featureImage}
            />
            <Text style={s.featureName}>360° View</Text>
            <Text style={s.featureSub}>Explore every angle</Text>
          </Pressable>
        </View>

        {/* Tailors */}
        <View style={s.heading}>
          <View style={{ flex: 1 }}>
            <Text style={s.title}>Tailor Masters Near You</Text>
            <Text style={s.subtitle}>Meet the hands behind the craft</Text>
          </View>
          <Pressable onPress={onViewAllTailors}>
            <Text style={s.viewAll}>View all ↗</Text>
          </Pressable>
        </View>
        {tailorsLoading ? (
          <Text style={{ color: C.muted, paddingVertical: 16 }}>Loading tailor listings…</Text>
        ) : liveTailors.length === 0 ? (
          <View style={{ backgroundColor: C.card, borderColor: C.border, borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 12 }}>
            <Text style={{ color: C.text, fontWeight: '700' }}>No live tailor listings yet</Text>
            <Text style={{ color: C.muted, fontSize: 12, marginTop: 5 }}>Published tailor profiles will appear here when they are accepting orders.</Text>
          </View>
        ) : liveTailors.slice(0, 4).map((tailor) => (
          <Pressable
            key={tailor.id}
            style={s.tailor}
            onPress={() => onOpenTailor(tailor)}
            accessibilityRole="button"
            accessibilityLabel={`View ${tailor.shopName}`}
          >
            <View style={s.tailorIcon}><Text style={{ fontSize: 26 }}>✂</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={s.tailorName}>{tailor.shopName}</Text>
              <Text style={s.rating}>★ {Number(tailor.rating || 0).toFixed(1)} · {tailor.verified ? 'Verified' : 'Tailor'}</Text>
              <Text style={s.tailorNote}>{tailor.specialization || (tailor.categories || []).slice(0, 2).join(', ') || 'Custom tailoring'}</Text>
            </View>
            <Text style={s.chevron}>›</Text>
          </Pressable>
        ))}

        {/* Creations */}
        <View style={s.heading}>
          <View>
            <Text style={s.title}>Best Creations</Text>
            <Text style={s.subtitle}>Inspiration, crafted with care</Text>
          </View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {creations.map((item, index) => (
            <View key={`${item.name}-${index}`} style={s.creation}>
              <Pressable onPress={() => onOpenCreation(item)} accessibilityLabel={`View ${item.name}`}>
                <Image
                  source={{ uri: item.image }}
                  style={s.creationImage}
                  resizeMode="cover"
                  onError={(event) => console.log('Creation image failed:', item.name, event.nativeEvent.error)}
                />
              </Pressable>
              <Text style={s.creationName}>{item.name}</Text>
              <Text style={s.creationHint}>{item.category} · {item.price}</Text>
              <Pressable style={s.detailsButton} onPress={() => onOpenCreation(item)}>
                <Text style={s.detailsButtonText}>Details →</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>
      </ScrollView>

      <Pressable
        style={s.chatButton}
        onPress={() => Alert.alert('Chat Support', 'How can we help you today?')}
        accessibilityLabel="Chat support"
      >
        <Text style={s.chatButtonText}>💬</Text>
      </Pressable>

      {showTopButton && (
        <Pressable
          style={s.topButton}
          onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
          accessibilityLabel="Back to top"
        >
          <Text style={s.topButtonText}>↑</Text>
        </Pressable>
      )}

      <BottomNavigation activeTab="home" onNavigate={onNavigateTab} />
    </SafeAreaView>
  );
}
