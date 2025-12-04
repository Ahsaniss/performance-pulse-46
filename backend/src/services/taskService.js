const Task = require('../models/Task');

class TaskService {
  async getTasks(filter) {
    return await Task.find(filter)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email')
      .sort('-createdAt');
  }

  async getTaskById(id) {
    return await Task.findById(id)
      .populate('assignedTo', 'name email')
      .populate('assignedBy', 'name email');
  }

  async createTask(data) {
    return await Task.create(data);
  }

  async updateTask(id, data) {
    if (data.status === 'completed' && !data.completedAt) {
      data.completedAt = new Date();
    }
    
    // Set startedAt if status changes to in-progress
    if (data.status === 'in-progress') {
      const currentTask = await Task.findById(id);
      if (currentTask && !currentTask.startedAt) {
        data.startedAt = new Date();
      }
    }

    return await Task.findByIdAndUpdate(
      id,
      data,
      { new: true, runValidators: true }
    );
  }

  async updateTaskProgress(id, { percentage, comment, strategy, blockers, files }) {
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

    const task = await Task.findById(id);
    if (!task) {
      throw new Error('Task not found');
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
    return task;
  }

  async deleteTask(id) {
    return await Task.findByIdAndDelete(id);
  }
}

module.exports = new TaskService();
