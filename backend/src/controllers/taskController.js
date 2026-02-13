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
    // First get the task to check ownership
    const existingTask = await taskService.getTaskById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Only admin or assigned user can update
    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = existingTask.assignedTo.toString() === req.user.id;
    
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this task' 
      });
    }

    // Whitelist allowed fields
    const allowedFields = ['title', 'description', 'status', 'priority', 'deadline', 'difficulty'];
    const updates = {};
    
    // Only allow certain fields for non-admin users
    if (!isAdmin) {
      const userAllowedFields = ['status']; // Regular users can only update status
      Object.keys(req.body).forEach(key => {
        if (userAllowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      });
    } else {
      // Admin can update all allowed fields
      Object.keys(req.body).forEach(key => {
        if (allowedFields.includes(key)) {
          updates[key] = req.body[key];
        }
      });
    }

    const task = await taskService.updateTask(req.params.id, updates);

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
    // Get task to verify ownership
    const existingTask = await taskService.getTaskById(req.params.id);
    
    if (!existingTask) {
      return res.status(404).json({ success: false, message: 'Task not found' });
    }

    // Authorization: Only assigned user or admin can update progress
    const isAdmin = req.user.role === 'admin';
    const isAssignedUser = existingTask.assignedTo.toString() === req.user.id;
    
    if (!isAdmin && !isAssignedUser) {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update progress for this task' 
      });
    }

    const { percentage, comment, strategy, blockers, tags, kpiMetrics, aiSuggestion, estimatedCompletion } = req.body;
    const files = req.files || [];

    // Parse JSON fields that may come as strings from FormData
    let parsedTags = [];
    let parsedKpiMetrics = [];
    try {
      parsedTags = typeof tags === 'string' ? JSON.parse(tags) : (tags || []);
    } catch (e) { parsedTags = []; }
    try {
      parsedKpiMetrics = typeof kpiMetrics === 'string' ? JSON.parse(kpiMetrics) : (kpiMetrics || []);
    } catch (e) { parsedKpiMetrics = []; }

    const task = await taskService.updateTaskProgress(req.params.id, {
      percentage,
      comment,
      strategy,
      blockers,
      files,
      tags: parsedTags,
      kpiMetrics: parsedKpiMetrics,
      aiSuggestion: aiSuggestion || '',
      estimatedCompletion: estimatedCompletion || ''
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
