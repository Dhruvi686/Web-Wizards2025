const { Poll } = require('../models');

// Validation helper functions
const isValidEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const isValidObjectId = (id) => {
  const objectIdRegex = /^[0-9a-fA-F]{24}$/;
  return objectIdRegex.test(id);
};

// Validate poll creation data
const validatePollCreation = (req, res, next) => {
  const { title, description, options } = req.body;
  const errors = [];

  // Title validation
  if (!title) {
    errors.push('Title is required');
  } else if (typeof title !== 'string') {
    errors.push('Title must be a string');
  } else if (title.trim().length === 0) {
    errors.push('Title cannot be empty');
  } else if (title.length > 200) {
    errors.push('Title cannot exceed 200 characters');
  }

  // Description validation
  if (!description) {
    errors.push('Description is required');
  } else if (typeof description !== 'string') {
    errors.push('Description must be a string');
  } else if (description.trim().length === 0) {
    errors.push('Description cannot be empty');
  } else if (description.length > 1000) {
    errors.push('Description cannot exceed 1000 characters');
  }

  // Options validation
  if (!options) {
    errors.push('Options are required');
  } else if (!Array.isArray(options)) {
    errors.push('Options must be an array');
  } else if (options.length < 2) {
    errors.push('Poll must have at least 2 options');
  } else if (options.length > 10) {
    errors.push('Poll cannot have more than 10 options');
  } else {
    // Validate each option
    const optionTexts = new Set();
    options.forEach((option, index) => {
      if (typeof option !== 'string') {
        errors.push(`Option ${index + 1} must be a string`);
      } else if (option.trim().length === 0) {
        errors.push(`Option ${index + 1} cannot be empty`);
      } else if (option.length > 200) {
        errors.push(`Option ${index + 1} cannot exceed 200 characters`);
      } else {
        const normalizedText = option.trim().toLowerCase();
        if (optionTexts.has(normalizedText)) {
          errors.push(`Duplicate option: "${option}"`);
        }
        optionTexts.add(normalizedText);
      }
    });
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid poll data',
      details: errors
    });
  }

  // Sanitize and normalize data
  req.body.title = title.trim();
  req.body.description = description.trim();
  req.body.options = options.map(option => option.trim());

  next();
};

// Validate token request data
const validateTokenRequest = (req, res, next) => {
  const { pollId, email } = req.body;
  const errors = [];

  // Poll ID validation
  if (!pollId) {
    errors.push('Poll ID is required');
  } else if (!isValidObjectId(pollId)) {
    errors.push('Invalid poll ID format');
  }

  // Email validation
  if (!email) {
    errors.push('Email is required');
  } else if (typeof email !== 'string') {
    errors.push('Email must be a string');
  } else if (!isValidEmail(email)) {
    errors.push('Invalid email format');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid token request data',
      details: errors
    });
  }

  // Normalize email
  req.body.email = email.trim().toLowerCase();

  next();
};

// Validate vote data
const validateVote = (req, res, next) => {
  const { token, optionId } = req.body;
  const { id: pollId } = req.params;
  const errors = [];

  // Poll ID validation
  if (!isValidObjectId(pollId)) {
    errors.push('Invalid poll ID format');
  }

  // Token validation
  if (!token) {
    errors.push('Token is required');
  } else if (typeof token !== 'string') {
    errors.push('Token must be a string');
  } else if (token.trim().length === 0) {
    errors.push('Token cannot be empty');
  }

  // Option ID validation
  if (!optionId) {
    errors.push('Option ID is required');
  } else if (typeof optionId !== 'string') {
    errors.push('Option ID must be a string');
  } else if (optionId.trim().length === 0) {
    errors.push('Option ID cannot be empty');
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid vote data',
      details: errors
    });
  }

  // Sanitize data
  req.body.token = token.trim();
  req.body.optionId = optionId.trim();

  next();
};

// Validate poll ID parameter
const validatePollId = (req, res, next) => {
  const { id } = req.params;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid poll ID format'
    });
  }

  next();
};

// Generic request sanitization
const sanitizeRequest = (req, res, next) => {
  // Remove any potential XSS or injection attempts
  const sanitizeValue = (value) => {
    if (typeof value === 'string') {
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    }
    return value;
  };

  // Recursively sanitize request body
  const sanitizeObject = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitizeObject(obj[key]);
        } else {
          obj[key] = sanitizeValue(obj[key]);
        }
      }
    }
  };

  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }

  next();
};

module.exports = {
  validatePollCreation,
  validateTokenRequest,
  validateVote,
  validatePollId,
  sanitizeRequest,
  isValidEmail,
  isValidObjectId
};
