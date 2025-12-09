/**
 * Format currency with Indian Rupee symbol
 */
export const formatCurrency = (amount: number): string => {
  return `₹${amount.toFixed(2)}`;
};

/**
 * Format date to Indian locale
 */
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Format time to 12-hour format
 */
export const formatTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Format date and time together
 */
export const formatDateTime = (date: Date | string): string => {
  return `${formatDate(date)} ${formatTime(date)}`;
};

/**
 * Generate unique ID
 */
export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Calculate GST from price
 */
export const calculateGST = (
  price: number,
  gstPercentage: number,
  isInclusive: boolean
): { basePrice: number; gstAmount: number; total: number } => {
  if (isInclusive) {
    const basePrice = price / (1 + gstPercentage / 100);
    const gstAmount = price - basePrice;
    return {
      basePrice: Math.round(basePrice * 100) / 100,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: price,
    };
  } else {
    const gstAmount = (price * gstPercentage) / 100;
    return {
      basePrice: price,
      gstAmount: Math.round(gstAmount * 100) / 100,
      total: Math.round((price + gstAmount) * 100) / 100,
    };
  }
};

/**
 * Validate phone number (Indian format)
 */
export const isValidPhone = (phone: string): boolean => {
  return /^[6-9]\d{9}$/.test(phone);
};

/**
 * Validate PIN (4 digits)
 */
export const isValidPin = (pin: string): boolean => {
  return /^\d{4}$/.test(pin);
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};

