const express = require('express');
const { Poll, Token, Vote } = require('../models');
const { validatePollId, sanitizeRequest } = require('../middleware/validation');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeRequest);

// Rate limiting for token requests
const tokenRequestLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Max 5 token requests per IP per hour
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many token requests. Please try again later.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /polls - List active polls
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.findActive()
      .select('title description totalVotes createdAt options')
      .lean();

    const pollsWithBasicInfo = polls.map(poll => ({
      id: poll._id,
      title: poll.title,
      description: poll.description.length > 150
        ? poll.description.substring(0, 150) + '...'
        : poll.description,
      totalVotes: poll.totalVotes || 0,
      createdAt: poll.createdAt,
      optionsCount: poll.options?.length || 0
    }));

    console.log(`Found ${polls.length} active polls:`, pollsWithBasicInfo);

    res.json({
      success: true,
      data: {
        polls: pollsWithBasicInfo,
        count: pollsWithBasicInfo.length
      }
    });
  } catch (error) {
    console.error('List polls error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve polls'
    });
  }
});

// GET /polls/:id - Get poll details with results
router.get('/:id', validatePollId, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    if (!poll.isActive) {
      return res.status(410).json({
        error: 'Poll Inactive',
        message: 'This poll is no longer active'
      });
    }

    // Calculate results
    const results = poll.options?.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      percentage: poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
    })) || [];

    const pollDetails = {
      id: poll._id,
      title: poll.title,
      description: poll.description,
      options: poll.options?.map(opt => ({
        id: opt.id,
        text: opt.text
      })) || [],
      results: poll.settings?.showResults !== false ? results : null,
      totalVotes: poll.totalVotes || 0,
      isActive: poll.isActive,
      createdAt: poll.createdAt,
      settings: {
        showResults: poll.settings?.showResults !== false,
        requireEmail: poll.settings?.requireEmail !== false
      }
    };

    res.json({
      success: true,
      data: pollDetails
    });
  } catch (error) {
    console.error('Get poll details error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve poll details'
    });
  }
});

// GET /polls/:id/results - Get poll results only
router.get('/:id/results', validatePollId, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .select('title options totalVotes settings isActive')
      .lean();

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    if (!poll.isActive) {
      return res.status(410).json({
        error: 'Poll Inactive',
        message: 'This poll is no longer active'
      });
    }

    if (poll.settings?.showResults === false) {
      return res.status(403).json({
        error: 'Results Hidden',
        message: 'Results are not available for this poll'
      });
    }

    // Calculate detailed results
    const results = poll.options?.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      percentage: poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
    })) || [];

    res.json({
      success: true,
      data: {
        pollId: poll._id,
        title: poll.title,
        results,
        totalVotes: poll.totalVotes || 0,
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get poll results error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve poll results'
    });
  }
});

// POST /polls/:id/vote - Cast a vote
router.post('/:id/vote', validatePollId, async (req, res) => {
  try {
    const { token, optionId } = req.body;
    const pollId = req.params.id;

    // Validation
    if (!token || typeof token !== 'string' || token.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid token is required'
      });
    }

    if (!optionId || typeof optionId !== 'string' || optionId.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Valid option ID is required'
      });
    }

    // Get poll
    const poll = await Poll.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    if (!poll.isActive) {
      return res.status(410).json({
        error: 'Poll Inactive',
        message: 'This poll is no longer active'
      });
    }

    // Validate option exists
    if (!poll.isValidOption(optionId)) {
      return res.status(400).json({
        error: 'Invalid Option',
        message: 'Selected option does not exist'
      });
    }

    // Hash the provided token
    const tokenHash = Token.hashToken(token.trim());

    // Find and validate token
    const tokenDoc = await Token.findValidToken(tokenHash, pollId);
    if (!tokenDoc) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token is invalid, expired, or already used'
      });
    }

    // Check if already voted with this token
    const existingVote = await Vote.hasVoted(pollId, tokenHash);
    if (existingVote) {
      return res.status(409).json({
        error: 'Already Voted',
        message: 'This token has already been used to vote'
      });
    }

    // Get request metadata
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    try {
      // Create vote record
      await Vote.createVote(
        pollId,
        optionId,
        tokenHash,
        tokenDoc.email,
        ipAddress,
        userAgent
      );

      // Mark token as used
      await tokenDoc.markAsUsed();

      // Update poll vote count
      const success = poll.addVote(optionId);
      if (success) {
        await poll.save();
      } else {
        throw new Error('Failed to update poll vote count');
      }
    } catch (voteError) {
      console.error('Vote casting error:', voteError);
      return res.status(500).json({
        error: 'Vote Failed',
        message: 'Failed to cast vote. Please try again.'
      });
    }

    // Get updated results
    const updatedPoll = await Poll.findById(pollId).select('options totalVotes').lean();
    const results = updatedPoll.options?.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      percentage: updatedPoll.totalVotes > 0 ? Math.round((option.votes / updatedPoll.totalVotes) * 100) : 0
    })) || [];

    res.json({
      success: true,
      message: 'Vote cast successfully',
      data: {
        pollId,
        selectedOption: optionId,
        results: poll.settings?.showResults !== false ? results : null,
        totalVotes: updatedPoll.totalVotes,
        votedAt: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Vote casting error:', error);

    if (error.message.includes('already been used')) {
      return res.status(409).json({
        error: 'Already Voted',
        message: 'This token has already been used to vote'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to cast vote'
    });
  }
});

module.exports = router;
