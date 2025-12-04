import { useMemo } from 'react';

export const useAdminStats = (tasks: any[], employees: any[]) => {
  return useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const completedToday = tasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updatedAt) return false;
      const updatedDate = new Date(t.updatedAt);
      return updatedDate >= todayStart;
    });
    
    const pending = tasks.filter((t: any) => t.status !== 'completed');
    
    const avgScore = employees.length > 0
      ? (employees.reduce((acc, p) => acc + (p.performanceScore || 0), 0) / employees.length).toFixed(1)
      : '0.0';
    
    return {
      completedTasksToday: completedToday.length,
      pendingTasks: pending.length,
      avgPerformance: avgScore,
    };
  }, [tasks, employees]);
};
