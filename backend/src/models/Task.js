const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Task title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigned user is required']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigner is required']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  deadline: {
    type: Date
  },
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  difficulty: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  progressUpdates: [{
    percentage: { type: Number, required: true, min: 0, max: 100 },
    comment: { type: String },
    strategy: { type: String },
    blockers: { type: String },
    attachments: [{
      filename: String,
      originalName: String,
      path: String,
      mimetype: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    updatedAt: { type: Date, default: Date.now }
  }],
  currentProgress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  progressRating: {
    type: Number,
    min: 0,
    max: 10,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Task', taskSchema);
