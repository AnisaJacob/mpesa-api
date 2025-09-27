import { PrismaClient } from "@prisma/client";
import MpesaAPI from "../lib/mpesa.js";
import QRCode from "qrcode";

const prisma = new PrismaClient();
const mpesa = new MpesaAPI();

export const initiatePayment = async (req, res) => {
  try {
    const { phoneNumber, amount, accountReference, transactionDesc } = req.body;

    if (!phoneNumber || !amount || !accountReference) {
      return res.status(400).json({
        success: false,
        message: "Phone number, amount, and account reference are required",
      });
    }

    if (amount < 1) {
      return res.status(400).json({
        success: false,
        message: "Amount must be at least 1 KSH",
      });
    }

    const stkResponse = await mpesa.stkPush(
      phoneNumber,
      amount,
      accountReference,
      transactionDesc || "Payment"
    );

    if (stkResponse.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message: stkResponse.ResponseDescription || "STK Push failed",
      });
    }

    const payment = await prisma.payment.create({
      data: {
        checkoutRequestId: stkResponse.CheckoutRequestID,
        merchantRequestId: stkResponse.MerchantRequestID,
        amount: parseFloat(amount),
        phoneNumber,
        accountReference,
        transactionDesc: transactionDesc || "Payment",
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: stkResponse.ResponseDescription,
      data: {
        checkoutRequestId: payment.checkoutRequestId,
        merchantRequestId: payment.merchantRequestId,
      },
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const checkPaymentStatus = async (req, res) => {
  try {
    const { checkoutRequestId } = req.params;

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId },
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    const queryResponse = await mpesa.queryTransaction(checkoutRequestId);

    if (queryResponse.ResultCode !== undefined) {
      // parse resultCode from string to number
      const rc = parseInt(queryResponse.ResultCode, 10);
      const resultCodeValue = isNaN(rc) ? null : rc;

      const updatedPayment = await prisma.payment.update({
        where: { checkoutRequestId },
        data: {
          status: queryResponse.ResultCode === "0" ? "SUCCESS" : "FAILED",
          resultCode: resultCodeValue,
          resultDesc: queryResponse.ResultDesc,
        },
      });

      return res.json({
        success: true,
        data: updatedPayment,
      });
    }

    res.json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check payment status",
    });
  }
};

export const mpesaCallback = async (req, res) => {
  try {
    const { Body } = req.body;

    if (!Body || !Body.stkCallback) {
      return res.status(400).json({ message: "Invalid callback data" });
    }

    const { CheckoutRequestID, ResultCode, ResultDesc, CallbackMetadata } =
      Body.stkCallback;

    const payment = await prisma.payment.findUnique({
      where: { checkoutRequestId: CheckoutRequestID },
    });

    if (!payment) {
      console.log(
        "Payment not found for CheckoutRequestID:",
        CheckoutRequestID
      );
      return res.status(404).json({ message: "Payment not found" });
    }

    // parse ResultCode (which might be numeric or string)
    const rc = parseInt(ResultCode, 10);
    const resultCodeValue = isNaN(rc) ? null : rc;

    let updateData = {
      status: resultCodeValue === 0 ? "SUCCESS" : "FAILED",
      resultCode: resultCodeValue,
      resultDesc: ResultDesc,
    };

    if (resultCodeValue === 0 && CallbackMetadata && CallbackMetadata.Item) {
      const metadata = CallbackMetadata.Item;

      const receiptNumber = metadata.find(
        (item) => item.Name === "MpesaReceiptNumber"
      );
      const transactionDate = metadata.find(
        (item) => item.Name === "TransactionDate"
      );

      if (receiptNumber) {
        updateData.mpesaReceiptNumber = receiptNumber.Value;
      }

      if (transactionDate) {
        const timestamp = transactionDate.Value.toString();
        const year = parseInt(timestamp.substring(0, 4));
        const month = parseInt(timestamp.substring(4, 6)) - 1;
        const day = parseInt(timestamp.substring(6, 8));
        const hour = parseInt(timestamp.substring(8, 10));
        const minute = parseInt(timestamp.substring(10, 12));
        const second = parseInt(timestamp.substring(12, 14));

        updateData.transactionDate = new Date(
          year,
          month,
          day,
          hour,
          minute,
          second
        );
      }
    }

    await prisma.payment.update({
      where: { checkoutRequestId: CheckoutRequestID },
      data: updateData,
    });

    console.log(`Payment ${CheckoutRequestID} updated: ${ResultDesc}`);
    res.json({ message: "Callback processed successfully" });
  } catch (error) {
    console.error("M-Pesa callback error:", error);
    res.status(500).json({ message: "Callback processing failed" });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
    });
  }
};

export const b2cPayment = async (req, res) => {
  try {
    const { phoneNumber, amount, commandId, remarks, occasion } = req.body;

    if (!phoneNumber || !amount || !commandId || !remarks) {
      return res.status(400).json({
        success: false,
        message: "Phone number, amount, command ID, and remarks are required",
      });
    }

    const validCommands = [
      "SalaryPayment",
      "BusinessPayment",
      "PromotionPayment",
    ];
    if (!validCommands.includes(commandId)) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid command ID. Use: SalaryPayment, BusinessPayment, or PromotionPayment",
      });
    }

    const b2cResponse = await mpesa.b2cPayment(
      phoneNumber,
      amount,
      commandId,
      remarks,
      occasion
    );

    if (b2cResponse.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message: b2cResponse.ResponseDescription || "B2C Payment failed",
      });
    }

    const transaction = await prisma.b2CTransaction.create({
      data: {
        conversationId: b2cResponse.ConversationID,
        originatorConversationId: b2cResponse.OriginatorConversationID,
        amount: parseFloat(amount),
        phoneNumber,
        commandId,
        remarks,
        occasion: occasion || "",
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: b2cResponse.ResponseDescription,
      data: transaction,
    });
  } catch (error) {
    console.error("B2C Payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const b2bPayment = async (req, res) => {
  try {
    const { partyB, amount, commandId, accountReference, remarks } = req.body;

    if (!partyB || !amount || !commandId || !accountReference || !remarks) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    const validCommands = [
      "BusinessPayBill",
      "BusinessBuyGoods",
      "DisburseFundsToBusiness",
      "BusinessToBusinessTransfer",
    ];
    if (!validCommands.includes(commandId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid command ID",
      });
    }

    const b2bResponse = await mpesa.b2bPayment(
      partyB,
      amount,
      commandId,
      accountReference,
      remarks
    );

    if (b2bResponse.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message: b2bResponse.ResponseDescription || "B2B Payment failed",
      });
    }

    const transaction = await prisma.b2BTransaction.create({
      data: {
        conversationId: b2bResponse.ConversationID,
        originatorConversationId: b2bResponse.OriginatorConversationID,
        amount: parseFloat(amount),
        partyA: process.env.MPESA_BUSINESS_SHORT_CODE,
        partyB,
        commandId,
        accountReference,
        remarks,
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: b2bResponse.ResponseDescription,
      data: transaction,
    });
  } catch (error) {
    console.error("B2B Payment error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const checkAccountBalance = async (req, res) => {
  try {
    const { partyA, identifierType, remarks } = req.body;

    if (!partyA || !identifierType || !remarks) {
      return res.status(400).json({
        success: false,
        message: "Party A, identifier type, and remarks are required",
      });
    }

    const balanceResponse = await mpesa.accountBalance(
      partyA,
      identifierType,
      remarks
    );

    if (balanceResponse.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message:
          balanceResponse.ResponseDescription || "Account balance query failed",
      });
    }

    const balanceQuery = await prisma.accountBalance.create({
      data: {
        conversationId: balanceResponse.ConversationID,
        originatorConversationId: balanceResponse.OriginatorConversationID,
        partyA,
        identifierType,
        remarks,
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: balanceResponse.ResponseDescription,
      data: balanceQuery,
    });
  } catch (error) {
    console.error("Account balance error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const checkTransactionStatus = async (req, res) => {
  try {
    const { transactionId, partyA, identifierType, remarks, occasion } =
      req.body;

    if (!transactionId || !partyA || !identifierType || !remarks) {
      return res.status(400).json({
        success: false,
        message:
          "Transaction ID, Party A, identifier type, and remarks are required",
      });
    }

    const statusResponse = await mpesa.transactionStatus(
      transactionId,
      partyA,
      identifierType,
      remarks,
      occasion
    );

    if (statusResponse.ResponseCode !== "0") {
      return res.status(400).json({
        success: false,
        message:
          statusResponse.ResponseDescription ||
          "Transaction status query failed",
      });
    }

    const statusQuery = await prisma.transactionStatus.create({
      data: {
        conversationId: statusResponse.ConversationID,
        originatorConversationId: statusResponse.OriginatorConversationID,
        transactionId,
        partyA,
        identifierType,
        remarks,
        occasion: occasion || "",
        status: "PENDING",
      },
    });

    res.json({
      success: true,
      message: statusResponse.ResponseDescription,
      data: statusQuery,
    });
  } catch (error) {
    console.error("Transaction status error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const generateQRCode = async (req, res) => {
  try {
    const { merchantName, refNo, amount, trxCode, cpi, size } = req.body;

    if (!merchantName || !refNo || !trxCode) {
      return res.status(400).json({
        success: false,
        message:
          "Merchant name, reference number, and transaction code are required",
      });
    }

    const validTrxCodes = ["BG", "WA", "PB", "SM"];
    if (!validTrxCodes.includes(trxCode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid transaction code. Use: BG, WA, PB, or SM",
      });
    }

    const qrResponse = await mpesa.generateQRCode(
      merchantName,
      refNo,
      amount,
      trxCode,
      cpi
    );

    if (qrResponse.ResponseCode !== "00") {
      return res.status(400).json({
        success: false,
        message: qrResponse.ResponseDescription || "QR Code generation failed",
      });
    }

    const qrCodeImage = await QRCode.toDataURL(qrResponse.QRCode, {
      width: parseInt(size) || 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });

    const qrCode = await prisma.qRCode.create({
      data: {
        merchantName,
        refNo,
        amount: amount ? parseFloat(amount) : null,
        trxCode,
        cpi: cpi || "174379",
        size: size || "300",
        qrCodeData: qrCodeImage,
        status: "ACTIVE",
      },
    });

    res.json({
      success: true,
      message: "QR Code generated successfully",
      data: {
        ...qrCode,
        qrCodeString: qrResponse.QRCode,
      },
    });
  } catch (error) {
    console.error("QR Code generation error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Internal server error",
    });
  }
};

export const mpesaResult = async (req, res) => {
  try {
    const { Result } = req.body;

    if (!Result) {
      return res.status(400).json({ message: "Invalid result data" });
    }

    const {
      ConversationID,
      OriginatorConversationID,
      ResultCode,
      ResultDesc,
      ResultParameters,
    } = Result;

    // parse ResultCode
    const rc = parseInt(ResultCode, 10);
    const resultCodeValue = isNaN(rc) ? null : rc;

    const b2cTransaction = await prisma.b2CTransaction.findFirst({
      where: { conversationId: ConversationID },
    });

    if (b2cTransaction) {
      let updateData = {
        status: resultCodeValue === 0 ? "SUCCESS" : "FAILED",
        resultCode: resultCodeValue,
        resultDesc: ResultDesc,
      };

      if (
        resultCodeValue === 0 &&
        ResultParameters &&
        ResultParameters.ResultParameter
      ) {
        const transactionIdParam = ResultParameters.ResultParameter.find(
          (param) => param.Key === "TransactionID"
        );
        if (transactionIdParam) {
          updateData.transactionId = transactionIdParam.Value;
        }
      }

      await prisma.b2CTransaction.update({
        where: { id: b2cTransaction.id },
        data: updateData,
      });
    }

    const b2bTransaction = await prisma.b2BTransaction.findFirst({
      where: { conversationId: ConversationID },
    });

    if (b2bTransaction) {
      let updateData = {
        status: resultCodeValue === 0 ? "SUCCESS" : "FAILED",
        resultCode: resultCodeValue,
        resultDesc: ResultDesc,
      };

      if (
        resultCodeValue === 0 &&
        ResultParameters &&
        ResultParameters.ResultParameter
      ) {
        const transactionIdParam = ResultParameters.ResultParameter.find(
          (param) => param.Key === "TransactionID"
        );
        if (transactionIdParam) {
          updateData.transactionId = transactionIdParam.Value;
        }
      }

      await prisma.b2BTransaction.update({
        where: { id: b2bTransaction.id },
        data: updateData,
      });
    }

    const accountBalance = await prisma.accountBalance.findFirst({
      where: { conversationId: ConversationID },
    });

    if (accountBalance) {
      let updateData = {
        status: resultCodeValue === 0 ? "SUCCESS" : "FAILED",
        resultCode: resultCodeValue,
        resultDesc: ResultDesc,
      };

      if (
        resultCodeValue === 0 &&
        ResultParameters &&
        ResultParameters.ResultParameter
      ) {
        const balanceParam = ResultParameters.ResultParameter.find(
          (param) => param.Key === "AccountBalance"
        );
        if (balanceParam) {
          updateData.accountBalance = balanceParam.Value;
        }
      }

      await prisma.accountBalance.update({
        where: { id: accountBalance.id },
        data: updateData,
      });
    }

    const transactionStatus = await prisma.transactionStatus.findFirst({
      where: { conversationId: ConversationID },
    });

    if (transactionStatus) {
      let updateData = {
        status: resultCodeValue === 0 ? "SUCCESS" : "FAILED",
        resultCode: resultCodeValue,
        resultDesc: ResultDesc,
      };

      if (
        resultCodeValue === 0 &&
        ResultParameters &&
        ResultParameters.ResultParameter
      ) {
        const receiptNumberParam = ResultParameters.ResultParameter.find(
          (param) => param.Key === "ReceiptNo"
        );
        if (receiptNumberParam) {
          updateData.receiptNumber = receiptNumberParam.Value;
        }

        updateData.transactionData = JSON.stringify(
          ResultParameters.ResultParameter
        );
      }

      await prisma.transactionStatus.update({
        where: { id: transactionStatus.id },
        data: updateData,
      });
    }

    console.log(`Result processed for ConversationID: ${ConversationID}`);
    res.json({ message: "Result processed successfully" });
  } catch (error) {
    console.error("M-Pesa result error:", error);
    res.status(500).json({ message: "Result processing failed" });
  }
};

export const mpesaTimeout = async (req, res) => {
  try {
    const { ConversationID, OriginatorConversationID, ResultCode, ResultDesc } =
      req.body;

    const rc = parseInt(ResultCode, 10);
    const resultCodeValue = isNaN(rc) ? null : rc;

    await Promise.all([
      prisma.b2CTransaction.updateMany({
        where: { conversationId: ConversationID },
        data: {
          status: "TIMEOUT",
          resultCode: resultCodeValue,
          resultDesc: ResultDesc,
        },
      }),
      prisma.b2BTransaction.updateMany({
        where: { conversationId: ConversationID },
        data: {
          status: "TIMEOUT",
          resultCode: resultCodeValue,
          resultDesc: ResultDesc,
        },
      }),
      prisma.accountBalance.updateMany({
        where: { conversationId: ConversationID },
        data: {
          status: "TIMEOUT",
          resultCode: resultCodeValue,
          resultDesc: ResultDesc,
        },
      }),
      prisma.transactionStatus.updateMany({
        where: { conversationId: ConversationID },
        data: {
          status: "TIMEOUT",
          resultCode: resultCodeValue,
          resultDesc: ResultDesc,
        },
      }),
    ]);

    console.log(`Timeout processed for ConversationID: ${ConversationID}`);
    res.json({ message: "Timeout processed successfully" });
  } catch (error) {
    console.error("M-Pesa timeout error:", error);
    res.status(500).json({ message: "Timeout processing failed" });
  }
};

export const getB2CTransactions = async (req, res) => {
  try {
    const transactions = await prisma.b2CTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Get B2C transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch B2C transactions",
    });
  }
};

export const getB2BTransactions = async (req, res) => {
  try {
    const transactions = await prisma.b2BTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: transactions,
    });
  } catch (error) {
    console.error("Get B2B transactions error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch B2B transactions",
    });
  }
};

export const getQRCodes = async (req, res) => {
  try {
    const qrCodes = await prisma.qRCode.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    res.json({
      success: true,
      data: qrCodes,
    });
  } catch (error) {
    console.error("Get QR codes error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch QR codes",
    });
  }
};
