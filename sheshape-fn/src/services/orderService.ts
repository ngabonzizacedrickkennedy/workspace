// src/services/orderService.ts - COMPLETE FIX
import { api } from '@/lib/api';

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface CheckoutRequest {
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PAYPAL' | 'DIGITAL_WALLET' | 'CASH_ON_DELIVERY';
  shippingAddress: Address;
  billingAddress?: Address;
  notes?: string;
  paymentDetails?: {
    cardNumber?: string;
    cardHolderName?: string;
    expiryMonth?: number;
    expiryYear?: number;
    cvv?: string;
    paypalEmail?: string;
    walletType?: string;
  };
}

// ✅ FIXED OrderItem interface - matches backend OrderItemDto exactly
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productDescription?: string;    // ✅ ADDED - matches backend
  productCategory?: string;       // ✅ ADDED - matches backend
  productImageUrl?: string;
  quantity: number;
  price: number;                  // ✅ FIXED - was 'unitPrice', now 'price' to match backend
  discountPrice?: number;         // ✅ ADDED - matches backend
  totalPrice: number;
}

// ✅ FIXED Order interface - matches backend OrderDto exactly
export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail?: string;             // ✅ ADDED - matches backend
  status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'RETURNED';
  paymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  totalAmount: number;
  taxAmount: number;              // ✅ FIXED - was 'taxes', now 'taxAmount' to match backend
  shippingAmount: number;         // ✅ FIXED - was 'shippingCost', now 'shippingAmount' to match backend
  discountAmount: number;         // ✅ FIXED - was 'totalDiscount', now 'discountAmount' to match backend
  shippingAddress: string;        // ✅ FIXED - backend stores as formatted string, not Address object
  billingAddress: string;         // ✅ FIXED - backend stores as formatted string, not Address object
  customerNotes?: string;         // ✅ FIXED - was 'notes', now 'customerNotes' to match backend
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderPage {
  content: Order[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

class OrderService {
  // Checkout - Create order from cart
  async checkout(checkoutRequest: CheckoutRequest): Promise<Order> {
    const response = await api.post('/api/orders/checkout', checkoutRequest);
    return response.data;
  }

  // Get current user's orders
  async getMyOrders(
    page: number = 0,
    size: number = 10,
    sortBy: string = 'createdAt',
    direction: 'asc' | 'desc' = 'desc'
  ): Promise<OrderPage> {
    const response = await api.get('/api/orders/my-orders', {
      params: { page, size, sortBy, direction }
    });
    return response.data;
  }

  // Get order by ID
  async getOrderById(orderId: number): Promise<Order> {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  }

  // Cancel order
  async cancelOrder(orderId: number, reason?: string): Promise<{ message: string }> {
    const response = await api.put(`/api/orders/${orderId}/cancel`, { reason });
    return response.data;
  }

  // Track order - ✅ FIXED to use correct backend endpoint
  async trackOrder(orderNumber: string): Promise<Order> {
    const response = await api.get(`/api/orders/number/${orderNumber}`);
    return response.data;
  }
}

export const orderService = new OrderService();