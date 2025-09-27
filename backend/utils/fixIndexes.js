const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const { Token, Vote, Poll } = require('../models');

/**
 * Fix database index conflicts by dropping and recreating indexes
 */
const fixIndexes = async () => {
  try {
    console.log('🔧 Starting database index fix...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Fix Token model indexes
    console.log('\n🔍 Fixing Token model indexes...');
    const tokenCollection = mongoose.connection.collection('tokens');

    // Get existing indexes
    const existingTokenIndexes = await tokenCollection.indexes();
    console.log('📋 Existing Token indexes:', existingTokenIndexes.map(idx => idx.name));

    // Drop the conflicting expiresAt index if it exists
    try {
      await tokenCollection.dropIndex('expiresAt_1');
      console.log('🗑️ Dropped conflicting expiresAt_1 index');
    } catch (error) {
      if (error.code !== 27) { // Index not found error code
        console.warn('⚠️ Could not drop expiresAt_1 index:', error.message);
      }
    }

    // Drop tokenHash index if it has conflicts
    try {
      await tokenCollection.dropIndex('tokenHash_1');
      console.log('🗑️ Dropped tokenHash_1 index');
    } catch (error) {
      if (error.code !== 27) { // Index not found error code
        console.warn('⚠️ Could not drop tokenHash_1 index:', error.message);
      }
    }

    // Drop used index
    try {
      await tokenCollection.dropIndex('used_1');
      console.log('🗑️ Dropped used_1 index');
    } catch (error) {
      if (error.code !== 27) { // Index not found error code
        console.warn('⚠️ Could not drop used_1 index:', error.message);
      }
    }

    // Recreate indexes properly
    console.log('\n🔨 Recreating Token indexes...');

    // Compound indexes
    await tokenCollection.createIndex({ pollId: 1, email: 1 });
    console.log('✅ Created compound index: pollId + email');

    await tokenCollection.createIndex({ pollId: 1, used: 1 });
    console.log('✅ Created compound index: pollId + used');

    // TTL index for automatic expiry
    await tokenCollection.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    console.log('✅ Created TTL index: expiresAt');

    // Unique tokenHash index
    await tokenCollection.createIndex({ tokenHash: 1 }, { unique: true });
    console.log('✅ Created unique index: tokenHash');

    // Fix Vote model indexes
    console.log('\n🔍 Fixing Vote model indexes...');
    try {
      await Vote.createIndexes();
      console.log('✅ Vote model indexes verified');
    } catch (error) {
      console.warn('⚠️ Vote model index issue:', error.message);
    }

    // Fix Poll model indexes
    console.log('\n🔍 Fixing Poll model indexes...');
    try {
      await Poll.createIndexes();
      console.log('✅ Poll model indexes verified');
    } catch (error) {
      console.warn('⚠️ Poll model index issue:', error.message);
    }

    // Verify all indexes are working
    console.log('\n🔍 Verifying all indexes...');

    const finalTokenIndexes = await tokenCollection.indexes();
    console.log('📋 Final Token indexes:', finalTokenIndexes.map(idx => ({
      name: idx.name,
      key: idx.key,
      expireAfterSeconds: idx.expireAfterSeconds,
      unique: idx.unique
    })));

    console.log('\n✅ Database index fix completed successfully!');

  } catch (error) {
    console.error('❌ Error fixing database indexes:', error);
    throw error;
  }
};

/**
 * Clean up all indexes and recreate from scratch
 */
const resetAllIndexes = async () => {
  try {
    console.log('🧹 Resetting all database indexes...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Reset Token indexes
    const tokenCollection = mongoose.connection.collection('tokens');
    await tokenCollection.dropIndexes();
    console.log('🗑️ Dropped all Token indexes');

    // Reset Vote indexes
    const voteCollection = mongoose.connection.collection('votes');
    await voteCollection.dropIndexes();
    console.log('🗑️ Dropped all Vote indexes');

    // Reset Poll indexes
    const pollCollection = mongoose.connection.collection('polls');
    await pollCollection.dropIndexes();
    console.log('🗑️ Dropped all Poll indexes');

    // Recreate from models
    await Token.createIndexes();
    console.log('✅ Recreated Token indexes');

    await Vote.createIndexes();
    console.log('✅ Recreated Vote indexes');

    await Poll.createIndexes();
    console.log('✅ Recreated Poll indexes');

    console.log('\n✅ All indexes reset and recreated successfully!');

  } catch (error) {
    console.error('❌ Error resetting indexes:', error);
    throw error;
  }
};

/**
 * List all current indexes
 */
const listIndexes = async () => {
  try {
    console.log('📋 Listing all database indexes...');

    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // List Token indexes
    const tokenCollection = mongoose.connection.collection('tokens');
    const tokenIndexes = await tokenCollection.indexes();
    console.log('\n📊 Token indexes:');
    tokenIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''} ${idx.expireAfterSeconds !== undefined ? `(TTL: ${idx.expireAfterSeconds}s)` : ''}`);
    });

    // List Vote indexes
    const voteCollection = mongoose.connection.collection('votes');
    const voteIndexes = await voteCollection.indexes();
    console.log('\n📊 Vote indexes:');
    voteIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

    // List Poll indexes
    const pollCollection = mongoose.connection.collection('polls');
    const pollIndexes = await pollCollection.indexes();
    console.log('\n📊 Poll indexes:');
    pollIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)} ${idx.unique ? '(unique)' : ''}`);
    });

  } catch (error) {
    console.error('❌ Error listing indexes:', error);
    throw error;
  }
};

// Command line interface
const command = process.argv[2];

const runCommand = async () => {
  try {
    switch (command) {
      case 'fix':
        await fixIndexes();
        break;
      case 'reset':
        await resetAllIndexes();
        break;
      case 'list':
        await listIndexes();
        break;
      default:
        console.log('🔧 Database Index Fix Utility');
        console.log('');
        console.log('Usage: node fixIndexes.js [command]');
        console.log('');
        console.log('Commands:');
        console.log('  fix   - Fix conflicting indexes (recommended)');
        console.log('  reset - Drop and recreate all indexes');
        console.log('  list  - List all current indexes');
        console.log('');
        console.log('Examples:');
        console.log('  node fixIndexes.js fix');
        console.log('  node fixIndexes.js list');
        break;
    }
  } catch (error) {
    console.error('❌ Command failed:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Database connection closed');
    process.exit(0);
  }
};

// Run if called directly
if (require.main === module) {
  runCommand();
}

module.exports = {
  fixIndexes,
  resetAllIndexes,
  listIndexes
};
