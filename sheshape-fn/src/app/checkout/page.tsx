// src/app/checkout/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Truck,
  CreditCard,
  Eye,
  Check,
  Shield,
  Lock,
  MapPin,
  Mail,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Loader,
} from "lucide-react";
import { toast } from "react-toastify";
import { useAuth } from "@/context/AuthContext";
import { cartService } from "@/services/cartService";
import {
  orderService,
  CheckoutRequest,
  Address,
  Order,
} from "@/services/orderService";

// FIXED: Define CartItem interface that matches your API structure
interface CartItem {
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
  // Optional product object for full product details
  product?: {
    id: number;
    name: string;
    images: Array<{
      id: number;
      imageUrl: string;
      isMain: boolean;
    }>;
  };
}

// FIXED: Define Cart interface that matches your API
interface Cart {
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

interface Step {
  id: "shipping" | "payment" | "review" | "success";
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface ShippingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  apartmentNumber?: string;
  sameAsBilling: boolean;
}

interface PaymentData {
  paymentMethod:
    | "CREDIT_CARD"
    | "DEBIT_CARD"
    | "PAYPAL"
    | "DIGITAL_WALLET"
    | "CASH_ON_DELIVERY";
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardHolderName: string;
  saveCard: boolean;
}

type SectionKey = "shipping" | "payment" | "review";

export default function CheckoutPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState<
    "shipping" | "payment" | "review" | "success"
  >("shipping");
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  const [expandedSections, setExpandedSections] = useState({
    shipping: true,
    payment: false,
    review: false,
  });

  const [shippingData, setShippingData] = useState<ShippingData>({
    firstName: "",
    lastName: "",
    email: user?.email || "",
    phone: "",
    street: "",
    city: "",
    state: "",
    zipCode: "",
    country: "US",
    apartmentNumber: "",
    sameAsBilling: true,
  });

  const [paymentData, setPaymentData] = useState<PaymentData>({
    paymentMethod: "CREDIT_CARD",
    cardNumber: "",
    expiryMonth: "",
    expiryYear: "",
    cvv: "",
    cardHolderName: "",
    saveCard: false,
  });

  // FIXED: Helper function to get product image with proper typing
  const getProductImage = (item: CartItem): string | undefined => {
    // First check if there's a direct productImage URL
    if (item.productImage) {
      return item.productImage;
    }

    // If there's a product object with images, use that
    if (item.product?.images && item.product.images.length > 0) {
      const mainImage = item.product.images.find(
        (img: { id: number; imageUrl: string; isMain: boolean }) => img.isMain
      );
      return mainImage?.imageUrl || item.product.images[0].imageUrl;
    }

    return undefined;
  };

  // FIXED: Helper function to get product name
  const getProductName = (item: CartItem): string => {
    return item.productName || item.product?.name || "Unknown Product";
  };

  const steps: Step[] = [
    { id: "shipping", name: "Shipping", icon: Truck },
    { id: "payment", name: "Payment", icon: CreditCard },
    { id: "review", name: "Review", icon: Eye },
    { id: "success", name: "Success", icon: Check },
  ];

  // Load cart data on component mount
  useEffect(() => {
    const loadCart = async () => {
      try {
        if (!user) {
          router.push("/auth/login");
          return;
        }

        const cartData = await cartService.getUserCart();
        if (!cartData || cartData.items.length === 0) {
          toast.error("Your cart is empty");
          router.push("/cart");
          return;
        }

        setCart(cartData);

        // Pre-fill user data if available
        if (user) {
          setShippingData((prev) => ({
            ...prev,
            email: user.email || "",
            firstName: user.profile?.firstName || "",
            lastName: user.profile?.lastName || "",
          }));
        }
      } catch (error) {
        console.error("Error loading cart:", error);
        toast.error("Failed to load cart data");
        router.push("/cart");
      } finally {
        setIsLoading(false);
      }
    };

    loadCart();
  }, [user, router]);

  const subtotal = cart?.subtotal || 0;
  const shippingCost = 9.99;
  const tax = subtotal * 0.08;
  const total = subtotal + shippingCost + tax;

  const toggleSection = (section: SectionKey) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const validateShippingData = (): boolean => {
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "street",
      "city",
      "state",
      "zipCode",
    ];

    for (const field of required) {
      if (!shippingData[field as keyof ShippingData]) {
        toast.error(
          `${field.replace(/([A-Z])/g, " $1").toLowerCase()} is required`
        );
        return false;
      }
    }

    if (!/\S+@\S+\.\S+/.test(shippingData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (!/^\+?[\d\s-()]+$/.test(shippingData.phone)) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  const validatePaymentData = (): boolean => {
    if (paymentData.paymentMethod === "CASH_ON_DELIVERY") {
      return true;
    }

    if (
      paymentData.paymentMethod === "CREDIT_CARD" ||
      paymentData.paymentMethod === "DEBIT_CARD"
    ) {
      if (
        !paymentData.cardNumber ||
        !paymentData.cardHolderName ||
        !paymentData.expiryMonth ||
        !paymentData.expiryYear ||
        !paymentData.cvv
      ) {
        toast.error("Please fill in all payment details");
        return false;
      }

      if (!/^\d{16}$/.test(paymentData.cardNumber.replace(/\s/g, ""))) {
        toast.error("Please enter a valid 16-digit card number");
        return false;
      }

      if (!/^\d{3,4}$/.test(paymentData.cvv)) {
        toast.error("Please enter a valid CVV");
        return false;
      }
    }

    return true;
  };

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateShippingData()) {
      return;
    }

    setCompletedSteps((prev) => [
      ...prev.filter((step) => step !== "shipping"),
      "shipping",
    ]);
    setCurrentStep("payment");
    setExpandedSections({
      shipping: false,
      payment: true,
      review: false,
    });
  };

  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePaymentData()) {
      return;
    }

    setCompletedSteps((prev) => [
      ...prev.filter((step) => step !== "payment"),
      "payment",
    ]);
    setCurrentStep("review");
    setExpandedSections({
      shipping: false,
      payment: false,
      review: true,
    });
  };

  const handlePlaceOrder = async () => {
    if (!cart || !user) {
      toast.error("Unable to place order. Please try again.");
      return;
    }

    setIsPlacingOrder(true);

    try {
      // Prepare the address data
      const shippingAddress: Address = {
        firstName: shippingData.firstName,
        lastName: shippingData.lastName,
        phone: shippingData.phone,
        street:
          shippingData.street +
          (shippingData.apartmentNumber
            ? `, ${shippingData.apartmentNumber}`
            : ""),
        city: shippingData.city,
        state: shippingData.state,
        zipCode: shippingData.zipCode,
        country: shippingData.country,
      };

      const billingAddress = shippingData.sameAsBilling
        ? shippingAddress
        : {
            // Add billing address logic if different from shipping
            ...shippingAddress,
          };

      // Prepare payment details (only include for card payments)
      const paymentDetails =
        paymentData.paymentMethod === "CREDIT_CARD" ||
        paymentData.paymentMethod === "DEBIT_CARD"
          ? {
              cardNumber: paymentData.cardNumber.replace(/\s/g, ""),
              cardHolderName: paymentData.cardHolderName,
              expiryMonth: parseInt(paymentData.expiryMonth),
              expiryYear: parseInt(paymentData.expiryYear),
              cvv: paymentData.cvv,
            }
          : undefined;

      // Prepare the checkout request
      const checkoutRequest: CheckoutRequest = {
        paymentMethod: paymentData.paymentMethod,
        shippingAddress,
        billingAddress,
        notes: "", // You can add a notes field to the form if needed
        paymentDetails,
      };

      // Place the order via API
      const createdOrder = await orderService.checkout(checkoutRequest);

      setOrder(createdOrder);
      setCompletedSteps((prev) => [...prev, "review"]);
      setCurrentStep("success");

      toast.success(
        `Order placed successfully! Order #${createdOrder.orderNumber}`
      );
    } catch (error: any) {
      console.error("Error placing order:", error);

      let errorMessage = "Failed to place order. Please try again.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = "Invalid order data. Please check your information.";
      } else if (error.response?.status === 401) {
        errorMessage = "Please log in to place an order.";
        router.push("/auth/login");
        return;
      }

      toast.error(errorMessage);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (currentStep === "success" && order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-gray-600 mb-4">
            Thank you for your order. We'll send you a confirmation email
            shortly.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Order Number</p>
            <p className="text-lg font-semibold text-gray-900">
              {order.orderNumber}
            </p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => router.push("/orders")}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View Order Details
            </button>
            <button
              onClick={() => router.push("/")}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
            <div className="flex items-center space-x-4">
              <Shield className="h-5 w-5 text-green-600" />
              <span className="text-sm text-gray-600">Secure Checkout</span>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isCompleted = completedSteps.includes(step.id);
              const isCurrent = currentStep === step.id;
              const IconComponent = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full ${
                      isCompleted
                        ? "bg-green-600 text-white"
                        : isCurrent
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <IconComponent className="h-5 w-5" />
                    )}
                  </div>
                  <span
                    className={`ml-2 text-sm font-medium ${
                      isCompleted || isCurrent
                        ? "text-gray-900"
                        : "text-gray-500"
                    }`}
                  >
                    {step.name}
                  </span>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-4 ${
                        isCompleted ? "bg-green-600" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="lg:grid lg:grid-cols-3 lg:gap-12">
          {/* Left Column - Form Steps */}
          <div className="lg:col-span-2 space-y-6">
            {/* Shipping Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleSection("shipping")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Truck className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Shipping Information
                    </h3>
                    {completedSteps.includes("shipping") && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              {expandedSections.shipping && (
                <div className="px-6 pb-6">
                  <form onSubmit={handleShippingSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingData.firstName}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              firstName: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingData.lastName}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              lastName: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email Address *
                        </label>
                        <input
                          type="email"
                          required
                          value={shippingData.email}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              email: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          required
                          value={shippingData.phone}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              phone: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={shippingData.street}
                        onChange={(e) =>
                          setShippingData((prev) => ({
                            ...prev,
                            street: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Apartment, suite, etc. (optional)
                      </label>
                      <input
                        type="text"
                        value={shippingData.apartmentNumber}
                        onChange={(e) =>
                          setShippingData((prev) => ({
                            ...prev,
                            apartmentNumber: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingData.city}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingData.state}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={shippingData.zipCode}
                          onChange={(e) =>
                            setShippingData((prev) => ({
                              ...prev,
                              zipCode: e.target.value,
                            }))
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Continue to Payment
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Payment Information */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleSection("payment")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Payment Information
                    </h3>
                    {completedSteps.includes("payment") && (
                      <Check className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                </div>
              </div>

              {expandedSections.payment && (
                <div className="px-6 pb-6">
                  <form onSubmit={handlePaymentSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="space-y-2">
                        {[
                          { value: "CREDIT_CARD", label: "Credit Card" },
                          { value: "DEBIT_CARD", label: "Debit Card" },
                          { value: "PAYPAL", label: "PayPal" },
                          {
                            value: "CASH_ON_DELIVERY",
                            label: "Cash on Delivery",
                          },
                        ].map((method) => (
                          <label
                            key={method.value}
                            className="flex items-center"
                          >
                            <input
                              type="radio"
                              name="paymentMethod"
                              value={method.value}
                              checked={
                                paymentData.paymentMethod === method.value
                              }
                              onChange={(e) =>
                                setPaymentData((prev) => ({
                                  ...prev,
                                  paymentMethod: e.target.value as any,
                                }))
                              }
                              className="mr-2"
                            />
                            <span className="text-sm text-gray-700">
                              {method.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {(paymentData.paymentMethod === "CREDIT_CARD" ||
                      paymentData.paymentMethod === "DEBIT_CARD") && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Holder Name *
                          </label>
                          <input
                            type="text"
                            required
                            value={paymentData.cardHolderName}
                            onChange={(e) =>
                              setPaymentData((prev) => ({
                                ...prev,
                                cardHolderName: e.target.value,
                              }))
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Card Number *
                          </label>
                          <input
                            type="text"
                            required
                            placeholder="1234 5678 9012 3456"
                            value={paymentData.cardNumber}
                            onChange={(e) => {
                              // Format card number with spaces
                              const value = e.target.value
                                .replace(/\s/g, "")
                                .replace(/(.{4})/g, "$1 ")
                                .trim();
                              setPaymentData((prev) => ({
                                ...prev,
                                cardNumber: value,
                              }));
                            }}
                            maxLength={19}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Year *
                            </label>
                            <select
                              required
                              value={paymentData.expiryYear}
                              onChange={(e) =>
                                setPaymentData((prev) => ({
                                  ...prev,
                                  expiryYear: e.target.value,
                                }))
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">YYYY</option>
                              {Array.from({ length: 10 }, (_, i) => (
                                <option
                                  key={i}
                                  value={String(new Date().getFullYear() + i)}
                                >
                                  {new Date().getFullYear() + i}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              CVV *
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="123"
                              value={paymentData.cvv}
                              onChange={(e) =>
                                setPaymentData((prev) => ({
                                  ...prev,
                                  cvv: e.target.value,
                                }))
                              }
                              maxLength={4}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      Continue to Review
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Review Order */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div
                className="p-6 cursor-pointer"
                onClick={() => toggleSection("review")}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Eye className="h-6 w-6 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      Review Order
                    </h3>
                  </div>
                </div>
              </div>

              {expandedSections.review && (
                <div className="px-6 pb-6 space-y-6">
                  {/* Shipping Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Shipping Address
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">
                        {shippingData.firstName} {shippingData.lastName}
                      </p>
                      <p>{shippingData.street}</p>
                      {shippingData.apartmentNumber && (
                        <p>{shippingData.apartmentNumber}</p>
                      )}
                      <p>
                        {shippingData.city}, {shippingData.state}{" "}
                        {shippingData.zipCode}
                      </p>
                      <p>{shippingData.country}</p>
                      <p className="mt-2 text-gray-600">
                        Phone: {shippingData.phone}
                      </p>
                      <p className="text-gray-600">
                        Email: {shippingData.email}
                      </p>
                    </div>
                  </div>

                  {/* Payment Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Payment Method
                    </h4>
                    <div className="p-4 bg-gray-50 rounded-lg text-sm">
                      <p className="font-medium">
                        {paymentData.paymentMethod === "CREDIT_CARD" &&
                          "Credit Card"}
                        {paymentData.paymentMethod === "DEBIT_CARD" &&
                          "Debit Card"}
                        {paymentData.paymentMethod === "PAYPAL" && "PayPal"}
                        {paymentData.paymentMethod === "CASH_ON_DELIVERY" &&
                          "Cash on Delivery"}
                      </p>
                      {(paymentData.paymentMethod === "CREDIT_CARD" ||
                        paymentData.paymentMethod === "DEBIT_CARD") && (
                        <p className="text-gray-600">
                          **** **** **** {paymentData.cardNumber.slice(-4)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Items - FIXED */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">
                      Order Items
                    </h4>
                    <div className="space-y-3">
                      {cart?.items.map((item) => {
                        const productImage = getProductImage(item);
                        const productName = getProductName(item);

                        return (
                          <div
                            key={item.id}
                            className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                          >
                            {productImage ? (
                              <img
                                src={productImage}
                                alt={productName}
                                className="w-12 h-12 object-cover rounded"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <span className="text-gray-400 text-xs">
                                  No Image
                                </span>
                              </div>
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">
                                {productName}
                              </p>
                              <p className="text-xs text-gray-600">
                                Qty: {item.quantity} × $
                                {item.unitPrice.toFixed(2)}
                              </p>
                            </div>
                            <p className="font-medium text-gray-900">
                              ${item.totalPrice.toFixed(2)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Terms and Place Order */}
                  <div className="border-t pt-4">
                    <div className="flex items-start space-x-2 mb-4">
                      <input
                        type="checkbox"
                        id="terms"
                        required
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5"
                      />
                      <label htmlFor="terms" className="text-sm text-gray-600">
                        I agree to the{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          Terms of Service
                        </a>{" "}
                        and{" "}
                        <a href="#" className="text-blue-600 hover:underline">
                          Privacy Policy
                        </a>
                      </label>
                    </div>

                    <button
                      onClick={handlePlaceOrder}
                      disabled={isPlacingOrder}
                      className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        {isPlacingOrder ? (
                          <>
                            <Loader className="h-5 w-5 animate-spin" />
                            <span>Processing Order...</span>
                          </>
                        ) : (
                          <>
                            <Lock className="h-5 w-5" />
                            <span>Place Order - ${total.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border sticky top-8">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Order Summary
                </h3>

                {/* Items - FIXED */}
                <div className="space-y-3 mb-4">
                  {cart?.items.map((item) => {
                    const productImage = getProductImage(item);
                    const productName = getProductName(item);

                    return (
                      <div
                        key={item.id}
                        className="flex items-center space-x-3"
                      >
                        <div className="relative">
                          {productImage ? (
                            <img
                              src={productImage}
                              alt={productName}
                              className="w-12 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                              <span className="text-gray-400 text-xs">
                                No Image
                              </span>
                            </div>
                          )}
                          <span className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {productName}
                          </p>
                          <p className="text-sm text-gray-500">
                            ${item.unitPrice.toFixed(2)} each
                          </p>
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          ${item.totalPrice.toFixed(2)}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Pricing Breakdown */}
                <div className="border-t pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-gray-900">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="text-gray-900">
                      ${shippingCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tax</span>
                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span className="text-gray-900">Total</span>
                    <span className="text-gray-900">${total.toFixed(2)}</span>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mt-6 flex items-center space-x-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Your payment information is secure</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
