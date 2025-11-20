const mongoose = require('mongoose');

const evaluationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required']
  },
  evaluatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Evaluator is required']
  },
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: 0,
    max: 100
  },
  date: {
    type: Date,
    default: Date.now
  },
  comments: {
    type: String,
    trim: true
  },
  categories: {
    productivity: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    quality: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    teamwork: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    communication: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  meetingsHeld: {
    type: Number,
    default: 0
  },
  trainingApplied: {
    type: Number,
    default: 0
  },
  outcomeSummary: {
    type: String,
    trim: true
  },
  previousWork: [{
    type: String
  }],
  satisfactionScore: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Evaluation', evaluationSchema);
