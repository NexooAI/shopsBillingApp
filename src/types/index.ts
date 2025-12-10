export type UserRole = 'admin' | 'user';

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
  nameEn: string;
  nameTa: string;
  categoryId: string;
  price: number;
  gstPercentage: number;
  isGstInclusive: boolean;
  unit: string;
  stock?: number;
  barcode?: string;
  imageUri?: string;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Bill {
  id: string;
  items: CartItem[];
  subtotal: number;
  gstAmount: number;
  total: number;
  customerId?: string;
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

export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  categories: Category[];
  products: Product[];
  cart: CartItem[];
  bills: Bill[];
  users: User[];
}

export type LoginMethod = 'phone' | 'username';

