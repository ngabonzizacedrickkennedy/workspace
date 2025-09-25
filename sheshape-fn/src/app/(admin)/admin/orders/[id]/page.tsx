// src/app/(admin)/admin/orders/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Calendar,
  DollarSign,
  Mail,
  Edit,
  RefreshCw,
  Download,
  Send,
} from "lucide-react";
import { formatDate, formatPrice } from "@/lib/utils";
import { toast } from "react-toastify";

// Types (same as previous)
interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  userEmail: string;
  items: OrderItem[];
  status: "PENDING" | "PROCESSING" | "SHIPPED" | "DELIVERED" | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  paymentMethod: "CREDIT_CARD" | "DEBIT_CARD" | "PAYPAL" | "BANK_TRANSFER";
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

// Import your existing API configuration
import { api } from "@/lib/api";

// API service using your existing API configuration
const orderService = {
  async getOrderById(orderId: number): Promise<Order> {
    const response = await api.get(`/api/orders/${orderId}`);
    return response.data;
  },

  async updateOrderStatus(orderId: number, status: string): Promise<Order> {
    const response = await api.put(`/api/orders/${orderId}/status`, null, {
      params: { status },
    });
    return response.data;
  },

  async updatePaymentStatus(
    orderId: number,
    paymentStatus: string
  ): Promise<Order> {
    const response = await api.put(
      `/api/orders/${orderId}/payment-status`,
      null,
      {
        params: { paymentStatus },
      }
    );
    return response.data;
  },

  async resendConfirmation(orderId: number): Promise<void> {
    await api.post(`/api/orders/${orderId}/resend-confirmation`);
  },
};

// Status badge component
const StatusBadge = ({ status }: { status: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "PROCESSING":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "DELIVERED":
        return "bg-green-100 text-green-800 border-green-200";
      case "CANCELLED":
        return "bg-red-100 text-red-800 border-red-200";
      case "PAID":
        return "bg-green-100 text-green-800 border-green-200";
      case "FAILED":
        return "bg-red-100 text-red-800 border-red-200";
      case "REFUNDED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <Badge
      className={`${getStatusColor(status)} font-medium`}
      variant="outline"
    >
      {status}
    </Badge>
  );
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = parseInt(params.id as string);

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch order details
  const fetchOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orderData = await orderService.getOrderById(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error("Failed to fetch order:", err);
      setError("Failed to load order details. Please try again.");
      toast.error("Failed to load order details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Handle order status update
  const handleStatusUpdate = async (newStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const updatedOrder = await orderService.updateOrderStatus(
        order.id,
        newStatus
      );
      setOrder(updatedOrder);
      toast.success("Order status updated successfully");
    } catch (err) {
      console.error("Failed to update order status:", err);
      toast.error("Failed to update order status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle payment status update
  const handlePaymentStatusUpdate = async (newPaymentStatus: string) => {
    if (!order) return;

    setIsUpdating(true);
    try {
      const updatedOrder = await orderService.updatePaymentStatus(
        order.id,
        newPaymentStatus
      );
      setOrder(updatedOrder);
      toast.success("Payment status updated successfully");
    } catch (err) {
      console.error("Failed to update payment status:", err);
      toast.error("Failed to update payment status");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle resend confirmation
  const handleResendConfirmation = async () => {
    if (!order) return;

    try {
      await orderService.resendConfirmation(order.id);
      toast.success("Confirmation email sent successfully");
    } catch (err) {
      console.error("Failed to resend confirmation:", err);
      toast.error("Failed to send confirmation email");
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-2">
            <Button
              onClick={fetchOrder}
              className="bg-pink-600 hover:bg-pink-700"
            >
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                `Order ${order?.orderNumber}`
              )}
            </h1>
            <div className="text-gray-600 mt-1">
  {isLoading ? (
    <Skeleton className="h-4 w-32" />
  ) : (
    `Created ${formatDate(order?.createdAt || "")}`
  )}
</div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={fetchOrder}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleResendConfirmation}
            disabled={isLoading || !order}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Resend Email
          </Button>
          <Button className="bg-pink-600 hover:bg-pink-700 flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : !order ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Order not found
          </h3>
          <p className="text-gray-600">
            The requested order could not be found.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Status and Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Order Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Current Status:</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <Select
                    value={order.status}
                    onValueChange={handleStatusUpdate}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PROCESSING">Processing</SelectItem>
                      <SelectItem value="SHIPPED">Shipped</SelectItem>
                      <SelectItem value="DELIVERED">Delivered</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Payment Status:</span>
                    <StatusBadge status={order.paymentStatus} />
                  </div>
                  <Select
                    value={order.paymentStatus}
                    onValueChange={handlePaymentStatusUpdate}
                    disabled={isUpdating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="FAILED">Failed</SelectItem>
                      <SelectItem value="REFUNDED">Refunded</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-sm text-gray-600">
                    Method: {order.paymentMethod.replace("_", " ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-900">{order.userEmail}</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    User ID
                  </label>
                  <div className="mt-1">
                    <Link
                      href={`/admin/users/${order.userId}`}
                      className="text-pink-600 hover:text-pink-700 hover:underline"
                    >
                      #{order.userId}
                    </Link>
                  </div>
                </div>
                {order.customerNotes && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Customer Notes
                    </label>
                    <div className="mt-1 p-2 bg-gray-50 rounded text-sm text-gray-900">
                      {order.customerNotes}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Shipping Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Shipping Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Shipping Address
                  </label>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {order.shippingAddress}
                  </div>
                </div>
                {order.trackingNumber && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Tracking Number
                    </label>
                    <div className="mt-1 font-mono text-sm text-gray-900">
                      {order.trackingNumber}
                    </div>
                  </div>
                )}
                {order.estimatedDeliveryDate && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Estimated Delivery
                    </label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-900">
                        {formatDate(order.estimatedDeliveryDate)}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Billing Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Billing Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Billing Address
                  </label>
                  <div className="mt-1 text-sm text-gray-900 whitespace-pre-line">
                    {order.billingAddress}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Payment Method
                  </label>
                  <div className="mt-1 text-gray-900">
                    {order.paymentMethod.replace("_", " ")}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Order Items ({order.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {item.productName}
                      </h4>
                      <div className="text-sm text-gray-600">
                        Product ID: #{item.productId}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Quantity</div>
                      <div className="font-medium">×{item.quantity}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Unit Price</div>
                      <div className="font-medium">
                        {formatPrice(item.unitPrice)}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm text-gray-600">Total</div>
                      <div className="font-medium">
                        {formatPrice(item.totalPrice)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">
                    {formatPrice(order.subtotal)}
                  </span>
                </div>
                {order.taxAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax</span>
                    <span className="font-medium">
                      {formatPrice(order.taxAmount)}
                    </span>
                  </div>
                )}
                {order.shippingAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium">
                      {formatPrice(order.shippingAmount)}
                    </span>
                  </div>
                )}
                {order.discountAmount && order.discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span className="font-medium">
                      -{formatPrice(order.discountAmount)}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span>{formatPrice(order.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
