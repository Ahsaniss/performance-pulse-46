const Meeting = require('../models/Meeting');

// @desc    Get all meetings
// @route   GET /api/meetings
// @access  Private
exports.getMeetings = async (req, res) => {
  try {
    let query = {};

    // If user is NOT admin, restrict to their meetings
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { scheduledBy: req.user.id },
          { attendees: req.user.id }
        ]
      };
    }
    // If user IS admin, check if they want to filter by a specific user
    else if (req.query.userId) {
      query = {
        $or: [
          { scheduledBy: req.query.userId },
          { attendees: req.query.userId }
        ]
      };
    }
    // If admin and no userId param, query remains {} (fetch all)

    const meetings = await Meeting.find(query)
    .populate('scheduledBy', 'name email')
    .populate('attendees', 'name email')
    .sort('-date');
    res.json({ success: true, data: meetings });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single meeting
// @route   GET /api/meetings/:id
// @access  Private
exports.getMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('scheduledBy', 'name email')
      .populate('attendees', 'name email');
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create meeting
// @route   POST /api/meetings
// @access  Private/Admin
exports.createMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.create({
      ...req.body,
      scheduledBy: req.user.id
    });
    res.status(201).json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update meeting
// @route   PUT /api/meetings/:id
// @access  Private/Admin
exports.updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, data: meeting });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete meeting
// @route   DELETE /api/meetings/:id
// @access  Private/Admin
exports.deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findByIdAndDelete(req.params.id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: 'Meeting not found' });
    }
    res.json({ success: true, message: 'Meeting deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
