import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/AppNavigator';

type AddProductRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'dozen', 'pack', 'box'];
const GST_RATES = [0, 5, 12, 18, 28];

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddProductRouteProp>();
  const { state, addProduct } = useApp();

  const [nameEn, setNameEn] = useState('');
  const [nameTa, setNameTa] = useState('');
  const [categoryId, setCategoryId] = useState(route.params?.categoryId || '');
  const [price, setPrice] = useState('');
  const [unit, setUnit] = useState('kg');
  const [gstPercentage, setGstPercentage] = useState(0);
  const [isGstInclusive, setIsGstInclusive] = useState(false);
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState('');

  const handleSubmit = () => {
    if (!nameEn.trim()) {
      Alert.alert('Error', 'Please enter product name in English');
      return;
    }
    if (!categoryId) {
      Alert.alert('Error', 'Please select a category');
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      Alert.alert('Error', 'Please enter a valid price');
      return;
    }

    addProduct({
      nameEn: nameEn.trim(),
      nameTa: nameTa.trim() || nameEn.trim(),
      categoryId,
      price: parseFloat(price),
      unit,
      gstPercentage,
      isGstInclusive,
      stock: stock ? parseInt(stock) : undefined,
      barcode: barcode.trim() || undefined,
    });

    Alert.alert('Success', 'Product added successfully', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Product Names */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Product Details</Text>
        
        <Text style={styles.inputLabel}>Name (English) *</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter product name"
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

      {/* Category Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Category *</Text>
        <View style={styles.categoryGrid}>
          {state.categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryOption,
                categoryId === category.id && styles.categoryOptionActive,
                { borderColor: category.color },
              ]}
              onPress={() => setCategoryId(category.id)}
            >
              <View
                style={[
                  styles.categoryDot,
                  { backgroundColor: categoryId === category.id ? category.color : colors.gray[300] },
                ]}
              />
              <Text
                style={[
                  styles.categoryOptionText,
                  categoryId === category.id && { color: category.color },
                ]}
              >
                {category.nameEn}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Price and Unit */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pricing</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Price (₹) *</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor={colors.gray[400]}
              value={price}
              onChangeText={setPrice}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Unit</Text>
            <View style={styles.unitSelector}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitOption, unit === u && styles.unitOptionActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text
                      style={[styles.unitText, unit === u && styles.unitTextActive]}
                    >
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </View>
      </View>

      {/* GST Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>GST Settings</Text>
        
        <Text style={styles.inputLabel}>GST Rate</Text>
        <View style={styles.gstOptions}>
          {GST_RATES.map((rate) => (
            <TouchableOpacity
              key={rate}
              style={[styles.gstOption, gstPercentage === rate && styles.gstOptionActive]}
              onPress={() => setGstPercentage(rate)}
            >
              <Text style={[styles.gstText, gstPercentage === rate && styles.gstTextActive]}>
                {rate}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.switchRow}>
          <View style={styles.switchInfo}>
            <Text style={styles.switchLabel}>GST Inclusive</Text>
            <Text style={styles.switchDescription}>
              Price already includes GST
            </Text>
          </View>
          <Switch
            value={isGstInclusive}
            onValueChange={setIsGstInclusive}
            trackColor={{ false: colors.gray[300], true: colors.accent + '50' }}
            thumbColor={isGstInclusive ? colors.accent : colors.gray[100]}
          />
        </View>
      </View>

      {/* Optional Fields */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Optional</Text>
        
        <View style={styles.row}>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Stock Quantity</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={colors.gray[400]}
              value={stock}
              onChangeText={setStock}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.halfInput}>
            <Text style={styles.inputLabel}>Barcode</Text>
            <TextInput
              style={styles.input}
              placeholder="Scan or enter"
              placeholderTextColor={colors.gray[400]}
              value={barcode}
              onChangeText={setBarcode}
            />
          </View>
        </View>
      </View>

      {/* Preview */}
      {nameEn && price && (
        <View style={styles.preview}>
          <Text style={styles.previewTitle}>Preview</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewRow}>
              <Text style={styles.previewName}>{nameEn}</Text>
              <Text style={styles.previewPrice}>₹{price}/{unit}</Text>
            </View>
            <Text style={styles.previewTamil}>{nameTa || nameEn}</Text>
            <Text style={styles.previewGst}>
              {gstPercentage > 0
                ? `${gstPercentage}% GST ${isGstInclusive ? '(Inclusive)' : '(Extra)'}`
                : 'No GST'}
            </Text>
          </View>
        </View>
      )}

      {/* Submit Button */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
        <Text style={styles.submitButtonText}>Add Product</Text>
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
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  halfInput: {
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.gray[300],
    gap: spacing.xs,
  },
  categoryOptionActive: {
    backgroundColor: colors.primary + '10',
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryOptionText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  unitSelector: {
    flexDirection: 'row',
  },
  unitOption: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    marginRight: spacing.xs,
  },
  unitOptionActive: {
    backgroundColor: colors.primary,
  },
  unitText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
  },
  unitTextActive: {
    color: colors.white,
  },
  gstOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  gstOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
  },
  gstOptionActive: {
    backgroundColor: colors.accent,
  },
  gstText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.text.secondary,
  },
  gstTextActive: {
    color: colors.primary,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  switchInfo: {
    flex: 1,
  },
  switchLabel: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  switchDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
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
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewName: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  previewPrice: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  previewTamil: {
    fontSize: fontSize.md,
    color: colors.gray[300],
    marginTop: 2,
  },
  previewGst: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
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

