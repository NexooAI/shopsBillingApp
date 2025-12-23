export type UserRole = 'super_admin' | 'admin' | 'user';

export interface User {
  id: string;
  username: string;
  phone?: string;
  role: UserRole;
  pin?: string;
  createdAt: Date;
  createdBy?: string;
}

export interface Category {
  id: string;
  nameEn: string;
  nameTa: string;
  icon: string;
  color: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  productCode?: string;  // Unique product number (e.g., "12" for Rice)
  nameEn: string;
  nameTa: string;
  categoryId: string;
  price: number;
  gstPercentage: number;
  isGstInclusive: boolean;
  unit: string;
  stock?: number;
  barcode?: string;      // Barcode for scanner
  imageUri?: string;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}


export interface Customer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: Date;
}

export type PrintStatus = 'not_printed' | 'printed' | 'reprinted';

export interface Bill {
  id: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  // New fields
  customerId?: string;
  customer?: Customer; // For easier checking
  roundOff: number;
  grandTotal: number;
  printStatus: PrintStatus;

  createdAt: Date;
  createdBy: string;
}

export interface DailySales {
  date: string;
  totalRevenue: number;
  totalProducts: number;
  totalCustomers: number;
  bills: Bill[];
}

export interface ShopSettings {
  id: string;
  shopName: string;
  address: string;
  phone: string;
  logoUri?: string;
  gstin?: string; // New field for branding/billing
  adminUsername: string;
  adminPassword: string;
  setupComplete: boolean;
  printerWidth?: 58 | 80; // Default 58
  createdAt: Date;
}

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  bills: Bill[];
  users: User[];
  customers: Customer[]; // Add customers to state
  settings: ShopSettings | null;
  isSetupComplete: boolean;
}

export type LoginMethod = 'phone' | 'username';

export interface ProductSalesStat {
  productId: string;
  productName: string;
  quantitySold: number;
  totalRevenue: number;
}


