import React, { useState, useEffect } from "react";
import { CircleCheck as CheckCircle, Circle as XCircle, Clock, Loader as Loader2, RefreshCw } from "lucide-react";

interface Payment {
  id: string;
  checkoutRequestId: string;
  amount: number;
  phoneNumber: string;
  accountReference: string;
  status: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  resultDesc?: string;
  createdAt: string;
}

interface PaymentStatusProps {
  checkoutRequestId: string;
  onClose: () => void;
}

const PaymentStatus: React.FC<PaymentStatusProps> = ({
  checkoutRequestId,
  onClose,
}) => {
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rateLimited, setRateLimited] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // Start with 5 seconds

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-12 h-12 text-green-500" />;
      case "FAILED":
        return <XCircle className="w-12 h-12 text-red-500" />;
      case "PENDING":
        return <Clock className="w-12 h-12 text-yellow-500" />;
      default:
        return <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50 border-green-200";
      case "FAILED":
        return "text-red-600 bg-red-50 border-red-200";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const checkPaymentStatus = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `https://pv6zd9-3000.csb.app/api/payments/status/${checkoutRequestId}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        setPayment(data.data);
        setRateLimited(data.data.rateLimited || false);
        
        // If rate limited, increase refresh interval to reduce API calls
        if (data.data.rateLimited) {
          setRefreshInterval(30000); // 30 seconds when rate limited
        } else if (data.data.status === "PENDING") {
          setRefreshInterval(10000); // 10 seconds for pending payments
        }
      } else {
        setError(data.message || "Failed to fetch payment status");
      }
    } catch (error) {
      console.error("Status check error:", error);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkPaymentStatus();

    // Auto-refresh for pending payments with dynamic interval
    const interval = setInterval(() => {
      if (payment?.status === "PENDING") {
        checkPaymentStatus();
      }
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [checkoutRequestId, payment?.status, refreshInterval]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading && !payment) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Checking Payment Status
          </h3>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    );
  }

  if (error && !payment) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={checkPaymentStatus}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-6">
        {getStatusIcon(payment?.status || "")}
        <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">
          Payment {payment?.status || "Processing"}
        </h3>

        <div
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
            payment?.status || ""
          )}`}
        >
          {payment?.status || "PROCESSING"}
        </div>
      </div>

      {payment && (
        <div className="space-y-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Amount</span>
                <p className="font-semibold text-lg text-green-600">
                  {formatAmount(payment.amount)}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Phone</span>
                <p className="font-medium">{payment.phoneNumber}</p>
              </div>
              <div>
                <span className="text-gray-500">Reference</span>
                <p className="font-medium">{payment.accountReference}</p>
              </div>
              <div>
                <span className="text-gray-500">Date</span>
                <p className="font-medium">{formatDate(payment.createdAt)}</p>
              </div>
            </div>
          </div>

          {payment.mpesaReceiptNumber && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <span className="text-green-700 text-sm font-medium">
                M-Pesa Receipt
              </span>
              <p className="text-green-800 font-mono text-sm">
                {payment.mpesaReceiptNumber}
              </p>
            </div>
          )}

          {payment.resultDesc && (
            <div className="bg-gray-50 rounded-lg p-3">
              <span className="text-gray-600 text-sm">
                {payment.resultDesc}
              </span>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {payment?.status === "PENDING" && (
          <button
            onClick={checkPaymentStatus}
            disabled={loading}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Refresh
          </button>
        )}

        <button
          onClick={onClose}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>

      {payment?.status === "PENDING" && (
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Status updates automatically every 5 seconds
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentStatus;
