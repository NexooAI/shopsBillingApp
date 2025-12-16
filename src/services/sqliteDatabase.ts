import * as SQLite from 'expo-sqlite';
import { User, Category, Product, Bill, CartItem, UserRole, ShopSettings } from '../types';

let db: SQLite.SQLiteDatabase | null = null;

// Get or create database instance
export const getDatabase = async (): Promise<SQLite.SQLiteDatabase> => {
    if (!db) {
        db = await SQLite.openDatabaseAsync('shopbilling.db');
    }
    return db;
};

// Initialize database with tables and indexes
export const initDatabase = async (): Promise<void> => {
    const database = await getDatabase();

    // Enable foreign keys and WAL mode for better performance
    await database.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
    `);

    // Create Users table
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            phone TEXT,
            role TEXT NOT NULL DEFAULT 'user',
            pin TEXT,
            createdAt TEXT NOT NULL,
            createdBy TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
        CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    // Create Categories table
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS categories (
            id TEXT PRIMARY KEY,
            nameEn TEXT NOT NULL,
            nameTa TEXT NOT NULL,
            icon TEXT NOT NULL,
            color TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_categories_nameEn ON categories(nameEn);
        CREATE INDEX IF NOT EXISTS idx_categories_nameTa ON categories(nameTa);
    `);

    // Create Products table with indexes for fast search
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS products (
            id TEXT PRIMARY KEY,
            productCode TEXT,
            nameEn TEXT NOT NULL,
            nameTa TEXT NOT NULL,
            categoryId TEXT NOT NULL,
            price REAL NOT NULL,
            gstPercentage REAL NOT NULL DEFAULT 0,
            isGstInclusive INTEGER NOT NULL DEFAULT 0,
            unit TEXT NOT NULL,
            stock INTEGER,
            barcode TEXT,
            imageUri TEXT,
            createdAt TEXT NOT NULL,
            FOREIGN KEY (categoryId) REFERENCES categories(id)
        );
        CREATE INDEX IF NOT EXISTS idx_products_productCode ON products(productCode);
        CREATE INDEX IF NOT EXISTS idx_products_nameEn ON products(nameEn);
        CREATE INDEX IF NOT EXISTS idx_products_nameTa ON products(nameTa);
        CREATE INDEX IF NOT EXISTS idx_products_categoryId ON products(categoryId);
        CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
        CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);
    `);

    // Create Bills table
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS bills (
            id TEXT PRIMARY KEY,
            items TEXT NOT NULL,
            subtotal REAL NOT NULL,
            gstAmount REAL NOT NULL,
            total REAL NOT NULL,
            customerId TEXT,
            createdAt TEXT NOT NULL,
            createdBy TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_bills_createdAt ON bills(createdAt);
        CREATE INDEX IF NOT EXISTS idx_bills_createdBy ON bills(createdBy);
    `);

    // Create Settings table (single row)
    await database.execAsync(`
        CREATE TABLE IF NOT EXISTS settings (
            id TEXT PRIMARY KEY,
            data TEXT NOT NULL,
            createdAt TEXT NOT NULL
        );
    `);

    // Insert demo data if empty
    const userCount = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users');
    if (userCount?.count === 0) {
        await insertDemoData(database);
    }

    console.log('SQLite database initialized successfully');
};

// Insert demo data
const insertDemoData = async (database: SQLite.SQLiteDatabase): Promise<void> => {
    const now = new Date().toISOString();

    // Insert demo users
    await database.runAsync(
        `INSERT INTO users (id, username, phone, role, pin, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        ['superadmin', 'superadmin', '9999999999', 'super_admin', '0000', now]
    );
    await database.runAsync(
        `INSERT INTO users (id, username, phone, role, pin, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['master', 'admin', '8888888888', 'admin', '1234', now, 'superadmin']
    );
    await database.runAsync(
        `INSERT INTO users (id, username, phone, role, pin, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['staff1', 'user', '7777777777', 'user', '4321', now, 'master']
    );

    // Insert demo categories
    const categories = [
        { id: '1', nameEn: 'Grocery', nameTa: 'மளிகை', icon: 'basket', color: '#e74c3c' },
        { id: '2', nameEn: 'Vegetables', nameTa: 'காய்கறிகள்', icon: 'leaf', color: '#27ae60' },
        { id: '3', nameEn: 'Fruits', nameTa: 'பழங்கள்', icon: 'nutrition', color: '#f39c12' },
        { id: '4', nameEn: 'Dairy', nameTa: 'பால் பொருட்கள்', icon: 'water', color: '#3498db' },
        { id: '5', nameEn: 'Beverages', nameTa: 'பானங்கள்', icon: 'cafe', color: '#9b59b6' },
        { id: '6', nameEn: 'Snacks', nameTa: 'தின்பண்டங்கள்', icon: 'fast-food', color: '#e67e22' },
    ];

    for (const cat of categories) {
        await database.runAsync(
            `INSERT INTO categories (id, nameEn, nameTa, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [cat.id, cat.nameEn, cat.nameTa, cat.icon, cat.color, now]
        );
    }

    // Insert demo products
    const products = [
        { id: '1', productCode: '1', nameEn: 'Rice', nameTa: 'அரிசி', categoryId: '1', price: 60, gstPercentage: 5, isGstInclusive: 0, unit: 'kg', stock: 100 },
        { id: '2', productCode: '2', nameEn: 'Wheat', nameTa: 'கோதுமை', categoryId: '1', price: 45, gstPercentage: 5, isGstInclusive: 0, unit: 'kg', stock: 80 },
        { id: '3', productCode: '3', nameEn: 'Sugar', nameTa: 'சர்க்கரை', categoryId: '1', price: 42, gstPercentage: 5, isGstInclusive: 0, unit: 'kg', stock: 50 },
        { id: '4', productCode: '4', nameEn: 'Tomato', nameTa: 'தக்காளி', categoryId: '2', price: 30, gstPercentage: 0, isGstInclusive: 0, unit: 'kg', stock: 40 },
        { id: '5', productCode: '5', nameEn: 'Onion', nameTa: 'வெங்காயம்', categoryId: '2', price: 35, gstPercentage: 0, isGstInclusive: 0, unit: 'kg', stock: 60 },
        { id: '6', productCode: '6', nameEn: 'Potato', nameTa: 'உருளைக்கிழங்கு', categoryId: '2', price: 25, gstPercentage: 0, isGstInclusive: 0, unit: 'kg', stock: 70 },
        { id: '7', productCode: '7', nameEn: 'Apple', nameTa: 'ஆப்பிள்', categoryId: '3', price: 180, gstPercentage: 0, isGstInclusive: 0, unit: 'kg', stock: 30 },
        { id: '8', productCode: '8', nameEn: 'Banana', nameTa: 'வாழைப்பழம்', categoryId: '3', price: 50, gstPercentage: 0, isGstInclusive: 0, unit: 'dozen', stock: 50 },
        { id: '9', productCode: '9', nameEn: 'Milk', nameTa: 'பால்', categoryId: '4', price: 54, gstPercentage: 5, isGstInclusive: 1, unit: 'liter', stock: 100 },
        { id: '10', productCode: '10', nameEn: 'Curd', nameTa: 'தயிர்', categoryId: '4', price: 45, gstPercentage: 5, isGstInclusive: 1, unit: 'liter', stock: 40 },
    ];

    for (const prod of products) {
        await database.runAsync(
            `INSERT INTO products (id, productCode, nameEn, nameTa, categoryId, price, gstPercentage, isGstInclusive, unit, stock, createdAt) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [prod.id, prod.productCode, prod.nameEn, prod.nameTa, prod.categoryId, prod.price, prod.gstPercentage, prod.isGstInclusive, prod.unit, prod.stock, now]
        );
    }

    console.log('Demo data inserted successfully');
};

// ============ SETTINGS ============

export const getSettings = async (): Promise<ShopSettings | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<any>('SELECT * FROM settings WHERE id = ?', ['default']);
    if (!row) return null;
    const data = JSON.parse(row.data) as Omit<ShopSettings, 'createdAt'>;
    return {
        ...data,
        createdAt: new Date(row.createdAt),
    };
};

export const upsertSettings = async (settings: ShopSettings): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO settings (id, data, createdAt)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET data = excluded.data, createdAt = excluded.createdAt`,
        [
            'default',
            JSON.stringify({ ...settings, createdAt: undefined }),
            settings.createdAt.toISOString(),
        ]
    );
};

// ============ USERS ============

export const getAllUsers = async (): Promise<User[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>('SELECT * FROM users ORDER BY createdAt DESC');
    return rows.map(row => ({
        ...row,
        role: row.role as UserRole,
        createdAt: new Date(row.createdAt),
    }));
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<any>('SELECT * FROM users WHERE username = ?', [username]);
    if (!row) return null;
    return {
        ...row,
        role: row.role as UserRole,
        createdAt: new Date(row.createdAt),
    };
};

export const insertUser = async (user: User): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO users (id, username, phone, role, pin, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.username, user.phone || null, user.role, user.pin || null, user.createdAt.toISOString(), user.createdBy || null]
    );
};

export const updateUser = async (user: User): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE users SET username = ?, phone = ?, role = ?, pin = ? WHERE id = ?`,
        [user.username, user.phone || null, user.role, user.pin || null, user.id]
    );
};

export const deleteUser = async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM users WHERE id = ?', [id]);
};

export const getUserByPhoneAndPin = async (phone: string, pin: string): Promise<User | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<any>(
        'SELECT * FROM users WHERE phone = ? AND pin = ?',
        [phone, pin]
    );
    if (!row) return null;
    return {
        ...row,
        role: row.role as UserRole,
        createdAt: new Date(row.createdAt),
    };
};

// ============ CATEGORIES ============

export const getAllCategories = async (): Promise<Category[]> => {
    const database = await getDatabase();
    const rows = await database.getAllAsync<any>('SELECT * FROM categories ORDER BY nameEn ASC');
    return rows.map(row => ({
        ...row,
        createdAt: new Date(row.createdAt),
    }));
};

export const insertCategory = async (category: Category): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO categories (id, nameEn, nameTa, icon, color, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
        [category.id, category.nameEn, category.nameTa, category.icon, category.color, category.createdAt.toISOString()]
    );
};

export const updateCategory = async (category: Category): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE categories SET nameEn = ?, nameTa = ?, icon = ?, color = ? WHERE id = ?`,
        [category.nameEn, category.nameTa, category.icon, category.color, category.id]
    );
};

export const deleteCategory = async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM categories WHERE id = ?', [id]);
};

// ============ PRODUCTS ============

// Get all products (with optional pagination)
export const getAllProducts = async (limit?: number, offset?: number): Promise<Product[]> => {
    const database = await getDatabase();
    let query = 'SELECT * FROM products ORDER BY nameEn ASC';
    const params: any[] = [];

    if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset !== undefined) {
            query += ' OFFSET ?';
            params.push(offset);
        }
    }

    const rows = await database.getAllAsync<any>(query, params);
    return rows.map(row => ({
        ...row,
        isGstInclusive: Boolean(row.isGstInclusive),
        createdAt: new Date(row.createdAt),
    }));
};

// Get products count
export const getProductsCount = async (): Promise<number> => {
    const database = await getDatabase();
    const result = await database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products');
    return result?.count || 0;
};

// Get products by category (with pagination)
export const getProductsByCategory = async (categoryId: string, limit?: number, offset?: number): Promise<Product[]> => {
    const database = await getDatabase();
    let query = 'SELECT * FROM products WHERE categoryId = ? ORDER BY nameEn ASC';
    const params: any[] = [categoryId];

    if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset !== undefined) {
            query += ' OFFSET ?';
            params.push(offset);
        }
    }

    const rows = await database.getAllAsync<any>(query, params);
    return rows.map(row => ({
        ...row,
        isGstInclusive: Boolean(row.isGstInclusive),
        createdAt: new Date(row.createdAt),
    }));
};

// Search products by name, code, or barcode (FAST with indexes!)
export const searchProducts = async (query: string, limit: number = 50): Promise<Product[]> => {
    const database = await getDatabase();
    const searchTerm = `%${query}%`;

    const rows = await database.getAllAsync<any>(
        `SELECT * FROM products 
         WHERE nameEn LIKE ? OR nameTa LIKE ? OR productCode LIKE ? OR barcode LIKE ?
         ORDER BY 
            CASE 
                WHEN productCode = ? THEN 1
                WHEN barcode = ? THEN 2
                WHEN nameEn LIKE ? THEN 3
                ELSE 4
            END,
            nameEn ASC
         LIMIT ?`,
        [searchTerm, searchTerm, searchTerm, searchTerm, query, query, query + '%', limit]
    );

    return rows.map(row => ({
        ...row,
        isGstInclusive: Boolean(row.isGstInclusive),
        createdAt: new Date(row.createdAt),
    }));
};

// Get product by barcode (instant lookup)
export const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<any>(
        'SELECT * FROM products WHERE barcode = ?',
        [barcode]
    );
    if (!row) return null;
    return {
        ...row,
        isGstInclusive: Boolean(row.isGstInclusive),
        createdAt: new Date(row.createdAt),
    };
};

// Get product by product code (instant lookup)
export const getProductByCode = async (productCode: string): Promise<Product | null> => {
    const database = await getDatabase();
    const row = await database.getFirstAsync<any>(
        'SELECT * FROM products WHERE productCode = ?',
        [productCode]
    );
    if (!row) return null;
    return {
        ...row,
        isGstInclusive: Boolean(row.isGstInclusive),
        createdAt: new Date(row.createdAt),
    };
};

export const insertProduct = async (product: Product): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO products (id, productCode, nameEn, nameTa, categoryId, price, gstPercentage, isGstInclusive, unit, stock, barcode, imageUri, createdAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            product.id, product.productCode || null, product.nameEn, product.nameTa, product.categoryId,
            product.price, product.gstPercentage, product.isGstInclusive ? 1 : 0, product.unit,
            product.stock || null, product.barcode || null, product.imageUri || null, product.createdAt.toISOString()
        ]
    );
};

export const updateProduct = async (product: Product): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `UPDATE products SET productCode = ?, nameEn = ?, nameTa = ?, categoryId = ?, price = ?, 
         gstPercentage = ?, isGstInclusive = ?, unit = ?, stock = ?, barcode = ?, imageUri = ? WHERE id = ?`,
        [
            product.productCode || null, product.nameEn, product.nameTa, product.categoryId,
            product.price, product.gstPercentage, product.isGstInclusive ? 1 : 0, product.unit,
            product.stock || null, product.barcode || null, product.imageUri || null, product.id
        ]
    );
};

export const deleteProduct = async (id: string): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

// Bulk insert products (for Excel import - MUCH faster!)
export const insertProductsBulk = async (products: Product[]): Promise<void> => {
    const database = await getDatabase();

    // Use transaction for bulk insert (much faster!)
    await database.withTransactionAsync(async () => {
        for (const product of products) {
            await database.runAsync(
                `INSERT INTO products (id, productCode, nameEn, nameTa, categoryId, price, gstPercentage, isGstInclusive, unit, stock, barcode, imageUri, createdAt) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    product.id, product.productCode || null, product.nameEn, product.nameTa, product.categoryId,
                    product.price, product.gstPercentage, product.isGstInclusive ? 1 : 0, product.unit,
                    product.stock || null, product.barcode || null, product.imageUri || null, product.createdAt.toISOString()
                ]
            );
        }
    });
};

// ============ BILLS ============

export const getAllBills = async (limit?: number, offset?: number): Promise<Bill[]> => {
    const database = await getDatabase();
    let query = 'SELECT * FROM bills ORDER BY createdAt DESC';
    const params: any[] = [];

    if (limit !== undefined) {
        query += ' LIMIT ?';
        params.push(limit);
        if (offset !== undefined) {
            query += ' OFFSET ?';
            params.push(offset);
        }
    }

    const rows = await database.getAllAsync<any>(query, params);
    return rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        createdAt: new Date(row.createdAt),
    }));
};

export const insertBill = async (bill: Bill): Promise<void> => {
    const database = await getDatabase();
    await database.runAsync(
        `INSERT INTO bills (id, items, subtotal, gstAmount, total, customerId, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [bill.id, JSON.stringify(bill.items), bill.subtotal, bill.gstAmount, bill.total, bill.customerId || null, bill.createdAt.toISOString(), bill.createdBy]
    );
};

export const getBillsByDate = async (date: Date): Promise<Bill[]> => {
    const database = await getDatabase();
    const dateStr = date.toISOString().split('T')[0];

    const rows = await database.getAllAsync<any>(
        `SELECT * FROM bills WHERE date(createdAt) = ? ORDER BY createdAt DESC`,
        [dateStr]
    );

    return rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        createdAt: new Date(row.createdAt),
    }));
};

export const getBillsByDateRange = async (startDate: Date, endDate: Date): Promise<Bill[]> => {
    const database = await getDatabase();

    const rows = await database.getAllAsync<any>(
        `SELECT * FROM bills WHERE createdAt >= ? AND createdAt <= ? ORDER BY createdAt DESC`,
        [startDate.toISOString(), endDate.toISOString()]
    );

    return rows.map(row => ({
        ...row,
        items: JSON.parse(row.items),
        createdAt: new Date(row.createdAt),
    }));
};

// ============ UTILITY FUNCTIONS ============

export const clearAllData = async (): Promise<void> => {
    const database = await getDatabase();
    await database.execAsync(`
        DELETE FROM bills;
        DELETE FROM products;
        DELETE FROM categories;
        DELETE FROM users;
        DELETE FROM settings;
    `);
};

export const closeDatabase = async (): Promise<void> => {
    if (db) {
        await db.closeAsync();
        db = null;
    }
};

// Reset everything but recreate the permanent super admin user
export const resetAppData = async (): Promise<void> => {
    const database = await getDatabase();
    const now = new Date().toISOString();

    await database.withTransactionAsync(async () => {
        await database.execAsync(`
            DELETE FROM bills;
            DELETE FROM products;
            DELETE FROM categories;
            DELETE FROM users;
            DELETE FROM settings;
        `);

        await database.runAsync(
            `INSERT INTO users (id, username, phone, role, pin, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            ['superadmin', 'superadmin', '9999999999', 'super_admin', '0000', now]
        );
    });
};

// Get database statistics
export const getDatabaseStats = async (): Promise<{
    users: number;
    categories: number;
    products: number;
    bills: number;
}> => {
    const database = await getDatabase();
    const [users, categories, products, bills] = await Promise.all([
        database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM users'),
        database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM categories'),
        database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM products'),
        database.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM bills'),
    ]);

    return {
        users: users?.count || 0,
        categories: categories?.count || 0,
        products: products?.count || 0,
        bills: bills?.count || 0,
    };
};

