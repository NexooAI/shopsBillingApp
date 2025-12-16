import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function InitialSetupScreen() {
  const { completeInitialSetup } = useApp();

  const [shopName, setShopName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [logoUri, setLogoUri] = useState<string | undefined>(undefined);
  const [adminUsername, setAdminUsername] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [confirmPassword, setConfirmPassword] = useState('admin123');
  const [isSaving, setIsSaving] = useState(false);

  const pickLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.7,
    });
    if (!result.canceled && result.assets?.length) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    if (!shopName.trim()) {
      Alert.alert('Error', 'Please enter shop name');
      return;
    }
    if (!address.trim()) {
      Alert.alert('Error', 'Please enter address');
      return;
    }
    if (!phone.trim() || phone.length < 10) {
      Alert.alert('Error', 'Please enter valid phone number');
      return;
    }
    if (!adminUsername.trim()) {
      Alert.alert('Error', 'Please enter admin username');
      return;
    }
    if (!adminPassword.trim() || adminPassword.length < 4) {
      Alert.alert('Error', 'Password must be at least 4 characters');
      return;
    }
    if (adminPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsSaving(true);
    try {
      await completeInitialSetup({
        shopName: shopName.trim(),
        address: address.trim(),
        phone: phone.trim(),
        logoUri,
        adminUsername: adminUsername.trim(),
        adminPassword: adminPassword.trim(),
      });
      Alert.alert('Success', 'Setup completed. Please login with the admin credentials.');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Ionicons name="storefront" size={48} color={colors.accent} />
        <Text style={styles.title}>Initial Setup</Text>
        <Text style={styles.subtitle}>Add shop info and admin credentials</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Shop Details</Text>
        <Text style={styles.inputLabel}>Shop Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter shop name"
          placeholderTextColor={colors.gray[400]}
          value={shopName}
          onChangeText={setShopName}
        />

        <Text style={styles.inputLabel}>Address</Text>
        <TextInput
          style={[styles.input, styles.multiline]}
          placeholder="Enter address"
          placeholderTextColor={colors.gray[400]}
          value={address}
          onChangeText={setAddress}
          multiline
        />

        <Text style={styles.inputLabel}>Phone</Text>
        <TextInput
          style={styles.input}
          placeholder="10-digit phone"
          placeholderTextColor={colors.gray[400]}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          maxLength={10}
        />

        <View style={styles.logoRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.inputLabel}>Logo (optional)</Text>
            <TouchableOpacity style={styles.logoPicker} onPress={pickLogo}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImage} />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="image" size={28} color={colors.gray[400]} />
                  <Text style={styles.logoText}>Upload logo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Admin Credentials</Text>
        <Text style={styles.inputLabel}>Username</Text>
        <TextInput
          style={styles.input}
          placeholder="Admin username"
          placeholderTextColor={colors.gray[400]}
          value={adminUsername}
          onChangeText={setAdminUsername}
          autoCapitalize="none"
        />

        <Text style={styles.inputLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.gray[400]}
          value={adminPassword}
          onChangeText={setAdminPassword}
          secureTextEntry
        />

        <Text style={styles.inputLabel}>Confirm Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Confirm password"
          placeholderTextColor={colors.gray[400]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={isSaving}
      >
        <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save & Continue'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  logoRow: {
    marginTop: spacing.md,
  },
  logoPicker: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logoPlaceholder: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  logoText: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: 'contain',
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});


