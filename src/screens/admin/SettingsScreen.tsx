import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, rightElement, danger }: SettingItemProps) {
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
  const { state, logout } = useApp();
  const isAdmin = state.user?.role === 'admin';

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: logout },
    ]);
  };

  const handleResetData = () => {
    Alert.alert(
      'Reset All Data',
      'This will delete all products, categories, bills, and users (except master account). This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Demo', 'Data reset would happen in production');
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
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
            onPress={() => Alert.alert('Shop Info', 'Edit shop details here')}
          />
          <SettingItem
            icon="image"
            title="Logo & Branding"
            subtitle="Bill header logo"
            onPress={() => Alert.alert('Logo', 'Upload shop logo for bills')}
          />
          <SettingItem
            icon="print"
            title="Printer Settings"
            subtitle="Wired & Bluetooth printer setup"
            onPress={() => navigation.navigate('PrinterSettings' as never)}
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
            />
            <SettingItem
              icon="layers"
              title="Category Management"
              subtitle="Organize product categories"
              onPress={() => navigation.navigate('CategoryManagement' as never)}
            />
            <SettingItem
              icon="pricetag"
              title="Product Management"
              subtitle="Add and edit products"
              onPress={() => navigation.navigate('ProductManagement' as never)}
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
            />
            <SettingItem
              icon="document-text"
              title="GSTIN Details"
              subtitle="Business registration"
              onPress={() => Alert.alert('GSTIN', 'Enter your GSTIN number')}
            />
          </View>
        </View>
      )}

      {/* App Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionHeader}>App Settings</Text>
        <View style={styles.sectionContent}>
          <SettingItem
            icon="language"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Choose app language')}
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
          />
          <SettingItem
            icon="moon"
            title="Dark Mode"
            rightElement={
              <Switch
                value={false}
                onValueChange={() => Alert.alert('Theme', 'Dark mode coming soon!')}
                trackColor={{ false: colors.gray[300], true: colors.accent + '50' }}
                thumbColor={colors.gray[100]}
              />
            }
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
            />
            <SettingItem
              icon="cloud-download"
              title="Export Data"
              subtitle="Download all data as Excel"
              onPress={() => Alert.alert('Export', 'Export functionality')}
            />
            <SettingItem
              icon="trash"
              title="Reset All Data"
              danger
              onPress={handleResetData}
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
          />
          <SettingItem
            icon="help-circle"
            title="Help & Support"
            onPress={() => Alert.alert('Support', 'Contact support@shopbill.com')}
          />
          <SettingItem
            icon="document"
            title="Terms & Privacy"
            onPress={() => Alert.alert('Terms', 'View terms and privacy policy')}
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

const styles = StyleSheet.create({
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
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginTop: 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dangerIcon: {
    backgroundColor: colors.error + '15',
  },
  settingContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  settingTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  dangerText: {
    color: colors.error,
  },
  settingSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    ...shadows.small,
  },
  logoutText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

