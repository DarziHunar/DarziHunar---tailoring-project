import React from "react";
import { ActivityIndicator, Pressable, Text } from "react-native";
import { C } from "../theme/colors";

type Props = { title: string; onPress: () => void; outline?: boolean; loading?: boolean; disabled?: boolean };

export default function AuthButton({ title, onPress, outline = false, loading = false, disabled = false }: Props) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      accessibilityRole="button"
      style={{
        backgroundColor: outline ? C.card : C.wine,
        borderWidth: outline ? 1 : 0, borderColor: C.wine, padding: 16,
        borderRadius: 12, alignItems: "center", marginTop: 12,
        opacity: isDisabled ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color={outline ? C.wine : "#FFFFFF"} />
      ) : (
        <Text style={{ color: outline ? C.wine : "#FFFFFF", fontWeight: "700" }}>{title}</Text>
      )}
    </Pressable>
  );
}
