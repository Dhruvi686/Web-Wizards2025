const express = require('express');
const { Poll, Vote } = require('../models');
const { adminAuth } = require('../middleware/auth');
const { validatePollCreation, validatePollId, sanitizeRequest } = require('../middleware/validation');
const { generatePollStructure, isConfigured } = require('../services/aiService');

const router = express.Router();

// Apply admin authentication to all routes
router.use(adminAuth);
router.use(sanitizeRequest);

// POST /admin/polls - Create a new poll
router.post('/polls', validatePollCreation, async (req, res) => {
  try {
    const { title, description, options, settings } = req.body;

    // Convert options array to objects with IDs
    const pollOptions = options.map((optionText, index) => ({
      id: `option_${Date.now()}_${index}`,
      text: optionText,
      votes: 0
    }));

    // Create poll data
    const pollData = {
      title,
      description,
      options: pollOptions,
      isActive: true,
      totalVotes: 0,
      createdBy: 'admin'
    };

    // Add settings if provided
    if (settings && typeof settings === 'object') {
      pollData.settings = {
        allowMultipleVotes: settings.allowMultipleVotes || false,
        requireEmail: settings.requireEmail !== undefined ? settings.requireEmail : true,
        showResults: settings.showResults !== undefined ? settings.showResults : true
      };
    }

    // Create and save poll
    const poll = new Poll(pollData);
    const savedPoll = await poll.save();

    res.status(201).json({
      success: true,
      message: 'Poll created successfully',
      data: {
        id: savedPoll._id,
        title: savedPoll.title,
        description: savedPoll.description,
        options: savedPoll.options,
        isActive: savedPoll.isActive,
        settings: savedPoll.settings,
        totalVotes: savedPoll.totalVotes,
        createdAt: savedPoll.createdAt,
        magicLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/poll/${savedPoll._id}`
      }
    });
  } catch (error) {
    console.error('Poll creation error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Poll data validation failed',
        details: errors
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Poll with similar data already exists'
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to create poll'
    });
  }
});

// POST /admin/generate-poll - Generate poll structure using AI
router.post('/generate-poll', async (req, res) => {
  try {
    const { prompt } = req.body;

    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Prompt is required and must be a non-empty string'
      });
    }

    // Check if AI service is configured
    if (!isConfigured()) {
      return res.status(503).json({
        error: 'Service Unavailable',
        message: 'AI service is not configured. Please set the Groq API key and model.'
      });
    }

    // Generate poll structure using AI
    const pollStructure = await generatePollStructure(prompt.trim());

    res.json({
      success: true,
      message: 'Poll structure generated successfully',
      data: pollStructure
    });

  } catch (error) {
    console.error('AI poll generation error:', error);

    // Handle specific AI service errors
    if (error.message.includes('Groq') || error.message.includes('API')) {
      return res.status(502).json({
        error: 'Bad Gateway',
        message: error.message
      });
    }

    if (error.message.includes('parse') || error.message.includes('Invalid')) {
      return res.status(422).json({
        error: 'Unprocessable Entity',
        message: error.message
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to generate poll structure'
    });
  }
});

// GET /admin/polls - List all polls (admin view)
router.get('/polls', async (req, res) => {
  try {
    const { page = 1, limit = 10, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build filter
    const filter = {};
    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    // Get polls with pagination
    const polls = await Poll.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Poll.countDocuments(filter);

    // Add computed fields
    const pollsWithStats = polls.map(poll => ({
      ...poll,
      optionsCount: poll.options?.length || 0,
      magicLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/poll/${poll._id}`
    }));

    res.json({
      success: true,
      data: {
        polls: pollsWithStats,
        pagination: {
          current: parseInt(page),
          total: Math.ceil(total / parseInt(limit)),
          count: polls.length,
          totalPolls: total
        }
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

// GET /admin/polls/:id - Get specific poll details (admin view)
router.get('/polls/:id', validatePollId, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id).lean();

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    // Add admin-specific data
    const pollWithStats = {
      ...poll,
      results: poll.options?.map(option => ({
        id: option.id,
        text: option.text,
        votes: option.votes || 0,
        percentage: poll.totalVotes > 0 ? Math.round((option.votes / poll.totalVotes) * 100) : 0
      })) || [],
      magicLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/poll/${poll._id}`,
      adminLink: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/poll/${poll._id}`
    };

    res.json({
      success: true,
      data: pollWithStats
    });
  } catch (error) {
    console.error('Get poll error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve poll'
    });
  }
});

// PUT /admin/polls/:id - Update poll
router.put('/polls/:id', validatePollId, sanitizeRequest, async (req, res) => {
  try {
    const { title, description, isActive, settings } = req.body;
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    // Update allowed fields
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Title must be a non-empty string'
        });
      }
      poll.title = title.trim();
    }

    if (description !== undefined) {
      if (typeof description !== 'string' || description.trim().length === 0) {
        return res.status(400).json({
          error: 'Validation Error',
          message: 'Description must be a non-empty string'
        });
      }
      poll.description = description.trim();
    }

    if (isActive !== undefined) {
      poll.isActive = Boolean(isActive);
    }

    if (settings && typeof settings === 'object') {
      poll.settings = {
        ...poll.settings,
        ...settings
      };
    }

    const updatedPoll = await poll.save();

    res.json({
      success: true,
      message: 'Poll updated successfully',
      data: {
        id: updatedPoll._id,
        title: updatedPoll.title,
        description: updatedPoll.description,
        isActive: updatedPoll.isActive,
        settings: updatedPoll.settings,
        updatedAt: updatedPoll.updatedAt
      }
    });
  } catch (error) {
    console.error('Update poll error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Poll update validation failed',
        details: errors
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to update poll'
    });
  }
});

// DELETE /admin/polls/:id - Delete poll
router.delete('/polls/:id', validatePollId, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    // Check if poll has votes
    const voteCount = await Vote.countByPoll(req.params.id);

    if (voteCount > 0) {
      // Instead of deleting, deactivate the poll
      poll.isActive = false;
      await poll.save();

      return res.json({
        success: true,
        message: `Poll deactivated instead of deleted due to existing ${voteCount} votes`,
        data: {
          id: poll._id,
          isActive: poll.isActive,
          voteCount
        }
      });
    }

    // Safe to delete if no votes
    await Poll.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Poll deleted successfully'
    });
  } catch (error) {
    console.error('Delete poll error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to delete poll'
    });
  }
});

// GET /admin/polls/:id/audit - Get vote audit trail
router.get('/polls/:id/audit', validatePollId, async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id);

    if (!poll) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Poll not found'
      });
    }

    const auditTrail = await Vote.getAuditTrail(req.params.id);

    res.json({
      success: true,
      data: {
        pollId: req.params.id,
        pollTitle: poll.title,
        totalVotes: auditTrail.length,
        votes: auditTrail.map(vote => ({
          optionId: vote.optionId,
          tokenHash: vote.tokenHash.substring(0, 8) + '...', // Partial hash for security
          ipAddress: vote.ipAddress,
          userAgent: vote.userAgent,
          votedAt: vote.votedAt,
          isValid: vote.isValid
        }))
      }
    });
  } catch (error) {
    console.error('Audit trail error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve audit trail'
    });
  }
});

// GET /admin/stats - Get system statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPolls,
      activePolls,
      totalVotes,
      recentPolls
    ] = await Promise.all([
      Poll.countDocuments(),
      Poll.countDocuments({ isActive: true }),
      Vote.countDocuments({ isValid: true }),
      Poll.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title totalVotes createdAt')
        .lean()
    ]);

    res.json({
      success: true,
      data: {
        overview: {
          totalPolls,
          activePolls,
          inactivePolls: totalPolls - activePolls,
          totalVotes
        },
        recentPolls
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve statistics'
    });
  }
});

module.exports = router;
