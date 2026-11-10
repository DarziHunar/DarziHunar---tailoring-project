import React, { useState } from "react";
import { Alert, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthButton from "../components/AuthButton";
import AuthHeader from "../components/AuthHeader";
import { useAuth } from "../context/AuthContext";
import { C } from "../theme/colors";

type Props = { onBack: () => void };

export default function ProfilePage({ onBack }: Props) {
  const { user, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);
  const handleSignOut = async () => {
    setSigningOut(true);
    try { await signOut(); }
    catch (error) { Alert.alert("Sign out failed", error instanceof Error ? error.message : "Please try again."); }
    finally { setSigningOut(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg, padding: 24 }}>
      <AuthHeader title="My Account" onBack={onBack} />
      <View style={{ backgroundColor: C.card, borderRadius: 16, padding: 20, marginTop: 24, borderColor: C.border, borderWidth: 1 }}>
        <Text style={{ fontSize: 24, color: C.wine, fontWeight: "800" }}>Account details</Text>
        <Text style={{ color: C.muted, marginTop: 18 }}>Email</Text>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginTop: 4 }}>{user?.email ?? "—"}</Text>
        <Text style={{ color: C.muted, marginTop: 18 }}>Account type</Text>
        <Text style={{ color: C.text, fontSize: 16, fontWeight: "600", marginTop: 4 }}>{user?.role ?? "—"}</Text>
      </View>
      <View style={{ marginTop: 26 }}>
        <AuthButton title="Log Out" onPress={handleSignOut} loading={signingOut} disabled={signingOut} />
      </View>
    </SafeAreaView>
  );
}
