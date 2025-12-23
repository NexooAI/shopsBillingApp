import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Image, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function ShopProfileScreen() {
    const { state, updateShopSettings } = useApp();
    const navigation = useNavigation();

    const [shopName, setShopName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [gstin, setGstin] = useState('');
    const [logoUri, setLogoUri] = useState<string | undefined>(undefined);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (state.settings) {
            setShopName(state.settings.shopName || '');
            setAddress(state.settings.address || '');
            setPhone(state.settings.phone || '');
            setGstin(state.settings.gstin || '');
            setLogoUri(state.settings.logoUri);
        }
    }, [state.settings]);

    const pickLogo = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true, // We might need base64 for printing
        });

        if (!result.canceled && result.assets.length > 0) {
            // For printing, we prefer URI or Base64. 
            // The printer logic in PrinterService currently handles FS but storing base64 
            // might be heavy for DB. Storing URI is better, but cache issues.
            // Let's store URI.
            setLogoUri(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        if (!shopName.trim() || !address.trim() || !phone.trim() || phone.length < 10) {
            Alert.alert('Error', 'Please enter valid shop name, address and phone number');
            return;
        }

        setIsSaving(true);
        try {
            await updateShopSettings({
                shopName: shopName.trim(),
                address: address.trim(),
                phone: phone.trim(),
                gstin: gstin.trim(),
                logoUri,
            });
            Alert.alert('Success', 'Shop details updated successfully', [
                { text: 'OK', onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error('Error updating shop settings:', error);
            Alert.alert('Error', 'Failed to update settings');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1, backgroundColor: colors.background }}
        >
            <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
                
                {/* Logo Section */}
                <View style={styles.logoSection}>
                   <TouchableOpacity style={styles.logoContainer} onPress={pickLogo}>
                        {logoUri ? (
                            <Image source={{ uri: logoUri }} style={styles.logoImage} />
                        ) : (
                            <View style={styles.logoPlaceholder}>
                                <Ionicons name="image-outline" size={40} color={colors.gray[400]} />
                                <Text style={styles.logoPlaceholderText}>Tap to add Logo</Text>
                            </View>
                        )}
                        <View style={styles.editBadge}>
                            <Ionicons name="pencil" size={14} color={colors.white} />
                        </View>
                   </TouchableOpacity>
                   <Text style={styles.logoHelpText}>Tap to change shop logo</Text>
                </View>

                {/* Form Section */}
                <View style={styles.formSection}>
                    <Text style={styles.label}>Shop Name *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter shop name"
                        value={shopName}
                        onChangeText={setShopName}
                    />

                    <Text style={styles.label}>Address *</Text>
                    <TextInput
                        style={[styles.input, styles.multiline]}
                        placeholder="Enter full address"
                        value={address}
                        onChangeText={setAddress}
                        multiline
                        numberOfLines={3}
                    />

                    <Text style={styles.label}>Phone Number *</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="10-digit mobile number"
                        value={phone}
                        onChangeText={setPhone}
                        keyboardType="phone-pad"
                        maxLength={10}
                    />
                    
                    <Text style={styles.label}>GSTIN (Optional)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="GST Number"
                        value={gstin}
                        onChangeText={setGstin}
                        autoCapitalize="characters"
                    />
                </View>

                <TouchableOpacity 
                    style={[styles.saveButton, isSaving && styles.disabled]} 
                    onPress={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <ActivityIndicator color={colors.white} />
                    ) : (
                        <>
                            <Ionicons name="save-outline" size={20} color={colors.white} />
                            <Text style={styles.saveButtonText}>Save Changes</Text>
                        </>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: spacing.lg,
        paddingBottom: spacing.xxl,
    },
    logoSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logoContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.medium,
        position: 'relative',
    },
    logoImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    logoPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoPlaceholderText: {
        fontSize: fontSize.xs,
        color: colors.gray[500],
        marginTop: spacing.xs,
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    logoHelpText: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginTop: spacing.sm,
    },
    formSection: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        ...shadows.small,
        marginBottom: spacing.xl,
    },
    label: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
        marginTop: spacing.md,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
        color: colors.text.primary,
        backgroundColor: colors.gray[50],
    },
    multiline: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    saveButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
        ...shadows.medium,
    },
    saveButtonText: {
        color: colors.white,
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
    },
    disabled: {
        opacity: 0.7,
    },
});
