// src/services/cartService.ts - FIXED VERSION
import { api, apiHelpers } from '@/lib/api';

// Types remain the same
export interface CartItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
  productSku?: string;
  maxQuantity?: number;
  isAvailable: boolean;
}

export interface Cart {
  id: number;
  userId: number;
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  subtotal: number;
  taxAmount?: number;
  shippingAmount?: number;
  discountAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface AddToCartRequest {
  productId: number;
  quantity: number;
}

export interface UpdateQuantityRequest {
  quantity: number;
}

export interface CartValidationResult {
  valid: boolean;
  issues?: {
    productId: number;
    issue: string;
  }[];
}

// FIXED: Remove CartResponse wrapper interface since backend doesn't use it
// The backend returns CartDto directly, not wrapped in a response object

class CartService {
  // Get current user's cart - FIXED
  async getUserCart(): Promise<Cart | null> {
    try {
      console.log('Fetching user cart...');
      const response = await api.get<Cart>('/api/cart'); // FIXED: Expect Cart directly
      
      console.log('Cart fetched successfully');
      return response.data; // FIXED: Return response.data directly
    } catch (error) {
      console.error('Cart fetch error:', error);
      
      // Handle specific error scenarios gracefully
      if (apiHelpers.isAuthError(error)) {
        console.warn('Authentication error when fetching cart - user may need to re-login');
        throw error;
      }
      
      if (apiHelpers.isNotFoundError(error)) {
        console.info('No cart found for user - returning empty cart');
        return null;
      }
      
      if (apiHelpers.isServerError(error)) {
        console.error('Server error when fetching cart - may be authentication issue');
        return null;
      }
      
      // For other errors, throw to be handled by calling code
      console.error('Unexpected error fetching cart:', apiHelpers.getErrorMessage(error));
      throw error;
    }
  }

  // Add item to cart - FIXED
  async addToCart(request: AddToCartRequest): Promise<Cart> {
    try {
      console.log('Adding item to cart:', request);
      const response = await api.post<Cart>('/api/cart/add', request); // FIXED: Expect Cart directly
      
      console.log('Item added to cart successfully');
      return response.data; // FIXED: Return response.data directly
    } catch (error) {
      console.error('Add to cart error:', error);
      
      const errorMessage = apiHelpers.getErrorMessage(error, 'Failed to add item to cart');
      throw new Error(errorMessage);
    }
  }

  // Update item quantity - FIXED
  async updateCartItemQuantity(productId: number, quantity: number): Promise<Cart> {
    try {
      console.log(`Updating cart item ${productId} quantity to ${quantity}`);
      const response = await api.put<Cart>( // FIXED: Expect Cart directly
        `/api/cart/items/${productId}`,
        { quantity }
      );
      
      console.log('Cart item quantity updated successfully');
      return response.data; // FIXED: Return response.data directly
    } catch (error) {
      console.error('Update quantity error:', error);
      
      const errorMessage = apiHelpers.getErrorMessage(error, 'Failed to update item quantity');
      throw new Error(errorMessage);
    }
  }

  // Remove item from cart - FIXED
  async removeFromCart(productId: number): Promise<Cart> {
    try {
      console.log(`Removing item ${productId} from cart`);
      const response = await api.delete<Cart>(`/api/cart/items/${productId}`); // FIXED: Expect Cart directly
      
      console.log('Item removed from cart successfully');
      return response.data; // FIXED: Return response.data directly
    } catch (error) {
      console.error('Remove from cart error:', error);
      
      const errorMessage = apiHelpers.getErrorMessage(error, 'Failed to remove item from cart');
      throw new Error(errorMessage);
    }
  }

  // Clear cart - FIXED
  async clearCart(): Promise<void> {
    try {
      console.log('Clearing cart...');
      await api.delete<{ message: string }>('/api/cart/clear'); // FIXED: Expect simple message response
      console.log('Cart cleared successfully');
    } catch (error) {
      console.error('Clear cart error:', error);
      
      const errorMessage = apiHelpers.getErrorMessage(error, 'Failed to clear cart');
      throw new Error(errorMessage);
    }
  }

  // Validate cart - FIXED
  async validateCart(): Promise<CartValidationResult> {
    try {
      console.log('Validating cart...');
      const response = await api.get<{ valid: boolean }>('/api/cart/validate'); // FIXED: Expect simple response
      
      console.log('Cart validation completed');
      return { valid: response.data.valid }; // FIXED: Map to proper interface
    } catch (error) {
      console.error('Cart validation error:', error);
      
      // Return invalid on error
      return { 
        valid: false, 
        issues: [{ productId: 0, issue: 'Validation failed due to error' }] 
      };
    }
  }

  // Get cart items count - FIXED
  async getCartItemsCount(): Promise<number> {
    try {
      console.log('Getting cart items count...');
      const response = await api.get<{ count: number }>('/api/cart/count'); // FIXED: Expect count response
      
      console.log('Cart items count retrieved successfully');
      return response.data.count; // FIXED: Return count directly
    } catch (error) {
      console.error('Get cart items count error:', error);
      return 0; // Return 0 on error
    }
  }

  // Helper method for safe cart operations with better error handling
  private async safeCartOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    fallback?: T
  ): Promise<T | null> {
    try {
      console.log(`Executing ${operationName}...`);
      const result = await operation();
      console.log(`${operationName} completed successfully`);
      return result;
    } catch (error) {
      console.error(`${operationName} failed:`, error);
      
      // Handle authentication errors specially
      if (apiHelpers.isAuthError(error)) {
        console.warn(`${operationName} failed due to authentication - user needs to login`);
        throw error;
      }
      
      // For other errors, return fallback or null
      if (fallback !== undefined) {
        console.info(`${operationName} failed, using fallback:`, fallback);
        return fallback;
      }
      
      console.warn(`${operationName} failed, returning null`);
      return null;
    }
  }

  // Sync cart
  async syncCart(): Promise<Cart | null> {
    return this.safeCartOperation(
      () => this.getUserCart(),
      'Cart sync',
      null
    );
  }

  // Check if cart is empty
  async isCartEmpty(): Promise<boolean> {
    try {
      const cart = await this.getUserCart();
      return !cart || cart.totalItems === 0;
    } catch (error) {
      console.error('Error checking if cart is empty:', error);
      return true;
    }
  }

  // Get cart summary for quick display
  async getCartSummary(): Promise<{ totalItems: number; totalPrice: number }> {
    try {
      const cart = await this.getUserCart();
      if (!cart) {
        return { totalItems: 0, totalPrice: 0 };
      }
      return {
        totalItems: cart.totalItems,
        totalPrice: cart.totalPrice
      };
    } catch (error) {
      console.error('Error getting cart summary:', error);
      return { totalItems: 0, totalPrice: 0 };
    }
  }
}

// Export singleton instance
export const cartService = new CartService();