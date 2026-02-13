/**
 * Shared Performance Calculation Utility
 * Ensures consistent scoring across the entire application
 */

/**
 * Calculate performance score using standardized formula
 * Formula: (Task Completion * 0.40) + (On-Time Delivery * 0.40) + (Communication * 0.20)
 * 
 * @param tasks - Array of tasks for the employee
 * @returns Object containing score and detailed breakdown
 */
export const calculatePerformanceScore = (tasks: any[]) => {
  const totalTasks = tasks.length;

  if (totalTasks === 0) {
    return {
      score: 0,
      details: {
        taskCompletionRate: 0,
        onTimeRate: 0,
        communicationScore: 0,
        weightedCompletionScore: 0,
        weightedOnTimeScore: 0,
        weightedCommunicationScore: 0,
        totalTasks: 0,
        completedTasks: 0,
        onTimeTasks: 0,
        tasksWithQualityUpdates: 0
      }
    };
  }

  // A. Task Completion Rate (40%)
  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const completionRate = (completedTasks / totalTasks) * 100;

  // B. On-Time Delivery (40%)
  const onTimeTasks = tasks.filter(t => {
    if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
    return new Date(t.completedAt) <= new Date(t.deadline);
  }).length;

  const completedWithDeadlines = tasks.filter(t => 
    t.status === 'completed' && t.deadline
  ).length;

  const onTimeRate = completedWithDeadlines === 0 
    ? 100 
    : (onTimeTasks / completedWithDeadlines) * 100;

  // C. Communication Score (20%)
  const tasksWithQualityUpdates = tasks.filter(t => {
    if (!t.progressUpdates || t.progressUpdates.length === 0) return false;
    
    const endDate = t.completedAt ? new Date(t.completedAt) : new Date();
    const startDate = new Date(t.createdAt);
    const daysActive = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    
    const requiredUpdates = Math.max(1, Math.floor(daysActive / 5));
    const hasEnoughUpdates = t.progressUpdates.length >= requiredUpdates;
    
    const hasEvidence = t.progressUpdates.some((u: any) => 
      u.attachments && u.attachments.length > 0
    );
    
    return hasEnoughUpdates || hasEvidence;
  }).length;

  const communicationScore = (tasksWithQualityUpdates / totalTasks) * 100;

  // Final Weighted Score
  const weightedCompletionScore = completionRate * 0.40;
  const weightedOnTimeScore = onTimeRate * 0.40;
  const weightedCommunicationScore = communicationScore * 0.20;
  const finalScore = weightedCompletionScore + weightedOnTimeScore + weightedCommunicationScore;

  return {
    score: Math.round(finalScore),
    details: {
      taskCompletionRate: Math.round(completionRate * 10) / 10,
      onTimeRate: Math.round(onTimeRate * 10) / 10,
      communicationScore: Math.round(communicationScore * 10) / 10,
      weightedCompletionScore: Math.round(weightedCompletionScore * 10) / 10,
      weightedOnTimeScore: Math.round(weightedOnTimeScore * 10) / 10,
      weightedCommunicationScore: Math.round(weightedCommunicationScore * 10) / 10,
      totalTasks,
      completedTasks,
      onTimeTasks,
      tasksWithQualityUpdates,
      completedWithDeadlines
    }
  };
};

/**
 * Get performance rating label based on score
 */
export const getPerformanceRating = (score: number): string => {
  if (score >= 90) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 60) return 'Average';
  return 'Needs Improvement';
};

/**
 * Format decimal precision consistently across the app
 */
export const formatMetric = (value: number, decimals: number = 1): string => {
  return (Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals)).toFixed(decimals);
};

/**
 * Safe date comparison with timezone handling
 */
export const isBeforeDeadline = (completedDate: Date | string, deadline: Date | string): boolean => {
  try {
    const completed = typeof completedDate === 'string' ? new Date(completedDate) : completedDate;
    const due = typeof deadline === 'string' ? new Date(deadline) : deadline;
    
    // Compare dates at the day level to avoid timezone issues
    completed.setHours(0, 0, 0, 0);
    due.setHours(23, 59, 59, 999);
    
    return completed <= due;
  } catch (error) {
    console.error('Date comparison error:', error);
    return false;
  }
};

/**
 * Calculate days between dates, allowing 0 for same-day
 */
export const calculateDaysBetween = (startDate: Date | string, endDate: Date | string): number => {
  try {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays); // Allow 0 for same-day completion
  } catch (error) {
    console.error('Date calculation error:', error);
    return 0;
  }
};
