import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { getLowStockProducts, getInventoryValue, getAllProducts, getTotalSalesPerProduct } from '../../services/sqliteDatabase';
import { Product } from '../../types';

export default function InventoryStatusScreen() {
  const navigation = useNavigation();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [inventoryValue, setInventoryValue] = useState(0);
  const [soldCountMap, setSoldCountMap] = useState<Map<string, number>>(new Map());
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      loadData();
    }, [])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [allProds, lowStock, value, salesMap] = await Promise.all([
        getAllProducts(),
        getLowStockProducts(10), // Threshold 10
        getInventoryValue(),
        getTotalSalesPerProduct(),
      ]);
      setProducts(allProds);
      setLowStockProducts(lowStock);
      setInventoryValue(value);
      setSoldCountMap(salesMap);
    } catch (error) {
      console.error('Error loading inventory data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return products;
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      p.nameEn.toLowerCase().includes(lowerQuery) || 
      (p.productCode && p.productCode.includes(lowerQuery))
    );
  }, [searchQuery, products]);

  const renderProductItem = ({ item }: { item: Product }) => (
    <View style={styles.productRow}>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{item.nameEn}</Text>
        <Text style={styles.productCode}>Code: {item.productCode || 'N/A'}</Text>
      </View>
      <View style={styles.stockInfo}>
        <Text style={[
          styles.stockText, 
          (item.stock || 0) <= 10 ? styles.lowStockText : styles.normalStockText
        ]}>
          {t('inventory.inStock')}: {item.stock || 0} {item.unit}
        </Text>
        <Text style={styles.soldText}>
          ({t('inventory.sold')}: {soldCountMap.get(item.id) || 0})
        </Text>
        <Text style={styles.stockValue}>
          {t('inventory.value')}: ₹{((item.stock || 0) * item.price).toFixed(0)}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
            </TouchableOpacity>
            <Text style={styles.title}>{t('inventory.title')}</Text>
        </View>

        {loading ? (
             <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Summary Cards */}
                <View style={styles.summaryGrid}>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{t('inventory.totalValue')}</Text>
                        <Text style={[styles.summaryValue, { color: colors.success }]}>
                            ₹{inventoryValue.toFixed(0)}
                        </Text>
                    </View>
                    <View style={styles.summaryCard}>
                        <Text style={styles.summaryLabel}>{t('inventory.lowStockItems')}</Text>
                        <Text style={[styles.summaryValue, { color: colors.error }]}>
                            {lowStockProducts.length}
                        </Text>
                    </View>
                </View>

                {/* Low Stock Alerts */}
                {lowStockProducts.length > 0 && (
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Ionicons name="warning-outline" size={20} color={colors.error} />
                            <Text style={[styles.sectionTitle, { color: colors.error }]}>{t('inventory.lowStockAlerts')}</Text>
                        </View>
                        {lowStockProducts.map(item => (
                            <View key={item.id} style={styles.alertRow}>
                                <Text style={styles.alertName}>{item.nameEn}</Text>
                                <Text style={styles.alertStock}>{item.stock || 0} {t('inventory.stockLeft')}</Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* All Inventory */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>{t('inventory.fullInventory')}</Text>
                    <View style={styles.searchBar}>
                        <Ionicons name="search-outline" size={20} color={colors.text.secondary} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder={t('inventory.searchPlaceholder')}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>
                    
                    {filteredProducts.map(item => (
                         <View key={item.id} style={styles.productRowWrapper}>
                            {renderProductItem({ item })}
                         </View>
                    ))}
                </View>
                
                <View style={styles.bottomPadding} />
            </ScrollView>
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
    paddingTop: spacing.xl,
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
  content: {
    padding: spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    ...shadows.small,
  },
  summaryLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    fontSize: fontSize.xxl,
    fontWeight: fontWeight.bold,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.error + '10', // Light red bg
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  },
  alertName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  alertStock: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.error,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    height: 48,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
  },
  productRowWrapper: {
      marginBottom: spacing.sm,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    ...shadows.small,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  productCode: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  stockInfo: {
    alignItems: 'flex-end',
  },
  stockText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
  },
  lowStockText: {
    color: colors.error,
  },
  normalStockText: {
    color: colors.primary,
  },
  stockValue: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  soldText: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});
