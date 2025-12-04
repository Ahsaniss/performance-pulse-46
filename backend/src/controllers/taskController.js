const taskService = require('../services/taskService');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
  try {
    const filter = req.query.employeeId ? { assignedTo: req.query.employeeId } : {};
    const tasks = await taskService.getTasks(filter);
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
    const task = await taskService.getTaskById(req.params.id);
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
    const task = await taskService.createTask({
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
    const task = await taskService.updateTask(req.params.id, req.body);

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

    const task = await taskService.updateTaskProgress(req.params.id, {
      percentage,
      comment,
      strategy,
      blockers,
      files
    });

    res.json({ success: true, data: task });
  } catch (error) {
    if (error.message === 'Task not found') {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private/Admin
exports.deleteTask = async (req, res) => {
  try {
    const task = await taskService.deleteTask(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }
    res.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};
