import React from "react";
import { Pressable, Text, View } from "react-native";
import { C } from "../theme/colors";

type Props = { title: string; onBack: () => void };

export default function AuthHeader({ title, onBack }: Props) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 30 }}>
      <Pressable onPress={onBack} hitSlop={12} accessibilityRole="button" accessibilityLabel="Go back">
        <Text style={{ fontSize: 30, color: C.wine }}>‹</Text>
      </Pressable>
      <Text style={{ fontSize: 20, fontWeight: "700", color: C.wine, marginLeft: 15 }}>
        {title}
      </Text>
    </View>
  );
}
