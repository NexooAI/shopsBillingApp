import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { User, Category, Product, CartItem, Bill, AppState, UserRole, ShopSettings } from '../types';
import * as Database from '../services/sqliteDatabase';

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  categories: [],
  products: [],
  cart: [],
  bills: [],
  users: [],
  settings: null,
  isSetupComplete: false,
};

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
  | { type: 'SET_SETTINGS'; payload: ShopSettings }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'UPDATE_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'ADD_PRODUCTS_BULK'; payload: Product[] }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'ADD_TO_CART'; payload: { product: Product; quantity: number } }
  | { type: 'UPDATE_CART_ITEM'; payload: { productId: string; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'CLEAR_CART' }
  | { type: 'ADD_BILL'; payload: Bill }
  | { type: 'ADD_USER'; payload: User }
  | { type: 'UPDATE_USER'; payload: User }
  | { type: 'DELETE_USER'; payload: string }
  | { type: 'LOAD_STATE'; payload: Partial<AppState> };

function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'LOGIN':
      return { ...state, user: action.payload, isAuthenticated: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, cart: [] };
    case 'SET_SETTINGS':
      return { ...state, settings: action.payload, isSetupComplete: action.payload.setupComplete };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'UPDATE_CATEGORY':
      return {
        ...state,
        categories: state.categories.map((c) =>
          c.id === action.payload.id ? action.payload : c
        ),
      };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'ADD_PRODUCTS_BULK':
      return { ...state, products: [...state.products, ...action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map((p) =>
          p.id === action.payload.id ? action.payload : p
        ),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter((p) => p.id !== action.payload),
      };
    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(
        (item) => item.product.id === action.payload.product.id
      );
      if (existingItem) {
        return {
          ...state,
          cart: state.cart.map((item) =>
            item.product.id === action.payload.product.id
              ? { ...item, quantity: item.quantity + action.payload.quantity }
              : item
          ),
        };
      }
      return {
        ...state,
        cart: [...state.cart, { product: action.payload.product, quantity: action.payload.quantity }],
      };
    }
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map((item) =>
          item.product.id === action.payload.productId
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((item) => item.product.id !== action.payload),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [] };
    case 'ADD_BILL':
      return { ...state, bills: [...state.bills, action.payload] };
    case 'ADD_USER':
      return { ...state, users: [...state.users, action.payload] };
    case 'UPDATE_USER':
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.id ? action.payload : u
        ),
      };
    case 'DELETE_USER':
      return {
        ...state,
        users: state.users.filter((u) => u.id !== action.payload),
      };
    case 'LOAD_STATE':
      return { ...state, ...action.payload };
    default:
      return state;
  }
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  login: (username: string, password: string) => boolean;
  loginWithPhone: (phone: string, pin: string) => Promise<boolean>;
  configureShop: (settings: Omit<ShopSettings, 'id' | 'createdAt' | 'setupComplete'>) => Promise<void>;
  resetAppData: () => Promise<void>;
  logout: () => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => Promise<void>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addProductsBulk: (products: Omit<Product, 'id' | 'createdAt'>[]) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createBill: () => Promise<Bill | null>;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  getProductsByCategory: (categoryId: string) => Product[];
  getDailySales: (date?: Date) => { totalRevenue: number; totalProducts: number; totalCustomers: number; bills: Bill[] };
  isLoading: boolean;
  refreshData: () => Promise<void>;
  // New SQLite-powered search functions
  searchProducts: (query: string) => Promise<Product[]>;
  getProductByBarcode: (barcode: string) => Promise<Product | null>;
  getProductByCode: (code: string) => Promise<Product | null>;
  settings: ShopSettings | null;
  isSetupComplete: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize SQLite database and load data
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsLoading(true);
        await Database.initDatabase();
        await loadDataFromDatabase();
      } catch (error) {
        console.error('Error initializing app:', error);
      } finally {
        setIsLoading(false);
      }
    };
    initApp();
  }, []);

  // Load all data from SQLite database (optimized for large datasets)
  const loadDataFromDatabase = async () => {
    try {
      const [categories, products, bills, users, settings] = await Promise.all([
        Database.getAllCategories(),
        Database.getAllProducts(500), // Load first 500 products for initial view
        Database.getAllBills(100),    // Load last 100 bills
        Database.getAllUsers(),
        Database.getSettings(),
      ]);

      dispatch({
        type: 'LOAD_STATE',
        payload: { categories, products, bills, users, settings: settings || null, isSetupComplete: Boolean(settings?.setupComplete) },
      });
      if (settings) {
        dispatch({ type: 'SET_SETTINGS', payload: { ...settings, setupComplete: settings.setupComplete } });
      }
    } catch (error) {
      console.error('Error loading data from database:', error);
    }
  };

  // Search products (uses SQLite indexes for fast search)
  const searchProducts = async (query: string): Promise<Product[]> => {
    try {
      return await Database.searchProducts(query);
    } catch (error) {
      console.error('Error searching products:', error);
      return [];
    }
  };

  // Get product by barcode (instant lookup)
  const getProductByBarcode = async (barcode: string): Promise<Product | null> => {
    try {
      return await Database.getProductByBarcode(barcode);
    } catch (error) {
      console.error('Error getting product by barcode:', error);
      return null;
    }
  };

  // Get product by code (instant lookup)
  const getProductByCode = async (code: string): Promise<Product | null> => {
    try {
      return await Database.getProductByCode(code);
    } catch (error) {
      console.error('Error getting product by code:', error);
      return null;
    }
  };

  // Complete initial setup: save shop settings and create admin user
  const configureShop = async (settingsInput: Omit<ShopSettings, 'id' | 'createdAt' | 'setupComplete'>) => {
    const createdAt = new Date();
    const settings: ShopSettings = {
      id: 'default',
      createdAt,
      setupComplete: true,
      ...settingsInput,
    };

    // Persist settings
    await Database.upsertSettings(settings);
    dispatch({ type: 'SET_SETTINGS', payload: settings });

    // Ensure admin user exists with provided credentials
    let adminUser = await Database.getUserByUsername(settings.adminUsername);
    if (!adminUser) {
      adminUser = {
        id: `admin-${Date.now()}`,
        username: settings.adminUsername,
        phone: settings.phone,
        role: 'admin',
        pin: '0000',
        createdAt,
        createdBy: 'superadmin',
      };
      await Database.insertUser(adminUser);
      dispatch({ type: 'ADD_USER', payload: adminUser });
    }
  };

  // Reset all data but keep super admin; mark setup incomplete
  const resetAppData = async () => {
    await Database.resetAppData();
    dispatch({
      type: 'LOAD_STATE',
      payload: {
        user: null,
        isAuthenticated: false,
        categories: [],
        products: [],
        bills: [],
        users: [],
        settings: null,
        isSetupComplete: false,
      },
    });
  };

  // Refresh data from database
  const refreshData = async () => {
    await loadDataFromDatabase();
  };

  const login = (username: string, password: string): boolean => {
    // Find user by username
    const user = state.users.find(u => u.username === username);

    // If settings-defined admin credentials exist, respect them
    if (state.settings && username === state.settings.adminUsername && password === state.settings.adminPassword && user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }

    // Legacy/demo logins remain for existing seeded users
    if (username === 'superadmin' && password === 'superadmin123' && user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    if (username === 'admin' && password === 'admin123' && user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    if (username === 'user' && password === 'user123' && user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    if (user && password === `${username}123`) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    return false;
  };

  const loginWithPhone = async (phone: string, pin: string): Promise<boolean> => {
    try {
      const user = await Database.getUserByPhoneAndPin(phone, pin);
      if (user) {
        dispatch({ type: 'LOGIN', payload: user });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error logging in with phone:', error);
      return false;
    }
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const addCategory = async (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    try {
      await Database.insertCategory(newCategory);
      dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
    } catch (error) {
      console.error('Error adding category:', error);
      throw error;
    }
  };

  const updateCategory = async (category: Category) => {
    try {
      await Database.updateCategory(category);
      dispatch({ type: 'UPDATE_CATEGORY', payload: category });
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await Database.deleteCategory(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  };

  const addProduct = async (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
    };

    try {
      await Database.insertProduct(newProduct);
      dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
    } catch (error) {
      console.error('Error adding product:', error);
      throw error;
    }
  };

  const updateProduct = async (product: Product) => {
    try {
      await Database.updateProduct(product);
      dispatch({ type: 'UPDATE_PRODUCT', payload: product });
    } catch (error) {
      console.error('Error updating product:', error);
      throw error;
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await Database.deleteProduct(id);
      dispatch({ type: 'DELETE_PRODUCT', payload: id });
    } catch (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  };

  const addProductsBulk = async (products: Omit<Product, 'id' | 'createdAt'>[]) => {
    const newProducts: Product[] = products.map((p, index) => ({
      ...p,
      id: `${Date.now()}-${index}`,
      createdAt: new Date(),
    }));

    try {
      await Database.insertProductsBulk(newProducts);
      dispatch({ type: 'ADD_PRODUCTS_BULK', payload: newProducts });
    } catch (error) {
      console.error('Error adding products in bulk:', error);
      throw error;
    }
  };

  const addToCart = (product: Product, quantity: number = 1) => {
    dispatch({ type: 'ADD_TO_CART', payload: { product, quantity } });
  };

  const updateCartItem = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
    } else {
      dispatch({ type: 'UPDATE_CART_ITEM', payload: { productId, quantity } });
    }
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: productId });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const createBill = async (): Promise<Bill | null> => {
    if (state.cart.length === 0 || !state.user) return null;

    let subtotal = 0;
    let gstAmount = 0;

    state.cart.forEach((item) => {
      const itemTotal = item.product.price * item.quantity;
      if (item.product.isGstInclusive) {
        const basePrice = itemTotal / (1 + item.product.gstPercentage / 100);
        subtotal += basePrice;
        gstAmount += itemTotal - basePrice;
      } else {
        subtotal += itemTotal;
        gstAmount += (itemTotal * item.product.gstPercentage) / 100;
      }
    });

    const bill: Bill = {
      id: Date.now().toString(),
      items: [...state.cart],
      subtotal: Math.round(subtotal * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round((subtotal + gstAmount) * 100) / 100,
      createdAt: new Date(),
      createdBy: state.user.id,
    };

    try {
      await Database.insertBill(bill);
      dispatch({ type: 'ADD_BILL', payload: bill });
      dispatch({ type: 'CLEAR_CART' });
      return bill;
    } catch (error) {
      console.error('Error creating bill:', error);
      throw error;
    }
  };

  const addUser = async (user: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      createdBy: state.user?.id,
    };

    try {
      await Database.insertUser(newUser);
      dispatch({ type: 'ADD_USER', payload: newUser });
    } catch (error) {
      console.error('Error adding user:', error);
      throw error;
    }
  };

  const updateUser = async (user: User) => {
    try {
      await Database.updateUser(user);
      dispatch({ type: 'UPDATE_USER', payload: user });
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await Database.deleteUser(id);
      dispatch({ type: 'DELETE_USER', payload: id });
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const getProductsByCategory = (categoryId: string): Product[] => {
    return state.products.filter((p) => p.categoryId === categoryId);
  };

  const getDailySales = (date: Date = new Date()) => {
    const dateStr = date.toDateString();
    const todaysBills = state.bills.filter(
      (bill) => new Date(bill.createdAt).toDateString() === dateStr
    );

    return {
      totalRevenue: todaysBills.reduce((sum, bill) => sum + bill.total, 0),
      totalProducts: todaysBills.reduce(
        (sum, bill) => sum + bill.items.reduce((s, item) => s + item.quantity, 0),
        0
      ),
      totalCustomers: todaysBills.length,
      bills: todaysBills,
    };
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        login,
        loginWithPhone,
        logout,
        addCategory,
        updateCategory,
        deleteCategory,
        addProduct,
        updateProduct,
        deleteProduct,
        addProductsBulk,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createBill,
        addUser,
        updateUser,
        deleteUser,
        getProductsByCategory,
        getDailySales,
        configureShop,
        resetAppData,
        isLoading,
        refreshData,
        searchProducts,
        getProductByBarcode,
        getProductByCode,
        settings: state.settings,
        isSetupComplete: state.isSetupComplete,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
