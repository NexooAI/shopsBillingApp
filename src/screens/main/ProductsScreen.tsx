import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { useLanguage } from '../../context/LanguageContext';
import { Product, Category, CartItem } from '../../types';

const { width } = Dimensions.get('window');
const CATEGORY_WIDTH = 80;

type ViewMode = 'grid' | 'list';

interface ProductCardProps {
  product: Product;
  viewMode: ViewMode;
  cartItem?: CartItem;
  onAddToCart: () => void;
  onIncrement: () => void;
  onDecrement: () => void;
}

function ProductCard({ product, viewMode, cartItem, onAddToCart, onIncrement, onDecrement }: ProductCardProps) {
  const { t } = useLanguage();
  const gstLabel = product.isGstInclusive 
    ? t('products.gstInclusive') 
    : t('products.plusGst').replace('%s', product.gstPercentage.toString());
  const quantity = cartItem?.quantity || 0;

  // Render product image or placeholder
  const renderImage = (size: 'large' | 'small') => {
    const isLarge = size === 'large';
    const imageSize = isLarge ? 32 : 24;

    if (product.imageUri) {
      return (
        <Image
          source={{ uri: product.imageUri }}
          style={isLarge ? styles.productImageGrid : styles.productImageListImg}
          resizeMode="cover"
        />
      );
    }
    return <Ionicons name="cube-outline" size={imageSize} color={colors.gray[400]} />;
  };

  // Render quantity controls or add button
  const renderQuantityControls = (isGrid: boolean) => {
    if (quantity > 0) {
      return (
        <View style={isGrid ? styles.quantityControlsGrid : styles.quantityControlsList}>
          <TouchableOpacity
            style={[styles.quantityButton, styles.decrementButton]}
            onPress={onDecrement}
          >
            <Ionicons name={quantity === 1 ? "trash-outline" : "remove"} size={16} color={colors.white} />
          </TouchableOpacity>
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
          <TouchableOpacity
            style={[styles.quantityButton, styles.incrementButton]}
            onPress={onIncrement}
          >
            <Ionicons name="add" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={isGrid ? styles.addButtonGrid : styles.addButtonList}
        onPress={onAddToCart}
      >
        <Ionicons name="add" size={isGrid ? 20 : 18} color={colors.white} />
      </TouchableOpacity>
    );
  };

  if (viewMode === 'grid') {
    return (
      <TouchableOpacity style={styles.productCardGrid} onPress={quantity === 0 ? onAddToCart : undefined} activeOpacity={quantity > 0 ? 1 : 0.7}>
        <View style={styles.productImagePlaceholder}>
          {renderImage('large')}
        </View>
        {quantity > 0 && (
          <View style={styles.cartBadgeGrid}>
            <Text style={styles.cartBadgeText}>{quantity}</Text>
          </View>
        )}
        <View style={styles.productInfoGrid}>
          <Text style={styles.productNameGrid} numberOfLines={1}>{product.nameEn}</Text>
          <Text style={styles.productNameTamil} numberOfLines={1}>{product.nameTa}</Text>
          <View style={styles.priceRowGrid}>
            <Text style={styles.productPrice}>₹{product.price}</Text>
            <Text style={styles.productUnit}>/{product.unit}</Text>
          </View>
          <Text style={styles.gstLabel}>{gstLabel}</Text>
        </View>
        {renderQuantityControls(true)}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.productCardList} onPress={quantity === 0 ? onAddToCart : undefined} activeOpacity={quantity > 0 ? 1 : 0.7}>
      <View style={styles.productImageSmall}>
        {renderImage('small')}
      </View>
      {quantity > 0 && (
        <View style={styles.cartBadgeList}>
          <Text style={styles.cartBadgeTextSmall}>{quantity}</Text>
        </View>
      )}
      <View style={styles.productInfoList}>
        <Text style={styles.productNameList}>{product.nameEn}</Text>
        <Text style={styles.productNameTamilSmall}>{product.nameTa}</Text>
        <Text style={styles.gstLabelSmall}>{gstLabel}</Text>
      </View>
      <View style={styles.priceSection}>
        <Text style={styles.productPriceList}>₹{product.price}</Text>
        <Text style={styles.productUnitSmall}>/{product.unit}</Text>
      </View>
      {renderQuantityControls(false)}
    </TouchableOpacity>
  );
}

interface CategoryTabProps {
  category: Category;
  isSelected: boolean;
  onSelect: () => void;
}

function CategoryTab({ category, isSelected, onSelect }: CategoryTabProps) {
  const { language } = useLanguage();
  const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    basket: 'basket',
    leaf: 'leaf',
    nutrition: 'nutrition',
    water: 'water',
    cafe: 'cafe',
    'fast-food': 'fast-food',
  };

  return (
    <TouchableOpacity
      style={[styles.categoryTab, isSelected && styles.categoryTabSelected]}
      onPress={onSelect}
    >
      <View
        style={[
          styles.categoryIcon,
          { backgroundColor: isSelected ? category.color : category.color + '20' },
        ]}
      >
        <Ionicons
          name={iconMap[category.icon] || 'cube'}
          size={24}
          color={isSelected ? colors.white : category.color}
        />
      </View>
      <Text
        style={[styles.categoryName, isSelected && styles.categoryNameSelected]}
        numberOfLines={2}
      >
        {language === 'ta' ? category.nameTa : category.nameEn}
      </Text>
    </TouchableOpacity>
  );
}

export default function ProductsScreen() {
  const { state, addToCart, updateCartItem, removeFromCart } = useApp();
  const { t } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');

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

  // Get cart item for a product
  const getCartItem = (productId: string) => {
    return state.cart.find(item => item.product.id === productId);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const handleIncrement = (product: Product) => {
    const cartItem = getCartItem(product.id);
    if (cartItem) {
      updateCartItem(product.id, cartItem.quantity + 1);
    } else {
      addToCart(product, 1);
    }
  };

  const handleDecrement = (product: Product) => {
    const cartItem = getCartItem(product.id);
    if (cartItem) {
      if (cartItem.quantity === 1) {
        removeFromCart(product.id);
      } else {
        updateCartItem(product.id, cartItem.quantity - 1);
      }
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard
      product={item}
      viewMode={viewMode}
      cartItem={getCartItem(item.id)}
      onAddToCart={() => handleAddToCart(item)}
      onIncrement={() => handleIncrement(item)}
      onDecrement={() => handleDecrement(item)}
    />
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder={t('products.searchPlaceholder')}
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
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
            onPress={() => setViewMode('grid')}
          >
            <Ionicons
              name="grid"
              size={18}
              color={viewMode === 'grid' ? colors.white : colors.gray[500]}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
            onPress={() => setViewMode('list')}
          >
            <Ionicons
              name="list"
              size={18}
              color={viewMode === 'list' ? colors.white : colors.gray[500]}
            />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.mainContent}>
        {/* Categories Sidebar */}
        <View style={styles.categorySidebar}>
          <TouchableOpacity
            style={[styles.categoryTab, !selectedCategory && styles.categoryTabSelected]}
            onPress={() => setSelectedCategory(null)}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: !selectedCategory ? colors.accent : colors.gray[200] },
              ]}
            >
              <Ionicons
                name="apps"
                size={24}
                color={!selectedCategory ? colors.white : colors.gray[500]}
              />
            </View>
            <Text
              style={[styles.categoryName, !selectedCategory && styles.categoryNameSelected]}
            >
              {t('products.allCategories')}
            </Text>
          </TouchableOpacity>
          <FlatList
            data={state.categories}
            renderItem={({ item }) => (
              <CategoryTab
                category={item}
                isSelected={selectedCategory === item.id}
                onSelect={() => setSelectedCategory(item.id)}
              />
            )}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Products Grid/List */}
        <View style={styles.productsContainer}>
          {filteredProducts.length > 0 ? (
            <FlatList
              data={filteredProducts}
              renderItem={renderProduct}
              keyExtractor={(item) => item.id}
              numColumns={viewMode === 'grid' ? 2 : 1}
              key={viewMode}
              contentContainerStyle={styles.productsList}
              showsVerticalScrollIndicator={false}
              columnWrapperStyle={viewMode === 'grid' ? styles.gridRow : undefined}
            />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="cube-outline" size={64} color={colors.gray[300]} />
              <Text style={styles.emptyTitle}>{t('products.noProductsFound')}</Text>
              <Text style={styles.emptySubtitle}>
                {searchQuery
                  ? t('products.tryDifferentSearch')
                  : t('products.selectCategoryOrAdd')}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Cart Summary */}
      {state.cart.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.cartInfo}>
            <View style={styles.cartBadge}>
              <Text style={styles.cartCount}>{state.cart.length}</Text>
            </View>
            <Text style={styles.cartText}>
              {state.cart.reduce((sum, item) => sum + item.quantity, 0)} {t('products.items')}
            </Text>
          </View>
          <Text style={styles.cartTotal}>
            ₹{state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray[200],
    borderRadius: borderRadius.md,
    padding: 2,
  },
  viewButton: {
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  viewButtonActive: {
    backgroundColor: colors.primary,
  },
  mainContent: {
    flex: 1,
    flexDirection: 'row',
  },
  categorySidebar: {
    width: CATEGORY_WIDTH,
    backgroundColor: colors.white,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingVertical: spacing.sm,
  },
  categoryTab: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  categoryTabSelected: {
    backgroundColor: colors.accent + '10',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: colors.accent,
    fontWeight: fontWeight.bold,
  },
  productsContainer: {
    flex: 1,
  },
  productsList: {
    padding: spacing.sm,
  },
  gridRow: {
    gap: spacing.sm,
  },
  productCardGrid: {
    width: (width - CATEGORY_WIDTH - spacing.sm * 3) / 2,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    overflow: 'hidden',
    ...shadows.small,
  },
  productImagePlaceholder: {
    height: 80,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoGrid: {
    padding: spacing.sm,
  },
  productNameGrid: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  productNameTamil: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  priceRowGrid: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  productPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  productUnit: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  gstLabel: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: 2,
  },
  productImageGrid: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  productImageListImg: {
    width: '100%',
    height: '100%',
    borderRadius: borderRadius.md,
  },
  cartBadgeGrid: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    width: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  cartBadgeList: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  cartBadgeTextSmall: {
    fontSize: 10,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  quantityControlsGrid: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
    ...shadows.small,
  },
  quantityControlsList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.full,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  decrementButton: {
    backgroundColor: colors.error,
  },
  incrementButton: {
    backgroundColor: colors.secondary,
  },
  quantityBadge: {
    paddingHorizontal: spacing.sm,
    minWidth: 28,
    alignItems: 'center',
  },
  quantityText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  addButtonGrid: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productCardList: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    ...shadows.small,
  },
  productImageSmall: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfoList: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  productNameList: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  productNameTamilSmall: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  gstLabelSmall: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  priceSection: {
    alignItems: 'flex-end',
    marginRight: spacing.sm,
  },
  productPriceList: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  productUnitSmall: {
    fontSize: fontSize.xs,
    color: colors.text.secondary,
  },
  addButtonList: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
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
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  cartInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  cartBadge: {
    backgroundColor: colors.accent,
    borderRadius: borderRadius.full,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartCount: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  cartText: {
    fontSize: fontSize.md,
    color: colors.white,
  },
  cartTotal: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
});

