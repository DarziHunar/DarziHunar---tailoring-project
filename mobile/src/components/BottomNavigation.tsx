import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { C } from "../theme/colors";

const tabs = [
  { label: "Home", symbol: "⌂" },
  { label: "Favorites", symbol: "♡" },
  { label: "My Orders", symbol: "▤" },
  { label: "Explore", symbol: "◇" },
  { label: "Measurements", symbol: "↔" },
];

export default function BottomNavigation() {
  return (
    <View style={styles.bottomArea}>
      <View style={styles.bottomNav}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.label}
            style={styles.bottomTab}
            onPress={() => Alert.alert(tab.label, `${tab.label} screen will be added next.`)}
          >
            <Text style={[styles.bottomSymbol, tab.label === "Home" && styles.activeTab]}>
              {tab.symbol}
            </Text>
            <Text
              style={[styles.bottomLabel, tab.label === "Home" && styles.activeTab]}
              numberOfLines={1}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.footerTagline}>CRAFTED WITH CARE · STITCHED WITH LOVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomArea: { backgroundColor: C.bg, borderTopWidth: 0, paddingTop: 4, paddingBottom: 2 },
  bottomNav: { flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  bottomTab: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 2 },
  bottomSymbol: { fontSize: 20, color: C.muted, marginBottom: 3 },
  bottomLabel: { fontSize: 9, color: C.muted, textAlign: "center" },
  activeTab: { color: C.wine, fontWeight: "700" },
  footerTagline: { textAlign: "center", color: C.muted, fontSize: 10, marginTop: 6 },
});
