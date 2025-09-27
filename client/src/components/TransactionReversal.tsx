import React, { useState } from "react";

interface TransactionReversalProps {
  onSuccess?: () => void;
}

const TransactionReversal: React.FC<TransactionReversalProps> = ({
  onSuccess,
}) => {
  const [transactionId, setTransactionId] = useState("");
  const [amount, setAmount] = useState("");
  const [receiverParty, setReceiverParty] = useState("174379");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleReverse = async () => {
    setLoading(true);
    setError("");
    setSuccess("");

    // Validate inputs
    if (!transactionId.trim()) {
      setError("Transaction ID is required.");
      setLoading(false);
      return;
    }
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError("Please enter a valid amount.");
      setLoading(false);
      return;
    }
    if (!receiverParty.trim()) {
      setError("Receiver party is required.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "https://7qvlz9-3000.csb.app/api/payments/transaction-reversal",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            transactionId,
            amount: Number(amount),
            receiverParty,
            remarks: "Reversal requested by user",
            occasion: "User initiated reversal",
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        setSuccess("Reversal requested successfully.");
        setTransactionId("");
        setAmount("");
        setReceiverParty("");
        if (onSuccess) onSuccess();
      } else {
        setError(data.message || "Failed to reverse transaction");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 max-w-md mx-auto">
      <h3 className="text-lg font-semibold mb-4">Reverse Transaction</h3>

      <label className="block mb-2 font-medium">
        Transaction ID
        <input
          type="text"
          value={transactionId}
          onChange={(e) => setTransactionId(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1"
          placeholder="Enter Transaction ID"
        />
      </label>

      <label className="block mb-2 font-medium">
        Amount (KES)
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1"
          placeholder="Enter Amount"
        />
      </label>

      <label className="block mb-2 font-medium">
        Receiver Party
        <input
          type="text"
          value={receiverParty}
          onChange={(e) => setReceiverParty(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded mt-1"
          placeholder="Enter Receiver Party"
        />
      </label>

      {error && (
        <div className="text-red-600 mt-3 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="text-green-600 mt-3 text-sm font-medium">{success}</div>
      )}

      <button
        onClick={handleReverse}
        disabled={loading}
        className="mt-5 w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
      >
        {loading ? "Reversing..." : "Request Reversal"}
      </button>
    </div>
  );
};

export default TransactionReversal;
