import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { useApp } from '../../context/AppContext';

export default function BulkUploadScreen() {
  const { state, addProductsBulk } = useApp();
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/csv',
        ],
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile(file.name);

      // In a real app, you would parse the Excel file here using xlsx library
      // For demo, we'll simulate the process
      Alert.alert(
        'File Selected',
        `Selected: ${file.name}\n\nNote: In production, the file would be parsed and products would be imported.`,
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setSelectedFile(null) },
          { text: 'Import Demo Data', onPress: handleDemoImport },
        ]
      );
    } catch (error) {
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

  const handleDownloadTemplate = () => {
    Alert.alert(
      'Download Template',
      'Template format:\n\n' +
        'Column A: Name (English)\n' +
        'Column B: Name (Tamil)\n' +
        'Column C: Category\n' +
        'Column D: Price\n' +
        'Column E: Unit\n' +
        'Column F: GST %\n' +
        'Column G: GST Inclusive (Yes/No)\n\n' +
        'Note: Template download would work in production.',
      [{ text: 'OK' }]
    );
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
      <TouchableOpacity style={styles.templateCard} onPress={handleDownloadTemplate}>
        <View style={styles.templateIcon}>
          <Ionicons name="document-text" size={32} color={colors.success} />
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateTitle}>Download Template</Text>
          <Text style={styles.templateSubtitle}>Excel format (.xlsx)</Text>
        </View>
        <Ionicons name="download" size={24} color={colors.success} />
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

