// src/components/checkout/OrderSuccess.tsx
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Order } from "@/services/orderService";
import { formatPrice } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  Package,
  Truck,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Share2,
  ArrowLeft,
  Eye,
  Copy,
  CheckCheck,
} from "lucide-react";
import { toast } from "react-toastify";

interface OrderSuccessProps {
  order: Order;
  className?: string;
}

export function OrderSuccess({ order, className }: OrderSuccessProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopyOrderNumber = async () => {
    try {
      await navigator.clipboard.writeText(order.orderNumber);
      setCopied(true);
      toast.success("Order number copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy order number");
    }
  };

  const handleShareOrder = async () => {
    const shareText = `My order #${
      order.orderNumber
    } has been placed successfully! Total: ${formatPrice(order.totalAmount)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Order Confirmation",
          text: shareText,
          url: window.location.origin + `/orders/${order.id}`,
        });
      } catch (error) {
        // User cancelled sharing
      }
    } else {
      // Fallback to copying to clipboard
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success("Order details copied to clipboard!");
      } catch (error) {
        toast.error("Failed to share order details");
      }
    }
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 space-y-8 ${className}`}>
      {/* Success Header */}
      <div className="text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Order Placed Successfully! 🎉
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Thank you for your order! We've received your order and will process
          it shortly.
        </p>

        {/* Order Number */}
        <div className="flex items-center justify-center gap-2 mb-4">
          <span className="text-sm font-medium text-gray-700">
            Order Number:
          </span>
          <code className="bg-gray-100 px-3 py-1 rounded font-mono text-sm">
            {order.orderNumber}
          </code>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyOrderNumber}
            className="h-8 w-8 p-0"
          >
            {copied ? (
              <CheckCheck className="h-4 w-4 text-green-600" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild className="bg-pink-600 hover:bg-pink-700">
            <Link href="/orders">
              <Eye className="h-4 w-4 mr-2" />
              View All Orders
            </Link>
          </Button>
          <Button variant="outline" onClick={handleShareOrder}>
            <Share2 className="h-4 w-4 mr-2" />
            Share Order
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Continue Shopping
            </Link>
          </Button>
        </div>
      </div>

      <Separator />

      {/* Order Overview */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Package className="h-5 w-5 text-blue-600" />
              Order Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Badge variant="outline" className="mb-2">
              {order.status.replace(/_/g, " ")}
            </Badge>
            <p className="text-sm text-gray-600">
              Your order is being prepared for shipment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Truck className="h-5 w-5 text-green-600" />
              Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm">
              {order.estimatedDeliveryDate
                ? new Date(order.estimatedDeliveryDate).toLocaleDateString()
                : "3-5 business days"}
            </p>
            <p className="text-sm text-gray-600">Estimated delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5 text-purple-600" />
              Confirmation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium text-sm">
              {order.userEmail || "Email sent"}
            </p>
            <p className="text-sm text-gray-600">Confirmation email sent</p>
          </CardContent>
        </Card>
      </div>

      {/* Shipping Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Shipping Address
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {order.shippingAddress}
            </div>
          </div>

          {order.customerNotes && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Delivery Notes:
              </p>
              <p className="text-sm text-gray-600 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                {order.customerNotes}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Items */}
      <Card>
        <CardHeader>
          <CardTitle>Order Items ({order.items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center space-x-4 pb-4 border-b last:border-0 last:pb-0"
              >
                {/* Product Image */}
                <div className="relative h-16 w-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                  {item.productImageUrl ? (
                    <img
                      src={item.productImageUrl}
                      alt={item.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">
                    {item.productName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-sm text-gray-600">
                    {item.discountPrice && item.discountPrice < item.price ? (
                      <>
                        <span className="line-through text-gray-400">
                          {formatPrice(item.price)}
                        </span>
                        <span className="text-green-600 ml-1">
                          {formatPrice(item.discountPrice)}
                        </span>
                        {" each"}
                      </>
                    ) : (
                      `${formatPrice(item.price)} each`
                    )}
                  </p>
                </div>

                {/* Total Price */}
                <div className="text-right">
                  <p className="font-medium text-gray-900">
                    {formatPrice(item.totalPrice)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Order Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Shipping:</span>
              <span>{formatPrice(order.shippingAmount)}</span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount:</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span>Tax:</span>
              <span>{formatPrice(order.taxAmount)}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold text-lg">
              <span>Total:</span>
              <span>{formatPrice(order.totalAmount)}</span>
            </div>
          </div>

          {/* Payment Info */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="font-medium text-gray-900 mb-2">
              Payment Information
            </h4>
            <div className="text-sm text-gray-600">
              <div className="flex items-center justify-between mb-1">
                <span>Payment Method:</span>
                <Badge variant="outline">
                  {order.paymentMethod.replace(/_/g, " ")}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Payment Status:</span>
                <Badge
                  variant={
                    order.paymentStatus === "COMPLETED"
                      ? "default"
                      : "secondary"
                  }
                  className={
                    order.paymentStatus === "COMPLETED"
                      ? "bg-green-100 text-green-800"
                      : ""
                  }
                >
                  {order.paymentStatus.replace(/_/g, " ")}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle>What's Next?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">1</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">
                  Order Confirmation
                </h4>
                <p className="text-sm text-gray-600">
                  You'll receive an email confirmation shortly with your order
                  details.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">2</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Processing</h4>
                <p className="text-sm text-gray-600">
                  We'll prepare your order and update you once it's ready for
                  shipment.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-xs font-medium text-blue-600">3</span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Shipping Updates</h4>
                <p className="text-sm text-gray-600">
                  You'll receive tracking information once your order ships.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support */}
      <div className="text-center p-6 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-2">Need Help?</h3>
        <p className="text-sm text-gray-600 mb-4">
          If you have any questions about your order, don't hesitate to contact
          us.
        </p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/support">Contact Support</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/faq">View FAQ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
