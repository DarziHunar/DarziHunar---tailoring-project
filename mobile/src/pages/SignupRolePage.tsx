import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import AuthButton from "../components/AuthButton";
import AuthHeader from "../components/AuthHeader";
import { C } from "../theme/colors";

export type SignupRole = "CUSTOMER" | "TAILOR";
type Props = { onBack: () => void; onSelect: (role: SignupRole) => void };

export default function SignupRolePage({ onBack, onSelect }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ padding: 24 }}>
        <AuthHeader title="Create Account" onBack={onBack} />
        <Text style={{ fontSize: 25, fontWeight: "800", color: C.wine }}>Join DarziHunar</Text>
        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 24 }}>Choose how you want to use DarziHunar.</Text>
        <AuthButton title="I am a Customer" onPress={() => onSelect("CUSTOMER")} />
        <AuthButton title="I am a Tailor" outline onPress={() => onSelect("TAILOR")} />
        <Text style={{ color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 22 }}>
          Your registration form will change based on the account type you select.
        </Text>
      </View>
    </SafeAreaView>
  );
}
