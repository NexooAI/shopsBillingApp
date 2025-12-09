import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ProductCardProps {
  product: Product;
  categoryName: string;
  onEdit: () => void;
  onDelete: () => void;
}

function ProductCard({ product, categoryName, onEdit, onDelete }: ProductCardProps) {
  return (
    <View style={styles.productCard}>
      <View style={styles.productImagePlaceholder}>
        <Ionicons name="cube-outline" size={28} color={colors.gray[400]} />
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productNameEn}>{product.nameEn}</Text>
        <Text style={styles.productNameTa}>{product.nameTa}</Text>
        <View style={styles.productMeta}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryBadgeText}>{categoryName}</Text>
          </View>
          <Text style={styles.gstInfo}>
            GST: {product.gstPercentage}% {product.isGstInclusive ? '(Incl.)' : ''}
          </Text>
        </View>
      </View>
      <View style={styles.priceSection}>
        <Text style={styles.price}>₹{product.price}</Text>
        <Text style={styles.unit}>/{product.unit}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={18} color={colors.info} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ProductManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, dispatch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredProducts = useMemo(() => {
    let products = state.products;

    if (selectedCategory) {
      products = products.filter((p) => p.categoryId === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      products = products.filter(
        (p) =>
          p.nameEn.toLowerCase().includes(query) ||
          p.nameTa.includes(searchQuery)
      );
    }

    return products;
  }, [state.products, selectedCategory, searchQuery]);

  const getCategoryName = (categoryId: string) => {
    return state.categories.find((c) => c.id === categoryId)?.nameEn || 'Unknown';
  };

  const handleDeleteProduct = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.nameEn}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_PRODUCT', payload: product.id });
          },
        },
      ]
    );
  };

  const handleEditProduct = (product: Product) => {
    // Navigate to edit screen (reusing AddProduct screen)
    navigation.navigate('AddProduct', { categoryId: product.categoryId });
  };

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.filterSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search products..."
            placeholderTextColor={colors.gray[400]}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
            </TouchableOpacity>
          )}
        </View>

        {/* Category Filter */}
        <FlatList
          horizontal
          data={[{ id: null, nameEn: 'All' }, ...state.categories]}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                selectedCategory === item.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === item.id && styles.filterChipTextActive,
                ]}
              >
                {item.nameEn}
              </Text>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id || 'all'}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.actionButtonLarge}
          onPress={() => navigation.navigate('AddProduct', {})}
        >
          <Ionicons name="add-circle" size={20} color={colors.white} />
          <Text style={styles.actionButtonText}>Add Product</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButtonLarge, styles.secondaryButton]}
          onPress={() => navigation.navigate('BulkUpload')}
        >
          <Ionicons name="cloud-upload" size={20} color={colors.primary} />
          <Text style={styles.secondaryButtonText}>Bulk Upload</Text>
        </TouchableOpacity>
      </View>

      {/* Products List */}
      <FlatList
        data={filteredProducts}
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            categoryName={getCategoryName(item.categoryId)}
            onEdit={() => handleEditProduct(item)}
            onDelete={() => handleDeleteProduct(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Products Found</Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery || selectedCategory
                ? 'Try different search or filter'
                : 'Add products to get started'}
            </Text>
          </View>
        }
        ListHeaderComponent={
          <Text style={styles.resultCount}>
            {filteredProducts.length} products
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterSection: {
    backgroundColor: colors.white,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  filterChips: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.gray[100],
    marginRight: spacing.sm,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  filterChipTextActive: {
    color: colors.white,
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  actionButtonLarge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  secondaryButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  actionButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.white,
  },
  secondaryButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
    paddingTop: 0,
  },
  resultCount: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  productImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  productNameEn: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  productNameTa: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  productMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
    gap: spacing.sm,
  },
  categoryBadge: {
    backgroundColor: colors.primaryLight + '30',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  categoryBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
    color: colors.primary,
  },
  gstInfo: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  priceSection: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  price: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  unit: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  actions: {
    gap: spacing.xs,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
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
    textAlign: 'center',
  },
});

