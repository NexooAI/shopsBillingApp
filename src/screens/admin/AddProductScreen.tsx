import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '../../theme';
import { useApp } from '../../context/AppContext';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { translateToTamil, smartTranslate } from '../../utils/translation';

type AddProductRouteProp = RouteProp<RootStackParamList, 'AddProduct'>;

const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'dozen', 'pack', 'box'];
const GST_RATES = [0, 5, 12, 18, 28];

// Directory for storing product images
const PRODUCT_IMAGES_DIR = FileSystem.documentDirectory + 'product_images/';

export default function AddProductScreen() {
  const navigation = useNavigation();
  const route = useRoute<AddProductRouteProp>();
  const { state, addProduct, updateProduct } = useApp();
  
  const editingProduct = route.params?.product;

  const [productCode, setProductCode] = useState(editingProduct?.productCode || '');
  const [nameEn, setNameEn] = useState(editingProduct?.nameEn || '');
  const [nameTa, setNameTa] = useState(editingProduct?.nameTa || '');
  const [categoryId, setCategoryId] = useState(editingProduct?.categoryId || route.params?.categoryId || '');
  const [price, setPrice] = useState(editingProduct?.price ? editingProduct.price.toString() : '');
  const [unit, setUnit] = useState(editingProduct?.unit || 'kg');
  const [gstPercentage, setGstPercentage] = useState(editingProduct?.gstPercentage || 0);
  const [isGstInclusive, setIsGstInclusive] = useState(editingProduct?.isGstInclusive || false);
  const [stock, setStock] = useState(editingProduct?.stock ? editingProduct.stock.toString() : '');
  const [barcode, setBarcode] = useState(editingProduct?.barcode || '');
  const [imageUri, setImageUri] = useState<string | undefined>(editingProduct?.imageUri || undefined);
  const [isLoadingImage, setIsLoadingImage] = useState(false);

  // Generate next product code
  const getNextProductCode = () => {
    const existingCodes = state.products
      .map(p => parseInt(p.productCode || '0', 10))
      .filter(code => !isNaN(code));
    const maxCode = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
    return (maxCode + 1).toString();
  };

  // Auto-generate code if empty and not editing
  React.useEffect(() => {
    if (!productCode && !editingProduct) {
      setProductCode(getNextProductCode());
    }
    
    if (editingProduct) {
      navigation.setOptions({ title: 'Edit Product' });
    }
  }, []);

  // Auto-translate English to Tamil when English name changes (only if Tamil is empty)
  useEffect(() => {
    if (nameEn && !nameTa) {
      const translated = translateToTamil(nameEn);
      if (translated && translated !== nameEn) {
        setNameTa(translated);
      }
    }
  }, [nameEn]);

  // Ensure product images directory exists
  const ensureImageDirectory = async () => {
    try {
      const dirInfo = await FileSystem.getInfoAsync(PRODUCT_IMAGES_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(PRODUCT_IMAGES_DIR, { intermediates: true });
      }
    } catch (error) {
      console.log('Error creating directory:', error);
      throw error;
    }
  };

  // Save image to local storage and return the new URI
  const saveImageToStorage = async (uri: string): Promise<string> => {
    try {
      await ensureImageDirectory();
      const filename = `product_${Date.now()}.jpg`;
      const newUri = PRODUCT_IMAGES_DIR + filename;
      await FileSystem.copyAsync({ from: uri, to: newUri });
      return newUri;
    } catch (error) {
      console.log('Error saving image:', error);
      throw error;
    }
  };

  // Pick image from gallery
  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to add product images.');
        return;
      }

      setIsLoadingImage(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await saveImageToStorage(result.assets[0].uri);
        setImageUri(savedUri);
      }
    } catch (error) {
      console.log('Error picking image:', error);
      Alert.alert('Error', 'Failed to load image. Please try again.');
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take product photos.');
        return;
      }

      setIsLoadingImage(true);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (!result.canceled && result.assets[0]) {
        const savedUri = await saveImageToStorage(result.assets[0].uri);
        setImageUri(savedUri);
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture image. Please try again.');
    } finally {
      setIsLoadingImage(false);
    }
  };

  // Show image picker options
  const showImageOptions = () => {
    Alert.alert(
      'Add Product Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  // Remove selected image
  const removeImage = async () => {
    if (imageUri) {
      try {
        await FileSystem.deleteAsync(imageUri, { idempotent: true });
      } catch (error) {
        console.log('Error deleting image:', error);
      }
      setImageUri(undefined);
    }
  };

  const handleSubmit = async () => {
    if (!productCode.trim()) {
      Alert.alert('Error', 'Please enter a product code');
      return;
    }
    
    // Check for duplicate product code (exclude current product if editing)
    const existingProduct = state.products.find(p => p.productCode === productCode.trim());
    if (existingProduct && (!editingProduct || existingProduct.id !== editingProduct.id)) {
      Alert.alert('Error', `Product code "${productCode}" already exists for "${existingProduct.nameEn}"`);
      return;
    }

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

    try {
      const productData = {
        productCode: productCode.trim(),
        nameEn: nameEn.trim(),
        nameTa: nameTa.trim() || nameEn.trim(),
        categoryId,
        price: parseFloat(price),
        unit,
        gstPercentage,
        isGstInclusive,
        stock: stock ? parseInt(stock) : undefined,
        barcode: barcode.trim() || undefined,
        imageUri: imageUri,
      };

      if (editingProduct) {
        await updateProduct({
          ...editingProduct,
          ...productData,
        });
        Alert.alert('Success', `Product updated successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addProduct(productData);
        Alert.alert('Success', `Product #${productCode} added successfully`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to ${editingProduct ? 'update' : 'add'} product. Please try again.`);
      console.error('Error saving product:', error);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Product Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Image</Text>
          <View style={styles.imageSection}>
            {isLoadingImage ? (
              <View style={styles.imagePlaceholder}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.imagePlaceholderText}>Loading image...</Text>
              </View>
            ) : imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} />
                <TouchableOpacity style={styles.removeImageButton} onPress={removeImage}>
                  <Ionicons name="close-circle" size={28} color={colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={showImageOptions}>
                <Ionicons name="camera-outline" size={40} color={colors.gray[400]} />
                <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
              </TouchableOpacity>
            )}
            {imageUri && !isLoadingImage && (
              <TouchableOpacity style={styles.changeImageButton} onPress={showImageOptions}>
                <Ionicons name="camera" size={18} color={colors.white} />
                <Text style={styles.changeImageText}>Change Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Product Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Product Code *</Text>
          <Text style={styles.sectionDescription}>
            Unique number for quick search (e.g., type "12" to find Rice)
          </Text>
          <View style={styles.codeInputRow}>
            <View style={styles.codePrefix}>
              <Text style={styles.codePrefixText}>#</Text>
            </View>
            <TextInput
              style={styles.codeInput}
              placeholder="Enter unique code"
              placeholderTextColor={colors.gray[400]}
              value={productCode}
              onChangeText={setProductCode}
              keyboardType="number-pad"
              maxLength={10}
            />
            <TouchableOpacity
              style={styles.autoGenerateButton}
              onPress={() => setProductCode(getNextProductCode())}
            >
              <Ionicons name="refresh" size={18} color={colors.white} />
              <Text style={styles.autoGenerateText}>Auto</Text>
            </TouchableOpacity>
          </View>
        </View>

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

          <View style={styles.tamilInputRow}>
            <View style={styles.tamilInputContainer}>
              <Text style={styles.inputLabel}>Name (Tamil)</Text>
              <TextInput
                style={styles.input}
                placeholder="தமிழில் பெயர் உள்ளிடவும்"
                placeholderTextColor={colors.gray[400]}
                value={nameTa}
                onChangeText={setNameTa}
              />
            </View>
            {nameEn && (
              <TouchableOpacity
                style={styles.translateButton}
                onPress={() => {
                  const translated = translateToTamil(nameEn);
                  if (translated) {
                    setNameTa(translated);
                  }
                }}
              >
                <Ionicons name="language" size={20} color={colors.white} />
                <Text style={styles.translateButtonText}>Auto</Text>
              </TouchableOpacity>
            )}
          </View>
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
              <View style={styles.previewContent}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={styles.previewImage} />
                ) : (
                  <View style={styles.previewImagePlaceholder}>
                    <Ionicons name="cube-outline" size={24} color={colors.gray[400]} />
                  </View>
                )}
                <View style={styles.previewInfo}>
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
            </View>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          <Text style={styles.submitButtonText}>{editingProduct ? 'Update Product' : 'Add Product'}</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: spacing.xxl,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  imageSection: {
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.gray[100],
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: fontSize.sm,
    color: colors.gray[400],
    marginTop: spacing.xs,
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 150,
    height: 150,
    borderRadius: borderRadius.lg,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.white,
    borderRadius: borderRadius.full,
  },
  changeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  changeImageText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  sectionDescription: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  codeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  codePrefix: {
    width: 40,
    height: 48,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  codePrefixText: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  codeInput: {
    flex: 1,
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    height: 48,
  },
  autoGenerateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    height: 48,
    gap: spacing.xs,
  },
  autoGenerateText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  inputLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  tamilInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-end',
  },
  tamilInputContainer: {
    flex: 1,
  },
  translateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.secondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 70,
  },
  translateButtonText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
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
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    marginRight: spacing.md,
  },
  previewImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    backgroundColor: colors.gray[600],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewName: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.white,
    flex: 1,
  },
  previewPrice: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  previewTamil: {
    fontSize: fontSize.sm,
    color: colors.gray[300],
    marginTop: 2,
  },
  previewGst: {
    fontSize: fontSize.xs,
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
    height: 100,
  },
});

