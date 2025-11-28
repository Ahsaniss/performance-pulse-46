const Task = require('../models/Task');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const filter = req.query.employeeId ? { assignedTo: req.query.employeeId } : {};
    const tasks = await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort('-createdAt');
    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Create task
// @route   POST /api/tasks
// @access  Private/Admin
exports.createTask = async (req, res) => {
  try {
    const task = await Task.create({
      ...req.body,
      assignedBy: req.user.id
    });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
  try {
    if (req.body.status === 'completed' && !req.body.completedAt) {
      req.body.completedAt = new Date();
    }
    
    // Set startedAt if status changes to in-progress
    if (req.body.status === 'in-progress') {
      const currentTask = await Task.findById(req.params.id);
      if (currentTask && !currentTask.startedAt) {
        req.body.startedAt = new Date();
      }
    }

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Update task progress
// @route   POST /api/tasks/:id/progress
// @access  Private
exports.updateTaskProgress = async (req, res) => {
  try {
    const { percentage, comment, strategy, blockers } = req.body;
    const files = req.files || [];

    const attachments = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      mimetype: file.mimetype
    }));

    const update = {
      percentage: Number(percentage),
      comment,
      strategy,
      blockers,
      attachments,
      updatedAt: new Date()
    };

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    task.progressUpdates.push(update);
    task.currentProgress = Number(percentage);
    
    // Auto-update status based on progress
    if (Number(percentage) === 100) {
      task.status = 'completed';
      task.completedAt = new Date();
    } else if (Number(percentage) > 0 && task.status === 'pending') {
      task.status = 'in-progress';
      if (!task.startedAt) {
        task.startedAt = new Date();
      }
    }

    await task.save();

    res.json({ success: true, data: task });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
