import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  color: string;
  onPress: () => void;
}

function QuickActionCard({ icon, title, subtitle, color, onPress }: QuickActionProps) {
  return (
    <TouchableOpacity style={styles.quickActionCard} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.quickActionTitle}>{title}</Text>
      <Text style={styles.quickActionSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
  );
}

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  color: string;
}

function StatCard({ icon, title, value, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
    </View>
  );
}

export default function DashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, logout, getDailySales } = useApp();
  const isSuperAdmin = state.user?.role === 'super_admin';
  const isAdmin = state.user?.role === 'admin' || isSuperAdmin;
  const dailySales = getDailySales();

  const quickActions = isAdmin
    ? [
        {
          icon: 'grid-outline' as const,
          title: 'Categories',
          subtitle: 'Manage categories',
          color: colors.categories.grocery,
          onPress: () => navigation.navigate('CategoryManagement'),
        },
        {
          icon: 'cube-outline' as const,
          title: 'Products',
          subtitle: 'Add & edit',
          color: colors.categories.vegetables,
          onPress: () => navigation.navigate('ProductManagement'),
        },
        {
          icon: 'people-outline' as const,
          title: 'Users',
          subtitle: 'Manage staff',
          color: colors.categories.fruits,
          onPress: () => navigation.navigate('UserManagement'),
        },
        {
          icon: 'cloud-upload-outline' as const,
          title: 'Bulk Upload',
          subtitle: 'Excel import',
          color: colors.categories.dairy,
          onPress: () => navigation.navigate('BulkUpload'),
        },
      ]
    : [
        {
          icon: 'cart-outline' as const,
          title: 'New Bill',
          subtitle: 'Start billing',
          color: colors.accent,
          onPress: () => navigation.navigate('Main', { screen: 'Billing' } as any),
        },
        {
          icon: 'grid-outline' as const,
          title: 'Products',
          subtitle: 'View catalog',
          color: colors.secondary,
          onPress: () => navigation.navigate('Main', { screen: 'Products' } as any),
        },
      ];

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{state.user?.username || 'User'}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color={colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton} onPress={logout}>
              <Ionicons name="log-out-outline" size={24} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Role Badge */}
        <View style={[
          styles.roleBadge, 
          isSuperAdmin ? styles.superAdminBadge : (isAdmin ? styles.adminBadge : styles.userBadge)
        ]}>
          <Ionicons
            name={isSuperAdmin ? 'shield-checkmark' : (isAdmin ? 'shield' : 'person')}
            size={14}
            color={isSuperAdmin ? colors.error : (isAdmin ? colors.accent : colors.secondary)}
          />
          <Text style={[
            styles.roleText, 
            isSuperAdmin ? styles.superAdminText : (isAdmin ? styles.adminText : styles.userText)
          ]}>
            {isSuperAdmin ? 'Super Administrator' : (isAdmin ? 'Administrator' : 'Staff Member')}
          </Text>
        </View>
      </View>

      {/* Today's Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            title="Revenue"
            value={`₹${dailySales.totalRevenue.toFixed(0)}`}
            color={colors.success}
          />
          <StatCard
            icon="receipt-outline"
            title="Bills"
            value={dailySales.totalCustomers.toString()}
            color={colors.info}
          />
          <StatCard
            icon="cube-outline"
            title="Products"
            value={state.products.length.toString()}
            color={colors.warning}
          />
          <StatCard
            icon="layers-outline"
            title="Categories"
            value={state.categories.length.toString()}
            color={colors.secondary}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          {quickActions.map((action, index) => (
            <QuickActionCard key={index} {...action} />
          ))}
        </View>
      </View>

      {/* Recent Activity (Admin only) */}
      {isAdmin && dailySales.bills.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Bills</Text>
          <View style={styles.recentBills}>
            {dailySales.bills.slice(-3).reverse().map((bill) => (
              <TouchableOpacity
                key={bill.id}
                style={styles.recentBillCard}
                onPress={() => navigation.navigate('BillPreview', { bill })}
              >
                <View style={styles.billInfo}>
                  <Text style={styles.billId}>Bill #{bill.id.slice(-6)}</Text>
                  <Text style={styles.billTime}>
                    {new Date(bill.createdAt).toLocaleTimeString()}
                  </Text>
                </View>
                <Text style={styles.billAmount}>₹{bill.total.toFixed(2)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Admin Quick Links */}
      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Admin Panel</Text>
          <View style={styles.adminLinks}>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('CategoryManagement')}
            >
              <Ionicons name="folder-outline" size={20} color={colors.primary} />
              <Text style={styles.adminLinkText}>Category Management</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('ProductManagement')}
            >
              <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
              <Text style={styles.adminLinkText}>Product Management</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Ionicons name="people-outline" size={20} color={colors.primary} />
              <Text style={styles.adminLinkText}>User Management</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: fontSize.md,
    color: colors.gray[400],
  },
  userName: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
    color: colors.white,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  superAdminBadge: {
    backgroundColor: colors.error + '20',
  },
  adminBadge: {
    backgroundColor: colors.accent + '20',
  },
  userBadge: {
    backgroundColor: colors.secondary + '20',
  },
  roleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
  },
  superAdminText: {
    color: colors.error,
  },
  adminText: {
    color: colors.accent,
  },
  userText: {
    color: colors.secondary,
  },
  section: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.small,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickActionCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionTitle: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  recentBills: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  recentBillCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  billInfo: {
    flex: 1,
  },
  billId: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  billTime: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  billAmount: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  adminLinks: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    ...shadows.small,
  },
  adminLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  adminLinkText: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

