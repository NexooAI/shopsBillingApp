import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { Product, CartItem } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface CartItemCardProps {
  item: CartItem;
  onUpdateQuantity: (quantity: number) => void;
  onRemove: () => void;
}

function CartItemCard({ item, onUpdateQuantity, onRemove }: CartItemCardProps) {
  const { product, quantity } = item;
  const itemTotal = product.price * quantity;

  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemRow}>
        {/* Product Image */}
        {product.imageUri ? (
          <Image source={{ uri: product.imageUri }} style={styles.cartItemImage} />
        ) : (
          <View style={styles.cartItemImagePlaceholder}>
            <Ionicons name="cube-outline" size={20} color={colors.gray[400]} />
          </View>
        )}

        {/* Product Info */}
        <View style={styles.cartItemInfo}>
          <View style={styles.cartItemNameRow}>
            {product.productCode && (
              <Text style={styles.cartItemCode}>#{product.productCode}</Text>
            )}
            <Text style={styles.cartItemName} numberOfLines={1}>{product.nameEn}</Text>
          </View>
          <Text style={styles.cartItemTamil}>{product.nameTa}</Text>
          <Text style={styles.cartItemPrice}>
            ₹{product.price}/{product.unit}
            {product.gstPercentage > 0 && (
              <Text style={styles.gstText}>
                {' '}({product.isGstInclusive ? 'incl.' : '+'}{product.gstPercentage}% GST)
              </Text>
            )}
          </Text>
        </View>

        {/* Remove Button */}
        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.cartItemActions}>
        <View style={styles.quantityControl}>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(quantity - 1)}
          >
            <Ionicons name="remove" size={16} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.quantityText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.quantityButton}
            onPress={() => onUpdateQuantity(quantity + 1)}
          >
            <Ionicons name="add" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>

        <Text style={styles.itemTotal}>₹{itemTotal.toFixed(2)}</Text>
      </View>
    </View>
  );
}

interface ProductQuickAddProps {
  product: Product;
  onAdd: () => void;
  isExactMatch?: boolean;
}

function ProductQuickAdd({ product, onAdd, isExactMatch }: ProductQuickAddProps) {
  return (
    <TouchableOpacity
      style={[
        styles.quickAddCard,
        isExactMatch && styles.quickAddCardExact
      ]}
      onPress={onAdd}
    >
      {/* Small Product Image */}
      {product.imageUri ? (
        <Image source={{ uri: product.imageUri }} style={styles.quickAddImage} />
      ) : (
        <View style={styles.quickAddImagePlaceholder}>
          <Ionicons name="cube-outline" size={16} color={colors.gray[400]} />
        </View>
      )}

      <View style={styles.quickAddContent}>
        <View style={styles.quickAddHeader}>
          {product.productCode && (
            <Text style={[styles.quickAddCode, isExactMatch && styles.quickAddCodeExact]}>
              #{product.productCode}
            </Text>
          )}
          <Text style={[styles.quickAddName, isExactMatch && styles.quickAddNameExact]} numberOfLines={1}>
            {product.nameEn}
          </Text>
        </View>
        <View style={styles.quickAddFooter}>
          <Text style={styles.quickAddPrice}>₹{product.price}</Text>
          {isExactMatch && (
            <View style={styles.exactMatchBadge}>
              <Ionicons name="checkmark-circle" size={14} color={colors.success} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function BillingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, addToCart, updateCartItem, removeFromCart, clearCart, createBill } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [gstMode, setGstMode] = useState<'inclusive' | 'exclusive'>('exclusive');

  // Find exact match by code or barcode
  const exactMatch = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.trim();
    return state.products.find(
      (p) =>
        p.productCode === query ||
        p.barcode === query
    ) || null;
  }, [state.products, searchQuery]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return state.products.slice(0, 10);
    const query = searchQuery.toLowerCase().trim();

    // Filter products by code, barcode, or name
    const filtered = state.products.filter(
      (p) =>
        p.productCode?.toLowerCase().includes(query) ||
        p.barcode?.toLowerCase().includes(query) ||
        p.nameEn.toLowerCase().includes(query) ||
        p.nameTa.includes(searchQuery)
    );

    // If there's an exact match, put it first
    if (exactMatch) {
      const withoutExact = filtered.filter(p => p.id !== exactMatch.id);
      return [exactMatch, ...withoutExact];
    }

    return filtered;
  }, [state.products, searchQuery, exactMatch]);

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let gstAmount = 0;

    state.cart.forEach((item) => {
      const itemTotal = item.product.price * item.quantity;

      if (gstMode === 'inclusive') {
        // GST Inclusive: Price already includes GST, no extra GST charged
        // Calculate base price by removing GST from displayed price
        const basePrice = itemTotal / (1 + item.product.gstPercentage / 100);
        subtotal += basePrice;
        gstAmount += itemTotal - basePrice;
      } else {
        // GST Exclusive: GST is added on top of the price
        subtotal += itemTotal;
        gstAmount += (itemTotal * item.product.gstPercentage) / 100;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round((subtotal + gstAmount) * 100) / 100,
      // For inclusive mode, total = subtotal (displayed prices)
      // For exclusive mode, total = subtotal + GST
      finalTotal: gstMode === 'inclusive'
        ? Math.round(state.cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0) * 100) / 100
        : Math.round((subtotal + gstAmount) * 100) / 100,
    };
  }, [state.cart, gstMode]);

  const handleCreateBill = () => {
    if (state.cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to create a bill');
      return;
    }

    const gstModeText = gstMode === 'inclusive'
      ? 'GST Inclusive (No extra GST)'
      : 'GST Exclusive (GST Added)';

    Alert.alert(
      'Create Bill',
      `${gstModeText}\n\nSubtotal: ₹${cartSummary.subtotal.toFixed(2)}\nGST: ₹${cartSummary.gstAmount.toFixed(2)}\n\nTotal Payable: ₹${cartSummary.finalTotal.toFixed(2)}\n\nProceed to generate bill?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Bill',
          onPress: async () => {
            try {
              const bill = await createBill();
              if (bill) {
                navigation.navigate('BillPreview', { bill });
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to create bill. Please try again.');
              console.error('Error creating bill:', error);
            }
          },
        },
      ]
    );
  };

  const handleClearCart = () => {
    if (state.cart.length === 0) return;

    Alert.alert('Clear Cart', 'Are you sure you want to clear all items?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  // Handle barcode scan (simulated - you can integrate real scanner)
  const handleBarcodeScan = () => {
    // Alert.prompt is iOS only, using Alert.alert with text input workaround
    Alert.alert(
      'Enter Barcode / Product Code',
      'Type the barcode or product code number to search',
      [
        { text: 'Cancel', style: 'cancel' },
      ]
    );
    // For now, focus on the search input - user can type code directly
    // You can integrate expo-barcode-scanner for actual scanning
  };

  return (
    <View style={styles.container}>
      {/* Quick Add Section */}
      <View style={styles.quickAddSection}>
        <View style={styles.searchRow}>
          <View style={styles.searchBar}>
            <Ionicons name="search" size={20} color={colors.gray[400]} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by code, barcode or name..."
              placeholderTextColor={colors.gray[400]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              keyboardType="default"
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.gray[400]} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity style={styles.barcodeButton} onPress={handleBarcodeScan}>
            <Ionicons name="barcode-outline" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Exact match indicator */}
        {exactMatch && (
          <View style={styles.exactMatchIndicator}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.exactMatchText}>
              Found: #{exactMatch.productCode || exactMatch.barcode} - {exactMatch.nameEn}
            </Text>
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={() => {
                addToCart(exactMatch, 1);
                setSearchQuery('');
              }}
            >
              <Ionicons name="add" size={18} color={colors.white} />
              <Text style={styles.quickAddButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickAddList}
          contentContainerStyle={styles.quickAddContent}
        >
          {filteredProducts.map((product) => (
            <ProductQuickAdd
              key={product.id}
              product={product}
              onAdd={() => {
                addToCart(product, 1);
                if (exactMatch?.id === product.id) {
                  setSearchQuery('');
                }
              }}
              isExactMatch={exactMatch?.id === product.id}
            />
          ))}
        </ScrollView>
      </View>

      {/* Cart Items */}
      <View style={styles.cartSection}>
        <View style={styles.cartHeader}>
          <Text style={styles.cartTitle}>Cart Items</Text>
          {state.cart.length > 0 && (
            <TouchableOpacity onPress={handleClearCart}>
              <Text style={styles.clearText}>Clear All</Text>
            </TouchableOpacity>
          )}
        </View>

        {state.cart.length > 0 ? (
          <FlatList
            data={state.cart}
            renderItem={({ item }) => (
              <CartItemCard
                item={item}
                onUpdateQuantity={(qty) => updateCartItem(item.product.id, qty)}
                onRemove={() => removeFromCart(item.product.id)}
              />
            )}
            keyExtractor={(item) => item.product.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.cartList}
          />
        ) : (
          <View style={styles.emptyCart}>
            <Ionicons name="cart-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>Cart is Empty</Text>
            <Text style={styles.emptySubtitle}>
              Search and add products to start billing
            </Text>
          </View>
        )}
      </View>

      {/* Bill Summary */}
      <View style={styles.summarySection}>
        {/* GST Mode Toggle */}
        <View style={styles.gstToggleContainer}>
          <Text style={styles.gstToggleLabel}>GST Mode:</Text>
          <View style={styles.gstToggleButtons}>
            <TouchableOpacity
              style={[
                styles.gstToggleButton,
                gstMode === 'inclusive' && styles.gstToggleButtonActive,
              ]}
              onPress={() => setGstMode('inclusive')}
            >
              <Ionicons
                name={gstMode === 'inclusive' ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={gstMode === 'inclusive' ? colors.white : colors.text.secondary}
              />
              <Text style={[
                styles.gstToggleText,
                gstMode === 'inclusive' && styles.gstToggleTextActive,
              ]}>
                Inclusive
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.gstToggleButton,
                gstMode === 'exclusive' && styles.gstToggleButtonActive,
              ]}
              onPress={() => setGstMode('exclusive')}
            >
              <Ionicons
                name={gstMode === 'exclusive' ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={gstMode === 'exclusive' ? colors.white : colors.text.secondary}
              />
              <Text style={[
                styles.gstToggleText,
                gstMode === 'exclusive' && styles.gstToggleTextActive,
              ]}>
                Exclusive
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.gstModeInfo}>
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={gstMode === 'inclusive' ? colors.success : colors.warning}
          />
          <Text style={[
            styles.gstModeInfoText,
            { color: gstMode === 'inclusive' ? colors.success : colors.warning }
          ]}>
            {gstMode === 'inclusive'
              ? 'GST included in price - Pay only displayed rate'
              : 'GST added separately - Pay rate + GST'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            {gstMode === 'inclusive' ? 'Base Amount' : 'Subtotal'}
          </Text>
          <Text style={styles.summaryValue}>₹{cartSummary.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>
            GST {gstMode === 'inclusive' ? '(Included)' : '(Added)'}
          </Text>
          <Text style={[
            styles.summaryValue,
            { color: gstMode === 'inclusive' ? colors.success : colors.warning }
          ]}>
            {gstMode === 'inclusive' ? '' : '+'}₹{cartSummary.gstAmount.toFixed(2)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total Payable</Text>
          <Text style={styles.totalValue}>₹{cartSummary.finalTotal.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.billButton, state.cart.length === 0 && styles.billButtonDisabled]}
          onPress={handleCreateBill}
          disabled={state.cart.length === 0}
        >
          <Ionicons name="receipt" size={20} color={colors.primary} />
          <Text style={styles.billButtonText}>Generate Bill</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  quickAddSection: {
    backgroundColor: colors.white,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
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
  barcodeButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exactMatchIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '15',
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  exactMatchText: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.success,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  quickAddButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  quickAddList: {
    marginTop: spacing.sm,
  },
  quickAddScrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  quickAddCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginRight: spacing.sm,
    minWidth: 140,
    gap: spacing.sm,
  },
  quickAddCardExact: {
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.successLight,
  },
  quickAddImage: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
  },
  quickAddImagePlaceholder: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.gray[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickAddContent: {
    flex: 1,
  },
  quickAddHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickAddCode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    backgroundColor: colors.primary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  quickAddCodeExact: {
    backgroundColor: colors.white,
    color: colors.success,
  },
  quickAddName: {
    flex: 1,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  quickAddNameExact: {
    fontWeight: fontWeight.bold,
  },
  quickAddFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  quickAddPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  exactMatchBadge: {
    marginLeft: spacing.xs,
  },
  cartSection: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  cartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cartTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  clearText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.error,
  },
  cartList: {
    paddingBottom: spacing.md,
  },
  cartItemCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  cartItemImage: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    marginRight: spacing.sm,
  },
  cartItemImagePlaceholder: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  cartItemInfo: {
    flex: 1,
  },
  cartItemNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cartItemCode: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.white,
    backgroundColor: colors.secondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  cartItemName: {
    flex: 1,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  cartItemTamil: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  cartItemPrice: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  gstText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  cartItemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    minWidth: 30,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  removeButton: {
    padding: spacing.sm,
  },
  emptyCart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  summarySection: {
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    ...shadows.medium,
  },
  gstToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  gstToggleLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.primary,
  },
  gstToggleButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  gstToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    gap: spacing.xs,
  },
  gstToggleButtonActive: {
    backgroundColor: colors.secondary,
  },
  gstToggleText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  gstToggleTextActive: {
    color: colors.white,
  },
  gstModeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[50],
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  gstModeInfoText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.medium,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  summaryLabel: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
  },
  summaryValue: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  totalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  totalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  billButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  billButtonDisabled: {
    backgroundColor: colors.gray[300],
  },
  billButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});

