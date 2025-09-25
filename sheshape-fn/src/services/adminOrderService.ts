// src/services/adminOrderService.ts
import { api } from '@/lib/api';
import { Order, OrdersResponse } from '@/types/admin';

class AdminOrderService {
  // Get all orders with pagination
  async getAllOrders(
    page = 0, 
    size = 20, 
    sortBy = 'createdAt', 
    direction = 'desc'
  ): Promise<OrdersResponse> {
    const response = await api.get('/api/orders/all', {
      params: { page, size, sortBy, direction }
    });
    return response.data;
  }

  // Get orders by status
  async getOrdersByStatus(
    status: string,
    page = 0,
    size = 20
  ): Promise<OrdersResponse> {
    const response = await api.get(`/api/orders/status/${status}`, {
      params: { page, size }
    });
    return response.data;
  }

  // Get orders by user ID
  async getOrdersByUserId(
    userId: number,
    page = 0,
    size = 10
  ): Promise<OrdersResponse> {
    const response = await api.get(`/api/orders/user/${userId}`, {
      params: { page, size }
    });
    return response.data;
  }

  // Get single order by ID
  async getOrderById(orderId: number): Promise<Order> {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  }

  // Get order by order number
  async getOrderByNumber(orderNumber: string): Promise<Order> {
    const response = await api.get(`/api/orders/number/${orderNumber}`);
    return response.data;
  }

  // Update order status
  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const response = await api.put(`/api/orders/${orderId}/status`, null, {
      params: { status }
    });
    return response.data;
  }

  // Update payment status
  async updatePaymentStatus(orderId: number, paymentStatus: string): Promise<Order> {
    const response = await api.put(`/api/orders/${orderId}/payment-status`, null, {
      params: { paymentStatus }
    });
    return response.data;
  }

  // Cancel order with reason
  async cancelOrder(orderId: number, reason: string): Promise<Order> {
    const response = await api.put(`/api/orders/${orderId}/admin-cancel`, null, {
      params: { reason }
    });
    return response.data;
  }

  // Resend confirmation email
  async resendConfirmationEmail(orderId: number): Promise<{ message: string }> {
    const response = await api.post(`/api/orders/${orderId}/resend-confirmation`);
    return response.data;
  }

  // Search orders
  async searchOrders(
    query: string,
    page = 0,
    size = 20
  ): Promise<OrdersResponse> {
    const response = await api.get('/api/orders/search', {
      params: { query, page, size }
    });
    return response.data;
  }
}

export const adminOrderService = new AdminOrderService();

