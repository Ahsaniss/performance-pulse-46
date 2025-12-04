const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Sender is required']
  },
  to: {
    type: String, // Can be 'all' for broadcast or ObjectId for individual
    required: [true, 'Recipient is required']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  attachments: [{
    filename: String,
    path: String,
    mimetype: String,
    originalName: String
  }],
  read: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    enum: ['individual', 'broadcast'],
    default: 'individual'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Message', messageSchema);
