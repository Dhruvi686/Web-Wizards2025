const { Token, Vote, Poll } = require('../models');

// Clean up expired tokens
const cleanupExpiredTokens = async () => {
  try {
    const result = await Token.deleteMany({
      expiresAt: { $lt: new Date() }
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} expired tokens`);
    }

    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning expired tokens:', error);
    return 0;
  }
};

// Clean up old unused tokens (older than 7 days)
const cleanupOldUnusedTokens = async () => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Token.deleteMany({
      used: false,
      createdAt: { $lt: sevenDaysAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} old unused tokens`);
    }

    return result.deletedCount;
  } catch (error) {
    console.error('❌ Error cleaning old unused tokens:', error);
    return 0;
  }
};

// Update poll vote counts from actual vote records
const syncPollVoteCounts = async () => {
  try {
    const polls = await Poll.find({});
    let updatedCount = 0;

    for (const poll of polls) {
      // Get vote counts by option for this poll
      const voteResults = await Vote.aggregate([
        {
          $match: { pollId: poll._id, isValid: true }
        },
        {
          $group: {
            _id: '$optionId',
            count: { $sum: 1 }
          }
        }
      ]);

      // Create a map of option votes
      const voteCounts = {};
      voteResults.forEach(result => {
        voteCounts[result._id] = result.count;
      });

      // Update poll options with actual vote counts
      let pollUpdated = false;
      let totalVotes = 0;

      poll.options.forEach(option => {
        const actualVotes = voteCounts[option.id] || 0;
        if (option.votes !== actualVotes) {
          option.votes = actualVotes;
          pollUpdated = true;
        }
        totalVotes += actualVotes;
      });

      // Update total votes
      if (poll.totalVotes !== totalVotes) {
        poll.totalVotes = totalVotes;
        pollUpdated = true;
      }

      if (pollUpdated) {
        await poll.save();
        updatedCount++;
      }
    }

    if (updatedCount > 0) {
      console.log(`🔄 Synced vote counts for ${updatedCount} polls`);
    }

    return updatedCount;
  } catch (error) {
    console.error('❌ Error syncing poll vote counts:', error);
    return 0;
  }
};

// Get database statistics
const getDatabaseStats = async () => {
  try {
    const [
      totalPolls,
      activePolls,
      totalTokens,
      usedTokens,
      expiredTokens,
      totalVotes,
      validVotes
    ] = await Promise.all([
      Poll.countDocuments(),
      Poll.countDocuments({ isActive: true }),
      Token.countDocuments(),
      Token.countDocuments({ used: true }),
      Token.countDocuments({ expiresAt: { $lt: new Date() } }),
      Vote.countDocuments(),
      Vote.countDocuments({ isValid: true })
    ]);

    return {
      polls: {
        total: totalPolls,
        active: activePolls,
        inactive: totalPolls - activePolls
      },
      tokens: {
        total: totalTokens,
        used: usedTokens,
        unused: totalTokens - usedTokens,
        expired: expiredTokens
      },
      votes: {
        total: totalVotes,
        valid: validVotes,
        invalid: totalVotes - validVotes
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    return null;
  }
};

// Remove invalid votes (orphaned votes without valid polls or tokens)
const cleanupInvalidVotes = async () => {
  try {
    // Find votes for non-existent polls
    const validPollIds = (await Poll.find({}, { _id: 1 })).map(p => p._id.toString());

    const orphanedVotesResult = await Vote.deleteMany({
      pollId: { $nin: validPollIds }
    });

    // Find votes with non-existent token hashes
    const validTokenHashes = (await Token.find({}, { tokenHash: 1 })).map(t => t.tokenHash);

    const invalidTokenVotesResult = await Vote.updateMany(
      { tokenHash: { $nin: validTokenHashes } },
      { isValid: false }
    );

    const totalCleaned = orphanedVotesResult.deletedCount;
    const totalInvalidated = invalidTokenVotesResult.modifiedCount;

    if (totalCleaned > 0 || totalInvalidated > 0) {
      console.log(`🧹 Cleaned ${totalCleaned} orphaned votes, invalidated ${totalInvalidated} votes`);
    }

    return { deleted: totalCleaned, invalidated: totalInvalidated };
  } catch (error) {
    console.error('❌ Error cleaning invalid votes:', error);
    return { deleted: 0, invalidated: 0 };
  }
};

// Full database cleanup - runs all cleanup tasks
const performFullCleanup = async () => {
  console.log('🧹 Starting full database cleanup...');

  const results = {
    expiredTokens: await cleanupExpiredTokens(),
    oldUnusedTokens: await cleanupOldUnusedTokens(),
    syncedPolls: await syncPollVoteCounts(),
    cleanedVotes: await cleanupInvalidVotes(),
    timestamp: new Date().toISOString()
  };

  console.log('✅ Database cleanup completed');
  return results;
};

// Setup periodic cleanup tasks
const setupPeriodicCleanup = () => {
  // Clean expired tokens every hour
  setInterval(async () => {
    await cleanupExpiredTokens();
  }, 60 * 60 * 1000); // 1 hour

  // Full cleanup every 6 hours
  setInterval(async () => {
    await performFullCleanup();
  }, 6 * 60 * 60 * 1000); // 6 hours

  console.log('⏰ Periodic cleanup tasks scheduled');
};

// Database health check
const checkDatabaseHealth = async () => {
  try {
    // Test basic operations
    await Poll.findOne({}).limit(1);
    await Token.findOne({}).limit(1);
    await Vote.findOne({}).limit(1);

    const stats = await getDatabaseStats();

    return {
      healthy: true,
      message: 'Database is responsive',
      stats,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return {
      healthy: false,
      message: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize database indexes for performance
const initializeIndexes = async () => {
  try {
    console.log('📊 Initializing database indexes...');

    // Poll indexes
    await Poll.createIndexes();

    // Token indexes
    await Token.createIndexes();

    // Vote indexes
    await Vote.createIndexes();

    console.log('✅ Database indexes initialized');
  } catch (error) {
    console.error('❌ Error initializing database indexes:', error);
  }
};

module.exports = {
  cleanupExpiredTokens,
  cleanupOldUnusedTokens,
  syncPollVoteCounts,
  getDatabaseStats,
  cleanupInvalidVotes,
  performFullCleanup,
  setupPeriodicCleanup,
  checkDatabaseHealth,
  initializeIndexes
};
