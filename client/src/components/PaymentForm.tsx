import React, { useState } from "react";
import {
  CreditCard,
  Smartphone,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";

interface PaymentFormProps {
  onPaymentInitiated: (checkoutRequestId: string) => void;
}

const PaymentForm: React.FC<PaymentFormProps> = ({ onPaymentInitiated }) => {
  const [formData, setFormData] = useState({
    phoneNumber: "",
    amount: "",
    accountReference: "",
    transactionDesc: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const numbers = value.replace(/\D/g, "");

    // Handle different formats
    if (numbers.startsWith("254")) {
      return numbers;
    } else if (numbers.startsWith("0")) {
      return "254" + numbers.substring(1);
    } else if (numbers.length <= 9) {
      return "254" + numbers;
    }

    return numbers;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      phoneNumber: value,
    }));
  };

  const validateForm = () => {
    const { phoneNumber, amount, accountReference } = formData;

    if (!phoneNumber || !amount || !accountReference) {
      setError("Please fill in all required fields");
      return false;
    }

    const formattedPhone = formatPhoneNumber(phoneNumber);
    if (formattedPhone.length !== 12) {
      setError("Please enter a valid Kenyan phone number");
      return false;
    }

    if (parseFloat(amount) < 1) {
      setError("Amount must be at least 1 KSH");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      const formattedPhone = formatPhoneNumber(formData.phoneNumber);

      const response = await fetch(
        "https://pv6zd9-3000.csb.app/api/payments/initiate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: formattedPhone,
            amount: parseFloat(formData.amount),
            accountReference: formData.accountReference,
            transactionDesc: formData.transactionDesc || "Payment",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Payment initiated! Check your phone for M-Pesa prompt.");
        onPaymentInitiated(data.data.checkoutRequestId);

        // Reset form
        setFormData({
          phoneNumber: "",
          amount: "",
          accountReference: "",
          transactionDesc: "",
        });
      } else {
        setError(data.message || "Payment initiation failed");
      }
    } catch (error) {
      console.error("Payment error:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
          <Smartphone className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          M-Pesa Payment
        </h2>
        <p className="text-gray-600">Pay securely with M-Pesa</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="phoneNumber"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Phone Number *
          </label>
          <div className="relative">
            <input
              type="tel"
              id="phoneNumber"
              value={formData.phoneNumber}
              onChange={handlePhoneChange}
              placeholder="0712345678 or 254712345678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              required
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3">
              <span className="text-sm text-gray-500">🇰🇪</span>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="amount"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Amount (KSH) *
          </label>
          <div className="relative">
            <input
              type="number"
              id="amount"
              min="1"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: e.target.value }))
              }
              placeholder="100"
              className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
              required
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 font-medium">KSH</span>
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="accountReference"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Account Reference *
          </label>
          <input
            type="text"
            id="accountReference"
            value={formData.accountReference}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                accountReference: e.target.value,
              }))
            }
            placeholder="Invoice #12345"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
            required
          />
        </div>

        <div>
          <label
            htmlFor="transactionDesc"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Description (Optional)
          </label>
          <input
            type="text"
            id="transactionDesc"
            value={formData.transactionDesc}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                transactionDesc: e.target.value,
              }))
            }
            placeholder="Payment for services"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-colors"
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{success}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initiating Payment...
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5" />
              Pay with M-Pesa
            </>
          )}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-xs text-gray-500">Powered by M-Pesa Daraja API</p>
      </div>
    </div>
  );
};

export default PaymentForm;
