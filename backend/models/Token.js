const mongoose = require("mongoose");
const crypto = require("crypto");

const tokenSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "Poll ID is required"],
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    tokenHash: {
      type: String,
      required: true,
    },
    rawToken: {
      type: String,
      required: true,
    },
    used: {
      type: Boolean,
      default: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for performance
tokenSchema.index({ pollId: 1, email: 1 });
tokenSchema.index({ pollId: 1, used: 1 });

// Unique tokenHash index
tokenSchema.index({ tokenHash: 1 }, { unique: true });

// TTL index to automatically delete expired tokens
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Pre-save middleware to hash token
tokenSchema.pre("save", function (next) {
  if (this.isNew && !this.tokenHash) {
    // Generate a random token if not provided
    if (!this.rawToken) {
      this.rawToken = crypto.randomBytes(32).toString("hex");
    }

    // Hash the token for storage if not already set
    this.tokenHash = crypto
      .createHash("sha256")
      .update(this.rawToken)
      .digest("hex");
  }
  next();
});

// Instance methods
tokenSchema.methods.isExpired = function () {
  return new Date() > this.expiresAt;
};

tokenSchema.methods.isValid = function () {
  return !this.used && !this.isExpired();
};

tokenSchema.methods.markAsUsed = function () {
  this.used = true;
  this.usedAt = new Date();
  return this.save();
};

tokenSchema.methods.validateToken = function (providedToken) {
  const providedHash = crypto
    .createHash("sha256")
    .update(providedToken)
    .digest("hex");

  return this.tokenHash === providedHash;
};

// Static methods
tokenSchema.statics.generateToken = function () {
  return crypto.randomBytes(32).toString("hex");
};

tokenSchema.statics.hashToken = function (token) {
  return crypto.createHash("sha256").update(token).digest("hex");
};

tokenSchema.statics.findByTokenHash = function (tokenHash) {
  return this.findOne({ tokenHash });
};

tokenSchema.statics.findValidToken = function (tokenHash, pollId) {
  return this.findOne({
    tokenHash,
    pollId,
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.statics.createForPoll = async function (
  pollId,
  email,
  ipAddress,
  userAgent,
) {
  const expiryHours = parseInt(process.env.TOKEN_EXPIRY_HOURS || 24);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + expiryHours);

  const rawToken = this.generateToken();
  const tokenHash = this.hashToken(rawToken);

  const token = new this({
    pollId,
    email,
    expiresAt,
    ipAddress,
    userAgent,
    rawToken: rawToken,
    tokenHash: tokenHash,
  });

  await token.save();
  return token;
};

tokenSchema.statics.cleanupExpired = function () {
  return this.deleteMany({
    expiresAt: { $lt: new Date() },
  });
};

// Virtual for magic link generation
tokenSchema.virtual("magicLink").get(function () {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  return `${frontendUrl}/vote?token=${this.rawToken}&poll=${this.pollId}`;
});

const Token = mongoose.model("Token", tokenSchema);

module.exports = Token;
