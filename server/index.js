import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import paymentRoutes from "./routes/payments.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      process.env.FRONTEND_URL,
    ].filter(Boolean),
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use("/api/payments", paymentRoutes);

// Health check
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.MPESA_ENVIRONMENT,
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    success: false,
    message: "Internal server error",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 M-Pesa Payment Server running on port ${PORT}`);
  console.log(`📱 Environment: ${process.env.MPESA_ENVIRONMENT || "sandbox"}`);
  console.log(
    `🌐 CORS enabled for: ${process.env.FRONTEND_URL || "localhost"}`
  );
});
