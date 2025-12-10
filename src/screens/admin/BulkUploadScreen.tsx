import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function BulkUploadScreen() {
  const { state, addProductsBulk } = useApp();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file.name);
      setIsProcessing(true);

      try {
        // Read file content
        const fileContent = await FileSystem.readAsStringAsync(file.uri, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Parse Excel file
        const workbook = XLSX.read(fileContent, { type: 'base64' });

        // Get first sheet (Products sheet)
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (jsonData.length < 2) {
          Alert.alert('Error', 'File is empty or has no data rows');
          setIsProcessing(false);
          setSelectedFile(null);
          return;
        }

        // Skip header row and parse products
        const products: any[] = [];
        const errors: string[] = [];

        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (!row || row.length === 0 || !row[0]) continue; // Skip empty rows

          const nameEn = row[0]?.toString().trim();
          const nameTa = row[1]?.toString().trim() || nameEn;
          const categoryName = row[2]?.toString().trim();
          const price = parseFloat(row[3]) || 0;
          const unit = row[4]?.toString().trim() || 'piece';
          const gstPercentage = parseFloat(row[5]) || 0;
          const isGstInclusive = row[6]?.toString().toLowerCase() === 'yes';
          const stock = parseInt(row[7]) || undefined;
          const barcode = row[8]?.toString().trim() || undefined;

          // Validate required fields
          if (!nameEn) {
            errors.push(`Row ${i + 1}: Missing product name`);
            continue;
          }
          if (price <= 0) {
            errors.push(`Row ${i + 1}: Invalid price for "${nameEn}"`);
            continue;
          }

          // Find category ID
          const category = state.categories.find(
            c => c.nameEn.toLowerCase() === categoryName?.toLowerCase()
          );

          if (!category) {
            errors.push(`Row ${i + 1}: Category "${categoryName}" not found for "${nameEn}"`);
            continue;
          }

          products.push({
            nameEn,
            nameTa,
            categoryId: category.id,
            price,
            unit,
            gstPercentage,
            isGstInclusive,
            stock,
            barcode,
          });
        }

        setIsProcessing(false);

        if (products.length === 0) {
          Alert.alert(
            'Import Failed',
            errors.length > 0
              ? `No valid products found.\n\nErrors:\n${errors.slice(0, 5).join('\n')}${errors.length > 5 ? `\n...and ${errors.length - 5} more` : ''}`
              : 'No valid products found in the file.'
          );
          setSelectedFile(null);
          return;
        }

        // Confirm import
        Alert.alert(
          'Confirm Import',
          `Found ${products.length} valid products.${errors.length > 0 ? `\n\n${errors.length} rows had errors and were skipped.` : ''}\n\nDo you want to import these products?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setSelectedFile(null) },
            {
              text: 'Import',
              onPress: () => {
                addProductsBulk(products);
                setSelectedFile(null);
                Alert.alert('Success', `${products.length} products imported successfully!`);
              },
            },
          ]
        );
      } catch (parseError) {
        console.log('Error parsing file:', parseError);
        setIsProcessing(false);
        Alert.alert(
          'Parse Error',
          'Failed to parse the file. Make sure it\'s a valid Excel file (.xlsx) with the correct format.',
          [
            { text: 'Try Demo Import', onPress: handleDemoImport },
            { text: 'Cancel', style: 'cancel', onPress: () => setSelectedFile(null) },
          ]
        );
      }
    } catch (error) {
      console.log('Error picking file:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to pick file');
    }
  };

  const handleDemoImport = () => {
    setIsProcessing(true);

    // Simulate processing delay
    setTimeout(() => {
      const demoProducts = [
        { nameEn: 'Basmati Rice', nameTa: 'பாசுமதி அரிசி', categoryId: '1', price: 120, gstPercentage: 5, isGstInclusive: false, unit: 'kg' },
        { nameEn: 'Coconut Oil', nameTa: 'தேங்காய் எண்ணெய்', categoryId: '1', price: 180, gstPercentage: 5, isGstInclusive: false, unit: 'liter' },
        { nameEn: 'Carrot', nameTa: 'கேரட்', categoryId: '2', price: 40, gstPercentage: 0, isGstInclusive: false, unit: 'kg' },
        { nameEn: 'Spinach', nameTa: 'கீரை', categoryId: '2', price: 30, gstPercentage: 0, isGstInclusive: false, unit: 'bunch' },
        { nameEn: 'Orange', nameTa: 'ஆரஞ்சு', categoryId: '3', price: 80, gstPercentage: 0, isGstInclusive: false, unit: 'kg' },
      ];

      addProductsBulk(demoProducts);
      setIsProcessing(false);
      setSelectedFile(null);

      Alert.alert('Success', `${demoProducts.length} products imported successfully!`);
    }, 2000);
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);

      // Create workbook
      const workbook = XLSX.utils.book_new();

      // Products Sheet - Headers and sample data
      const productsData = [
        // Header row
        [
          'Name (English) *',
          'Name (Tamil)',
          'Category *',
          'Price *',
          'Unit *',
          'GST %',
          'GST Inclusive (Yes/No)',
          'Stock',
          'Barcode',
        ],
        // Sample data rows
        [
          'Sample Product',
          'மாதிரி பொருள்',
          state.categories[0]?.nameEn || 'Grocery',
          '100',
          'kg',
          '5',
          'No',
          '50',
          '',
        ],
        [
          'Another Product',
          'மற்றொரு பொருள்',
          state.categories[1]?.nameEn || 'Vegetables',
          '50',
          'piece',
          '0',
          'No',
          '100',
          '',
        ],
      ];

      const productsSheet = XLSX.utils.aoa_to_sheet(productsData);

      // Set column widths
      productsSheet['!cols'] = [
        { wch: 20 }, // Name English
        { wch: 20 }, // Name Tamil
        { wch: 15 }, // Category
        { wch: 10 }, // Price
        { wch: 10 }, // Unit
        { wch: 8 },  // GST %
        { wch: 20 }, // GST Inclusive
        { wch: 10 }, // Stock
        { wch: 15 }, // Barcode
      ];

      XLSX.utils.book_append_sheet(workbook, productsSheet, 'Products');

      // Categories Sheet - List of available categories
      const categoriesData = [
        ['Available Categories', 'Tamil Name'],
        ...state.categories.map(cat => [cat.nameEn, cat.nameTa]),
      ];
      const categoriesSheet = XLSX.utils.aoa_to_sheet(categoriesData);
      categoriesSheet['!cols'] = [{ wch: 20 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, 'Categories');

      // Units Sheet - List of available units
      const unitsData = [
        ['Available Units'],
        ['kg'],
        ['g'],
        ['liter'],
        ['ml'],
        ['piece'],
        ['dozen'],
        ['pack'],
        ['box'],
        ['bunch'],
      ];
      const unitsSheet = XLSX.utils.aoa_to_sheet(unitsData);
      unitsSheet['!cols'] = [{ wch: 15 }];
      XLSX.utils.book_append_sheet(workbook, unitsSheet, 'Units');

      // Instructions Sheet
      const instructionsData = [
        ['BULK UPLOAD INSTRUCTIONS'],
        [''],
        ['Required Columns (marked with *):'],
        ['- Name (English): Product name in English'],
        ['- Category: Must match exactly with categories in Categories sheet'],
        ['- Price: Numeric value (e.g., 100, 50.50)'],
        ['- Unit: Must match with units in Units sheet'],
        [''],
        ['Optional Columns:'],
        ['- Name (Tamil): Product name in Tamil'],
        ['- GST %: Tax percentage (0, 5, 12, 18, 28)'],
        ['- GST Inclusive: Yes or No'],
        ['- Stock: Numeric value for inventory'],
        ['- Barcode: Product barcode if available'],
        [''],
        ['NOTES:'],
        ['1. Do not change the header row'],
        ['2. Delete sample data rows before adding your products'],
        ['3. Category names must match exactly (case-sensitive)'],
        ['4. Save file as .xlsx format'],
      ];
      const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
      instructionsSheet['!cols'] = [{ wch: 60 }];
      XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

      // Generate Excel file
      const wbout = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });

      // Save to file system
      const fileName = `product_template_${Date.now()}.xlsx`;
      const filePath = FileSystem.documentDirectory + fileName;

      await FileSystem.writeAsStringAsync(filePath, wbout, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();

      if (isAvailable) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          dialogTitle: 'Download Product Template',
          UTI: 'com.microsoft.excel.xlsx',
        });
      } else {
        Alert.alert(
          'Template Created',
          `Template saved to: ${filePath}\n\nSharing is not available on this device.`
        );
      }

      setIsDownloading(false);
    } catch (error) {
      console.log('Error creating template:', error);
      setIsDownloading(false);
      Alert.alert('Error', 'Failed to create template. Please try again.');
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Instructions */}
      <View style={styles.instructionsCard}>
        <View style={styles.instructionsHeader}>
          <Ionicons name="information-circle" size={24} color={colors.info} />
          <Text style={styles.instructionsTitle}>How to Bulk Upload</Text>
        </View>
        <View style={styles.steps}>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Download the Excel template</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>Fill in your product details</Text>
          </View>
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={styles.stepText}>Upload the completed file</Text>
          </View>
        </View>
      </View>

      {/* Template Download */}
      <TouchableOpacity
        style={styles.templateCard}
        onPress={handleDownloadTemplate}
        disabled={isDownloading}
      >
        <View style={styles.templateIcon}>
          {isDownloading ? (
            <ActivityIndicator size="small" color={colors.success} />
          ) : (
            <Ionicons name="document-text" size={32} color={colors.success} />
          )}
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateTitle}>
            {isDownloading ? 'Creating Template...' : 'Download Template'}
          </Text>
          <Text style={styles.templateSubtitle}>Excel format (.xlsx)</Text>
        </View>
        {!isDownloading && (
          <Ionicons name="download" size={24} color={colors.success} />
        )}
      </TouchableOpacity>

      {/* Upload Section */}
      <View style={styles.uploadSection}>
        <Text style={styles.sectionTitle}>Upload Products</Text>

        <TouchableOpacity
          style={styles.uploadArea}
          onPress={handlePickFile}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <View style={styles.processingIcon}>
                <Ionicons name="sync" size={48} color={colors.accent} />
              </View>
              <Text style={styles.uploadTitle}>Processing...</Text>
              <Text style={styles.uploadSubtitle}>Please wait while we import your products</Text>
            </>
          ) : selectedFile ? (
            <>
              <View style={[styles.uploadIconContainer, styles.uploadIconSuccess]}>
                <Ionicons name="document-attach" size={48} color={colors.success} />
              </View>
              <Text style={styles.uploadTitle}>{selectedFile}</Text>
              <Text style={styles.uploadSubtitle}>Tap to select a different file</Text>
            </>
          ) : (
            <>
              <View style={styles.uploadIconContainer}>
                <Ionicons name="cloud-upload" size={48} color={colors.primary} />
              </View>
              <Text style={styles.uploadTitle}>Tap to Upload</Text>
              <Text style={styles.uploadSubtitle}>
                Supports .xlsx, .xls, .csv files
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Category Mapping */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Categories</Text>
        <Text style={styles.sectionSubtitle}>
          Use these exact names in your Excel file
        </Text>
        <View style={styles.categoriesList}>
          {state.categories.map((category) => (
            <View key={category.id} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{category.nameEn}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Column Reference */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Required Columns</Text>
        <View style={styles.columnTable}>
          <View style={styles.columnRow}>
            <Text style={styles.columnHeader}>Column</Text>
            <Text style={styles.columnHeader}>Field</Text>
            <Text style={styles.columnHeader}>Required</Text>
          </View>
          {[
            { col: 'A', field: 'Name (English)', required: true },
            { col: 'B', field: 'Name (Tamil)', required: false },
            { col: 'C', field: 'Category', required: true },
            { col: 'D', field: 'Price', required: true },
            { col: 'E', field: 'Unit', required: true },
            { col: 'F', field: 'GST %', required: false },
            { col: 'G', field: 'GST Inclusive', required: false },
            { col: 'H', field: 'Stock', required: false },
            { col: 'I', field: 'Barcode', required: false },
          ].map((row, index) => (
            <View key={index} style={styles.columnRow}>
              <Text style={styles.columnCell}>{row.col}</Text>
              <Text style={styles.columnCell}>{row.field}</Text>
              <Text style={[styles.columnCell, row.required && styles.requiredCell]}>
                {row.required ? 'Yes' : 'No'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  instructionsCard: {
    backgroundColor: colors.info + '15',
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  instructionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  instructionsTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.info,
  },
  steps: {
    gap: spacing.sm,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.info,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.white,
  },
  stepText: {
    fontSize: fontSize.md,
    color: colors.text.primary,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...shadows.small,
  },
  templateIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  templateInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  templateTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  templateSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  uploadSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  uploadArea: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    padding: spacing.xxl,
    alignItems: 'center',
  },
  uploadIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadIconSuccess: {
    backgroundColor: colors.success + '15',
  },
  processingIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.accent + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  uploadTitle: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  uploadSubtitle: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  categoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryChipText: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.white,
  },
  columnTable: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  columnRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  columnHeader: {
    flex: 1,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    backgroundColor: colors.gray[100],
    textAlign: 'center',
  },
  columnCell: {
    flex: 1,
    padding: spacing.sm,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  requiredCell: {
    color: colors.error,
    fontWeight: fontWeight.medium,
  },
  bottomPadding: {
    height: spacing.xxl,
  },
});

