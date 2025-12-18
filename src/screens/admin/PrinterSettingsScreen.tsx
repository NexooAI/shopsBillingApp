import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    Alert,
    ActivityIndicator,
    Platform,
    PermissionsAndroid,
    TextInput,
    Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '../../theme';
import PrinterService, { PrinterDevice } from '../../services/PrinterService';

interface PrinterInfo {
    id: string;
    name: string;
    type: 'bluetooth' | 'usb' | 'wifi' | 'system';
    address?: string; // MAC for BT/USB, IP for Net
    isConnected: boolean;
}

const PRINTER_STORAGE_KEY = 'selected_printer';

export default function PrinterSettingsScreen() {
    const [isChecking, setIsChecking] = useState(false);
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<PrinterInfo | null>(null);
    const [activeTab, setActiveTab] = useState<'bluetooth' | 'usb' | 'wifi'>('bluetooth');
    const [wifiIp, setWifiIp] = useState('192.168.1.100');
    const [wifiPort, setWifiPort] = useState('9100');

    useEffect(() => {
        loadSelectedPrinter();
        
        // Auto-connect if printer saved
        const restoreConnection = async () => {
             const saved = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
             if(saved) {
                 const p = JSON.parse(saved);
                 if (p.address && (p.type === 'bluetooth' || p.type === 'usb' || p.type === 'net')) {
                     try {
                        console.log('Attempting auto-connect to', p.name);
                        
                        // Construct device object for service
                        const device: PrinterDevice = {
                            inner_mac_address: p.address,
                            device_name: p.name,
                            device_type: p.type === 'wifi' ? 'net' : p.type as any, // mapping wifi -> net
                        };

                        await PrinterService.connect(device);
                        
                        // Update UI to show connected
                        setSelectedPrinter({...p, isConnected: true});
                     } catch (e: any) {
                         console.log('Auto-connect failed', e);
                         setSelectedPrinter({...p, isConnected: false});
                         
                         const errStr = e?.message || String(e);
                         if (errStr.toLowerCase().includes('bluetooth') || errStr.toLowerCase().includes('adapter')) {
                             Alert.alert(
                                 'Bluetooth is Off',
                                 'Please turn on Bluetooth to connect to the printer.',
                                 [
                                     { text: 'Cancel', style: 'cancel' },
                                     { text: 'Settings', onPress: () => Platform.OS === 'android' ? Linking.sendIntent('android.settings.BLUETOOTH_SETTINGS') : Linking.openSettings() }
                                 ]
                             );
                         }
                     }
                 }
             }
        };
        restoreConnection();

        return () => {
            PrinterService.disconnect();
        }
    }, []);

    const loadSelectedPrinter = async () => {
        try {
            const saved = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
            if (saved) {
                setSelectedPrinter(JSON.parse(saved));
            }
        } catch (error) {
            console.log('Error loading printer settings:', error);
        }
    };

    const saveSelectedPrinter = async (printer: PrinterInfo) => {
        try {
            if (printer.type !== 'system') {
                setIsChecking(true);
                try {
                     const device: PrinterDevice = {
                        inner_mac_address: printer.address || '',
                        device_name: printer.name,
                        device_type: printer.type === 'wifi' ? 'net' : printer.type as any,
                    };

                    await PrinterService.connect(device);
                    const connectedPrinter = { ...printer, isConnected: true };
                    await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(connectedPrinter));
                    setSelectedPrinter(connectedPrinter);
                    Alert.alert('Success', `Connected to ${printer.name}`);
                } catch (err: any) {
                     Alert.alert('Connection Failed', err.message || 'Could not connect to printer');
                } finally {
                    setIsChecking(false);
                }
            } else {
                // System printer
                await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
                setSelectedPrinter(printer);
                Alert.alert('Success', `${printer.name} selected as default`);
            }
        } catch (error) {
            console.log('Error saving printer settings:', error);
        }
    };

    const requestPermissions = async () => {
        if (Platform.OS !== 'android') return true;

        if (Platform.Version >= 31) {
            const result = await PermissionsAndroid.requestMultiple([
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
                PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            ]);
            return (
                result['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED &&
                result['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED
            );
        } else {
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
    };

    const scanForPrinters = async () => {
        if (activeTab === 'wifi') {
             // WiFi uses manual entry, simulated "scan" add
             if (!wifiIp) {
                 Alert.alert('Validation Check', 'Please enter an IP address');
                 return;
             }
             const netPrinter: PrinterInfo = {
                 id: `net-${wifiIp}`,
                 name: `WiFi Printer (${wifiIp})`,
                 type: 'wifi',
                 address: wifiIp,
                 isConnected: false,
             };
             setPrinters([netPrinter]);
             return;
        }

        setIsChecking(true);
        
        if (activeTab === 'bluetooth') {
            const hasPermissions = await requestPermissions();
            if (!hasPermissions) {
                Alert.alert('Permission Denied', 'Bluetooth permissions are required.');
                setIsChecking(false);
                return;
            }
        }

        try {
            const scanType = activeTab === 'bluetooth' ? 'bluetooth' : 'usb';
            const devices = await PrinterService.scan(scanType);
            
            const formattedDevices: PrinterInfo[] = devices.map(d => ({
                id: d.inner_mac_address,
                name: d.device_name,
                type: d.device_type === 'net' ? 'wifi' : d.device_type, // Normalize type name for UI if needed
                address: d.inner_mac_address,
                isConnected: false 
            }));

            if (devices.length === 0) {
                 if (activeTab === 'usb') Alert.alert('No Devices', 'No USB printers found. check OTG connection.');
            }

            setPrinters(formattedDevices);

        } catch (error: any) {
             Alert.alert('Scan Failed', error.message || 'Could not scan for devices');
        } finally {
            setIsChecking(false);
        }
    };

    const testPrint = async (printer: PrinterInfo) => {
        try {
            if (printer.type === 'system') {
                const testHtml = `
                    <html>
                        <head><style>body { font-size: 24px; text-align: center; }</style></head>
                        <body><h1>Test Print</h1><p>System Print Works!</p></body>
                    </html>
                `;
                await Print.printAsync({ html: testHtml });
            } else {
                await PrinterService.printTestReceipt();
                Alert.alert('Sent', 'Test print sent to printer');
            }
        } catch (error: any) {
            Alert.alert('Print Error', error.message || 'Failed to print');
        }
    };

    const getPrinterIcon = (type: string) => {
        switch (type) {
            case 'bluetooth': return 'bluetooth';
            case 'usb': return 'hardware-chip';
            case 'wifi': return 'wifi';
            default: return 'print';
        }
    };

    const getPrinterTypeColor = (type: string) => {
        switch (type) {
            case 'bluetooth': return colors.info;
            case 'usb': return colors.success;
            case 'wifi': return colors.secondary;
            default: return colors.primary;
        }
    };

    const renderTabs = () => (
        <View style={styles.tabContainer}>
            {(['bluetooth', 'usb', 'wifi'] as const).map((tab) => (
                <TouchableOpacity
                    key={tab}
                    style={[styles.tab, activeTab === tab && styles.activeTab]}
                    onPress={() => {
                         setActiveTab(tab);
                         setPrinters([]); // Clear list on tab switch
                    }}
                >
                    <Ionicons 
                        name={getPrinterIcon(tab)} 
                        size={20} 
                        color={activeTab === tab ? colors.white : colors.text.secondary} 
                    />
                    <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Connection Status */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <View style={[
                        styles.statusIndicator,
                        { backgroundColor: selectedPrinter?.isConnected ? colors.success : colors.warning }
                    ]} />
                    <Text style={styles.statusTitle}>
                        {selectedPrinter ? 'Printer Connected' : 'No Printer Selected'}
                    </Text>
                </View>
                {selectedPrinter && (
                    <View style={styles.selectedPrinterInfo}>
                        <Ionicons
                            name={getPrinterIcon(selectedPrinter.type)}
                            size={24}
                            color={getPrinterTypeColor(selectedPrinter.type)}
                        />
                        <View style={styles.selectedPrinterDetails}>
                            <Text style={styles.selectedPrinterName}>{selectedPrinter.name}</Text>
                            <Text style={styles.selectedPrinterType}>
                                {selectedPrinter.type.toUpperCase()} Connection
                            </Text>
                        </View>
                        <TouchableOpacity
                            style={styles.testButton}
                            onPress={() => testPrint(selectedPrinter)}
                        >
                            <Ionicons name="print" size={18} color={colors.white} />
                            <Text style={styles.testButtonText}>Test</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Type Tabs */}
            {renderTabs()}

            {/* Manual IP Entry for WiFi */}
            {activeTab === 'wifi' && (
                <View style={styles.ipConfigCard}>
                    <Text style={styles.inputLabel}>Printer IP Address</Text>
                    <View style={styles.inputRow}>
                        <TextInput
                            style={styles.ipInput}
                            value={wifiIp}
                            onChangeText={setWifiIp}
                            placeholder="192.168.1.100"
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={styles.portInput}
                            value={wifiPort}
                            onChangeText={setWifiPort}
                            placeholder="9100"
                            keyboardType="numeric"
                        />
                    </View>
                    <Text style={styles.helperText}>Default port is usually 9100</Text>
                </View>
            )}

            {/* Action Button */}
            <TouchableOpacity
                style={styles.scanButton}
                onPress={scanForPrinters}
                disabled={isChecking}
            >
                {isChecking ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Ionicons name={activeTab === 'wifi' ? "add-circle" : "search"} size={24} color={colors.white} />
                )}
                <Text style={styles.scanButtonText}>
                     {activeTab === 'wifi' 
                        ? 'Add WiFi Printer' 
                        : isChecking ? 'Scanning...' : `Scan ${activeTab === 'bluetooth' ? 'Bluetooth' : 'USB'} Devices`}
                </Text>
            </TouchableOpacity>

            {/* Device List */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Found Devices</Text>

                {printers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="print-outline" size={48} color={colors.gray[300]} />
                        <Text style={styles.emptyText}>No devices found</Text>
                        <Text style={styles.emptySubtext}>
                            {activeTab === 'wifi' ? 'Enter IP and tap Add' : 'Tap Scan to search'}
                        </Text>
                    </View>
                ) : (
                    printers.map((printer) => (
                        <TouchableOpacity
                            key={printer.id}
                            style={[
                                styles.printerCard,
                                selectedPrinter?.id === printer.id && styles.printerCardSelected
                            ]}
                            onPress={() => saveSelectedPrinter(printer)}
                        >
                            <View style={[
                                styles.printerIconContainer,
                                { backgroundColor: getPrinterTypeColor(printer.type) + '20' }
                            ]}>
                                <Ionicons
                                    name={getPrinterIcon(printer.type)}
                                    size={28}
                                    color={getPrinterTypeColor(printer.type)}
                                />
                            </View>
                            <View style={styles.printerInfo}>
                                <Text style={styles.printerName}>{printer.name}</Text>
                                <View style={styles.printerMeta}>
                                     <Text style={[styles.typeBadgeText, {color: colors.gray[600]}]}>
                                         {printer.address}
                                     </Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={colors.gray[300]} />
                        </TouchableOpacity>
                    ))
                )}
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
    statusCard: {
        backgroundColor: colors.white,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        borderRadius: borderRadius.lg,
        ...shadows.small,
    },
    statusHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    statusIndicator: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    statusTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
    },
    selectedPrinterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.md,
        paddingTop: spacing.md,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        gap: spacing.md,
    },
    selectedPrinterDetails: {
        flex: 1,
    },
    selectedPrinterName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
    },
    selectedPrinterType: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
    },
    testButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    testButtonText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.white,
    },
    tabContainer: {
        flexDirection: 'row',
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: 4,
        ...shadows.small,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.md,
        borderRadius: borderRadius.md,
        gap: spacing.xs,
    },
    activeTab: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text.secondary,
    },
    activeTabText: {
        color: colors.white,
        fontWeight: fontWeight.bold,
    },
    ipConfigCard: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        padding: spacing.lg,
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        ...shadows.small,
    },
    inputLabel: {
        fontSize: fontSize.sm,
        fontWeight: fontWeight.medium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    inputRow: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    ipInput: {
        flex: 3,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
    },
    portInput: {
        flex: 1,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: borderRadius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        fontSize: fontSize.md,
    },
    helperText: {
        fontSize: fontSize.xs,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    scanButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.primary,
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
        paddingVertical: spacing.md,
        borderRadius: borderRadius.lg,
        gap: spacing.sm,
    },
    scanButtonText: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.white,
    },
    section: {
        marginHorizontal: spacing.lg,
        marginTop: spacing.lg,
    },
    sectionTitle: {
        fontSize: fontSize.lg,
        fontWeight: fontWeight.bold,
        color: colors.text.primary,
        marginBottom: spacing.md,
    },
    emptyState: {
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.xxl,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginTop: spacing.md,
    },
    emptySubtext: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        marginTop: spacing.xs,
    },
    printerCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    printerCardSelected: {
        borderWidth: 2,
        borderColor: colors.success,
    },
    printerIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    printerInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    printerName: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: spacing.xs,
    },
    printerMeta: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    typeBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

