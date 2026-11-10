import React, { useState } from "react";
import { Alert, Pressable, ScrollView, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AuthButton from "../components/AuthButton";
import AuthHeader from "../components/AuthHeader";
import AuthInput from "../components/AuthInput";
import { useAuth } from "../context/AuthContext";
import { C } from "../theme/colors";

type Props = { onBack: () => void; onSignup: () => void };

export default function LoginPage({ onBack, onSignup }: Props) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Missing details", "Enter your email address and password.");
      return;
    }
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error) {
      Alert.alert("Login failed", error instanceof Error ? error.message : "Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <AuthHeader title="Login" onBack={onBack} />
        <Text style={{ fontSize: 25, fontWeight: "800", color: C.wine }}>Welcome Back!</Text>
        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 25 }}>Login to continue with DarziHunar.</Text>
        <AuthInput placeholder="Email Address" value={email} onChangeText={setEmail} keyboardType="email-address" autoComplete="email" />
        <AuthInput placeholder="Password" value={password} onChangeText={setPassword} secure autoComplete="password" />
        <AuthButton title="Login" onPress={handleLogin} loading={submitting} disabled={submitting} />
        <Pressable onPress={onSignup} style={{ marginTop: 25, alignItems: "center" }}>
          <Text style={{ color: C.wine }}>Don’t have an account? Sign Up</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
