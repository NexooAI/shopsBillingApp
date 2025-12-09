# ShopBill Pro - Mobile Billing System

A comprehensive React Native + Expo mobile application for shop billing and product management with GST support.

![React Native](https://img.shields.io/badge/React%20Native-0.74-blue)
![Expo](https://img.shields.io/badge/Expo-51-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue)

## 📱 Features

### Authentication
- **Dual Login Methods**: Username/Password or Phone/PIN
- **OTP Verification**: Phone-based OTP login support
- **Master Login**: Default admin account for initial setup
- **Role-Based Access**: Admin and Staff user roles

### Dashboard
- **Admin Dashboard**: Full access to all management features
- **Staff Dashboard**: Simplified billing-focused interface
- **Today's Overview**: Revenue, bills, products, and category stats
- **Quick Actions**: One-tap access to common tasks

### Product Management
- **Bilingual Support**: Product names in English and Tamil
- **Category Organization**: Visual category-based product grouping
- **GST Configuration**: Set GST rates per product (0%, 5%, 12%, 18%, 28%)
- **GST Inclusive/Exclusive**: Flexible pricing options
- **Bulk Upload**: Import products via Excel file
- **Manual Entry**: Add products one by one

### Billing System
- **Quick Product Search**: Find products instantly
- **Category Navigation**: Browse products by category
- **Cart Management**: Add, update, remove items
- **Real-time GST Calculation**: Automatic tax computation
- **Bill Generation**: Create bills with full breakdown
- **Print Support**: Bluetooth thermal printer integration
- **Bill Preview**: Professional bill layout with shop branding

### Sales & Reports
- **Daily Sales Summary**: Revenue, bill count, products sold
- **Date-wise Reports**: View historical sales data
- **GST Summary**: Tax collected breakdown (CGST/SGST)
- **Bill History**: Access all generated bills

### User Management (Admin)
- **Add Staff**: Create new user accounts
- **Role Assignment**: Set Admin or Staff roles
- **Credential Management**: Username/Password and Phone/PIN

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- Android Studio (for Android) or Xcode (for iOS)

### Installation

1. Clone the repository:
```bash
cd shopsBillingApp
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npx expo start
```

4. Run on device/emulator:
- Press `a` for Android
- Press `i` for iOS
- Scan QR code with Expo Go app

### Demo Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`
- Phone: `9999999999`
- PIN: `1234`

## 📁 Project Structure

```
shopsBillingApp/
├── App.tsx                    # Main entry point
├── src/
│   ├── context/
│   │   └── AppContext.tsx     # Global state management
│   ├── navigation/
│   │   └── AppNavigator.tsx   # Navigation configuration
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx
│   │   │   └── OTPScreen.tsx
│   │   ├── main/
│   │   │   ├── DashboardScreen.tsx
│   │   │   ├── ProductsScreen.tsx
│   │   │   ├── BillingScreen.tsx
│   │   │   └── SalesSummaryScreen.tsx
│   │   ├── admin/
│   │   │   ├── CategoryManagementScreen.tsx
│   │   │   ├── ProductManagementScreen.tsx
│   │   │   ├── UserManagementScreen.tsx
│   │   │   ├── AddProductScreen.tsx
│   │   │   ├── AddCategoryScreen.tsx
│   │   │   ├── BulkUploadScreen.tsx
│   │   │   └── SettingsScreen.tsx
│   │   └── billing/
│   │       └── BillPreviewScreen.tsx
│   ├── theme/
│   │   ├── colors.ts          # Color palette
│   │   └── index.ts           # Theme exports
│   └── types/
│       └── index.ts           # TypeScript types
├── assets/                    # App icons and images
├── package.json
├── app.json                   # Expo configuration
└── tsconfig.json
```

## 🎨 Theme & Design

### Color Palette
- **Primary**: Deep navy (#1a1a2e)
- **Accent**: Gold (#e8b923)
- **Secondary**: Teal (#16a596)
- **Success**: Green (#2ecc71)
- **Error**: Red (#e74c3c)

### Category Colors
- Grocery: Red
- Vegetables: Green
- Fruits: Orange
- Dairy: Blue
- Beverages: Purple
- Snacks: Orange-Brown

## 🛠️ Technologies Used

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **AsyncStorage** - Local data persistence
- **Context API** - State management

## 📄 License

This project is licensed under the MIT License.

## 🤝 Support

For support, email support@shopbill.com or open an issue.

---

Built with ❤️ using React Native and Expo
