import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
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

function BillGridCard({ bill, onPress }: BillCardProps) {
  const time = new Date(bill.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const itemCount = bill.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <TouchableOpacity style={styles.billGridCard} onPress={onPress}>
      <View style={styles.gridHeader}>
        <Text style={styles.billId}>#{bill.id.slice(-6)}</Text>
        <Text style={styles.billTime}>{time}</Text>
      </View>
      <View style={styles.gridContent}>
        <Text style={styles.gridTotal}>₹{bill.total.toFixed(2)}</Text>
        <Text style={styles.gridItems}>{itemCount} items</Text>
      </View>
      <Text style={styles.gridGst}>GST: ₹{bill.gstAmount.toFixed(2)}</Text>
    </TouchableOpacity>
  );
}

export default function SalesSummaryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, getSalesStats } = useApp();
  const { t, language } = useLanguage();
  const [rangeType, setRangeType] = useState<'daily' | 'weekly' | 'monthly' | 'custom'>('daily');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const onDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      setRangeType('daily');
    }
  };

  // Date ranges for stats
  const stats = useMemo(() => {
    let start = new Date(selectedDate);
    let end = new Date(selectedDate);

    if (rangeType === 'daily') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (rangeType === 'weekly') {
      // Last 7 days including today
      start = new Date();
      start.setDate(start.getDate() - 6);
      start.setHours(0, 0, 0, 0);
      end = new Date();
    } else if (rangeType === 'monthly') {
      // Current month
      start = new Date();
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
      end = new Date();
    }

    return getSalesStats(start, end);
  }, [rangeType, selectedDate, state.bills]);

  const dates = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(date);
    }
    return result;
  }, []);

  const getLabel = () => {
      if (rangeType === 'daily') {
          return selectedDate.toDateString() === new Date().toDateString() 
            ? t('sales.todaysSales') 
            : selectedDate.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US');
      }
      if (rangeType === 'weekly') return t('sales.last7Days');
      if (rangeType === 'monthly') return t('sales.thisMonth');
      return t('sales.salesSummary');
  };

  const salesData = stats || { totalRevenue: 0, totalProducts: 0, totalCustomers: 0, bills: [] };

  // Calculate average bill value
  const avgBillValue =
    salesData.totalCustomers > 0
      ? salesData.totalRevenue / salesData.totalCustomers
      : 0;

  // Calculate GST collected
  const gstCollected = salesData.bills.reduce(
    (sum, bill) => sum + bill.gstAmount,
    0
  );
  
  const handleBillPress = (bill: Bill) => {
    const userRole = state.user?.role;
    if (userRole === 'admin' || userRole === 'super_admin') {
       navigation.navigate('BillPreview', { bill });
    } else {
       Alert.alert(t('common.error'), 'Access Restricted: Only Admin can view/edit bill details.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Range Selector */}
      <View style={styles.dateSection}>
        <View style={styles.rangeTabs}>
            {(['daily', 'weekly', 'monthly'] as const).map((type) => (
                <TouchableOpacity
                    key={type}
                    style={[styles.rangeTab, rangeType === type && styles.rangeTabActive]}
                    onPress={() => setRangeType(type)}
                >
                    <Text style={[styles.rangeTabText, rangeType === type && styles.rangeTabTextActive]}>
                        {t(`sales.${type}`)}
                    </Text>
                </TouchableOpacity>
            ))}
            <TouchableOpacity 
                style={[styles.rangeTab, { paddingHorizontal: spacing.sm }]} 
                onPress={() => setShowDatePicker(true)}
            >
                <Ionicons name="calendar-outline" size={18} color={colors.text.secondary} />
            </TouchableOpacity>
        </View>

        {showDatePicker && (
            <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
            />
        )}

        {rangeType === 'daily' && (
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
                    {date.toLocaleDateString(language === 'ta' ? 'ta-IN' : 'en-US', { weekday: 'short' })}
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
        )}
      </View>

      {/* Stats Overview */}
      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>{getLabel()}</Text>
        <View style={styles.statsGrid}>
          <StatCard
            icon="cash-outline"
            title={t('sales.totalRevenue')}
            value={`₹${salesData.totalRevenue.toFixed(0)}`}
            subtitle={t('sales.includingGst')}
            color={colors.success}
          />
          <StatCard
            icon="receipt-outline"
            title={t('sales.totalBills')}
            value={salesData.totalCustomers.toString()}
            subtitle={t('sales.customersServed')}
            color={colors.info}
          />
          <StatCard
            icon="cube-outline"
            title={t('sales.productsSold')}
            value={salesData.totalProducts.toString()}
            subtitle={t('sales.totalQuantity')}
            color={colors.warning}
          />
          <StatCard
            icon="calculator-outline"
            title={t('sales.avgBillValue')}
            value={`₹${avgBillValue.toFixed(0)}`}
            subtitle={t('sales.perCustomer')}
            color={colors.secondary}
          />
        </View>
      </View>

      {/* Product Breakdown Link */}
      <View style={{ paddingHorizontal: spacing.lg, marginBottom: spacing.md }}>
        <TouchableOpacity
          style={styles.breakdownButton}
          onPress={() => navigation.navigate('ProductSalesStats')}
        >
          <Text style={styles.breakdownButtonText}>{t('sales.viewBreakdown')}</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* GST Summary */}
      <View style={styles.gstSection}>
        <Text style={styles.sectionTitle}>{t('sales.taxSummary')}</Text>
        <View style={styles.gstCard}>
          <View style={styles.gstRow}>
            <View style={styles.gstItem}>
              <Text style={styles.gstLabel}>{t('sales.subtotalExclGst')}</Text>
              <Text style={styles.gstValue}>
                ₹{(salesData.totalRevenue - gstCollected).toFixed(2)}
              </Text>
            </View>
            <View style={styles.gstDivider} />
            <View style={styles.gstItem}>
              <Text style={styles.gstLabel}>{t('sales.gstCollected')}</Text>
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
          <View style={styles.billsTitleRow}>
            <Text style={styles.sectionTitle}>{t('dashboard.bills')}</Text>
            <Text style={styles.billCount}>{salesData.bills.length} {t('dashboard.bills')}</Text>
          </View>
          <TouchableOpacity 
            style={styles.viewToggle}
            onPress={() => setViewMode(prev => prev === 'list' ? 'grid' : 'list')}
          >
            <Ionicons 
              name={viewMode === 'list' ? 'grid-outline' : 'list-outline'} 
              size={20} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        </View>

        {salesData.bills.length > 0 ? (
          viewMode === 'list' ? (
            salesData.bills
              .slice()
              .reverse()
              .map((bill) => (
                <BillCard
                  key={bill.id}
                  bill={bill}
                  onPress={() => handleBillPress(bill)}
                />
              ))
          ) : (
            <View style={styles.gridContainer}>
              {salesData.bills
                .slice()
                .reverse()
                .map((bill) => (
                  <BillGridCard
                    key={bill.id}
                    bill={bill}
                    onPress={() => handleBillPress(bill)}
                  />
                ))}
            </View>
          )
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>{t('sales.noBills')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('sales.noBillsMessage')}
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
    paddingBottom: spacing.sm,
  },
  rangeTabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  rangeTab: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  rangeTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  rangeTabText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.medium,
  },
  rangeTabTextActive: {
    color: colors.white,
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
    paddingRight: spacing.lg,
  },
  billsTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  viewToggle: {
    padding: spacing.xs,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
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
  breakdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  breakdownButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  billGridCard: {
    width: '48%',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.small,
  },
  gridHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  gridContent: {
    marginBottom: spacing.sm,
  },
  gridTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  gridItems: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  gridGst: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
});

