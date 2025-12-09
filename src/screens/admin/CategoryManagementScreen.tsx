import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';
import { Category } from '../../types';
import { RootStackParamList } from '../../navigation/AppNavigator';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const iconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
  basket: 'basket',
  leaf: 'leaf',
  nutrition: 'nutrition',
  water: 'water',
  cafe: 'cafe',
  'fast-food': 'fast-food',
  cube: 'cube',
  cart: 'cart',
  storefront: 'storefront',
  gift: 'gift',
};

interface CategoryCardProps {
  category: Category;
  productCount: number;
  onEdit: () => void;
  onDelete: () => void;
}

function CategoryCard({ category, productCount, onEdit, onDelete }: CategoryCardProps) {
  return (
    <View style={styles.categoryCard}>
      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
        <Ionicons
          name={iconMap[category.icon] || 'cube'}
          size={32}
          color={category.color}
        />
      </View>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryNameEn}>{category.nameEn}</Text>
        <Text style={styles.categoryNameTa}>{category.nameTa}</Text>
        <Text style={styles.productCount}>{productCount} products</Text>
      </View>
      <View style={styles.categoryActions}>
        <TouchableOpacity style={styles.actionButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={20} color={colors.info} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={onDelete}>
          <Ionicons name="trash-outline" size={20} color={colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CategoryManagementScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { state, dispatch } = useApp();

  const getProductCount = (categoryId: string) => {
    return state.products.filter((p) => p.categoryId === categoryId).length;
  };

  const handleDeleteCategory = (category: Category) => {
    const productCount = getProductCount(category.id);
    
    if (productCount > 0) {
      Alert.alert(
        'Cannot Delete',
        `This category has ${productCount} products. Please move or delete the products first.`,
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.nameEn}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch({ type: 'DELETE_CATEGORY', payload: category.id });
          },
        },
      ]
    );
  };

  const handleEditCategory = (category: Category) => {
    navigation.navigate('AddCategory', { category });
  };

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{state.categories.length}</Text>
          <Text style={styles.statLabel}>Categories</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{state.products.length}</Text>
          <Text style={styles.statLabel}>Products</Text>
        </View>
      </View>

      {/* Categories List */}
      <FlatList
        data={state.categories}
        renderItem={({ item }) => (
          <CategoryCard
            category={item}
            productCount={getProductCount(item.id)}
            onEdit={() => handleEditCategory(item)}
            onDelete={() => handleDeleteCategory(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={64} color={colors.gray[300]} />
            <Text style={styles.emptyTitle}>No Categories</Text>
            <Text style={styles.emptySubtitle}>
              Add categories to organize your products
            </Text>
          </View>
        }
      />

      {/* Add Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddCategory', {})}
      >
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.small,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  statLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.small,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  categoryNameEn: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  categoryNameTa: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
  productCount: {
    fontSize: fontSize.sm,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  addButton: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.large,
  },
});

