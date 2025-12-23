// Define the shape of the colors object for TypeScript safety
export type ColorPalette = typeof lightColors;

export const lightColors = {
  // Primary palette - Deep navy and gold for premium feel
  primary: '#1a1a2e',
  primaryLight: '#2d2d44',
  primaryDark: '#0f0f1a',

  // Accent colors - Warm gold and teal
  accent: '#e8b923',
  accentLight: '#f5d45a',
  accentDark: '#c49a1a',

  // Secondary accent - Teal for actions
  secondary: '#16a596',
  secondaryLight: '#1fc9b7',
  secondaryDark: '#108577',

  // Status colors
  success: '#2ecc71',
  successLight: '#58d68d',
  error: '#e74c3c',
  errorLight: '#f1948a',
  warning: '#f39c12',
  warningLight: '#f7c04a',
  info: '#3498db',
  infoLight: '#7fb3d5',

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },

  // Background colors
  background: '#f8f9fc',
  surface: '#ffffff',
  surfaceAlt: '#f0f2f5',

  // Text colors
  text: {
    primary: '#1a1a2e',
    secondary: '#5a5a72',
    disabled: '#9e9e9e',
    inverse: '#ffffff',
    accent: '#e8b923',
  },

  // Border colors
  border: '#e0e0e0',
  borderLight: '#f0f0f0',
  borderDark: '#c0c0c0',

  // Category colors for icons
  categories: {
    grocery: '#e74c3c',
    vegetables: '#27ae60',
    fruits: '#f39c12',
    dairy: '#3498db',
    beverages: '#9b59b6',
    snacks: '#e67e22',
    household: '#1abc9c',
    personal: '#e91e63',
  },
};

export const darkColors: ColorPalette = {
  // Primary palette - Deep navy and gold for premium feel
  primary: '#1a1a2e', // Keep primary brand color or shift slightly? Let's keep it.
  primaryLight: '#2d2d44',
  primaryDark: '#0f0f1a',

  // Accent colors - Warm gold and teal
  accent: '#e8b923',
  accentLight: '#f5d45a',
  accentDark: '#c49a1a',

  // Secondary accent - Teal for actions
  secondary: '#16a596',
  secondaryLight: '#1fc9b7',
  secondaryDark: '#108577',

  // Status colors - Slightly desaturated for dark mode usually, but keeping vibrant for now
  success: '#2ecc71',
  successLight: '#58d68d',
  error: '#e74c3c',
  errorLight: '#f1948a',
  warning: '#f39c12',
  warningLight: '#f7c04a',
  info: '#3498db',
  infoLight: '#7fb3d5',

  // Neutral palette
  white: '#ffffff',
  black: '#000000',
  gray: {
    50: '#121212', // Inverted logic roughly
    100: '#1e1e1e',
    200: '#2c2c2c',
    300: '#3a3a3a',
    400: '#505050',
    500: '#9e9e9e',
    600: '#bdbdbd',
    700: '#e0e0e0',
    800: '#eeeeee',
    900: '#fafafa',
  },

  // Background colors
  background: '#121212',
  surface: '#1e1e2d',
  surfaceAlt: '#2d2d44',

  // Text colors
  text: {
    primary: '#ffffff',
    secondary: '#b0b0c0',
    disabled: '#6e6e6e',
    inverse: '#1a1a2e',
    accent: '#e8b923',
  },

  // Border colors
  border: '#33334d',
  borderLight: '#444466',
  borderDark: '#222233',

  // Category colors for icons
  categories: {
    grocery: '#e74c3c',
    vegetables: '#27ae60',
    fruits: '#f39c12',
    dairy: '#3498db',
    beverages: '#9b59b6',
    snacks: '#e67e22',
    household: '#1abc9c',
    personal: '#e91e63',
  },
};

// Default export for backward compatibility
export const colors = lightColors;

export const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const gradients = {
  primary: ['#1a1a2e', '#2d2d44'],
  accent: ['#e8b923', '#f5d45a'],
  success: ['#27ae60', '#2ecc71'],
  header: ['#1a1a2e', '#16213e'],
};

