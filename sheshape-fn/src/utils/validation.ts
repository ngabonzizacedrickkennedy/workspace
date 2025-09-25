// src/utils/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateShippingAddress(address: any): ValidationResult {
  const errors: string[] = [];
  const required = ['firstName', 'lastName', 'email', 'phone', 'street', 'city', 'state', 'zipCode'];

  // Check required fields
  for (const field of required) {
    if (!address[field] || address[field].toString().trim() === '') {
      errors.push(`${field.replace(/([A-Z])/g, ' $1').toLowerCase()} is required`);
    }
  }

  // Validate email format
  if (address.email && !/\S+@\S+\.\S+/.test(address.email)) {
    errors.push('Please enter a valid email address');
  }

  // Validate phone format
  if (address.phone && !/^\+?[\d\s\-\(\)]+$/.test(address.phone)) {
    errors.push('Please enter a valid phone number');
  }

  // Validate ZIP code format (basic US format)
  if (address.zipCode && !/^\d{5}(-\d{4})?$/.test(address.zipCode)) {
    errors.push('Please enter a valid ZIP code');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function validatePaymentData(paymentData: any): ValidationResult {
  const errors: string[] = [];

  if (!paymentData.paymentMethod) {
    errors.push('Payment method is required');
  }

  // Skip validation for cash on delivery
  if (paymentData.paymentMethod === 'CASH_ON_DELIVERY') {
    return { isValid: true, errors: [] };
  }

  // Validate card details for card payments
  if (paymentData.paymentMethod === 'CREDIT_CARD' || paymentData.paymentMethod === 'DEBIT_CARD') {
    if (!paymentData.cardHolderName?.trim()) {
      errors.push('Card holder name is required');
    }

    if (!paymentData.cardNumber?.replace(/\s/g, '')) {
      errors.push('Card number is required');
    } else if (!/^\d{16}$/.test(paymentData.cardNumber.replace(/\s/g, ''))) {
      errors.push('Please enter a valid 16-digit card number');
    }

    if (!paymentData.expiryMonth) {
      errors.push('Expiry month is required');
    }

    if (!paymentData.expiryYear) {
      errors.push('Expiry year is required');
    }

    // Check if card is not expired
    if (paymentData.expiryMonth && paymentData.expiryYear) {
      const today = new Date();
      const expiry = new Date(parseInt(paymentData.expiryYear), parseInt(paymentData.expiryMonth) - 1);
      if (expiry < today) {
        errors.push('Card has expired');
      }
    }

    if (!paymentData.cvv) {
      errors.push('CVV is required');
    } else if (!/^\d{3,4}$/.test(paymentData.cvv)) {
      errors.push('Please enter a valid 3 or 4-digit CVV');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

export function formatCardNumber(value: string): string {
  // Remove all spaces and non-digits
  const cleanValue = value.replace(/\D/g, '');
  
  // Add spaces every 4 digits
  const formattedValue = cleanValue.replace(/(.{4})/g, '$1 ').trim();
  
  // Limit to 19 characters (16 digits + 3 spaces)
  return formattedValue.substring(0, 19);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}