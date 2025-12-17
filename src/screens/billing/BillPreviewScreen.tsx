import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { Bill } from '../../types';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import PrinterService from '../../services/PrinterService';

type BillPreviewRouteProp = RouteProp<RootStackParamList, 'BillPreview'>;

export default function BillPreviewScreen() {
  const route = useRoute<BillPreviewRouteProp>();
  const navigation = useNavigation();
  const bill: Bill = route.params.bill;
  const [isPrinting, setIsPrinting] = useState(false);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = async () => {
    setIsPrinting(true);
    
    try {
      // 1. Check selected printer preference
      const savedPrinter = await AsyncStorage.getItem('selected_printer');
      let printerType = 'system';
      let printerAddress = '';
      
      if (savedPrinter) {
        const p = JSON.parse(savedPrinter);
        printerType = p.type;
        printerAddress = p.address;
      }
      
      if (printerType === 'bluetooth' && printerAddress) {
        // 2. Bluetooth Printing
        await PrinterService.connect({ 
           inner_mac_address: printerAddress, 
           device_name: 'Printer' // Name doesn't matter for connection usually, but good practice
        });
        await PrinterService.printBillObject(bill);
        Alert.alert('Success', 'Sent to Bluetooth Printer');
        
      } else {
        // 3. System Printing (Default)
        // Create simple HTML for system print
        const html = `
          <html>
            <head>
              <style>
                body { font-family: Helvetica, sans-serif; padding: 20px; }
                .header { text-align: center; margin-bottom: 20px; }
                .row { display: flex; justify-content: space-between; margin-bottom: 5px; }
                .bold { font-weight: bold; }
                .divider { border-top: 1px dashed #000; margin: 10px 0; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>ShopBill Pro</h1>
                <p>123 Main Street, City</p>
              </div>
              <div class="divider"></div>
              <div class="row"><span>Bill No:</span><span>#${bill.id.slice(-6)}</span></div>
              <div class="row"><span>Date:</span><span>${new Date(bill.createdAt).toLocaleDateString()}</span></div>
              <div class="divider"></div>
              ${bill.items.map(item => `
                <div class="row">
                  <span style="flex:2">${item.product.nameEn} x${item.quantity}</span>
                  <span style="flex:1; text-align:right">${(item.quantity * item.product.price).toFixed(2)}</span>
                </div>
              `).join('')}
              <div class="divider"></div>
              <div class="row bold"><span>Total</span><span>₹${bill.total.toFixed(2)}</span></div>
              <div class="header" style="margin-top:20px"><p>Thank You!</p></div>
            </body>
          </html>
        `;
        
        await Print.printAsync({ html });
      }
      
    } catch (error: any) {
      Alert.alert('Print Error', error.message || 'Failed to print');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Bill', 'Share as PDF or image');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Bill Paper */}
        <View style={styles.billPaper}>
          {/* Header */}
          <View style={styles.billHeader}>
            <View style={styles.logoPlaceholder}>
              <Ionicons name="storefront" size={40} color={colors.primary} />
            </View>
            <Text style={styles.shopName}>ShopBill Pro</Text>
            <Text style={styles.shopAddress}>123 Main Street, City</Text>
            <Text style={styles.shopPhone}>📞 +91 98765 43210</Text>
            <Text style={styles.gstinText}>GSTIN: 33ABCDE1234F1Z5</Text>
          </View>

          {/* Divider */}
          <View style={styles.dashedDivider}>
            {[...Array(30)].map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* Bill Info */}
          <View style={styles.billInfo}>
            <View style={styles.billInfoRow}>
              <Text style={styles.billLabel}>Bill No:</Text>
              <Text style={styles.billValue}>#{bill.id.slice(-6)}</Text>
            </View>
            <View style={styles.billInfoRow}>
              <Text style={styles.billLabel}>Date:</Text>
              <Text style={styles.billValue}>{formatDate(bill.createdAt)}</Text>
            </View>
            <View style={styles.billInfoRow}>
              <Text style={styles.billLabel}>Time:</Text>
              <Text style={styles.billValue}>{formatTime(bill.createdAt)}</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dashedDivider}>
            {[...Array(30)].map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* Items Header */}
          <View style={styles.itemsHeader}>
            <Text style={[styles.headerText, styles.itemCol]}>Item</Text>
            <Text style={[styles.headerText, styles.qtyCol]}>Qty</Text>
            <Text style={[styles.headerText, styles.rateCol]}>Rate</Text>
            <Text style={[styles.headerText, styles.amountCol]}>Amount</Text>
          </View>

          {/* Items */}
          <View style={styles.itemsList}>
            {bill.items.map((item, index) => (
              <View key={index} style={styles.itemRow}>
                <View style={styles.itemCol}>
                  <Text style={styles.itemName}>{item.product.nameEn}</Text>
                  <Text style={styles.itemNameTa}>{item.product.nameTa}</Text>
                </View>
                <Text style={[styles.itemText, styles.qtyCol]}>{item.quantity}</Text>
                <Text style={[styles.itemText, styles.rateCol]}>₹{item.product.price}</Text>
                <Text style={[styles.itemText, styles.amountCol]}>
                  ₹{(item.product.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>

          {/* Divider */}
          <View style={styles.dashedDivider}>
            {[...Array(30)].map((_, i) => (
              <View key={i} style={styles.dash} />
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalsSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal</Text>
              <Text style={styles.totalValue}>₹{bill.subtotal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>GST</Text>
              <Text style={styles.totalValue}>₹{bill.gstAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>Total</Text>
              <Text style={styles.grandTotalValue}>₹{bill.total.toFixed(2)}</Text>
            </View>
          </View>

          {/* GST Breakdown */}
          <View style={styles.gstBreakdown}>
            <Text style={styles.gstBreakdownTitle}>GST Breakdown</Text>
            <View style={styles.gstBreakdownRow}>
              <Text style={styles.gstBreakdownText}>CGST (2.5%)</Text>
              <Text style={styles.gstBreakdownText}>₹{(bill.gstAmount / 2).toFixed(2)}</Text>
            </View>
            <View style={styles.gstBreakdownRow}>
              <Text style={styles.gstBreakdownText}>SGST (2.5%)</Text>
              <Text style={styles.gstBreakdownText}>₹{(bill.gstAmount / 2).toFixed(2)}</Text>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.billFooter}>
            <Text style={styles.thankYouText}>Thank You!</Text>
            <Text style={styles.visitAgainText}>Please visit again</Text>
          </View>
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={24} color={colors.primary} />
          <Text style={styles.shareButtonText}>Share</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.printButton, isPrinting && styles.printButtonDisabled]}
          onPress={handlePrint}
          disabled={isPrinting}
        >
          <Ionicons name="print" size={24} color={colors.primary} />
          <Text style={styles.printButtonText}>
            {isPrinting ? 'Printing...' : 'Print Bill'}
          </Text>
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
  scrollView: {
    flex: 1,
  },
  billPaper: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    ...shadows.medium,
  },
  billHeader: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.gray[100],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  shopName: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  shopAddress: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    marginTop: 2,
  },
  shopPhone: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  gstinText: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
    marginTop: spacing.xs,
  },
  dashedDivider: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: spacing.md,
  },
  dash: {
    width: 6,
    height: 1,
    backgroundColor: colors.gray[300],
    marginHorizontal: 2,
  },
  billInfo: {
    marginBottom: spacing.sm,
  },
  billInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  billLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  billValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  itemsHeader: {
    flexDirection: 'row',
    paddingBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  headerText: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
  },
  itemCol: {
    flex: 2,
  },
  qtyCol: {
    width: 40,
    textAlign: 'center',
  },
  rateCol: {
    width: 60,
    textAlign: 'right',
  },
  amountCol: {
    width: 70,
    textAlign: 'right',
  },
  itemsList: {
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemName: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  itemNameTa: {
    fontSize: fontSize.xs,
    color: colors.gray[500],
  },
  itemText: {
    fontSize: fontSize.sm,
    color: colors.text.primary,
  },
  totalsSection: {
    marginBottom: spacing.md,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  totalLabel: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  totalValue: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.text.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
    borderTopWidth: 2,
    borderTopColor: colors.primary,
    marginTop: spacing.sm,
  },
  grandTotalLabel: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
  grandTotalValue: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.accent,
  },
  gstBreakdown: {
    backgroundColor: colors.gray[50],
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  gstBreakdownTitle: {
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
  },
  gstBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gstBreakdownText: {
    fontSize: fontSize.xs,
    color: colors.gray[600],
  },
  billFooter: {
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  thankYouText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
  visitAgainText: {
    fontSize: fontSize.sm,
    color: colors.text.secondary,
  },
  actionBar: {
    flexDirection: 'row',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  shareButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
    color: colors.primary,
  },
  printButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  printButtonDisabled: {
    opacity: 0.7,
  },
  printButtonText: {
    fontSize: fontSize.md,
    fontWeight: fontWeight.bold,
    color: colors.primary,
  },
});

