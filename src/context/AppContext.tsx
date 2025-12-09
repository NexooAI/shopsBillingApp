import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Category, Product, CartItem, Bill, AppState, UserRole } from '../types';

// Initial demo data
const MASTER_USER: User = {
  id: 'master',
  username: 'admin',
  phone: '9999999999',
  role: 'admin',
  pin: '1234',
  createdAt: new Date(),
};

const DEMO_CATEGORIES: Category[] = [
  { id: '1', nameEn: 'Grocery', nameTa: 'மளிகை', icon: 'basket', color: '#e74c3c', createdAt: new Date() },
  { id: '2', nameEn: 'Vegetables', nameTa: 'காய்கறிகள்', icon: 'leaf', color: '#27ae60', createdAt: new Date() },
  { id: '3', nameEn: 'Fruits', nameTa: 'பழங்கள்', icon: 'nutrition', color: '#f39c12', createdAt: new Date() },
  { id: '4', nameEn: 'Dairy', nameTa: 'பால் பொருட்கள்', icon: 'water', color: '#3498db', createdAt: new Date() },
  { id: '5', nameEn: 'Beverages', nameTa: 'பானங்கள்', icon: 'cafe', color: '#9b59b6', createdAt: new Date() },
  { id: '6', nameEn: 'Snacks', nameTa: 'தின்பண்டங்கள்', icon: 'fast-food', color: '#e67e22', createdAt: new Date() },
];

const DEMO_PRODUCTS: Product[] = [
  { id: '1', nameEn: 'Rice', nameTa: 'அரிசி', categoryId: '1', price: 60, gstPercentage: 5, isGstInclusive: false, unit: 'kg', stock: 100, createdAt: new Date() },
  { id: '2', nameEn: 'Wheat', nameTa: 'கோதுமை', categoryId: '1', price: 45, gstPercentage: 5, isGstInclusive: false, unit: 'kg', stock: 80, createdAt: new Date() },
  { id: '3', nameEn: 'Sugar', nameTa: 'சர்க்கரை', categoryId: '1', price: 42, gstPercentage: 5, isGstInclusive: false, unit: 'kg', stock: 50, createdAt: new Date() },
  { id: '4', nameEn: 'Tomato', nameTa: 'தக்காளி', categoryId: '2', price: 30, gstPercentage: 0, isGstInclusive: false, unit: 'kg', stock: 40, createdAt: new Date() },
  { id: '5', nameEn: 'Onion', nameTa: 'வெங்காயம்', categoryId: '2', price: 35, gstPercentage: 0, isGstInclusive: false, unit: 'kg', stock: 60, createdAt: new Date() },
  { id: '6', nameEn: 'Potato', nameTa: 'உருளைக்கிழங்கு', categoryId: '2', price: 25, gstPercentage: 0, isGstInclusive: false, unit: 'kg', stock: 70, createdAt: new Date() },
  { id: '7', nameEn: 'Apple', nameTa: 'ஆப்பிள்', categoryId: '3', price: 180, gstPercentage: 0, isGstInclusive: false, unit: 'kg', stock: 30, createdAt: new Date() },
  { id: '8', nameEn: 'Banana', nameTa: 'வாழைப்பழம்', categoryId: '3', price: 50, gstPercentage: 0, isGstInclusive: false, unit: 'dozen', stock: 50, createdAt: new Date() },
  { id: '9', nameEn: 'Milk', nameTa: 'பால்', categoryId: '4', price: 54, gstPercentage: 5, isGstInclusive: true, unit: 'liter', stock: 100, createdAt: new Date() },
  { id: '10', nameEn: 'Curd', nameTa: 'தயிர்', categoryId: '4', price: 45, gstPercentage: 5, isGstInclusive: true, unit: 'liter', stock: 40, createdAt: new Date() },
];

const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  categories: DEMO_CATEGORIES,
  products: DEMO_PRODUCTS,
  cart: [],
  bills: [],
  users: [MASTER_USER],
};

type Action =
  | { type: 'LOGIN'; payload: User }
  | { type: 'LOGOUT' }
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
  loginWithPhone: (phone: string, pin: string) => boolean;
  logout: () => void;
  addCategory: (category: Omit<Category, 'id' | 'createdAt'>) => void;
  addProduct: (product: Omit<Product, 'id' | 'createdAt'>) => void;
  addProductsBulk: (products: Omit<Product, 'id' | 'createdAt'>[]) => void;
  addToCart: (product: Product, quantity?: number) => void;
  updateCartItem: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  createBill: () => Bill | null;
  addUser: (user: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => void;
  getProductsByCategory: (categoryId: string) => Product[];
  getDailySales: (date?: Date) => { totalRevenue: number; totalProducts: number; totalCustomers: number; bills: Bill[] };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Persist state to AsyncStorage
  useEffect(() => {
    const saveState = async () => {
      try {
        await AsyncStorage.setItem('appState', JSON.stringify({
          categories: state.categories,
          products: state.products,
          bills: state.bills,
          users: state.users,
        }));
      } catch (error) {
        console.error('Error saving state:', error);
      }
    };
    saveState();
  }, [state.categories, state.products, state.bills, state.users]);

  // Load state from AsyncStorage on mount
  useEffect(() => {
    const loadState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('appState');
        if (savedState) {
          const parsed = JSON.parse(savedState);
          dispatch({ type: 'LOAD_STATE', payload: parsed });
        }
      } catch (error) {
        console.error('Error loading state:', error);
      }
    };
    loadState();
  }, []);

  const login = (username: string, password: string): boolean => {
    // Master login: admin/admin123
    if (username === 'admin' && password === 'admin123') {
      dispatch({ type: 'LOGIN', payload: MASTER_USER });
      return true;
    }
    // Check other users (password is same as username for demo)
    const user = state.users.find(
      (u) => u.username === username && password === `${username}123`
    );
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    return false;
  };

  const loginWithPhone = (phone: string, pin: string): boolean => {
    const user = state.users.find((u) => u.phone === phone && u.pin === pin);
    if (user) {
      dispatch({ type: 'LOGIN', payload: user });
      return true;
    }
    return false;
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
  };

  const addCategory = (category: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_CATEGORY', payload: newCategory });
  };

  const addProduct = (product: Omit<Product, 'id' | 'createdAt'>) => {
    const newProduct: Product = {
      ...product,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    dispatch({ type: 'ADD_PRODUCT', payload: newProduct });
  };

  const addProductsBulk = (products: Omit<Product, 'id' | 'createdAt'>[]) => {
    const newProducts: Product[] = products.map((p, index) => ({
      ...p,
      id: `${Date.now()}-${index}`,
      createdAt: new Date(),
    }));
    dispatch({ type: 'ADD_PRODUCTS_BULK', payload: newProducts });
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

  const createBill = (): Bill | null => {
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

    dispatch({ type: 'ADD_BILL', payload: bill });
    dispatch({ type: 'CLEAR_CART' });
    return bill;
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt' | 'createdBy'>) => {
    const newUser: User = {
      ...user,
      id: Date.now().toString(),
      createdAt: new Date(),
      createdBy: state.user?.id,
    };
    dispatch({ type: 'ADD_USER', payload: newUser });
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
        addProduct,
        addProductsBulk,
        addToCart,
        updateCartItem,
        removeFromCart,
        clearCart,
        createBill,
        addUser,
        getProductsByCategory,
        getDailySales,
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

