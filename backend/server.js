const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

const app = express();

// Import routes
const adminRoutes = require("./routes/admin");
const pollRoutes = require("./routes/polls");
const tokenRoutes = require("./routes/token");

// Import email utilities
const { verifyEmailConfig } = require("./utils/email");

// Import database utilities
const {
  initializeIndexes,
  setupPeriodicCleanup,
  checkDatabaseHealth,
  performFullCleanup,
} = require("./utils/database");

// Middleware
app.use(
  cors({
    origin: [
      process.env.FRONTEND_URL || "http://localhost:3000",
      "http://localhost:5173", // Vite dev server
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Polling System API is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// API routes
app.get("/api", (req, res) => {
  res.status(200).json({
    message: "Polling System API v1.0",
    endpoints: {
      health: "/health",
      polls: "/api/polls",
      pollDetails: "/api/polls/:id",
      pollResults: "/api/polls/:id/results",
      vote: "/api/polls/:id/vote",
      admin: "/api/admin",
      requestToken: "/api/request-token",
      verifyToken: "/api/request-token/verify/:token",
    },
  });
});

// Mount routes
app.use("/api/admin", adminRoutes);
app.use("/api/polls", pollRoutes);
app.use("/api/request-token", tokenRoutes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    message: `Cannot ${req.method} ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    error: "Internal Server Error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "Something went wrong",
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    process.exit(1);
  }
};

// Start server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  // Initialize database indexes
  await initializeIndexes();

  // Verify email configuration
  console.log("📧 Verifying email configuration...");
  await verifyEmailConfig();

  // Check database health
  console.log("🏥 Checking database health...");
  const healthCheck = await checkDatabaseHealth();
  if (!healthCheck.healthy) {
    console.warn("⚠️ Database health check warning:", healthCheck.message);
  }

  // Setup periodic cleanup tasks
  setupPeriodicCleanup();

  // Perform initial cleanup
  setTimeout(async () => {
    console.log("🧹 Performing initial database cleanup...");
    await performFullCleanup();
  }, 5000); // Wait 5 seconds after startup

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL}`);
    console.log(`📍 Health check: http://localhost:${PORT}/health`);
    console.log(`📍 API info: http://localhost:${PORT}/api`);
    console.log(`🗳️ Poll endpoints: http://localhost:${PORT}/api/polls`);
    console.log(
      `🔐 Token endpoint: http://localhost:${PORT}/api/request-token`,
    );
    console.log("✅ Polling System backend ready!");
  });
};

startServer();

// Handle process termination
process.on("SIGINT", async () => {
  console.log("\n🛑 Received SIGINT, shutting down gracefully...");
  await mongoose.connection.close();
  console.log("✅ MongoDB connection closed");
  process.exit(0);
});

module.exports = app;
