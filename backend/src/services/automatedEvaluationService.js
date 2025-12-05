const Task = require('../models/Task');
const Evaluation = require('../models/Evaluation');

exports.generateAutomatedEvaluation = async (userId, month, year) => {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  endDate.setHours(23, 59, 59, 999);

  // 1. Fetch Tasks active in this period
  // We consider tasks created in this month or completed in this month
  const tasks = await Task.find({
    assignedTo: userId,
    $or: [
      { createdAt: { $gte: startDate, $lte: endDate } },
      { completedAt: { $gte: startDate, $lte: endDate } }
    ]
  });

  const totalTasks = tasks.length;

  // --- A. Task Completion Score (40%) ---
  // Tasks that are completed (regardless of when they were created, if they were active/completed in this window)
  // Or strictly tasks assigned in this window? The prompt says "percentage of assigned tasks completed within the month".
  // Let's stick to tasks found by the query above.
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = totalTasks === 0 ? 0 : (completedTasks / totalTasks) * 100;

  // --- B. On-Time Delivery Score (40%) ---
  // Measure deadlines met without delay.
  // Formula: (Tasks Delivered On Time / Total Completed Tasks) * 100.
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  }).length;
  
  const onTimeRate = completedTasks === 0 ? 0 : (onTimeTasks / completedTasks) * 100;

  // --- C. Communication Score (30%) ---
  // Calculate based on how consistently the employee uses the 'Report Progress' feature.
  // Logic: A task is "Communicated" if the employee added at least 1 update (comment or file)
  const tasksWithUpdates = tasks.filter(t => {
    return t.progressUpdates && t.progressUpdates.length > 0;
  }).length;

  const communicationScore = totalTasks === 0 ? 0 : (tasksWithUpdates / totalTasks) * 100;

  // --- D. Admin Rating Score (10%) ---
  // Based on admin rating (0-10) for each task
  const totalRating = tasks.reduce((sum, t) => sum + (t.progressRating || 0), 0);
  // Calculate percentage: (Total Rating / (Total Tasks * 10)) * 100
  const adminRatingScore = totalTasks === 0 ? 0 : (totalRating / (totalTasks * 10)) * 100;

  // --- FINAL WEIGHTED SCORE ---
  // (Task Completion Rate * 0.30) + (On-Time Delivery * 0.30) + (Communication Score * 0.30) + (Admin Rating Score * 0.10)
  const finalScore = (completionRate * 0.3) + (onTimeRate * 0.3) + (communicationScore * 0.3) + (adminRatingScore * 0.1);

  // Determine Rating Label
  let ratingLabel = 'Needs Improvement';
  if (finalScore >= 90) ratingLabel = 'Excellent';
  else if (finalScore >= 75) ratingLabel = 'Good';
  else if (finalScore >= 60) ratingLabel = 'Average';

  // Save to DB
  // We need an 'evaluatedBy' field. Since this is automated, we might need a system user or just use the user themselves or null if schema allows.
  // The schema says 'evaluatedBy' is required. We should probably use the admin who triggered it, or make it optional.
  // For now, I will assume the controller passes the admin ID who triggered the generation.
  
  return {
    score: Math.round(finalScore),
    rating: ratingLabel,
    details: {
      taskCompletionRate: Math.round(completionRate),
      onTimeRate: Math.round(onTimeRate),
      communicationScore: Math.round(communicationScore),
      adminRatingScore: Math.round(adminRatingScore),
      totalTasks,
      completedTasks,
      tasksWithUpdates,
      averageAdminRating: totalTasks > 0 ? (totalRating / totalTasks).toFixed(1) : 0
    },
    feedback: `System Generated: ${ratingLabel}. Updates: ${tasksWithUpdates}/${totalTasks}. Avg Rating: ${(totalRating / (totalTasks || 1)).toFixed(1)}/10.`,
    type: 'Automated',
    month,
    year
  };
};
