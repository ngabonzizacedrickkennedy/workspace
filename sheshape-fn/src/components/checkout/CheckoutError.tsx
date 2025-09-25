// src/components/checkout/CheckoutError.tsx
import { AlertCircle, X } from "lucide-react";

interface CheckoutErrorProps {
  error: string;
  onClose: () => void;
}

export function CheckoutError({ error, onClose }: CheckoutErrorProps) {
  return (
    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start">
        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Order Failed</h3>
          <p className="mt-1 text-sm text-red-700">{error}</p>
        </div>
        <button
          onClick={onClose}
          className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
