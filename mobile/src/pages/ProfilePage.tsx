import React, { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AuthButton from '../components/AuthButton';
import AuthHeader from '../components/AuthHeader';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { mediaService } from '../services/mediaService';
import { C } from '../theme/colors';

type Props = {
  onBack: () => void;
  onEditBusiness?: () => void;
};

const inputStyle = {
  backgroundColor: C.card,
  borderColor: C.border,
  borderWidth: 1,
  borderRadius: 13,
  paddingHorizontal: 14,
  paddingVertical: 13,
  color: C.text,
  fontSize: 15,
  marginTop: 7,
};

export default function ProfilePage({ onBack, onEditBusiness }: Props) {
  const { user, accessToken, refreshUser, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? '');
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    setFullName(user?.fullName ?? '');
    setEmail(user?.email ?? '');
    setPhoneNumber(user?.phoneNumber ?? '');
  }, [user?.fullName, user?.email, user?.phoneNumber]);

  useEffect(() => {
    if (!accessToken) return;
    let active = true;
    mediaService.getProfileImageUrl(accessToken)
      .then((result) => { if (active) setProfileImageUrl(result.imageUrl); })
      .catch(() => { if (active) setProfileImageUrl(null); });
    return () => { active = false; };
  }, [accessToken]);

  const handleChooseProfileImage = async () => {
    if (!accessToken) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Allow photo library access to choose a profile image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.82 });
    if (result.canceled || !result.assets[0]) return;
    setUploadingImage(true);
    try {
      const uploaded = await mediaService.uploadProfileImage(result.assets[0], accessToken);
      setProfileImageUrl(uploaded.imageUrl);
      Alert.alert('Profile photo updated', 'Your profile image has been saved.');
    } catch (error) {
      Alert.alert('Upload failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    if (!user || !accessToken) return;
    if (!fullName.trim() || !email.trim()) {
      Alert.alert('Missing details', 'Full name and email are required.');
      return;
    }
    setSaving(true);
    try {
      await authService.updateUser(user.id, accessToken, {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        ...(phoneNumber.trim() ? { phoneNumber: phoneNumber.trim() } : {}),
      });
      await refreshUser();
      setEditing(false);
      Alert.alert('Profile updated', 'Your account details have been saved.');
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      Alert.alert('Sign out failed', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSigningOut(false);
    }
  };

  const deleteAccount = async () => {
    if (!user || !accessToken) return;
    setDeleting(true);
    try {
      await authService.deleteUser(user.id, accessToken);
      await signOut();
      Alert.alert('Account deleted', 'Your DarziHunar account has been deleted.');
    } catch (error) {
      Alert.alert(
        'Unable to delete account',
        error instanceof Error
          ? `${error.message}\n\nIf you have existing orders or reviews, contact support so the account can be handled without losing transaction history.`
          : 'Please contact support for assistance.',
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert(
      'Delete your account?',
      'This is permanent. You will be signed out. Existing orders or reviews may prevent deletion so that transaction history is preserved.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete account', style: 'destructive', onPress: () => { void deleteAccount(); } },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        <AuthHeader title="My Account" onBack={onBack} />
        <View style={{ backgroundColor: C.card, borderRadius: 18, padding: 20, marginTop: 18, borderColor: C.border, borderWidth: 1 }}>
          <Pressable onPress={handleChooseProfileImage} disabled={uploadingImage} style={{ width: 82, height: 82, borderRadius: 26, backgroundColor: C.cream, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {profileImageUrl ? <Image source={{ uri: profileImageUrl }} style={{ width: 82, height: 82 }} /> : <Text style={{ color: C.wine, fontSize: 29, fontWeight: '800' }}>{(user?.fullName?.[0] || user?.email?.[0] || 'D').toUpperCase()}</Text>}
          </Pressable>
          <Pressable onPress={handleChooseProfileImage} disabled={uploadingImage} style={{ marginTop: 7 }}>
            <Text style={{ color: C.wine, fontSize: 12, fontWeight: '800' }}>{uploadingImage ? 'Uploading photo…' : 'Change profile photo'}</Text>
          </Pressable>
          <Text style={{ fontSize: 23, color: C.wine, fontWeight: '800', marginTop: 14 }}>{user?.fullName || 'Your account'}</Text>
          <Text style={{ color: C.muted, marginTop: 4 }}>{user?.role === 'TAILOR' ? 'Tailor account' : user?.role === 'ADMIN' ? 'Administrator account' : 'Customer account'}</Text>

          {editing ? (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700' }}>FULL NAME</Text>
              <TextInput style={inputStyle} value={fullName} onChangeText={setFullName} placeholder="Full name" placeholderTextColor={C.muted} autoCapitalize="words" />
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>EMAIL</Text>
              <TextInput style={inputStyle} value={email} onChangeText={setEmail} placeholder="Email address" placeholderTextColor={C.muted} keyboardType="email-address" autoCapitalize="none" />
              <Text style={{ color: C.muted, fontSize: 12, fontWeight: '700', marginTop: 15 }}>PHONE NUMBER</Text>
              <TextInput style={inputStyle} value={phoneNumber} onChangeText={setPhoneNumber} placeholder="Phone number" placeholderTextColor={C.muted} keyboardType="phone-pad" />
              <View style={{ marginTop: 18 }}>
                <AuthButton title="Save Changes" onPress={handleSave} loading={saving} disabled={saving} />
              </View>
              <Pressable onPress={() => setEditing(false)} style={{ alignItems: 'center', padding: 14 }}>
                <Text style={{ color: C.wine, fontWeight: '700' }}>Cancel editing</Text>
              </Pressable>
            </View>
          ) : (
            <View style={{ marginTop: 20 }}>
              <Text style={{ color: C.muted, fontSize: 12 }}>Full name</Text>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>{user?.fullName || 'Not added'}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>Email</Text>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>{user?.email || '—'}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>Phone number</Text>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>{user?.phoneNumber || 'Not added'}</Text>
              <Text style={{ color: C.muted, fontSize: 12, marginTop: 16 }}>Account type</Text>
              <Text style={{ color: C.text, fontSize: 16, fontWeight: '600', marginTop: 4 }}>{user?.role || '—'}</Text>
              <View style={{ marginTop: 20 }}>
                <AuthButton title="Edit Account Details" onPress={() => setEditing(true)} />
              </View>
            </View>
          )}
        </View>

        {user?.role === 'TAILOR' && onEditBusiness && (
          <Pressable onPress={onEditBusiness} style={{ backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 17, marginTop: 14 }}>
            <Text style={{ color: C.wine, fontSize: 16, fontWeight: '800' }}>Business profile</Text>
            <Text style={{ color: C.muted, marginTop: 5 }}>Edit your shop details, specializations, categories and starting price.</Text>
            <Text style={{ color: C.wine, fontWeight: '700', marginTop: 10 }}>Manage business profile →</Text>
          </Pressable>
        )}

        <View style={{ marginTop: 20 }}>
          <AuthButton title="Log Out" onPress={handleSignOut} loading={signingOut} disabled={signingOut || deleting} outline />
        </View>

        <Pressable disabled={deleting || signingOut} onPress={confirmDelete} style={{ borderWidth: 1, borderColor: '#C85D5D', borderRadius: 14, padding: 15, alignItems: 'center', marginTop: 14, opacity: deleting ? 0.6 : 1 }}>
          {deleting ? <ActivityIndicator color="#B42318" /> : <Text style={{ color: '#B42318', fontWeight: '800' }}>Delete Account</Text>}
        </Pressable>
        <Text style={{ color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 9, textAlign: 'center' }}>
          Account deletion is permanent. Accounts with linked orders or reviews may need support assistance.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
