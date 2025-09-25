// src/components/orders/OrderTracking.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { orderService, Order } from "@/services/orderService";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Package,
  Truck,
  MapPin,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react";
import { toast } from "react-toastify";

interface OrderTrackingProps {
  orderNumber: string;
}

export function OrderTracking({ orderNumber }: OrderTrackingProps) {
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrderTracking();
  }, [orderNumber]);

  const fetchOrderTracking = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orderData = await orderService.trackOrder(orderNumber);
      setOrder(orderData);
    } catch (error: any) {
      console.error("Error tracking order:", error);
      const message = error?.response?.data?.message || "Order not found";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "CONFIRMED":
      case "PROCESSING":
        return <Package className="h-5 w-5 text-blue-500" />;
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case "DELIVERED":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "CANCELLED":
      case "RETURNED":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Package className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadgeColor = (status: Order["status"]) => {
    switch (status) {
      case "PENDING":
        return "bg-yellow-100 text-yellow-800";
      case "CONFIRMED":
        return "bg-blue-100 text-blue-800";
      case "PROCESSING":
        return "bg-purple-100 text-purple-800";
      case "SHIPPED":
        return "bg-indigo-100 text-indigo-800";
      case "OUT_FOR_DELIVERY":
        return "bg-orange-100 text-orange-800";
      case "DELIVERED":
        return "bg-green-100 text-green-800";
      case "CANCELLED":
      case "RETURNED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Create tracking steps based on order status
  const createTrackingSteps = (currentStatus: Order["status"]) => {
    const statuses = [
      "PENDING",
      "CONFIRMED",
      "PROCESSING",
      "SHIPPED",
      "OUT_FOR_DELIVERY",
      "DELIVERED",
    ];
    const currentIndex = statuses.indexOf(currentStatus);

    return [
      {
        id: "pending",
        name: "Order Placed",
        description: "Your order has been placed and is awaiting confirmation",
        status: currentIndex >= 0 ? "completed" : "pending",
        isCurrent: currentIndex === 0,
      },
      {
        id: "confirmed",
        name: "Order Confirmed",
        description: "Your order has been confirmed and is being prepared",
        status: currentIndex >= 1 ? "completed" : "pending",
        isCurrent: currentIndex === 1,
      },
      {
        id: "processing",
        name: "Processing",
        description: "Your order is being processed and prepared for shipment",
        status: currentIndex >= 2 ? "completed" : "pending",
        isCurrent: currentIndex === 2,
      },
      {
        id: "shipped",
        name: "Shipped",
        description: "Your order has been shipped and is on its way",
        status: currentIndex >= 3 ? "completed" : "pending",
        isCurrent: currentIndex === 3,
      },
      {
        id: "out_for_delivery",
        name: "Out for Delivery",
        description: "Your order is out for delivery",
        status: currentIndex >= 4 ? "completed" : "pending",
        isCurrent: currentIndex === 4,
      },
      {
        id: "delivered",
        name: "Delivered",
        description: "Your order has been delivered",
        status: currentIndex >= 5 ? "completed" : "pending",
        isCurrent: currentIndex === 5,
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Order Not Found
        </h2>
        <p className="text-gray-600 mb-4">
          {error ||
            "The order you're looking for doesn't exist or you don't have permission to view it."}
        </p>
        <button
          onClick={() => router.push("/orders")}
          className="text-blue-600 hover:text-blue-800 underline"
        >
          View All Orders
        </button>
      </div>
    );
  }

  const trackingSteps = createTrackingSteps(order.status);

  return (
    <div className="space-y-6">
      {/* Order Header */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(order.status)}
                <span>Order #{order.orderNumber}</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Placed on {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <Badge
              className={`mt-2 md:mt-0 ${getStatusBadgeColor(order.status)}`}
            >
              {order.status.replace(/_/g, " ")}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Tracking Number */}
            {order.trackingNumber && (
              <div>
                <h3 className="font-medium mb-2">Tracking Number</h3>
                <p className="text-lg font-mono bg-gray-100 p-2 rounded">
                  {order.trackingNumber}
                </p>
              </div>
            )}

            {/* Estimated Delivery */}
            {order.estimatedDeliveryDate && (
              <div>
                <h3 className="font-medium mb-2">Estimated Delivery</h3>
                <p className="text-lg">
                  {new Date(order.estimatedDeliveryDate).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tracking Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Order Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {trackingSteps.map((step, index) => (
              <div key={step.id} className="flex items-start space-x-4">
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    step.status === "completed"
                      ? "bg-green-500"
                      : step.isCurrent
                      ? "bg-blue-500"
                      : "bg-gray-300"
                  }`}
                >
                  {step.status === "completed" ? (
                    <CheckCircle className="h-5 w-5 text-white" />
                  ) : (
                    <div
                      className={`w-3 h-3 rounded-full ${
                        step.isCurrent ? "bg-white" : "bg-gray-500"
                      }`}
                    />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4
                      className={`font-medium ${
                        step.isCurrent
                          ? "text-blue-600"
                          : step.status === "completed"
                          ? "text-green-600"
                          : "text-gray-500"
                      }`}
                    >
                      {step.name}
                    </h4>
                    {step.isCurrent && (
                      <Badge variant="secondary">Current</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Details */}
      <Card>
        <CardHeader>
          <CardTitle>Order Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Items */}
          <div>
            <h3 className="font-medium mb-4">Items ({order.items.length})</h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center py-3 border-b last:border-b-0"
                >
                  <div className="flex items-center space-x-4">
                    {item.productImageUrl && (
                      <img
                        src={item.productImageUrl}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div>
                      <h4 className="font-medium">{item.productName}</h4>
                      {item.productDescription && (
                        <p className="text-sm text-gray-600 mt-1">
                          {item.productDescription}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.totalPrice.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      {item.discountPrice ? (
                        <>
                          <span className="line-through text-gray-400">
                            ${item.price.toFixed(2)}
                          </span>
                          <span className="text-green-600 ml-1">
                            ${item.discountPrice.toFixed(2)}
                          </span>
                          {" each"}
                        </>
                      ) : (
                        `$${item.price.toFixed(2)} each`
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Addresses and Payment */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium mb-2 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Shipping Address
              </h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <div
                  dangerouslySetInnerHTML={{
                    __html: order.shippingAddress.replace(/\n/g, "<br/>"),
                  }}
                />
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Payment Information</h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                <Badge variant="outline" className="mb-2">
                  {order.paymentMethod.replace(/_/g, " ")}
                </Badge>
                <p>
                  Status:{" "}
                  <span className="capitalize">
                    {order.paymentStatus.toLowerCase()}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Customer Notes */}
          {order.customerNotes && (
            <div>
              <h3 className="font-medium mb-2">Order Notes</h3>
              <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                {order.customerNotes}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="border-t pt-4">
            <h3 className="font-medium mb-4">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${order.subtotal.toFixed(2)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-${order.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping:</span>
                <span>${order.shippingAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-medium text-lg border-t pt-2 mt-2">
                <span>Total:</span>
                <span>${order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
