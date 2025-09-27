const express = require('express');
const { Poll, Token } = require('../models');
const { validateTokenRequest, validatePollId, sanitizeRequest } = require('../middleware/validation');
const { sendVotingEmail } = require('../utils/email');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// Apply sanitization to all routes
router.use(sanitizeRequest);

// Rate limiting for token requests - more restrictive
const tokenRequestLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // Max 3 token requests per IP per hour
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many token requests. Please try again in an hour.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Custom key generator to also consider email
  keyGenerator: (req) => {
    return `${req.ip}-${req.body.email || 'no-email'}`;
  }
});

// Rate limiting for token requests per email
const emailTokenLimit = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // Max 2 requests per email per 10 minutes
  message: {
    error: 'Rate Limit Exceeded',
    message: 'Too many requests for this email. Please wait 10 minutes.',
    retryAfter: '10 minutes'
  },
  keyGenerator: (req) => {
    return req.body.email || req.ip;
  }
});

// POST /request-token - Request voting token via email
router.post('/', tokenRequestLimit, emailTokenLimit, validateTokenRequest, async (req, res) => {
  try {
    const { pollId, email } = req.body;

    // Get request metadata
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Verify poll exists and is active
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
        message: 'This poll is no longer accepting votes'
      });
    }

    // Check if email is required for this poll
    if (poll.settings?.requireEmail === false) {
      return res.status(400).json({
        error: 'Email Not Required',
        message: 'This poll does not require email authentication'
      });
    }

    // Check for existing unused token for this email and poll
    const existingToken = await Token.findOne({
      pollId,
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (existingToken) {
      // Send the existing token instead of creating a new one
      try {
        await sendVotingEmail({
          email,
          poll,
          token: existingToken.rawToken,
          magicLink: existingToken.magicLink
        });

        return res.json({
          success: true,
          message: 'Voting instructions sent to your email',
          data: {
            pollId,
            email,
            expiresAt: existingToken.expiresAt,
            tokenSent: true,
            isResend: true
          }
        });
      } catch (emailError) {
        console.error('Email sending error (existing token):', emailError);
        return res.status(500).json({
          error: 'Email Send Failed',
          message: 'Failed to send voting instructions. Please try again.'
        });
      }
    }

    // Create new token
    const token = await Token.createForPoll(pollId, email, ipAddress, userAgent);

    // Send email with token/magic link
    try {
      await sendVotingEmail({
        email,
        poll,
        token: token.rawToken,
        magicLink: token.magicLink
      });

      res.json({
        success: true,
        message: 'Voting instructions sent to your email',
        data: {
          pollId,
          email,
          expiresAt: token.expiresAt,
          tokenSent: true,
          isResend: false
        }
      });
    } catch (emailError) {
      console.error('Email sending error:', emailError);

      // Delete the created token if email failed
      await Token.findByIdAndDelete(token._id);

      return res.status(500).json({
        error: 'Email Send Failed',
        message: 'Failed to send voting instructions. Please try again later.'
      });
    }

  } catch (error) {
    console.error('Token request error:', error);

    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid token request data',
        details: errors
      });
    }

    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process token request'
    });
  }
});

// GET /verify/:token - Verify token validity (optional endpoint for frontend)
router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { pollId } = req.query;

    if (!token || !pollId) {
      return res.status(400).json({
        error: 'Missing Parameters',
        message: 'Token and pollId are required'
      });
    }

    const tokenHash = Token.hashToken(token);
    const tokenDoc = await Token.findValidToken(tokenHash, pollId);

    if (!tokenDoc) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: 'Token is invalid, expired, or already used',
        valid: false
      });
    }

    // Get poll info
    const poll = await Poll.findById(pollId).select('title isActive');
    if (!poll || !poll.isActive) {
      return res.status(410).json({
        error: 'Poll Inactive',
        message: 'Poll is no longer active',
        valid: false
      });
    }

    res.json({
      success: true,
      valid: true,
      data: {
        pollId,
        pollTitle: poll.title,
        email: tokenDoc.email,
        expiresAt: tokenDoc.expiresAt,
        timeRemaining: Math.max(0, tokenDoc.expiresAt - new Date())
      }
    });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify token',
      valid: false
    });
  }
});

// POST /resend - Resend token email
router.post('/resend', tokenRequestLimit, validateTokenRequest, async (req, res) => {
  try {
    const { pollId, email } = req.body;

    // Find existing valid token
    const token = await Token.findOne({
      pollId,
      email,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!token) {
      return res.status(404).json({
        error: 'No Valid Token',
        message: 'No valid token found for this email and poll. Please request a new token.'
      });
    }

    // Get poll info
    const poll = await Poll.findById(pollId);
    if (!poll || !poll.isActive) {
      return res.status(410).json({
        error: 'Poll Inactive',
        message: 'This poll is no longer active'
      });
    }

    // Resend email
    try {
      await sendVotingEmail({
        email,
        poll,
        token: token.rawToken,
        magicLink: token.magicLink
      });

      res.json({
        success: true,
        message: 'Voting instructions resent to your email',
        data: {
          pollId,
          email,
          expiresAt: token.expiresAt,
          tokenSent: true,
          isResend: true
        }
      });
    } catch (emailError) {
      console.error('Email resend error:', emailError);
      return res.status(500).json({
        error: 'Email Send Failed',
        message: 'Failed to resend voting instructions'
      });
    }

  } catch (error) {
    console.error('Token resend error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to resend token'
    });
  }
});

module.exports = router;
