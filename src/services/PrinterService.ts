import {
    BLEPrinter,
    NetPrinter,
    USBPrinter,
} from 'react-native-thermal-receipt-printer';
import { Platform, NativeModules } from 'react-native';
import { Bill } from '../types';

export interface PrinterDevice {
    inner_mac_address: string;
    device_name: string;
    device_type: 'bluetooth' | 'usb' | 'net';
}

class PrinterService {
    private isInitialized = false;
    private connectedDevice: PrinterDevice | null = null;

    async init() {
        if (this.isInitialized) return;

        try {
            if (Platform.OS === 'android') {
                if (BLEPrinter) {
                    await BLEPrinter.init();
                    // NetPrinter & USBPrinter usually initialized on demand or shared
                    // But safe to try init if methods exist
                    if (NetPrinter) await NetPrinter.init();
                    if (USBPrinter) await USBPrinter.init();

                    this.isInitialized = true;
                } else {
                    console.warn('Printer native modules are not available.');
                }
            }
        } catch (err) {
            console.warn('PrinterService Init Error:', err);
        }
    }

    async scan(type: 'bluetooth' | 'usb' = 'bluetooth'): Promise<PrinterDevice[]> {
        await this.init();
        try {
            let results: any[] = [];

            if (type === 'bluetooth') {
                if (!BLEPrinter) {
                    console.warn('Cannot scan: BLEPrinter not initialized');
                    return [];
                }
                results = await BLEPrinter.getDeviceList();
                return results.map(d => ({
                    inner_mac_address: d.inner_mac_address,
                    device_name: d.device_name || 'Unknown Bluetooth Device',
                    device_type: 'bluetooth',
                }));
            } else if (type === 'usb') {
                if (!USBPrinter) {
                    console.warn('Cannot scan: USBPrinter not initialized');
                    return [];
                }
                results = await USBPrinter.getDeviceList();
                return results.map(d => ({
                    inner_mac_address: d.vendor_id ? `${d.vendor_id}:${d.product_id}` : d.device_id, // USB often uses IDs
                    device_name: d.device_name || `USB Printer ${d.vendor_id}`,
                    device_type: 'usb',
                }));
            }

            return [];
        } catch (error) {
            console.error(`Scan Error (${type}):`, error);
            return [];
        }
    }

    async connect(pc: PrinterDevice): Promise<void> {
        await this.init();
        try {
            if (pc.device_type === 'bluetooth') {
                if (!BLEPrinter) throw new Error('Bluetooth Module Missing');
                await BLEPrinter.connectPrinter(pc.inner_mac_address);
            } else if (pc.device_type === 'net') {
                if (!NetPrinter) throw new Error('Net Module Missing');
                // For Net, address is IP, port is typically 9100
                await NetPrinter.connectPrinter(pc.inner_mac_address, 9100);
            } else if (pc.device_type === 'usb') {
                if (!USBPrinter) throw new Error('USB Module Missing');
                // For USB, address is typically vendorId or unique ID determined during scan
                await (USBPrinter as any).connectPrinter(pc.inner_mac_address);
            }
            this.connectedDevice = pc;
        } catch (error) {
            console.error('Connect Error:', error);
            this.connectedDevice = null;
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        // Close all to be safe or check connected type
        try {
            if (BLEPrinter) await BLEPrinter.closeConn();
            if (NetPrinter) await NetPrinter.closeConn();
            if (USBPrinter) await USBPrinter.closeConn();
            this.connectedDevice = null;
        } catch (e) {
            console.warn('Disconnect Warning:', e);
        }
    }

    private async printRaw(text: string): Promise<void> {
        if (!this.connectedDevice) {
            console.warn('No printer connected, trying last known method or fail');
            // Try BLE as fallback default
            if (BLEPrinter) await BLEPrinter.printBill(text);
            return;
        }

        try {
            const { device_type } = this.connectedDevice;
            if (device_type === 'bluetooth' && BLEPrinter) {
                await BLEPrinter.printBill(text);
            } else if (device_type === 'net' && NetPrinter) {
                await NetPrinter.printBill(text);
            } else if (device_type === 'usb' && USBPrinter) {
                await USBPrinter.printBill(text);
            } else {
                throw new Error(`Printer module for ${device_type} missing`);
            }
        } catch (error) {
            console.error('Print Raw Error:', error);
            throw error;
        }
    }

    async printText(text: string): Promise<void> {
        await this.printRaw(text);
    }

    async printImage(base64Image: string): Promise<void> {
        if (!this.connectedDevice) {
            // Fallback to BLE if not explicit
            console.log('BLEPrinter methods:', Object.keys(BLEPrinter));
            try {
                if (BLEPrinter && (BLEPrinter as any).printImageBase64) {
                    await (BLEPrinter as any).printImageBase64(base64Image, { imageWidth: 384 });
                } else if (BLEPrinter && (BLEPrinter as any).printImage) {
                    await (BLEPrinter as any).printImage(base64Image, { imageWidth: 384 });
                } else {
                    console.warn('No image print method found on BLEPrinter');
                }
            } catch (e) {
                console.error('Fallback print error:', e);
            }
            return;
        }
        try {
            const { device_type } = this.connectedDevice;
            if (device_type === 'bluetooth' && BLEPrinter) {
                // The JS wrapper hides printImageData, so we access the NativeModule directly
                const RNBLEPrinter = NativeModules.RNBLEPrinter;
                if (RNBLEPrinter && RNBLEPrinter.printImageData) {
                    // Java Sig: printImageData(String imageUrl, Callback error)
                    // Try passing base64 with correct Data URI scheme.
                    const imageStr = base64Image.startsWith('data:') ? base64Image : `data:image/jpeg;base64,${base64Image}`;
                    RNBLEPrinter.printImageData(imageStr, (err: any) => console.warn('Native Print Error:', err));
                } else {
                    console.warn('Native RNBLEPrinter.printImageData not found');
                }
            } else if (device_type === 'net' && NetPrinter) {
                await (NetPrinter as any).printImageData(base64Image, (err: any) => console.warn('Print Error:', err));
            } else if (device_type === 'usb' && USBPrinter) {
                await (USBPrinter as any).printImageData(base64Image, (err: any) => console.warn('Print Error:', err));
            }
        } catch (error) {
            console.error('Print Image Error:', error);
            throw error;
        }
    }

    /**
     * Print a formatted receipt example
     */
    async printTestReceipt(): Promise<void> {
        const BOLD_ON = '<B>';
        const BOLD_OFF = '</B>';
        const CENTER = '<C>';
        const LEFT = '<L>';
        const type = this.connectedDevice?.device_type || 'Unknown';

        let receipt = '';
        receipt += `${CENTER}${BOLD_ON}TEST PRINT${BOLD_OFF}\n`;
        receipt += `${CENTER}Shops Billing App\n`;
        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${LEFT}Date: ${new Date().toLocaleString()}\n`;
        receipt += `${LEFT}Connection: ${type.toUpperCase()}\n`;
        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${CENTER}Works Perfectly!\n\n\n`; // Feed paper

        await this.printText(receipt);
    }

    async printBillObject(bill: Bill, shopSettings?: any): Promise<void> {
        const BOLD_ON = '<B>';
        const BOLD_OFF = '</B>';
        const CENTER = '<C>';
        const LEFT = '<L>';

        // 1. Printer width (58mm / 80mm)
        const printerWidth = shopSettings?.printerWidth === 80 ? 48 : 32;
        const is80mm = printerWidth === 48;

        // 2. Column widths
        const colWidths = is80mm
            ? { name: 20, qty: 5, rate: 10, amt: 10 }
            : { name: 11, qty: 3, rate: 7, amt: 8 };

        // 3. Helpers
        const line = '-'.repeat(printerWidth) + '\n';

        const padRight = (str: string, len: number) =>
            str.length > len ? str.substring(0, len) : str + ' '.repeat(len - str.length);

        const padLeft = (str: string, len: number) =>
            str.length > len ? str.substring(0, len) : ' '.repeat(len - str.length) + str;

        const row = (label: string, value: string) => {
            const space = printerWidth - label.length - value.length;
            return label + ' '.repeat(Math.max(space, 1)) + value;
        };

        // 4. Shop details
        const shopName = shopSettings?.shopName || 'Demo Shop';
        const address = shopSettings?.address || '123 Demo Street, City';
        const phone = shopSettings?.phone || '9999999999';
        const gstin = shopSettings?.gstin || '33ABCDE1234F1Z5';

        let receipt = '';

        /* ---------- HEADER ---------- */
        receipt += `${CENTER}${BOLD_ON}${shopName}${BOLD_OFF}\n`;
        receipt += `${CENTER}${address}\n`;
        receipt += `${CENTER}Ph: ${phone}\n`;
        receipt += `${CENTER}GSTIN: ${gstin}\n`;
        receipt += `${CENTER}${line}`;

        /* ---------- BILL INFO ---------- */
        receipt += `${LEFT}Bill No:${padLeft('#' + bill.id.slice(-6), printerWidth - 8)}\n`;
        receipt += `${LEFT}Date:${padLeft(
            new Date(bill.createdAt).toLocaleDateString(),
            printerWidth - 5
        )}\n`;
        receipt += `${LEFT}Time:${padLeft(
            new Date(bill.createdAt).toLocaleTimeString(),
            printerWidth - 5
        )}\n`;
        receipt += `${CENTER}${line}`;

        /* ---------- TABLE HEADER ---------- */
        receipt += `${LEFT}${padRight('ITEM', colWidths.name)} ${padLeft(
            'QTY',
            colWidths.qty
        )} ${padLeft('RATE', colWidths.rate)} ${padLeft(
            'AMOUNT',
            colWidths.amt
        )}\n`;
        receipt += `${CENTER}${line}`;

        /* ---------- ITEMS ---------- */
        bill.items.forEach(item => {
            const name = item.product.nameEn;
            const qty = item.quantity.toString();
            const rate = `Rs.${item.product.price.toFixed(2)}`;
            const amount = `Rs.${(item.quantity * item.product.price).toFixed(2)}`;

            receipt += `${LEFT}${padRight(name, colWidths.name)} ${padLeft(
                qty,
                colWidths.qty
            )} ${padLeft(rate, colWidths.rate)} ${padLeft(
                amount,
                colWidths.amt
            )}\n`;
        });

        receipt += `${CENTER}${line}`;

        /* ---------- TOTALS ---------- */
        receipt += `${LEFT}${row('Subtotal', `Rs.${bill.subtotal.toFixed(2)}`)}\n`;
        receipt += `${LEFT}${row('GST', `Rs.${bill.gstAmount.toFixed(2)}`)}\n`;
        receipt += `${LEFT}${BOLD_ON}${row(
            'TOTAL',
            `Rs.${bill.total.toFixed(2)}`
        )}${BOLD_OFF}\n`;

        receipt += `${CENTER}${line}`;

        /* ---------- GST BREAKDOWN ---------- */
        const halfGST = bill.gstAmount / 2;
        receipt += `${LEFT}GST Breakdown\n`;
        receipt += `${LEFT}${row('CGST (2.5%)', `Rs.${halfGST.toFixed(2)}`)}\n`;
        receipt += `${LEFT}${row('SGST (2.5%)', `Rs.${halfGST.toFixed(2)}`)}\n`;

        receipt += `${CENTER}${line}`;

        /* ---------- FOOTER ---------- */
        receipt += `${CENTER}${BOLD_ON}Thank You!${BOLD_OFF}\n`;
        receipt += `${CENTER}Please visit again\n\n\n`;

        await this.printText(receipt);
    }

}
export default new PrinterService();
