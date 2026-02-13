const Task = require('../models/Task');
const Evaluation = require('../models/Evaluation');

/**
 * Generate Automated Performance Evaluation
 * Formula: (Task Completion Rate * 0.40) + (On-Time Delivery * 0.40) + (Communication Score * 0.20)
 */
exports.generateAutomatedEvaluation = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  // Fetch all tasks assigned to this employee during the month
  const tasks = await Task.find({
    assignedTo: userId,
    $or: [
      { createdAt: { $gte: startDate, $lte: endDate } },
      { completedAt: { $gte: startDate, $lte: endDate } }
    ]
  });

  const totalTasks = tasks.length;

  // --- A. Task Completion Rate (40%) ---
  // Percentage of assigned tasks completed within the month
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  // --- B. On-Time Delivery (40%) ---
  // Tasks delivered on time without delay
  // Formula: (Tasks Delivered On Time / Total Completed Tasks WITH DEADLINES) * 100
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  }).length;
  
  // Only count completed tasks that HAD deadlines
  const completedTasksWithDeadlines = tasks.filter(t => 
    t.status === 'completed' && t.deadline
  ).length;
  
  // If no tasks with deadlines, assume 100% compliance
  const onTimeRate = completedTasksWithDeadlines === 0 ? 100 : (onTimeTasks / completedTasksWithDeadlines) * 100;

  // --- C. Communication Score (20%) ---
  // Calculate based on consistent use of 'Report Progress' feature
  // Reward employees who submit daily/regular progress updates, upload evidence, maintain audit trail
  const tasksWithQualityUpdates = tasks.filter(t => {
    if (!t.progressUpdates || t.progressUpdates.length === 0) return false;
    
    // Calculate task duration in days
    const endDate = t.completedAt ? new Date(t.completedAt) : new Date();
    const startDate = new Date(t.createdAt);
    const daysActive = Math.max(1, Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)));
    
    // Quality criteria:
    // 1. For tasks > 5 days, require at least 1 update per 5 days
    const requiredUpdates = Math.max(1, Math.floor(daysActive / 5));
    const hasEnoughUpdates = t.progressUpdates.length >= requiredUpdates;
    
    // 2. Check for evidence (files/screenshots) - bonus for documentation
    const hasEvidence = t.progressUpdates.some(u => 
      u.attachments && u.attachments.length > 0
    );
    
    // Accept if either has enough updates OR has evidence
    return hasEnoughUpdates || hasEvidence;
  }).length;

  const communicationScore = totalTasks === 0 ? 0 : (tasksWithQualityUpdates / totalTasks) * 100;

  // --- FINAL WEIGHTED SCORE ---
  // (Task Completion Rate * 0.40) + (On-Time Delivery * 0.40) + (Communication Score * 0.20)
  const weightedCompletionScore = completionRate * 0.40;
  const weightedOnTimeScore = onTimeRate * 0.40;
  const weightedCommunicationScore = communicationScore * 0.20;
  const finalScore = weightedCompletionScore + weightedOnTimeScore + weightedCommunicationScore;

  // Determine Rating Label
  let ratingLabel = 'Needs Improvement';
  if (finalScore >= 90) ratingLabel = 'Excellent';
  else if (finalScore >= 75) ratingLabel = 'Good';
  else if (finalScore >= 60) ratingLabel = 'Average';

  // Return evaluation data
  return {
    score: Math.round(finalScore),
    rating: ratingLabel,
    details: {
      // Raw percentages
      taskCompletionRate: Math.round(completionRate * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      communicationScore: Math.round(communicationScore * 10) / 10,
      
      // Weighted contributions
      weightedCompletionScore: Math.round(weightedCompletionScore * 10) / 10,
      weightedOnTimeScore: Math.round(weightedOnTimeScore * 10) / 10,
      weightedCommunicationScore: Math.round(weightedCommunicationScore * 10) / 10,
      
      // Raw values
      taskCompletionRawValue: completedTasks,
      onTimeRawValue: onTimeTasks,
      communicationRawValue: tasksWithQualityUpdates,
      totalTasks,
      completedTasks,
      onTimeTasks,
      tasksWithUpdates: tasksWithQualityUpdates,
      completedTasksWithDeadlines
    },
    comments: `Automated evaluation for ${month}/${year}. Completion: ${Math.round(completionRate)}%, On-Time: ${Math.round(onTimeRate)}%, Communication: ${Math.round(communicationScore)}%. Final Score: ${Math.round(finalScore)}/100 - ${ratingLabel}.`,
    type: 'Automated',
    month,
    year
  };
};
