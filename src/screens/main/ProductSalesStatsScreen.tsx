import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { getProductSalesStats } from '../../services/sqliteDatabase';
import { ProductSalesStat } from '../../types';

export default function ProductSalesStatsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductSalesStat[]>([]);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  useFocusEffect(
    React.useCallback(() => {
      loadStats();
    }, [dateRange])
  );

  const loadStats = async () => {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();
    
    if (dateRange === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (dateRange === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (dateRange === 'month') {
      startDate.setDate(now.getDate() - 30);
    }

    try {
      const data = await getProductSalesStats(startDate, now);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item, index }: { item: ProductSalesStat; index: number }) => (
    <View style={styles.statRow}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>#{index + 1}</Text>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.productName}</Text>
        <Text style={styles.productQty}>{item.quantitySold} units sold</Text>
      </View>
      <View style={styles.revenueContainer}>
        <Text style={styles.revenueText}>₹{item.totalRevenue.toFixed(0)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Product Sales Analysis</Text>
      </View>

      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterChip, dateRange === 'today' && styles.activeFilter]}
          onPress={() => setDateRange('today')}
        >
          <Text style={[styles.filterText, dateRange === 'today' && styles.activeFilterText]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, dateRange === 'week' && styles.activeFilter]}
          onPress={() => setDateRange('week')}
        >
          <Text style={[styles.filterText, dateRange === 'week' && styles.activeFilterText]}>Last 7 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterChip, dateRange === 'month' && styles.activeFilter]}
          onPress={() => setDateRange('month')}
        >
          <Text style={[styles.filterText, dateRange === 'month' && styles.activeFilterText]}>Last 30 Days</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : stats.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="stats-chart-outline" size={48} color={colors.text.secondary} />
          <Text style={styles.emptyText}>No sales data for this period</Text>
        </View>
      ) : (
        <FlatList
          data={stats}
          renderItem={renderItem}
          keyExtractor={(item) => item.productId}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl, // For status bar
    paddingBottom: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    marginRight: spacing.md,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  activeFilter: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  activeFilterText: {
    color: colors.white,
    fontWeight: fontWeight.medium,
  },
  listContent: {
    padding: spacing.md,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  rankContainer: {
    width: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  rankText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    fontWeight: fontWeight.bold,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    color: colors.text.primary,
    fontWeight: fontWeight.medium,
  },
  productQty: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  revenueContainer: {
    alignItems: 'flex-end',
  },
  revenueText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.success,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
});
