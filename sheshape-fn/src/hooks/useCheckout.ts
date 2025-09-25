
// src/hooks/useCheckout.ts
import { useState, useCallback } from 'react';
import { orderService, CheckoutRequest, Order } from '@/services/orderService';
import { cartService } from '@/services/cartService';
import { toast } from 'react-toastify';

interface UseCheckoutReturn {
  isLoading: boolean;
  error: string | null;
  checkout: (checkoutRequest: CheckoutRequest) => Promise<Order | null>;
  clearError: () => void;
}

export function useCheckout(): UseCheckoutReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkout = useCallback(async (checkoutRequest: CheckoutRequest): Promise<Order | null> => {
    setIsLoading(true);
    setError(null);

    try {
      // Validate cart first
      const cartValidation = await cartService.validateCart();
      if (!cartValidation.valid) {
        throw new Error('Cart contains invalid items. Please review your cart.');
      }

      // Process checkout
      const order = await orderService.checkout(checkoutRequest);
      
      toast.success(`Order placed successfully! Order #${order.orderNumber}`);
      return order;

    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to place order';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isLoading,
    error,
    checkout,
    clearError,
  };
}
