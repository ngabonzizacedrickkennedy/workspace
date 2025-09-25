// src/types/admin.ts

// Order related types
export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  productImage?: string;
  productSku?: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail: string;
  items: OrderItem[];
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  discountAmount?: number;
  shippingAddress: string;
  billingAddress: string;
  customerNotes?: string;
  trackingNumber?: string;
  estimatedDeliveryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SHIPPED' 
  | 'DELIVERED' 
  | 'CANCELLED';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PAID' 
  | 'FAILED' 
  | 'REFUNDED';

export type PaymentMethod = 
  | 'CREDIT_CARD' 
  | 'DEBIT_CARD' 
  | 'PAYPAL' 
  | 'BANK_TRANSFER';

export interface OrdersResponse {
  content: Order[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// User related types for admin
export interface AdminUser {
  id: number;
  username: string;
  email: string;
  role: 'CLIENT' | 'TRAINER' | 'NUTRITIONIST' | 'ADMIN';
  isActive: boolean;
  profileCompleted: boolean;
  createdAt: string;
  updatedAt: string;
  profile?: AdminUserProfile;
  lastLoginAt?: string;
  totalOrders?: number;
  totalSpent?: number;
}

export interface AdminUserProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  gender?: string;
  phoneNumber?: string;
  profilePictureUrl?: string;
  bio?: string;
  city?: string;
  country?: string;
}

export interface UsersResponse {
  content: AdminUser[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      sorted: boolean;
      unsorted: boolean;
    };
  };
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// Dashboard statistics
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: number;
  orderGrowth: number;
  revenueGrowth: number;
  userGrowth: number;
}

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  averageOrderValue: number;
  statusBreakdown: Record<OrderStatus, number>;
  paymentBreakdown: Record<PaymentStatus, number>;
  revenueByMonth: Array<{
    month: string;
    revenue: number;
    orders: number;
  }>;
  topProducts: Array<{
    productId: number;
    productName: string;
    totalSold: number;
    totalRevenue: number;
  }>;
  topCustomers: Array<{
    userId: number;
    userEmail: string;
    totalOrders: number;
    totalSpent: number;
  }>;
}

// Product related types for admin
export interface AdminProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPrice?: number;
  sku: string;
  category: string;
  subcategory?: string;
  stock: number;
  isActive: boolean;
  images: string[];
  createdAt: string;
  updatedAt: string;
  totalSold: number;
  rating: number;
  reviewCount: number;
}

// Filter and search types
export interface OrderFilters {
  status?: OrderStatus | 'all';
  paymentStatus?: PaymentStatus | 'all';
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  customerEmail?: string;
}

export interface UserFilters {
  role?: string | 'all';
  isActive?: boolean | 'all';
  profileCompleted?: boolean | 'all';
  startDate?: string;
  endDate?: string;
}

// API response types
export interface ApiResponse<T = any> {
  data: T;
  message: string;
  success: boolean;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status: number;
}

// Bulk operation types
export interface BulkOrderUpdate {
  orderIds: number[];
  status: OrderStatus;
}

export interface BulkUpdateResult {
  updated: number;
  failed: number;
  errors?: string[];
}

// Export types
export interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  startDate?: string;
  endDate?: string;
  filters?: OrderFilters | UserFilters;
  includeDetails?: boolean;
}

// Notification types
export interface AdminNotification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: number;
  relatedType?: 'order' | 'user' | 'product' | 'system';
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Table configuration types
export interface TableColumn<T = any> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: T) => React.ReactNode;
}

export interface TableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    current: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
  };
  selection?: {
    selectedKeys: React.Key[];
    onChange: (keys: React.Key[]) => void;
  };
}