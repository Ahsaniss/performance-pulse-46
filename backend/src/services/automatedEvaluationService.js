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
  // Formula: (Tasks Delivered On Time / Total Completed Tasks) * 100
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  }).length;
  
  const onTimeRate = completedTasks === 0 ? 0 : (onTimeTasks / completedTasks) * 100;

  // --- C. Communication Score (20%) ---
  // Calculate based on consistent use of 'Report Progress' feature
  // Reward employees who submit daily/regular progress updates, upload evidence, maintain audit trail
  const tasksWithUpdates = tasks.filter(t => {
    return t.progressUpdates && t.progressUpdates.length > 0;
  }).length;

  const communicationScore = totalTasks === 0 ? 0 : (tasksWithUpdates / totalTasks) * 100;

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
      communicationRawValue: tasksWithUpdates,
      totalTasks,
      completedTasks,
      onTimeTasks,
      tasksWithUpdates
    },
    comments: `Automated evaluation for ${month}/${year}. Completion: ${Math.round(completionRate)}%, On-Time: ${Math.round(onTimeRate)}%, Communication: ${Math.round(communicationScore)}%. Final Score: ${Math.round(finalScore)}/100 - ${ratingLabel}.`,
    type: 'Automated',
    month,
    year
  };
};
