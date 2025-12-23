
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { resetAppData } from '../../services/sqliteDatabase';
import { ColorPalette } from '../../theme/colors';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
  colors: ColorPalette;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement, danger, colors }: SettingItemProps) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>
        <Ionicons name={icon} size={22} color={danger ? colors.error : colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
      ))}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const navigation = useNavigation();
  const { state, logout, factoryReset } = useApp();
  const { colors, toggleTheme, isDark } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const isAdmin = state.user?.role === 'admin';
  const styles = useMemo(() => createStyles(colors), [colors]);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleSoftReset = () => {
    Alert.alert(
      'Reset App Data',
      'This will delete all business data (Bills, Products, Customers, Categories) but PRESERVE your Admin account. You will remain logged in.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAppData();
              Alert.alert('Success', 'Business data has been reset.');
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  const handleFactoryReset = () => {
    Alert.alert(
      'Factory Reset',
      'This will permanently delete ALL data including shop settings, products, bills, and users. The app will return to the initial setup screen. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Factory Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await factoryReset();
              // Navigation will automatically update based on state specific changes (isAuthenticated=false, isSetupComplete=false)
            } catch (error) {
              console.error('Reset error:', error);
              Alert.alert('Error', 'Failed to reset data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      {/* User Profile */}
      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Ionicons
            name={isAdmin ? 'shield' : 'person'}
            size={40}
            color={colors.white}
          />
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>{state.user?.username}</Text>
          <Text style={styles.profileRole}>
            {isAdmin ? 'Administrator' : 'Staff Member'}
          </Text>
        </View>
      </View>

      {/* General Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>General</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="storefront"
            title="Shop Information"
            subtitle="Name, address, contact"
            onPress={() => navigation.navigate('ShopProfile' as never)}
            colors={colors}
          />
          <SettingItem
            icon="image"
            title="Logo & Branding"
            subtitle="Bill header logo"
            onPress={() => navigation.navigate('ShopProfile' as never)}
            colors={colors}
          />
          <SettingItem
            icon="print"
            title="Printer Settings"
            subtitle="Wired & Bluetooth printer setup"
            onPress={() => navigation.navigate('PrinterSettings' as never)}
            colors={colors}
          />
        </View>
      </View>

      {/* Admin Settings */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Administration</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="people"
              title="User Management"
              subtitle="Add and manage staff"
              onPress={() => navigation.navigate('UserManagement' as never)}
              colors={colors}
            />
            <SettingItem
              icon="layers"
              title="Category Management"
              subtitle="Organize product categories"
              onPress={() => navigation.navigate('CategoryManagement' as never)}
              colors={colors}
            />
            <SettingItem
              icon="pricetag"
              title="Product Management"
              subtitle="Add and edit products"
              onPress={() => navigation.navigate('ProductManagement' as never)}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* GST Settings */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Tax & GST</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="calculator"
              title="GST Configuration"
              subtitle="Set default GST rates"
              onPress={() => Alert.alert('GST', 'Configure GST settings')}
              colors={colors}
            />
            <SettingItem
              icon="document-text"
              title="GSTIN Details"
              subtitle="Business registration"
              onPress={() => Alert.alert('GSTIN', 'Enter your GSTIN number')}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>{t('settings.appSettings')}</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="language"
            title={t('settings.language')}
            subtitle={language === 'en' ? 'English' : 'தமிழ்'}
            onPress={toggleLanguage}
            colors={colors}
          />
          <SettingItem
            icon="notifications"
            title="Notifications"
            rightElement={
              <Switch
                value={true}
                onValueChange={() => { }}
                trackColor={{ false: colors.gray[300], true: colors.accent + '50' }}
                thumbColor={colors.accent}
              />
            }
            colors={colors}
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            rightElement={
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: colors.gray[300], true: colors.accent + '50' }}
                thumbColor={isDark ? colors.accent : colors.gray[100]}
              />
            }
            colors={colors}
          />
        </View>
      </View>

      {/* Data Management */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>Data</Text>
          <View style={styles.sectionContent}>
            <SettingItem
              icon="sync"
              title="Server Sync"
              subtitle="Backup data to server"
              onPress={() => navigation.navigate('ServerSync' as never)}
              colors={colors}
            />
            <SettingItem
              icon="cloud-download"
              title="Export Data"
              subtitle="Download all data as Excel"
              onPress={() => Alert.alert('Export', 'Export functionality')}
              colors={colors}
            />
            <SettingItem
              icon="refresh-circle"
              title="Reset App Data"
              subtitle="Clear data, keep Admin"
              danger
              onPress={handleSoftReset}
              colors={colors}
            />
            <SettingItem
              icon="trash"
              title="Factory Reset"
              subtitle="Erase everything"
              danger
              onPress={handleFactoryReset}
              colors={colors}
            />
          </View>
        </View>
      )}

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>About</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="information-circle"
            title="App Version"
            subtitle="1.0.0"
            colors={colors}
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            onPress={() => Alert.alert('Support', 'Contact support@shopbill.com')}
            colors={colors}
          />
          <SettingItem
            icon="document"
            title="Terms & Privacy"
            onPress={() => Alert.alert('Terms', 'View terms and privacy policy')}
            colors={colors}
          />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Ionicons name="log-out" size={22} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const createStyles = (colors: ColorPalette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginLeft: spacing.lg,
  },
  profileName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  profileRole: {
    fontSize: fontSize.sm,
    color: colors.gray[300], // Adjust for dark mode if needed
    marginTop: 4,
  },
  section: {
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionContent: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  dangerIcon: {
    backgroundColor: colors.errorLight + '20', // opacity
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  dangerText: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.errorLight,
    marginBottom: spacing.xl,
  },
  logoutText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  bottomPadding: {
    height: 40,
  },
});

