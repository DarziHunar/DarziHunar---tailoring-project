import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthButton from '../components/AuthButton';
import AuthHeader from '../components/AuthHeader';
import AuthInput from '../components/AuthInput';
import { useAuth } from '../context/AuthContext';
import { C } from '../theme/colors';
import type { SignupRole } from './SignupRolePage';

type Props = {
  role: SignupRole;
  onBack: () => void;
  onLogin: () => void;
};

function normalizeIndianPhoneNumber(value: string): string | null {
  const trimmed = value.trim();
  const digits = trimmed.replace(/\D/g, '');

  if (/^[6-9]\d{9}$/.test(digits)) return `+91${digits}`;
  if (/^91[6-9]\d{9}$/.test(digits)) return `+${digits}`;

  if (
    trimmed.startsWith('+') &&
    /^\+[1-9]\d{7,14}$/.test(trimmed.replace(/\s/g, ''))
  ) {
    return trimmed.replace(/\s/g, '');
  }

  return null;
}

export default function SignupPage({ role, onBack, onLogin }: Props) {
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [shopName, setShopName] = useState('');
  const [experience, setExperience] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isTailor = role === 'TAILOR';

  const handleSignup = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedPhone = normalizeIndianPhoneNumber(phoneNumber);

    if (
      !fullName.trim() ||
      !normalizedEmail ||
      !phoneNumber.trim() ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Missing details', 'Please complete all required fields.');
      return;
    }

    if (!normalizedPhone) {
      Alert.alert(
        'Invalid phone number',
        'Enter a valid 10-digit Indian mobile number.',
      );
      return;
    }

    if (
      isTailor &&
      (!shopName.trim() || !experience.trim() || !specialization.trim())
    ) {
      Alert.alert(
        'Missing tailor details',
        'Enter your shop name, experience and specialization.',
      );
      return;
    }

    if (
      isTailor &&
      (!Number.isInteger(Number(experience)) || Number(experience) < 0)
    ) {
      Alert.alert(
        'Invalid experience',
        'Enter a valid number of years of experience.',
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert('Password too short', 'Use at least 8 characters.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Passwords do not match', 'Please enter matching passwords.');
      return;
    }

    setSubmitting(true);

    try {
      await signUp({
        fullName: fullName.trim(),
        email: normalizedEmail,
        phoneNumber: normalizedPhone,
        password,
        role: isTailor ? 'TAILOR' : 'CUSTOMER',
        ...(isTailor
          ? {
              shopName: shopName.trim(),
              experience: Number(experience),
              specialization: specialization.trim(),
            }
          : {}),
      });

      // AuthProvider saves the returned JWT and user.
      // Your app's auth state should now navigate to Home.
    } catch (error) {
      Alert.alert(
        'Registration failed',
        error instanceof Error ? error.message : 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
        <AuthHeader
          title={`${isTailor ? 'Tailor' : 'Customer'} Registration`}
          onBack={onBack}
        />

        <Text style={{ fontSize: 24, fontWeight: '800', color: C.wine }}>
          Create Your Account
        </Text>

        <Text style={{ color: C.muted, marginTop: 8, marginBottom: 22 }}>
          {isTailor
            ? 'Tell us about yourself and your tailoring business.'
            : 'Create your customer account to get started.'}
        </Text>

        <View>
          <AuthInput
            placeholder="Full Name"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
            autoComplete="name"
          />

          {isTailor && (
            <>
              <AuthInput
                placeholder="Shop / Business Name"
                value={shopName}
                onChangeText={setShopName}
                autoCapitalize="words"
              />

              <AuthInput
                placeholder="Years of Experience"
                value={experience}
                onChangeText={setExperience}
                keyboardType="number-pad"
              />

              <AuthInput
                placeholder="Specialization (e.g. Bridal, Men's Wear)"
                value={specialization}
                onChangeText={setSpecialization}
                autoCapitalize="sentences"
              />
            </>
          )}

          <AuthInput
            placeholder="Email Address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <AuthInput
            placeholder="Phone Number"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            autoComplete="tel"
          />

          <AuthInput
            placeholder="Password (minimum 8 characters)"
            value={password}
            onChangeText={setPassword}
            secure
            autoComplete="new-password"
          />

          <AuthInput
            placeholder="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secure
            autoComplete="new-password"
          />

          <AuthButton
            title="Create Account"
            onPress={handleSignup}
            loading={submitting}
            disabled={submitting}
          />
        </View>

        <Pressable
          onPress={onLogin}
          style={{ marginTop: 22, alignItems: 'center' }}
        >
          <Text style={{ color: C.wine }}>
            Already have an account? Login
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}