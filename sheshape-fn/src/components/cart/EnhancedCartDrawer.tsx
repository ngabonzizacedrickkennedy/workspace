// src/components/cart/EnhancedCartDrawer.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useEnhancedCart } from "@/context/EnhancedCartContext";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Minus,
  X,
  ShoppingBag,
  ShoppingCart,
  ArrowRight,
  Trash2,
  AlertCircle,
  Package,
  CreditCard,
} from "lucide-react";
import { toast } from "react-toastify";

interface EnhancedCartDrawerProps {
  children?: React.ReactNode;
  className?: string;
}

export function EnhancedCartDrawer({
  children,
  className,
}: EnhancedCartDrawerProps) {
  const [updatingItemId, setUpdatingItemId] = useState<number | null>(null);
  const [itemToRemove, setItemToRemove] = useState<number | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    cart,
    isLoading,
    isCartOpen,
    totalItems,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    toggleCart,
  } = useEnhancedCart();

  // Handle quantity changes with loading state
  const handleQuantityChange = async (
    productId: number,
    newQuantity: number
  ) => {
    if (newQuantity < 1) {
      setItemToRemove(productId);
      return;
    }

    setUpdatingItemId(productId);
    try {
      await updateQuantity(productId, newQuantity);
    } catch (error) {
      console.error("Failed to update quantity:", error);
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Handle item removal with confirmation
  const handleRemoveItem = async (productId: number) => {
    try {
      await removeItem(productId);
      setItemToRemove(null);
    } catch (error) {
      console.error("Failed to remove item:", error);
      toast.error("Failed to remove item from cart");
    }
  };

  // Handle clear cart
  const handleClearCart = async () => {
    try {
      await clearCart();
      setShowClearConfirm(false);
      toast.success("Cart cleared successfully");
    } catch (error) {
      console.error("Failed to clear cart:", error);
      toast.error("Failed to clear cart");
    }
  };

  // Handle checkout navigation
  const handleCheckout = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to proceed with checkout");
      router.push("/login");
      return;
    }

    if (!cart || cart.items.length === 0) {
      toast.warning("Your cart is empty");
      return;
    }

    try {
      toggleCart(); // Close the cart drawer
      router.push("/checkout");
    } catch (error) {
      console.error("Navigation error:", error);
      toast.error("Failed to navigate to checkout");
    }
  };

  if (!isAuthenticated) {
    return (
      <Sheet open={isCartOpen} onOpenChange={toggleCart}>
        <SheetTrigger asChild>
          {children || (
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
            </Button>
          )}
        </SheetTrigger>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Shopping Cart</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <ShoppingBag className="h-12 w-12 text-neutral-400" />
            <div>
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Sign In Required
              </h3>
              <p className="text-neutral-600 mb-4">
                Please sign in to view your cart and make purchases.
              </p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Sign In
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={toggleCart}>
        <SheetTrigger asChild>
          {children || (
            <Button variant="outline" size="sm" className="relative">
              <ShoppingCart className="h-4 w-4" />
              {totalItems > 0 && (
                <Badge
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                >
                  {totalItems > 99 ? "99+" : totalItems}
                </Badge>
              )}
            </Button>
          )}
        </SheetTrigger>

        <SheetContent
          className={`w-full sm:max-w-lg flex flex-col h-full ${className}`}
        >
          <SheetHeader className="pb-4">
            <SheetTitle className="flex items-center justify-between">
              <span>Shopping Cart ({totalItems})</span>
              {cart && cart.items.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowClearConfirm(true)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </SheetTitle>
          </SheetHeader>

          {/* Loading State */}
          {isLoading && !cart && (
            <div className="flex items-center justify-center flex-1">
              <LoadingSpinner />
            </div>
          )}

          {/* Empty Cart */}
          {!isLoading && (!cart || cart.items.length === 0) && (
            <div className="flex flex-col items-center justify-center flex-1 text-center space-y-4">
              <ShoppingBag className="h-16 w-16 text-neutral-400" />
              <div>
                <h3 className="text-lg font-medium text-neutral-900 mb-2">
                  Your cart is empty
                </h3>
                <p className="text-neutral-600 mb-4">
                  Add some items to get started!
                </p>
                <Button onClick={toggleCart} asChild className="w-full">
                  <Link href="/shop">Start Shopping</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Cart Items */}
          {cart && cart.items.length > 0 && (
            <>
              <div className="flex-1 overflow-y-auto py-4">
                <div className="space-y-4 pr-6">
                  {cart.items.map((item) => (
                    <div
                      key={item.productId} // ✅ FIXED: Use productId instead of item.product.id
                      className="flex items-start space-x-4 p-4 border rounded-lg relative"
                    >
                      {/* Loading Overlay */}
                      {updatingItemId === item.productId && ( // ✅ FIXED: Use productId
                        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg z-10">
                          <LoadingSpinner size="sm" />
                        </div>
                      )}

                      {/* Product Image */}
                      <div className="relative h-16 w-16 rounded-md overflow-hidden bg-neutral-100 flex-shrink-0">
                        {item.productImage ? ( // ✅ FIXED: Use productImage instead of item.product.images
                          <Image
                            src={item.productImage}
                            alt={item.productName} // ✅ FIXED: Use productName
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <Package className="h-6 w-6 text-neutral-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-neutral-900 line-clamp-2 mb-1">
                          {item.productName} {/* ✅ FIXED: Use productName */}
                        </h4>

                        <div className="flex items-center justify-between mb-2">
                          <div className="text-sm text-neutral-600">
                            <span>
                              {formatPrice(item.unitPrice)}{" "}
                              {/* ✅ FIXED: Use unitPrice */}
                            </span>
                          </div>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-md">
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId, // ✅ FIXED: Use productId
                                  item.quantity - 1
                                )
                              }
                              disabled={
                                updatingItemId === item.productId || // ✅ FIXED: Use productId
                                item.quantity <= 1
                              }
                              className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 py-1 text-sm font-medium min-w-[3rem] text-center">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() =>
                                handleQuantityChange(
                                  item.productId, // ✅ FIXED: Use productId
                                  item.quantity + 1
                                )
                              }
                              disabled={
                                updatingItemId === item.productId || // ✅ FIXED: Use productId
                                Boolean(
                                  item.maxQuantity &&
                                    item.quantity >= item.maxQuantity
                                ) // ✅ FIXED: Convert to boolean
                              }
                              className="p-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setItemToRemove(item.productId)} // ✅ FIXED: Use productId
                            disabled={updatingItemId === item.productId} // ✅ FIXED: Use productId
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>

                        {/* Item Total */}
                        <div className="mt-2 text-right">
                          <span className="font-medium text-neutral-900">
                            {formatPrice(item.totalPrice)}{" "}
                            {/* ✅ FIXED: Use totalPrice */}
                          </span>
                        </div>

                        {/* Availability Warning */}
                        {!item.isAvailable && ( // ✅ FIXED: Use isAvailable
                          <div className="mt-2 flex items-center text-red-600 text-sm">
                            <AlertCircle className="h-4 w-4 mr-1" />
                            <span>Currently unavailable</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cart Summary */}
              <div className="border-t pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>
                  {cart.taxAmount && cart.taxAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Tax:</span>
                      <span>{formatPrice(cart.taxAmount)}</span>
                    </div>
                  )}
                  {cart.shippingAmount && cart.shippingAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Shipping:</span>
                      <span>{formatPrice(cart.shippingAmount)}</span>
                    </div>
                  )}
                  {cart.discountAmount && cart.discountAmount > 0 && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span>Discount:</span>
                      <span>-{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatPrice(totalPrice)}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <Button
                    onClick={handleCheckout}
                    className="w-full bg-pink-600 hover:bg-pink-700"
                    disabled={
                      isLoading || cart.items.some((item) => !item.isAvailable)
                    }
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  <Button
                    variant="outline"
                    onClick={toggleCart}
                    asChild
                    className="w-full"
                  >
                    <Link href="/shop">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Continue Shopping
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Remove Item Confirmation Dialog */}
      <AlertDialog
        open={itemToRemove !== null}
        onOpenChange={() => setItemToRemove(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this item from your cart?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToRemove && handleRemoveItem(itemToRemove)}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Clear Cart Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Cart</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove all items from your cart? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearCart}
              className="bg-red-600 hover:bg-red-700"
            >
              Clear Cart
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
