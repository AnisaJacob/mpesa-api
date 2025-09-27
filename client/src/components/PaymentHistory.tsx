import React, { useState, useEffect } from "react";
import {
  CircleCheck as CheckCircle,
  CircleX,
  Clock,
  RefreshCw,
  History,
} from "lucide-react";

interface Reversal {
  id: string;
  conversationId: string;
  originatorConversationId: string;
  transactionId: string;
  amount: number;
  receiverParty: string;
  remarks: string;
  occasion?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface Payment {
  id: string;
  checkoutRequestId: string;
  amount: number;
  phoneNumber: string;
  accountReference: string;
  transactionDesc: string;
  status: string;
  mpesaReceiptNumber?: string;
  transactionDate?: string;
  resultDesc?: string;
  createdAt: string;
  reversal?: Reversal | null;
}

const PaymentHistory: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchPayments = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "https://7qvlz9-3000.csb.app/api/payments/history"
      );
      const data = await response.json();

      if (data.success) {
        setPayments(data.data ?? []);
      } else {
        setError(data.message || "Failed to fetch payment history");
      }
    } catch (e) {
      console.error("Fetch payments error:", e);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case "FAILED":
        return <CircleX className="w-5 h-5 text-red-500" />;
      case "PENDING":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "text-green-600 bg-green-50";
      case "FAILED":
        return "text-red-600 bg-red-50";
      case "PENDING":
        return "text-yellow-600 bg-yellow-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
    }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment history...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center">
          <CircleX className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchPayments}
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
    <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-100 rounded-lg">
            <History className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Payment History</h2>
        </div>
        <button
          onClick={fetchPayments}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </header>

      {payments.length === 0 ? (
        <div className="text-center py-12">
          <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No Payments Yet
          </h3>
          <p className="text-gray-600">Your payment history will appear here</p>
        </div>
      ) : (
        <section className="space-y-4">
          {payments.map((payment) => (
            <article
              key={payment.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(payment.status)}
                  <div>
                    <h4 className="font-semibold text-gray-900">
                      {formatAmount(payment.amount)}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {payment.accountReference}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      payment.status
                    )}`}
                  >
                    {payment.status}
                  </span>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDate(payment.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Phone Number</span>
                  <p className="font-medium">{payment.phoneNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Description</span>
                  <p className="font-medium">{payment.transactionDesc}</p>
                </div>
                {payment.mpesaReceiptNumber && (
                  <div>
                    <span className="text-gray-500">M-Pesa Receipt</span>
                    <p className="font-mono text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                      {payment.mpesaReceiptNumber}
                    </p>
                  </div>
                )}
              </div>

              {payment.resultDesc && (
                <p className="mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600 italic">
                  {payment.resultDesc}
                </p>
              )}

              {payment.reversal && (
                <section className="mt-4 p-3 border border-yellow-300 rounded bg-yellow-50 text-yellow-800">
                  <h5 className="font-semibold mb-1">Reversal Details</h5>
                  <p>
                    <strong>Amount:</strong>{" "}
                    {formatAmount(payment.reversal.amount)}
                  </p>
                  <p>
                    <strong>Receiver:</strong> {payment.reversal.receiverParty}
                  </p>
                  <p>
                    <strong>Status:</strong> {payment.reversal.status}
                  </p>
                  <p>
                    <strong>Remarks:</strong> {payment.reversal.remarks}
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Requested on {formatDate(payment.reversal.createdAt)}
                  </p>
                </section>
              )}
            </article>
          ))}
        </section>
      )}
    </div>
  );
};

export default PaymentHistory;
