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
    Linking,
    PermissionsAndroid,
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
    address?: string;
    isConnected: boolean;
}

const PRINTER_STORAGE_KEY = 'selected_printer';

export default function PrinterSettingsScreen() {
    const [isChecking, setIsChecking] = useState(false);
    const [printers, setPrinters] = useState<PrinterInfo[]>([]);
    const [selectedPrinter, setSelectedPrinter] = useState<PrinterInfo | null>(null);
    const [systemPrintAvailable, setSystemPrintAvailable] = useState(false);

    useEffect(() => {
        checkPrintAvailability();
        loadSelectedPrinter();
        
        // Auto-connect if printer saved
        const restoreConnection = async () => {
             const saved = await AsyncStorage.getItem(PRINTER_STORAGE_KEY);
             if(saved) {
                 const p = JSON.parse(saved);
                 if (p.type === 'bluetooth' && p.address) {
                     try {
                        console.log('Attempting auto-connect to', p.name);
                        await PrinterService.connect({ 
                            inner_mac_address: p.address, 
                            device_name: p.name 
                        });
                        // Update UI to show connected
                        setSelectedPrinter({...p, isConnected: true});
                     } catch (e) {
                         console.log('Auto-connect failed', e);
                         setSelectedPrinter({...p, isConnected: false});
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
            if (printer.type === 'bluetooth' && printer.address) {
                setIsChecking(true);
                try {
                    await PrinterService.connect({
                        inner_mac_address: printer.address,
                        device_name: printer.name
                    });
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
                // System printer or others
                await AsyncStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(printer));
                setSelectedPrinter(printer);
                Alert.alert('Success', `${printer.name} selected as default`);
            }
        } catch (error) {
            console.log('Error saving printer settings:', error);
        }
    };

    const checkPrintAvailability = async () => {
        setIsChecking(true);
        try {
            const printAvailable = await Print.printAsync !== undefined;
            setSystemPrintAvailable(printAvailable);
            // Initialize the list with System Printer
             setPrinters([{
                id: 'system',
                name: 'System Print Dialog',
                type: 'system',
                isConnected: true,
            }]);
        } catch (error) {
            console.log('Error checking print availability:', error);
        } finally {
            setIsChecking(false);
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
        setIsChecking(true);
        
        const hasPermissions = await requestPermissions();
        if (!hasPermissions) {
            Alert.alert('Permission Denied', 'Bluetooth permissions are required to scan for printers.');
            setIsChecking(false);
            return;
        }

        try {
            const devices = await PrinterService.scan();
            const formattedDevices: PrinterInfo[] = devices.map(d => ({
                id: d.inner_mac_address,
                name: d.device_name,
                type: 'bluetooth',
                address: d.inner_mac_address,
                isConnected: false // Will be updated if matches selected
            }));

            // Merge with system printer
            setPrinters(prev => {
                const system = prev.find(p => p.type === 'system');
                return system ? [system, ...formattedDevices] : formattedDevices;
            });

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
            } else if (printer.type === 'bluetooth') {
                await PrinterService.printTestReceipt();
                Alert.alert('Sent', 'Test print sent to printer');
            }
        } catch (error: any) {
            Alert.alert('Print Error', error.message || 'Failed to print');
        }
    };



    const getPrinterIcon = (type: string) => {
        switch (type) {
            case 'bluetooth':
                return 'bluetooth';
            case 'usb':
                return 'hardware-chip';
            case 'wifi':
                return 'wifi';
            default:
                return 'print';
        }
    };

    const getPrinterTypeColor = (type: string) => {
        switch (type) {
            case 'bluetooth':
                return colors.info;
            case 'usb':
                return colors.success;
            case 'wifi':
                return colors.secondary;
            default:
                return colors.primary;
        }
    };

    return (
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
            {/* Connection Status */}
            <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                    <View style={[
                        styles.statusIndicator,
                        { backgroundColor: selectedPrinter ? colors.success : colors.warning }
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

            {/* Scan Button */}
            <TouchableOpacity
                style={styles.scanButton}
                onPress={scanForPrinters}
                disabled={isChecking}
            >
                {isChecking ? (
                    <ActivityIndicator color={colors.white} />
                ) : (
                    <Ionicons name="search" size={24} color={colors.white} />
                )}
                <Text style={styles.scanButtonText}>
                    {isChecking ? 'Scanning...' : 'Scan for Printers'}
                </Text>
            </TouchableOpacity>

            {/* Available Printers */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Available Printers</Text>

                {printers.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="print-outline" size={48} color={colors.gray[300]} />
                        <Text style={styles.emptyText}>No printers found</Text>
                        <Text style={styles.emptySubtext}>Tap "Scan for Printers" to search</Text>
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
                                    <View style={[
                                        styles.typeBadge,
                                        { backgroundColor: getPrinterTypeColor(printer.type) + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.typeBadgeText,
                                            { color: getPrinterTypeColor(printer.type) }
                                        ]}>
                                            {printer.type.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={[
                                        styles.statusBadge,
                                        { backgroundColor: printer.isConnected ? colors.success + '20' : colors.error + '20' }
                                    ]}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: printer.isConnected ? colors.success : colors.error }
                                        ]} />
                                        <Text style={[
                                            styles.statusBadgeText,
                                            { color: printer.isConnected ? colors.success : colors.error }
                                        ]}>
                                            {printer.isConnected ? 'Ready' : 'Disconnected'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                            {selectedPrinter?.id === printer.id && (
                                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                            )}
                        </TouchableOpacity>
                    ))
                )}
            </View>

            {/* Connection Types Info */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Connection Types</Text>

                <View style={styles.connectionTypeCard}>
                    <View style={[styles.connectionIcon, { backgroundColor: colors.info + '20' }]}>
                        <Ionicons name="bluetooth" size={24} color={colors.info} />
                    </View>
                    <View style={styles.connectionInfo}>
                        <Text style={styles.connectionTitle}>Bluetooth Printer</Text>
                        <Text style={styles.connectionDesc}>
                            Pair your thermal printer via Bluetooth. Ideal for portable receipt printing.
                        </Text>
                    </View>
                </View>

                <View style={styles.connectionTypeCard}>
                    <View style={[styles.connectionIcon, { backgroundColor: colors.success + '20' }]}>
                        <Ionicons name="hardware-chip" size={24} color={colors.success} />
                    </View>
                    <View style={styles.connectionInfo}>
                        <Text style={styles.connectionTitle}>USB Printer (OTG)</Text>
                        <Text style={styles.connectionDesc}>
                            Connect via USB OTG cable. Requires USB host support on your device.
                        </Text>
                    </View>
                </View>

                <View style={styles.connectionTypeCard}>
                    <View style={[styles.connectionIcon, { backgroundColor: colors.secondary + '20' }]}>
                        <Ionicons name="wifi" size={24} color={colors.secondary} />
                    </View>
                    <View style={styles.connectionInfo}>
                        <Text style={styles.connectionTitle}>Network Printer</Text>
                        <Text style={styles.connectionDesc}>
                            Connect to printers on your local WiFi network.
                        </Text>
                    </View>
                </View>

                <View style={styles.connectionTypeCard}>
                    <View style={[styles.connectionIcon, { backgroundColor: colors.primary + '20' }]}>
                        <Ionicons name="print" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.connectionInfo}>
                        <Text style={styles.connectionTitle}>System Print</Text>
                        <Text style={styles.connectionDesc}>
                            Use your device's built-in print dialog. Works with any connected printer.
                        </Text>
                    </View>
                </View>
            </View>

            {/* Setup Instructions */}
            <View style={styles.instructionsCard}>
                <View style={styles.instructionsHeader}>
                    <Ionicons name="help-circle" size={24} color={colors.accent} />
                    <Text style={styles.instructionsTitle}>Setup Instructions</Text>
                </View>
                <View style={styles.instruction}>
                    <Text style={styles.instructionNumber}>1</Text>
                    <Text style={styles.instructionText}>
                        Turn on your printer and enable Bluetooth/WiFi
                    </Text>
                </View>
                <View style={styles.instruction}>
                    <Text style={styles.instructionNumber}>2</Text>
                    <Text style={styles.instructionText}>
                        Pair the printer in your device settings first
                    </Text>
                </View>
                <View style={styles.instruction}>
                    <Text style={styles.instructionNumber}>3</Text>
                    <Text style={styles.instructionText}>
                        Return here and tap "Scan for Printers"
                    </Text>
                </View>
                <View style={styles.instruction}>
                    <Text style={styles.instructionNumber}>4</Text>
                    <Text style={styles.instructionText}>
                        Select your printer and test the connection
                    </Text>
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
    typeBadge: {
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
    },
    typeBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.bold,
    },
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
        paddingVertical: 2,
        borderRadius: borderRadius.sm,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusBadgeText: {
        fontSize: fontSize.xs,
        fontWeight: fontWeight.medium,
    },
    connectionTypeCard: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        ...shadows.small,
    },
    connectionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    connectionInfo: {
        flex: 1,
        marginLeft: spacing.md,
    },
    connectionTitle: {
        fontSize: fontSize.md,
        fontWeight: fontWeight.semibold,
        color: colors.text.primary,
        marginBottom: 2,
    },
    connectionDesc: {
        fontSize: fontSize.sm,
        color: colors.text.secondary,
        lineHeight: 18,
    },
    instructionsCard: {
        backgroundColor: colors.accent + '15',
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
        color: colors.accent,
    },
    instruction: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
        gap: spacing.sm,
    },
    instructionNumber: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: colors.accent,
        color: colors.primary,
        fontSize: fontSize.sm,
        fontWeight: fontWeight.bold,
        textAlign: 'center',
        lineHeight: 24,
    },
    instructionText: {
        flex: 1,
        fontSize: fontSize.md,
        color: colors.text.primary,
        lineHeight: 22,
    },
    bottomPadding: {
        height: spacing.xxl,
    },
});

