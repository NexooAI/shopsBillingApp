import * as FileSystem from 'expo-file-system/legacy';
import { Category, Product, Bill, User } from '../types';

// Server configuration - Update this with your actual server URL
const API_CONFIG = {
    baseUrl: '', // Set your server URL here, e.g., 'https://your-api.com/api'
    timeout: 30000,
};

export interface SyncResult {
    success: boolean;
    message: string;
    syncedCount?: number;
    errors?: string[];
}

export interface ServerConfig {
    baseUrl: string;
}

// Get server config from AsyncStorage
export const getServerConfig = async (): Promise<ServerConfig | null> => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        const config = await AsyncStorage.getItem('serverConfig');
        return config ? JSON.parse(config) : null;
    } catch (error) {
        console.error('Error getting server config:', error);
        return null;
    }
};

// Save server config to AsyncStorage
export const saveServerConfig = async (config: ServerConfig): Promise<void> => {
    try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('serverConfig', JSON.stringify(config));
    } catch (error) {
        console.error('Error saving server config:', error);
        throw error;
    }
};

// Convert image to base64 for upload
const imageToBase64 = async (uri: string): Promise<string | null> => {
    try {
        if (!uri) return null;
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) return null;
        const base64 = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
        });
        return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
        console.error('Error converting image to base64:', error);
        return null;
    }
};

// Generic API request function
const apiRequest = async (
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    data?: any
): Promise<any> => {
    const config = await getServerConfig();
    if (!config?.baseUrl) {
        throw new Error('Server URL not configured');
    }

    const url = `${config.baseUrl}${endpoint}`;

    const options: RequestInit = {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
    };

    if (data) {
        options.body = JSON.stringify(data);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    options.signal = controller.signal;

    try {
        const response = await fetch(url, options);
        clearTimeout(timeoutId);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error: any) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
            throw new Error('Request timeout');
        }
        throw error;
    }
};

// Sync categories to server
export const syncCategories = async (categories: Category[]): Promise<SyncResult> => {
    try {
        const result = await apiRequest('/categories/sync', 'POST', { categories });
        return {
            success: true,
            message: `${categories.length} categories synced successfully`,
            syncedCount: categories.length,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to sync categories',
            errors: [error.message],
        };
    }
};

// Sync products to server (with images converted to base64)
export const syncProducts = async (products: Product[]): Promise<SyncResult> => {
    try {
        const errors: string[] = [];
        let syncedCount = 0;

        // Process products in batches to handle images
        const productsWithImages = await Promise.all(
            products.map(async (product) => {
                try {
                    let imageBase64 = null;
                    if (product.imageUri) {
                        imageBase64 = await imageToBase64(product.imageUri);
                    }
                    return {
                        ...product,
                        imageBase64,
                        imageUri: undefined, // Don't send local URI to server
                    };
                } catch (error) {
                    errors.push(`Failed to process image for ${product.nameEn}`);
                    return {
                        ...product,
                        imageBase64: null,
                        imageUri: undefined,
                    };
                }
            })
        );

        const result = await apiRequest('/products/sync', 'POST', { products: productsWithImages });
        syncedCount = products.length;

        return {
            success: true,
            message: `${syncedCount} products synced successfully`,
            syncedCount,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to sync products',
            errors: [error.message],
        };
    }
};

// Sync bills to server
export const syncBills = async (bills: Bill[]): Promise<SyncResult> => {
    try {
        const result = await apiRequest('/bills/sync', 'POST', { bills });
        return {
            success: true,
            message: `${bills.length} bills synced successfully`,
            syncedCount: bills.length,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to sync bills',
            errors: [error.message],
        };
    }
};

// Sync users to server
export const syncUsers = async (users: User[]): Promise<SyncResult> => {
    try {
        // Filter out sensitive data like pins before syncing
        const sanitizedUsers = users.map(({ pin, ...user }) => user);
        const result = await apiRequest('/users/sync', 'POST', { users: sanitizedUsers });
        return {
            success: true,
            message: `${users.length} users synced successfully`,
            syncedCount: users.length,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to sync users',
            errors: [error.message],
        };
    }
};

// Sync all data to server
export const syncAllData = async (
    categories: Category[],
    products: Product[],
    bills: Bill[],
    users: User[]
): Promise<{
    categories: SyncResult;
    products: SyncResult;
    bills: SyncResult;
    users: SyncResult;
    overallSuccess: boolean;
}> => {
    const [categoriesResult, productsResult, billsResult, usersResult] = await Promise.all([
        syncCategories(categories),
        syncProducts(products),
        syncBills(bills),
        syncUsers(users),
    ]);

    return {
        categories: categoriesResult,
        products: productsResult,
        bills: billsResult,
        users: usersResult,
        overallSuccess:
            categoriesResult.success &&
            productsResult.success &&
            billsResult.success &&
            usersResult.success,
    };
};

// Test server connection
export const testServerConnection = async (): Promise<{ success: boolean; message: string }> => {
    try {
        const config = await getServerConfig();
        if (!config?.baseUrl) {
            return { success: false, message: 'Server URL not configured' };
        }

        const response = await fetch(`${config.baseUrl}/health`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });

        if (response.ok) {
            return { success: true, message: 'Server connected successfully' };
        } else {
            return { success: false, message: `Server returned status ${response.status}` };
        }
    } catch (error: any) {
        return { success: false, message: error.message || 'Failed to connect to server' };
    }
};

// Download data from server
export const downloadFromServer = async (): Promise<{
    success: boolean;
    message: string;
    data?: {
        categories?: Category[];
        products?: Product[];
    };
}> => {
    try {
        const result = await apiRequest('/data/download', 'GET');
        return {
            success: true,
            message: 'Data downloaded successfully',
            data: result,
        };
    } catch (error: any) {
        return {
            success: false,
            message: error.message || 'Failed to download data from server',
        };
    }
};

