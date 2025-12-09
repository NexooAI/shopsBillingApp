import React, { useState, useMemo } from 'react';
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
import { Bill } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  value: string;
  subtitle?: string;
  color: string;
}

function StatCard({ icon, title, value, subtitle, color }: StatCardProps) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIconBg, { backgroundColor: color + '15' }]}>
        <Ionicons name={icon} size={28} color={color} />
      </View>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
}

interface BillCardProps {
  bill: Bill;
  onPress: () => void;
}

function BillCard({ bill, onPress }: BillCardProps) {
  const time = new Date(bill.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity style={styles.billCard} onPress={onPress}>
      <View style={styles.billHeader}>
        <View style={styles.billIdContainer}>
          <Ionicons name="receipt-outline" size={16} color={colors.primary} />
          <Text style={styles.billId}>#{bill.id.slice(-6)}</Text>
        </View>
        <Text style={styles.billTime}>{time}</Text>
      </View>
      <View style={styles.billDetails}>
        <Text style={styles.billItemCount}>{itemCount} items</Text>
        <Text style={styles.billTotal}>₹{bill.total.toFixed(2)}</Text>
      </View>
      <View style={styles.billFooter}>
        <Text style={styles.gstInfo}>
          GST: ₹{bill.gstAmount.toFixed(2)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.gray[400]} />
      </View>
    </TouchableOpacity>
  );
}

export default function SalesSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, getDailySales } = useApp();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const dailySales = useMemo(() => {
    return getDailySales(selectedDate);
  }, [selectedDate, state.bills]);

  const dates = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date);
    }
    return result;
  }, []);

  const isToday = selectedDate.toDateString() === new Date().toDateString();
  const dateLabel = isToday
    ? "Today's Sales"
    : selectedDate.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });

  // Calculate average bill value
  const avgBillValue =
    dailySales.totalCustomers > 0
      ? dailySales.totalRevenue / dailySales.totalCustomers
      : 0;

  // Calculate GST collected
  const gstCollected = dailySales.bills.reduce(
    (sum, bill) => sum + bill.gstAmount,
    0
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Date Selector */}
      <View style={styles.dateSection}>
        <Text style={styles.sectionTitle}>Select Date</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.dateSelector}
        >
          {dates.map((date, index) => {
            const isSelected = date.toDateString() === selectedDate.toDateString();
            const isTodayDate = date.toDateString() === new Date().toDateString();
            return (
              <TouchableOpacity
                key={index}
                style={[styles.dateCard, isSelected && styles.dateCardSelected]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, isSelected && styles.dateDaySelected]}>
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text style={[styles.dateNum, isSelected && styles.dateNumSelected]}>
                  {date.getDate()}
                </Text>
                {isTodayDate && (
                  <View style={[styles.todayDot, isSelected && styles.todayDotSelected]} />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{dateLabel}</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            title="Total Revenue"
            value={`₹${dailySales.totalRevenue.toFixed(0)}`}
            subtitle="Including GST"
            color={colors.success}
          />
          <StatCard
            icon="receipt-outline"
            title="Total Bills"
            value={dailySales.totalCustomers.toString()}
            subtitle="Customers served"
            color={colors.info}
          />
          <StatCard
            icon="cube-outline"
            title="Products Sold"
            value={dailySales.totalProducts.toString()}
            subtitle="Total quantity"
            color={colors.warning}
          />
          <StatCard
            icon="calculator-outline"
            title="Avg Bill Value"
            value={`₹${avgBillValue.toFixed(0)}`}
            subtitle="Per customer"
            color={colors.secondary}
          />
        </View>
      </View>

      {/* GST Summary */}
      <View style={styles.gstSection}>
        <Text style={styles.sectionTitle}>Tax Summary</Text>
        <View style={styles.gstCard}>
          <View style={styles.gstRow}>
            <View style={styles.gstItem}>
              <Text style={styles.gstLabel}>Subtotal (excl. GST)</Text>
              <Text style={styles.gstValue}>
                ₹{(dailySales.totalRevenue - gstCollected).toFixed(2)}
              </Text>
            </View>
            <View style={styles.gstDivider} />
            <View style={styles.gstItem}>
              <Text style={styles.gstLabel}>GST Collected</Text>
              <Text style={[styles.gstValue, { color: colors.success }]}>
                ₹{gstCollected.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Recent Bills */}
      <View style={styles.billsSection}>
        <View style={styles.billsHeader}>
          <Text style={styles.sectionTitle}>Bills</Text>
          <Text style={styles.billCount}>{dailySales.bills.length} bills</Text>
        </View>

        {dailySales.bills.length > 0 ? (
          dailySales.bills
            .slice()
            .reverse()
            .map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onPress={() => navigation.navigate('BillPreview', { bill })}
              />
            ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Bills</Text>
            <Text style={styles.emptySubtitle}>
              No bills were generated on this day
            </Text>
          </View>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  dateSection: {
    backgroundColor: colors.white,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  dateSelector: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  dateCard: {
    width: 56,
    height: 72,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  dateCardSelected: {
    backgroundColor: colors.primary,
  },
  dateDay: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginBottom: 2,
  },
  dateDaySelected: {
    color: colors.gray[300],
  },
  dateNum: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  dateNumSelected: {
    color: colors.white,
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.accent,
    marginTop: spacing.xs,
  },
  todayDotSelected: {
    backgroundColor: colors.white,
  },
  statsSection: {
    paddingTop: spacing.lg,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  statCard: {
    width: (width - spacing.md * 2 - spacing.sm) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    ...shadows.small,
  },
  statIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statTitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  statValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  statSubtitle: {
    fontSize: fontSize.xs,
    color: colors.gray[400],
    marginTop: 2,
  },
  gstSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  gstCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.small,
  },
  gstRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gstItem: {
    flex: 1,
    alignItems: 'center',
  },
  gstDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  gstLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  gstValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  billsSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  billsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  billCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  billCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  billHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  billIdContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  billId: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  billTime: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  billDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billItemCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  billTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  billFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  gstInfo: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

