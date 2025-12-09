import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddCategoryRouteProp = RouteProp<RootStackParamList, 'AddCategory'>;

const ICONS: { name: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { name: 'basket', icon: 'basket' },
  { name: 'leaf', icon: 'leaf' },
  { name: 'nutrition', icon: 'nutrition' },
  { name: 'water', icon: 'water' },
  { name: 'cafe', icon: 'cafe' },
  { name: 'fast-food', icon: 'fast-food' },
  { name: 'cube', icon: 'cube' },
  { name: 'cart', icon: 'cart' },
  { name: 'storefront', icon: 'storefront' },
  { name: 'gift', icon: 'gift' },
  { name: 'pizza', icon: 'pizza' },
  { name: 'fish', icon: 'fish' },
  { name: 'beer', icon: 'beer' },
  { name: 'ice-cream', icon: 'ice-cream' },
  { name: 'wine', icon: 'wine' },
];

const COLORS = [
  '#e74c3c', '#e91e63', '#9b59b6', '#673ab7',
  '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4',
  '#009688', '#4caf50', '#8bc34a', '#cddc39',
  '#ffc107', '#ff9800', '#ff5722', '#795548',
];

export default function AddCategoryScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddCategoryRouteProp>();
  const { addCategory, dispatch, state } = useApp();
  
  const existingCategory = route.params?.category;
  const isEditing = !!existingCategory;

  const [nameEn, setNameEn] = useState(existingCategory?.nameEn || '');
  const [nameTa, setNameTa] = useState(existingCategory?.nameTa || '');
  const [selectedIcon, setSelectedIcon] = useState(existingCategory?.icon || 'basket');
  const [selectedColor, setSelectedColor] = useState(existingCategory?.color || '#e74c3c');

  const handleSubmit = () => {
    if (!nameEn.trim()) {
      Alert.alert('Error', 'Please enter category name in English');
      return;
    }

    if (isEditing) {
      dispatch({
        type: 'UPDATE_CATEGORY',
        payload: {
          ...existingCategory,
          nameEn: nameEn.trim(),
          nameTa: nameTa.trim() || nameEn.trim(),
          icon: selectedIcon,
          color: selectedColor,
        },
      });
      Alert.alert('Success', 'Category updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } else {
      addCategory({
        nameEn: nameEn.trim(),
        nameTa: nameTa.trim() || nameEn.trim(),
        icon: selectedIcon,
        color: selectedColor,
      });
      Alert.alert('Success', 'Category added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Category Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category Details</Text>
        
        <Text style={styles.inputLabel}>Name (English) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter category name"
          placeholderTextColor={colors.gray[400]}
          value={nameEn}
          onChangeText={setNameEn}
        />

        <Text style={styles.inputLabel}>Name (Tamil)</Text>
        <TextInput
          style={styles.input}
          placeholder="தமிழில் பெயர் உள்ளிடவும்"
          placeholderTextColor={colors.gray[400]}
          value={nameTa}
          onChangeText={setNameTa}
        />
      </View>

      {/* Icon Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Icon</Text>
        <View style={styles.iconGrid}>
          {ICONS.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={[
                styles.iconOption,
                selectedIcon === item.name && styles.iconOptionActive,
                selectedIcon === item.name && { borderColor: selectedColor },
              ]}
              onPress={() => setSelectedIcon(item.name)}
            >
              <Ionicons
                name={item.icon}
                size={28}
                color={selectedIcon === item.name ? selectedColor : colors.gray[400]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Color Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose Color</Text>
        <View style={styles.colorGrid}>
          {COLORS.map((color) => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorOption,
                { backgroundColor: color },
                selectedColor === color && styles.colorOptionActive,
              ]}
              onPress={() => setSelectedColor(color)}
            >
              {selectedColor === color && (
                <Ionicons name="checkmark" size={20} color={colors.white} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <Text style={styles.previewTitle}>Preview</Text>
        <View style={styles.previewCard}>
          <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
            <Ionicons
              name={ICONS.find((i) => i.name === selectedIcon)?.icon || 'cube'}
              size={40}
              color={selectedColor}
            />
          </View>
          <Text style={styles.previewName}>{nameEn || 'Category Name'}</Text>
          <Text style={styles.previewNameTa}>{nameTa || 'வகை பெயர்'}</Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        <Text style={styles.submitButtonText}>
          {isEditing ? 'Update Category' : 'Add Category'}
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconOptionActive: {
    backgroundColor: colors.white,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionActive: {
    borderWidth: 3,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  preview: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  previewTitle: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  previewCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  previewIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  previewName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  previewNameTa: {
    fontSize: fontSize.md,
    color: colors.text.secondary,
    marginTop: 2,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  submitButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

