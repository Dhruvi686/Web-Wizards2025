const mongoose = require('mongoose');

const pollOptionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true
  },
  votes: {
    type: Number,
    default: 0
  }
}, { _id: false });

const pollSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Poll title is required'],
    trim: true,
    maxLength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Poll description is required'],
    trim: true,
    maxLength: [1000, 'Description cannot exceed 1000 characters']
  },
  options: {
    type: [pollOptionSchema],
    required: [true, 'Poll must have options'],
    validate: {
      validator: function(options) {
        return options && options.length >= 2 && options.length <= 10;
      },
      message: 'Poll must have between 2 and 10 options'
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  totalVotes: {
    type: Number,
    default: 0
  },
  createdBy: {
    type: String,
    default: 'admin'
  },
  settings: {
    allowMultipleVotes: {
      type: Boolean,
      default: false
    },
    requireEmail: {
      type: Boolean,
      default: true
    },
    showResults: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for results with percentages
pollSchema.virtual('results').get(function() {
  if (!this.options || this.totalVotes === 0) {
    return this.options?.map(option => ({
      id: option.id,
      text: option.text,
      votes: option.votes || 0,
      percentage: 0
    })) || [];
  }

  return this.options.map(option => ({
    id: option.id,
    text: option.text,
    votes: option.votes || 0,
    percentage: this.totalVotes > 0 ? Math.round((option.votes / this.totalVotes) * 100) : 0
  }));
});

// Index for performance
pollSchema.index({ isActive: 1, createdAt: -1 });
pollSchema.index({ createdAt: -1 });

// Pre-save middleware to generate option IDs and validate
pollSchema.pre('save', function(next) {
  if (this.isNew || this.isModified('options')) {
    // Generate IDs for options if not provided
    this.options.forEach((option, index) => {
      if (!option.id) {
        option.id = `option_${Date.now()}_${index}`;
      }
    });

    // Validate unique option texts
    const optionTexts = this.options.map(opt => opt.text.toLowerCase().trim());
    const uniqueTexts = new Set(optionTexts);
    if (uniqueTexts.size !== optionTexts.length) {
      return next(new Error('Poll options must have unique text'));
    }
  }
  next();
});

// Instance methods
pollSchema.methods.addVote = function(optionId) {
  const option = this.options.find(opt => opt.id === optionId);
  if (option) {
    option.votes = (option.votes || 0) + 1;
    this.totalVotes = (this.totalVotes || 0) + 1;
    return true;
  }
  return false;
};

pollSchema.methods.getResults = function() {
  return this.results;
};

pollSchema.methods.isValidOption = function(optionId) {
  return this.options.some(opt => opt.id === optionId);
};

// Static methods
pollSchema.statics.findActive = function() {
  return this.find({ isActive: true }).sort({ createdAt: -1 });
};

pollSchema.statics.findById = function(id) {
  return this.findOne({ _id: id });
};

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
