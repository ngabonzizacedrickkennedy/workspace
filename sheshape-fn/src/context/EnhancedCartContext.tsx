// src/context/EnhancedCartContext.tsx
"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { useAuth } from "@/context/AuthContext";
import { cartService, Cart, AddToCartRequest } from "@/services/cartService";
import { toast } from "react-toastify";

interface CartContextType {
  cart: Cart | null;
  isLoading: boolean;
  isCartOpen: boolean;
  totalItems: number;
  totalPrice: number;
  addItem: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  toggleCart: () => void;
  refreshCart: () => Promise<void>;
  validateCart: () => Promise<boolean>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function EnhancedCartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  // Calculate derived values
  const totalItems = cart?.totalItems || 0;
  const totalPrice = cart?.totalPrice || 0;

  // CRITICAL FIX: Debounced cart refresh to prevent race conditions
  const refreshCart = useCallback(async () => {
    // SAFE: Only fetch cart if user is properly authenticated and user data is available
    if (!isAuthenticated || !user || !user.id) {
      console.log("Cart refresh skipped - user not ready:", {
        isAuthenticated,
        hasUser: !!user,
        hasUserId: !!user?.id,
      });
      setCart(null);
      return;
    }

    try {
      setIsLoading(true);
      console.log("Refreshing cart for user:", user.id);

      const userCart = await cartService.getUserCart();
      setCart(userCart);
    } catch (error: any) {
      console.error("Cart refresh error:", error);

      // CRITICAL FIX: Handle authentication/server errors gracefully
      if (error?.response?.status === 500) {
        console.warn("Server error loading cart - likely authentication issue");
        // Don't show error toast for 500 errors during initial load
        // The user might not be fully authenticated yet
        setCart(null);
        return;
      }

      if (error?.response?.status === 401) {
        console.warn("Unauthorized cart access - clearing cart");
        setCart(null);
        return;
      }

      // Handle 404 (empty cart) silently
      if (error?.response?.status === 404) {
        console.log("No cart found for user - setting empty cart");
        setCart(null);
        return;
      }

      // Only show error toast for unexpected errors
      console.error("Unexpected cart error:", error);
      toast.error("Failed to load cart");
      setCart(null);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user]);

  // ENHANCED: Load user's cart with better timing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    if (isAuthenticated && user && user.id) {
      // CRITICAL FIX: Add small delay to ensure auth is fully established
      timeoutId = setTimeout(() => {
        refreshCart();
      }, 100); // 100ms delay to prevent race conditions
    } else {
      // Clear cart data when not authenticated
      setCart(null);
    }

    // Cleanup timeout
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isAuthenticated, user, refreshCart]);

  // Add item to cart
  const addItem = async (productId: number, quantity: number) => {
    if (!isAuthenticated) {
      toast.error("Please log in to add items to cart");
      return;
    }

    try {
      setIsLoading(true);
      const request: AddToCartRequest = { productId, quantity };
      const updatedCart = await cartService.addToCart(request);
      setCart(updatedCart);
      toast.success(`Item added to cart`);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to add item to cart";
      toast.error(message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Update item quantity
  const updateQuantity = async (productId: number, quantity: number) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const updatedCart = await cartService.updateCartItemQuantity(
        productId,
        quantity
      );
      setCart(updatedCart);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to update quantity";
      toast.error(message);
      // Refresh cart to sync with backend state
      await refreshCart();
    } finally {
      setIsLoading(false);
    }
  };

  // Remove item from cart
  const removeItem = async (productId: number) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      const updatedCart = await cartService.removeFromCart(productId);
      setCart(updatedCart);
      toast.success("Item removed from cart");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to remove item";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      await cartService.clearCart();
      setCart(null);
      toast.success("Cart cleared");
    } catch (error: any) {
      const message = error?.response?.data?.message || "Failed to clear cart";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate cart
  const validateCart = async (): Promise<boolean> => {
    if (!isAuthenticated || !cart) return true;

    try {
      const result = await cartService.validateCart();
      if (!result.valid) {
        toast.warning(
          "Some items in your cart are no longer available. Please review your cart."
        );
        await refreshCart();
      }
      return result.valid;
    } catch (error) {
      console.error("Error validating cart:", error);
      return false;
    }
  };

  // Toggle cart visibility
  const toggleCart = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to view your cart");
      return;
    }
    setIsCartOpen((prev) => !prev);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        isCartOpen,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        toggleCart,
        refreshCart,
        validateCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useEnhancedCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error(
      "useEnhancedCart must be used within an EnhancedCartProvider"
    );
  }
  return context;
}
