import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function InitialSetupScreen() {
    const { configureShop } = useApp();
    const navigation = useNavigation();

    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [adminUsername, setAdminUsername] = useState('admin');
    const [adminPassword, setAdminPassword] = useState('');
    const [logoUri, setLogoUri] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });
        if (!result.canceled && result.assets.length > 0) {
            setLogoUri(result.assets[0].uri);
        }
    };

    const saveSettings = async () => {
        if (!shopName.trim() || !address.trim() || !phone.trim() || phone.length < 10) {
            Alert.alert('Error', 'Please enter shop name, address, and valid phone number');
            return;
        }
        if (!adminUsername.trim() || !adminPassword.trim()) {
            Alert.alert('Error', 'Please enter admin username and password');
            return;
        }
        setIsSaving(true);
        try {
            await configureShop({
                shopName: shopName.trim(),
                address: address.trim(),
                phone: phone.trim(),
                logoUri,
                adminUsername: adminUsername.trim(),
                adminPassword: adminPassword.trim(),
            });
        } catch (error) {
            console.error('Error saving setup:', error);
            Alert.alert('Error', 'Failed to save setup. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        await saveSettings();
        Alert.alert('Success', 'Setup completed. Please login with your admin credentials.', [
            { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] }) },
        ]);
    };

    const handleSaveAndRestart = async () => {
        await saveSettings();
        Alert.alert('Success', 'Setup saved. Restart the app to continue.', [
            { text: 'Restart', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] }) },
        ]);
    };

    const handleCancel = async () => {
        setIsSaving(true);
        try {
            await configureShop({
                shopName: 'Demo Shop',
                address: '123 Demo Street, City',
                phone: '9999999999',
                logoUri: undefined,
                adminUsername: 'admin',
                adminPassword: 'admin123',
            });
            Alert.alert('Demo Setup', 'App configured with demo credentials.\n\nUsername: admin\nPassword: admin123', [
                { text: 'OK', onPress: () => navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] }) },
            ]);
        } catch (error) {
            console.error('Error in default setup:', error);
            Alert.alert('Error', 'Failed to configure demo setup.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Well Come Billing Application</Text>
            <Text style={styles.subtitle}>Enter your shop details and admin credentials</Text>

            <Text style={styles.label}>Shop Name *</Text>
            <TextInput
                style={styles.input}
                placeholder="Enter shop name"
                placeholderTextColor={colors.gray[400]}
                value={shopName}
                onChangeText={setShopName}
            />

            <Text style={styles.label}>Address *</Text>
            <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="Enter shop address"
                placeholderTextColor={colors.gray[400]}
                value={address}
                onChangeText={setAddress}
                multiline
                numberOfLines={3}
            />

            <Text style={styles.label}>Phone *</Text>
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
                    <Text style={styles.label}>Logo (optional)</Text>
                    <TouchableOpacity style={styles.logoButton} onPress={pickLogo}>
                        <Ionicons name="image-outline" size={20} color={colors.white} />
                        <Text style={styles.logoButtonText}>Choose Image</Text>
                    </TouchableOpacity>
                </View>
                {logoUri && <Image source={{ uri: logoUri }} style={styles.logoPreview} />}
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Admin Credentials</Text>

            <Text style={styles.label}>Admin Username *</Text>
            <TextInput
                style={styles.input}
                placeholder="Admin username"
                placeholderTextColor={colors.gray[400]}
                value={adminUsername}
                onChangeText={setAdminUsername}
                autoCapitalize="none"
            />

            <Text style={styles.label}>Admin Password *</Text>
            <TextInput
                style={styles.input}
                placeholder="Admin password"
                placeholderTextColor={colors.gray[400]}
                value={adminPassword}
                onChangeText={setAdminPassword}
                secureTextEntry
            />

            <View style={styles.buttonRow}>
                <TouchableOpacity style={[styles.saveButton, isSaving && styles.disabled]} disabled={isSaving} onPress={handleSaveAndRestart}>
                    <Text style={styles.saveButtonText}>{isSaving ? 'Saving...' : 'Save & Restart'}</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.cancelButton, isSaving && styles.disabled]} disabled={isSaving} onPress={handleCancel}>
                    <Text style={styles.cancelButtonText}>Cancel (Use Demo Defaults)</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        backgroundColor: colors.background,
        flexGrow: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: fontSize.xxl,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    subtitle: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginTop: spacing.xs,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text.primary,
        marginTop: spacing.md,
        marginBottom: spacing.xs,
    },
    input: {
        backgroundColor: colors.white,
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
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        gap: spacing.md,
    },
    logoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.accent,
        paddingVertical: spacing.sm,
        paddingHorizontal: spacing.md,
        borderRadius: borderRadius.md,
    },
    logoButtonText: {
        color: colors.primary,
        fontWeight: fontWeight.bold,
    },
    logoPreview: {
        width: 64,
        height: 64,
        borderRadius: borderRadius.md,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    saveButton: {
        marginTop: spacing.lg,
        backgroundColor: colors.accent,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
        width: '100%',
    },
    saveButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.primary,
    },
    cancelButton: {
        marginTop: spacing.md,
        paddingVertical: spacing.md,
        alignItems: 'center',
        width: '100%',
    },
    cancelButtonText: {
        fontSize: fontSize.md,
        color: colors.text.secondary,
        textDecorationLine: 'underline',
    },
    secondaryButton: {
        flex: 1,
        marginTop: spacing.lg,
        backgroundColor: colors.gray[200],
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        alignItems: 'center',
    },
    secondaryButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    buttonRow: {
        marginTop: spacing.md,
        width: '100%',
    },
    disabled: {
        opacity: 0.7,
    },
});


