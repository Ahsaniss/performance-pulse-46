const Message = require('../models/Message');

// @desc    Get all messages for a user
// @route   GET /api/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const otherUserId = req.query.userId;
    const currentUserId = req.user.id;
    
    let query;

    // If a specific user ID is provided (and it's not the current user), 
    // fetch conversation between current user and that user
    if (otherUserId && otherUserId !== currentUserId) {
      query = {
        $or: [
          { from: currentUserId, to: otherUserId },
          { from: otherUserId, to: currentUserId }
        ]
      };
    } else {
      // Otherwise fetch all messages for the current user (Inbox)
      query = {
        $or: [
          { to: currentUserId },
          { to: 'all' },
          { from: currentUserId }
        ]
      };
    }

    const messages = await Message.find(query)
    .populate('from', 'name email')
    .sort('createdAt'); // Sort by oldest first for chat history, or newest for inbox? 
    // Chat usually needs oldest first to render top-down, but we can sort in frontend.
    // Let's keep it consistent with previous behavior or standard chat.
    // Previous was .sort('-createdAt') (newest first).
    // For chat UI, we usually want oldest at top, newest at bottom.
    // But let's stick to -createdAt and let frontend reverse it if needed, 
    // OR change to createdAt for easier chat rendering.
    // The frontend sorts it: .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    // So backend sort doesn't matter much, but let's keep it -createdAt for consistency with other endpoints.
    
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Send message
// @route   POST /api/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    let attachments = [];
    if (req.files && req.files.length > 0) {
      attachments = req.files.map(file => ({
        filename: file.filename,
        path: `/uploads/${file.filename}`,
        mimetype: file.mimetype,
        originalName: file.originalname
      }));
    }

    const messageData = {
      ...req.body,
      from: req.user.id,
      attachments
    };

    const message = await Message.create(messageData);
    
    // Populate sender info for real-time update
    const populatedMessage = await Message.findById(message._id).populate('from', 'name email');

    // Socket.io - Real-time update
    const io = req.app.get('io');
    if (io) {
      if (message.to === 'all') {
        io.emit('receive_message', populatedMessage);
      } else {
        // Emit to specific user room
        io.to(message.to).emit('receive_message', populatedMessage);
        // Also emit to sender so they see it immediately (optional if frontend handles optimistic UI)
        io.to(req.user.id).emit('receive_message', populatedMessage);
      }
    }

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Mark message as read
// @route   PUT /api/messages/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, data: message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private
exports.deleteMessage = async (req, res) => {
  try {
    const message = await Message.findByIdAndDelete(req.params.id);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }
    res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
