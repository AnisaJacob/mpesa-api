import React, { useState } from "react";
import PaymentForm from "./components/PaymentForm";
import PaymentStatus from "./components/PaymentStatus";
import PaymentHistory from "./components/PaymentHistory";
import B2CPaymentForm from "./components/B2CPaymentForm";
import B2BPaymentForm from "./components/B2BPaymentForm";
import AccountBalanceForm from "./components/AccountBalanceForm";
import QRCodeGenerator from "./components/QRCodeGenerator";
import TransactionReversal from "./components/TransactionReversal";
import {
  CreditCard,
  History,
  Smartphone,
  Send,
  Building2,
  Wallet,
  QrCode,
  RefreshCw,
} from "lucide-react";

function App() {
  const [activeTab, setActiveTab] = useState<
    "c2b" | "b2c" | "b2b" | "balance" | "qr" | "history" | "reversal"
  >("c2b");
  const [currentCheckoutRequestId, setCurrentCheckoutRequestId] =
    useState<string>("");
  const [currentConversationId, setCurrentConversationId] =
    useState<string>("");

  const handlePaymentInitiated = (checkoutRequestId: string) => {
    setCurrentCheckoutRequestId(checkoutRequestId);
  };

  const handleB2CPaymentInitiated = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleB2BPaymentInitiated = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleBalanceChecked = (conversationId: string) => {
    setCurrentConversationId(conversationId);
  };

  const handleQRGenerated = (qrCode: any) => {
    console.log("QR Code generated:", qrCode);
  };

  const handleCloseStatus = () => {
    setCurrentCheckoutRequestId("");
    setCurrentConversationId("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  M-Pesa Payment Gateway
                </h1>
                <p className="text-gray-600">
                  Secure payments with M-Pesa Daraja API
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">Sandbox Mode</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-4 overflow-x-auto">
            {/* Existing tabs */}
            <button
              onClick={() => setActiveTab("c2b")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "c2b"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              C2B Payment
            </button>
            <button
              onClick={() => setActiveTab("b2c")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "b2c"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Send className="w-4 h-4" />
              B2C Payment
            </button>
            <button
              onClick={() => setActiveTab("b2b")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "b2b"
                  ? "border-purple-500 text-purple-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Building2 className="w-4 h-4" />
              B2B Payment
            </button>
            <button
              onClick={() => setActiveTab("balance")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "balance"
                  ? "border-yellow-500 text-yellow-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <Wallet className="w-4 h-4" />
              Balance
            </button>
            <button
              onClick={() => setActiveTab("qr")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "qr"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <QrCode className="w-4 h-4" />
              QR Code
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "history"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
            {/* New Reversal tab */}
            <button
              onClick={() => setActiveTab("reversal")}
              className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === "reversal"
                  ? "border-red-500 text-red-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              Reversal
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentCheckoutRequestId || currentConversationId ? (
          <PaymentStatus
            checkoutRequestId={
              currentCheckoutRequestId || currentConversationId
            }
            onClose={handleCloseStatus}
          />
        ) : activeTab === "c2b" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                C2B Payment (STK Push)
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Customer to Business payment using STK Push. Customer pays from
                their M-Pesa account.
              </p>
            </div>
            <PaymentForm onPaymentInitiated={handlePaymentInitiated} />
          </div>
        ) : activeTab === "b2c" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                B2C Payment
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Business to Customer payment. Send money from your business
                account to customer's M-Pesa.
              </p>
            </div>
            <B2CPaymentForm onPaymentInitiated={handleB2CPaymentInitiated} />
          </div>
        ) : activeTab === "b2b" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                B2B Payment
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Business to Business payment. Transfer funds between business
                accounts.
              </p>
            </div>
            <B2BPaymentForm onPaymentInitiated={handleB2BPaymentInitiated} />
          </div>
        ) : activeTab === "balance" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Account Balance
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Check the account balance for your M-Pesa business account.
              </p>
            </div>
            <AccountBalanceForm onBalanceChecked={handleBalanceChecked} />
          </div>
        ) : activeTab === "qr" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                QR Code Generator
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Generate M-Pesa QR codes for easy payments. Customers can scan
                to pay.
              </p>
            </div>
            <QRCodeGenerator onQRGenerated={handleQRGenerated} />
          </div>
        ) : activeTab === "reversal" ? (
          <div className="space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-red-600 mb-4">
                Transaction Reversal
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Request a reversal for a previously made transaction.
              </p>
            </div>
            <TransactionReversal />
          </div>
        ) : (
          <PaymentHistory />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Smartphone className="w-5 h-5 text-green-600" />
              <span className="text-gray-600">
                Powered by M-Pesa Daraja API
              </span>
            </div>
            <p className="text-sm text-gray-500">
              This is a demonstration application. Use test credentials for
              sandbox mode.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
