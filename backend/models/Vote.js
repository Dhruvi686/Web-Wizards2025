const mongoose = require("mongoose");

const voteSchema = new mongoose.Schema(
  {
    pollId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Poll",
      required: [true, "Poll ID is required"],
      index: true,
    },
    optionId: {
      type: String,
      required: [true, "Option ID is required"],
      index: true,
    },
    tokenHash: {
      type: String,
      required: [true, "Token hash is required"],
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    votedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    isValid: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

// Compound indexes for performance and uniqueness
voteSchema.index({ pollId: 1, tokenHash: 1 }, { unique: true });
voteSchema.index({ pollId: 1, optionId: 1 });
voteSchema.index({ pollId: 1, votedAt: -1 });
voteSchema.index({ tokenHash: 1 });

// Instance methods
voteSchema.methods.invalidate = function () {
  this.isValid = false;
  return this.save();
};

// Static methods
voteSchema.statics.countByPoll = function (pollId) {
  return this.countDocuments({ pollId, isValid: true });
};

voteSchema.statics.countByOption = function (pollId, optionId) {
  return this.countDocuments({ pollId, optionId, isValid: true });
};

voteSchema.statics.getResultsByPoll = function (pollId) {
  return this.aggregate([
    {
      $match: { pollId: new mongoose.Types.ObjectId(pollId), isValid: true },
    },
    {
      $group: {
        _id: "$optionId",
        count: { $sum: 1 },
        votes: {
          $push: {
            votedAt: "$votedAt",
            ipAddress: "$ipAddress",
          },
        },
      },
    },
    {
      $project: {
        optionId: "$_id",
        count: 1,
        votes: 1,
        _id: 0,
      },
    },
  ]);
};

voteSchema.statics.hasVoted = function (pollId, tokenHash) {
  return this.findOne({ pollId, tokenHash, isValid: true });
};

voteSchema.statics.createVote = async function (
  pollId,
  optionId,
  tokenHash,
  email,
  ipAddress,
  userAgent,
) {
  // Check if already voted with this token
  const existingVote = await this.hasVoted(pollId, tokenHash);
  if (existingVote) {
    throw new Error("This token has already been used to vote");
  }

  const vote = new this({
    pollId,
    optionId,
    tokenHash,
    email,
    ipAddress,
    userAgent,
  });

  return vote.save();
};

voteSchema.statics.getAuditTrail = function (pollId) {
  return this.find(
    { pollId },
    {
      optionId: 1,
      tokenHash: 1,
      ipAddress: 1,
      userAgent: 1,
      votedAt: 1,
      isValid: 1,
    },
  ).sort({ votedAt: -1 });
};

const Vote = mongoose.model("Vote", voteSchema);

module.exports = Vote;
