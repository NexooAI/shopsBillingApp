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
  let gstAmount = 0;
  let basePrice = itemTotal;

  if (product.isGstInclusive) {
    basePrice = itemTotal / (1 + product.gstPercentage / 100);
    gstAmount = itemTotal - basePrice;
  } else {
    gstAmount = (itemTotal * product.gstPercentage) / 100;
  }

  return (
    <View style={styles.cartItemCard}>
      <View style={styles.cartItemInfo}>
        <Text style={styles.cartItemName}>{product.nameEn}</Text>
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

        <TouchableOpacity style={styles.removeButton} onPress={onRemove}>
          <Ionicons name="trash-outline" size={18} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface ProductQuickAddProps {
  product: Product;
  onAdd: () => void;
}

function ProductQuickAdd({ product, onAdd }: ProductQuickAddProps) {
  return (
    <TouchableOpacity style={styles.quickAddCard} onPress={onAdd}>
      <Text style={styles.quickAddName} numberOfLines={1}>{product.nameEn}</Text>
      <Text style={styles.quickAddPrice}>₹{product.price}</Text>
    </TouchableOpacity>
  );
}

export default function BillingScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, addToCart, updateCartItem, removeFromCart, clearCart, createBill } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return state.products.slice(0, 10);
    const query = searchQuery.toLowerCase();
    return state.products.filter(
      (p) =>
        p.nameEn.toLowerCase().includes(query) ||
        p.nameTa.includes(searchQuery)
    );
  }, [state.products, searchQuery]);

  const cartSummary = useMemo(() => {
    let subtotal = 0;
    let gstAmount = 0;

    state.cart.forEach((item) => {
      const itemTotal = item.product.price * item.quantity;
      if (item.product.isGstInclusive) {
        const basePrice = itemTotal / (1 + item.product.gstPercentage / 100);
        subtotal += basePrice;
        gstAmount += itemTotal - basePrice;
      } else {
        subtotal += itemTotal;
        gstAmount += (itemTotal * item.product.gstPercentage) / 100;
      }
    });

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round((subtotal + gstAmount) * 100) / 100,
    };
  }, [state.cart]);

  const handleCreateBill = () => {
    if (state.cart.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to create a bill');
      return;
    }

    Alert.alert(
      'Create Bill',
      `Total: ₹${cartSummary.total.toFixed(2)}\n\nProceed to generate bill?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Bill',
          onPress: () => {
            const bill = createBill();
            if (bill) {
              navigation.navigate('BillPreview', { bill });
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

  return (
    <View style={styles.container}>
      {/* Quick Add Section */}
      <View style={styles.quickAddSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={colors.gray[400]} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search to add product..."
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
              onAdd={() => addToCart(product, 1)}
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
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Subtotal (excl. GST)</Text>
          <Text style={styles.summaryValue}>₹{cartSummary.subtotal.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>GST</Text>
          <Text style={styles.summaryValue}>₹{cartSummary.gstAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>₹{cartSummary.total.toFixed(2)}</Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  quickAddList: {
    marginTop: spacing.sm,
  },
  quickAddContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  quickAddCard: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginRight: spacing.sm,
    minWidth: 100,
  },
  quickAddName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  quickAddPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.accent,
    marginTop: 2,
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
  cartItemInfo: {
    marginBottom: spacing.sm,
  },
  cartItemName: {
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

