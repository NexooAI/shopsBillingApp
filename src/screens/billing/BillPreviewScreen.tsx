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
import { useApp } from '../../context/AppContext';

type BillPreviewRouteProp = RouteProp<RootStackParamList, 'BillPreview'>;

export default function BillPreviewScreen() {
  const route = useRoute<BillPreviewRouteProp>();
  const navigation = useNavigation();
  const { state } = useApp();
  const shopName = state.settings?.shopName || 'ShopBill Pro';
  const shopAddress = state.settings?.address || '123 Main Street, City';
  const shopPhone = state.settings?.phone || '+91 98765 43210';
  const logoUri = state.settings?.logoUri;
  

  
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
           device_name: 'Printer',
           device_type: printerType === 'bluetooth' ? 'bluetooth' : (printerType === 'net' ? 'net' : 'usb')
        });
        
        // 2. Bluetooth Printing (Text Mode)
        await PrinterService.printBillObject(bill, state.settings);
        Alert.alert('Success', 'Sent to Bluetooth Printer');
        
      } else {
        // 3. System Printing (Default)
        const html = `
          <html>
            <head>
              <style>
                @page { margin: 0; }
                body { font-family: 'Courier New', monospace; padding: 10px; color: #000; margin: 0; width: 100%; max-width: 100%; box-sizing: border-box; }
                .header { text-align: center; margin-bottom: 5px; }
                .shop-name { font-size: 16px; font-weight: bold; margin: 0; text-transform: uppercase; }
                .shop-details { font-size: 10px; margin: 2px 0; }
                .divider { border-top: 1px dashed #000; margin: 5px 0; display: block; width: 100%; }
                .row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
                .label { font-weight: normal; }
                .value { font-weight: bold; }
                
                table { width: 100%; border-collapse: collapse; margin: 5px 0; table-layout: fixed; }
                th { border-bottom: 1px dashed #000; padding: 2px 0; font-weight: bold; text-transform: uppercase; white-space: nowrap; }
                td { padding: 2px 0; font-size: 10px; vertical-align: top; }
                .text-right { text-align: right; }
                .text-center { text-align: center; }
                
                .totals { margin-top: 5px; border-top: 1px dashed #000; padding-top: 5px; }
                .total-row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
                .grand-total { border-top: 1px solid #000; margin-top: 5px; padding-top: 5px; font-size: 14px; font-weight: bold; }
                
                .gst-box { margin: 5px 0; padding: 5px 0; border-top: 1px dashed #000; border-bottom: 1px dashed #000; }
                .gst-title { font-size: 9px; font-weight: bold; margin-bottom: 2px; }
                .footer { text-align: center; margin-top: 10px; padding-top: 10px; border-top: 1px dashed #000; }
                .footer p { margin: 2px 0; font-size: 10px; }
                .thank-you { font-weight: bold; font-size: 12px; margin-bottom: 5px; }
              </style>
            </head>
            <body>
              <div class="header">
                <div style="display: flex; justify-content: center; margin-bottom: 10px;">
                  <div style="width: 40px; height: 40px; background-color: #000; border-radius: 20px; display: flex; align-items: center; justify-content: center;">
                    ${logoUri 
                      ? `<img src="${logoUri}" style="width: 40px; height: 40px; border-radius: 20px; object-fit: cover;" />`
                      : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="20" height="20" fill="#fff">
                          <path d="M448 128h-32V80c0-26.51-21.49-48-48-48H144c-26.51 0-48 21.49-48 48v48H64c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16.15c20.35 0 38.64-12.01 46.64-30.63C134.8 290.4 153.1 304 176 304s41.21-13.6 49.21-30.63c8 18.62 26.29 30.63 46.79 30.63s38.79-12.01 46.79-30.63c8 18.62 26.29 30.63 46.79 30.63s38.79-12.01 46.79-30.63c8 18.62 26.29 30.63 46.79 30.63h16.15c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64zM128 128H384V80c0-8.82-7.18-16-16-16H144c-8.82 0-16 7.18-16 16v48zM64 256c-8.82 0-16-7.18-16-16v-48c0-8.82 7.18-16 16-16h32v80H64zm112 0c-8.82 0-16-7.18-16-16v-64h32v64c0 8.82-7.18 16-16 16zm112 0c-8.82 0-16-7.18-16-16v-64h32v64c0 8.82-7.18 16-16 16zm112 0c-8.82 0-16-7.18-16-16v-64h32v64c0 8.82-7.18 16-16 16zM464 240c0 8.82-7.18 16-16 16h-32v-80h32c8.82 0 16 7.18 16 16v48z"/>
                         </svg>`
                    }
                  </div>
                </div>
                <h1 class="shop-name">${shopName}</h1>
                <p class="shop-details">${shopAddress}</p>
                <p class="shop-details">📞 ${shopPhone}</p>
                <p class="shop-details" style="font-size: 10px; margin-top: 5px">GSTIN: 33ABCDE1234F1Z5</p>
              </div>
              
              <div class="divider"></div>
              
              <div class="row"><span class="label">Bill No:</span><span class="value">#${bill.id.slice(-6)}</span></div>
              <div class="row"><span class="label">Date:</span><span class="value">${formatDate(bill.createdAt)}</span></div>
              <div class="row"><span class="label">Time:</span><span class="value">${formatTime(bill.createdAt)}</span></div>
              
              <div class="divider"></div>
              
              <table>
                <thead>
                  <tr>
                    <th style="width: 45%; font-size: 10px; text-align: left;">Item</th>
                    <th style="width: 15%; font-size: 10px; text-align: center;">Qty</th>
                    <th style="width: 20%; font-size: 10px; text-align: right;">Rate</th>
                    <th style="width: 20%; font-size: 10px; text-align: right;">Amt</th>
                  </tr>
                </thead>
                <tbody>
                  ${bill.items.map(item => `
                    <tr>
                      <td>
                        <div style="font-weight: 500">${item.product.nameEn}</div>
                        <div style="font-size: 10px; color: #9e9e9e">${item.product.nameTa || ''}</div>
                      </td>
                      <td class="text-center">${item.quantity}</td>
                      <td class="text-right">₹${item.product.price}</td>
                      <td class="text-right">₹${(item.quantity * item.product.price).toFixed(2)}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
              
              <div class="divider"></div>
              
              <div class="totals">
                <div class="total-row"><span>Subtotal</span><span>₹${bill.subtotal.toFixed(2)}</span></div>
                <div class="total-row"><span>GST</span><span>₹${bill.gstAmount.toFixed(2)}</span></div>
                <div class="total-row grand-total"><span>Total</span><span>₹${bill.total.toFixed(2)}</span></div>
              </div>
              
              <div class="gst-box">
                <div class="gst-title">GST Breakdown</div>
                <div class="row"><span style="font-size: 10px">CGST (2.5%)</span><span style="font-size: 10px">₹${(bill.gstAmount / 2).toFixed(2)}</span></div>
                <div class="row"><span style="font-size: 10px">SGST (2.5%)</span><span style="font-size: 10px">₹${(bill.gstAmount / 2).toFixed(2)}</span></div>
              </div>
              
              <div class="footer">
                <p class="thank-you">Thank You!</p>
                <p class="shop-details">Please visit again</p>
                <p style="font-size: 10px; color: #bdbdbd; margin-top: 10px">Powered by ShopBill Pro</p>
              </div>
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
            <Text style={styles.shopName}>{shopName}</Text>
            <Text style={styles.shopAddress}>{shopAddress}</Text>
            <Text style={styles.shopPhone}>📞 {shopPhone}</Text>
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
    textAlign: 'center',
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
