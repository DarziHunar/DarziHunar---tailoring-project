import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, View } from "react-native";
import AuthButton from "../components/AuthButton";
import { C } from "../theme/colors";

type Props = { onLogin: () => void; onSignup: () => void };

export default function WelcomePage({ onLogin, onSignup }: Props) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
        <View style={{ alignItems: "center", marginBottom: 52 }}>
          <Text style={{ fontSize: 42, fontWeight: "800", color: C.wine }}>DarziHunar<Text style={{ color: C.gold }}>.</Text></Text>
          <Text style={{ color: C.muted, fontSize: 10, letterSpacing: 2, marginTop: 8 }}>YOUR STYLE, PERFECTLY STITCHED</Text>
          <Text style={{ fontSize: 55, marginTop: 48 }}>✂️</Text>
          <Text style={{ fontSize: 25, fontWeight: "800", color: C.wine, marginTop: 20, textAlign: "center" }}>Welcome to DarziHunar</Text>
          <Text style={{ color: C.muted, textAlign: "center", marginTop: 10, lineHeight: 22 }}>Find your style, connect with skilled tailors, and get the perfect fit.</Text>
        </View>
        <AuthButton title="Login" onPress={onLogin} />
        <AuthButton title="Create Account" outline onPress={onSignup} />
      </View>
    </SafeAreaView>
  );
}
