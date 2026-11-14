import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { C } from '../theme/colors';
import type { MainTab } from '../types/navigation';

type Props = {
  activeTab: MainTab;
  onNavigate: (tab: MainTab) => void;
};

const tabs: { key: MainTab; label: string; icon: string }[] = [
  { key: 'home', label: 'Home', icon: '⌂' },
  { key: 'favorites', label: 'Favorites', icon: '♡' },
  { key: 'orders', label: 'My Orders', icon: '▤' },
  { key: 'explore', label: 'Explore', icon: '◇' },
  { key: 'measurements', label: 'Measurements', icon: '↔' },
];

export default function BottomNavigation({ activeTab, onNavigate }: Props) {
  return (
    <View style={{ backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: '#E9E0D9' }}>
      <View style={{ flexDirection: 'row', paddingTop: 9, paddingBottom: 5 }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Open ${tab.label}`}
              onPress={() => onNavigate(tab.key)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 25, lineHeight: 29, color: active ? C.wine : '#8D8580' }}>
                {tab.icon}
              </Text>
              <Text
                numberOfLines={1}
                style={{ fontSize: 11, marginTop: 3, color: active ? C.wine : '#8D8580', fontWeight: active ? '700' : '400' }}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ textAlign: 'center', color: '#8D8580', fontSize: 10, letterSpacing: 0.4, paddingBottom: 4 }}>
        CRAFTED WITH CARE · STITCHED WITH LOVE
      </Text>
    </View>
  );
}
