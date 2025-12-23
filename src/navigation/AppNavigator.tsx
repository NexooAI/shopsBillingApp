import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { colors } from '../theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import InitialSetupScreen from '../screens/setup/InitialSetupScreen';

// Main Screens
import DashboardScreen from '../screens/main/DashboardScreen';
import ProductsScreen from '../screens/main/ProductsScreen';
import BillingScreen from '../screens/main/BillingScreen';
import SalesSummaryScreen from '../screens/main/SalesSummaryScreen';
import ProductSalesStatsScreen from '../screens/main/ProductSalesStatsScreen';
import InventoryStatusScreen from '../screens/main/InventoryStatusScreen';

// Admin Screens
import CategoryManagementScreen from '../screens/admin/CategoryManagementScreen';
import ProductManagementScreen from '../screens/admin/ProductManagementScreen';
import UserManagementScreen from '../screens/admin/UserManagementScreen';
import AddProductScreen from '../screens/admin/AddProductScreen';
import AddCategoryScreen from '../screens/admin/AddCategoryScreen';
import BulkUploadScreen from '../screens/admin/BulkUploadScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';
import ServerSyncScreen from '../screens/admin/ServerSyncScreen';
import ShopProfileScreen from '../screens/admin/ShopProfileScreen';
import PrinterSettingsScreen from '../screens/admin/PrinterSettingsScreen';

// Bill Screen
import BillPreviewScreen from '../screens/billing/BillPreviewScreen';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  OTP: { phone: string };
  InitialSetup: undefined;
  CategoryManagement: undefined;
  ProductManagement: undefined;
  UserManagement: undefined;
  AddProduct: { categoryId?: string; product?: import('../types').Product };
  AddCategory: { category?: any };
  BulkUpload: undefined;
  Settings: undefined;
  ServerSync: undefined;
  PrinterSettings: undefined;
  ShopProfile: undefined;
  BillPreview: { bill: any };
  SalesSummary: undefined;
  ProductSalesStats: undefined;
  InventoryStatus: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Products: undefined;
  Billing: { bill?: any }; // Using any to avoid circular dependency or import issues for now, or Import Bill
  Sales: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  const { state } = useApp();
  const isAdmin = state.user?.role === 'admin' || state.user?.role === 'super_admin';

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Products') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Billing') {
            iconName = focused ? 'cart' : 'cart-outline';
          } else if (route.name === 'Sales') {
            iconName = focused ? 'stats-chart' : 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.gray[500],
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 12,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.white,
        headerTitleStyle: {
          fontWeight: '700',
        },
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Products' }}
      />
      <Tab.Screen
        name="Billing"
        component={BillingScreen}
        options={{ title: 'Billing' }}
      />
      <Tab.Screen
        name="Sales"
        component={SalesSummaryScreen}
        options={{ title: 'Sales' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { state } = useApp();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.white,
          headerTitleStyle: {
            fontWeight: '700',
          },
          animation: 'slide_from_right',
          statusBarTranslucent: true,
        }}
      >
        {!state.isSetupComplete ? (
          <>
            <Stack.Screen
              name="InitialSetup"
              component={InitialSetupScreen}
              options={{ headerShown: false }}
            />
          </>
        ) : !state.isAuthenticated ? (
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="OTP"
              component={OTPScreen}
              options={{ title: 'Verify OTP' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Main"
              component={MainTabs}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="CategoryManagement"
              component={CategoryManagementScreen}
              options={{ title: 'Categories' }}
            />
            <Stack.Screen
              name="ProductManagement"
              component={ProductManagementScreen}
              options={{ title: 'Manage Products' }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{ title: 'Users' }}
            />
            <Stack.Screen
              name="AddProduct"
              component={AddProductScreen}
              options={{ title: 'Add Product' }}
            />
            <Stack.Screen
              name="AddCategory"
              component={AddCategoryScreen}
              options={{ title: 'Add Category' }}
            />
            <Stack.Screen
              name="BulkUpload"
              component={BulkUploadScreen}
              options={{ title: 'Bulk Upload' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ title: 'Settings' }}
            />
            <Stack.Screen
              name="ServerSync"
              component={ServerSyncScreen}
              options={{ title: 'Server Sync' }}
            />
            <Stack.Screen
              name="PrinterSettings"
              component={PrinterSettingsScreen}
              options={{ title: 'Printer Settings' }}
            />
            <Stack.Screen
              name="ShopProfile"
              component={ShopProfileScreen}
              options={{ title: 'Shop Profile' }}
            />
            <Stack.Screen
              name="BillPreview"
              component={BillPreviewScreen}
              options={{ title: 'Bill' }}
            />
            <Stack.Screen
              name="ProductSalesStats"
              component={ProductSalesStatsScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="InventoryStatus"
              component={InventoryStatusScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

