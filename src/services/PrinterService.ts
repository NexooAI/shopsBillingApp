import {
    BLEPrinter,
} from 'react-native-thermal-receipt-printer';
import { Platform } from 'react-native';
import { Bill } from '../types';

export interface PrinterDevice {
    inner_mac_address: string;
    device_name: string;
    device_type?: 'bluetooth' | 'usb' | 'net';
}

class PrinterService {
    private isInitialized = false;

    async init() {
        if (this.isInitialized) return;

        try {
            if (Platform.OS === 'android') {
                await BLEPrinter.init();
                this.isInitialized = true;
            }
        } catch (err) {
            console.warn('PrinterService Init Error:', err);
        }
    }

    async scan(): Promise<PrinterDevice[]> {
        await this.init();
        try {
            // getDeviceList returns an array of devices
            // The type might differ based on library version, casting mostly
            const results = await BLEPrinter.getDeviceList();
            return results.map((d: any) => ({
                inner_mac_address: d.inner_mac_address,
                device_name: d.device_name || 'Unknown Device',
                device_type: 'bluetooth',
            }));
        } catch (error) {
            console.error('Scan Error:', error);
            return [];
        }
    }

    async connect(pc: PrinterDevice): Promise<void> {
        await this.init();
        try {
            await BLEPrinter.connectPrinter(pc.inner_mac_address);
        } catch (error) {
            console.error('Connect Error:', error);
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        try {
            await BLEPrinter.closeConn();
        } catch (e) {
            console.warn('Disconnect Warning:', e);
        }
    }

    async printText(text: string): Promise<void> {
        try {
            // Default basic printing
            // <C> for Center, <B> for Bold, etc. are supported by the library's markup
            // For now, we assume pure ESC/POS or simple text
            await BLEPrinter.printBill(text);
        } catch (error) {
            console.error('Print Error:', error);
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

        let receipt = '';
        receipt += `${CENTER}${BOLD_ON}TEST PRINT${BOLD_OFF}\n`;
        receipt += `${CENTER}Shops Billing App\n`;
        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${LEFT}Date: ${new Date().toLocaleString()}\n`;
        receipt += `${LEFT}Printer: Connected\n`;
        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${CENTER}Thank you for your business!\n\n\n`; // Feed paper

        await this.printText(receipt);
    }

    async printBillObject(bill: Bill): Promise<void> {
        const BOLD_ON = '<B>';
        const BOLD_OFF = '</B>';
        const CENTER = '<C>';
        const LEFT = '<L>';
        const RIGHT = '<R>';

        let receipt = '';

        // Header
        receipt += `${CENTER}${BOLD_ON}ShopBill Pro${BOLD_OFF}\n`;
        receipt += `${CENTER}Thank you for your business\n`;
        receipt += `${CENTER}--------------------------------\n`;

        // Bill Info
        receipt += `${LEFT}Date: ${new Date(bill.createdAt).toLocaleDateString()}\n`;
        receipt += `${LEFT}Bill No: #${bill.id.slice(-6)}\n`;
        receipt += `${CENTER}--------------------------------\n`;

        // Items Header
        receipt += `${LEFT}${BOLD_ON}Item           Qty   Price   Amt${BOLD_OFF}\n`;

        // Items
        bill.items.forEach(item => {
            const total = (item.quantity * item.product.price).toFixed(2);
            const price = item.product.price.toString();
            const qty = item.quantity.toString();
            let name = item.product.nameEn;

            // Simple truncation
            if (name.length > 14) name = name.substring(0, 13) + '.';

            // Padding helpers
            const pad = (str: string, len: number) => {
                if (str.length >= len) return str.substring(0, len);
                return str + ' '.repeat(len - str.length);
            };
            const padStart = (str: string, len: number) => {
                if (str.length >= len) return str.substring(0, len);
                return ' '.repeat(len - str.length) + str;
            };

            receipt += `${pad(name, 14)} ${padStart(qty, 3)} ${padStart(price, 7)} ${padStart(total, 7)}\n`;
        });

        receipt += `${CENTER}--------------------------------\n`;

        // Totals
        const padLabel = (label: string, value: string) => {
            const space = 32 - label.length - value.length;
            return label + ' '.repeat(Math.max(0, space)) + value;
        };

        receipt += `${RIGHT}Subtotal: ${bill.subtotal.toFixed(2)}\n`;
        receipt += `${RIGHT}GST: ${bill.gstAmount.toFixed(2)}\n`;

        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${CENTER}${BOLD_ON}TOTAL: ${bill.total.toFixed(2)}${BOLD_OFF}\n`;
        receipt += `${CENTER}--------------------------------\n`;
        receipt += `${CENTER}Powered by ShopsBillingApp\n\n\n`;

        await this.printText(receipt);
    }
}

export default new PrinterService();
