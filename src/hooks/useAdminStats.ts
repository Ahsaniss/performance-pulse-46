import { useMemo } from 'react';

export const useAdminStats = (tasks: any[], employees: any[], evaluations: any[]) => {
  return useMemo(() => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const completedToday = tasks.filter((t: any) => {
      if (t.status !== 'completed' || !t.updatedAt) return false;
      const updatedDate = new Date(t.updatedAt);
      return updatedDate >= todayStart;
    });
    
    const pending = tasks.filter((t: any) => t.status !== 'completed');
    
    // Calculate average performance from evaluations
    let avgScore = '0.0';
    if (employees.length > 0 && evaluations.length > 0) {
      const employeeScores = employees.map(emp => {
        const empEvaluations = evaluations.filter((e: any) => 
          (e.employeeId?._id || e.employeeId) === emp.id
        );
        if (empEvaluations.length === 0) return 0;
        const avgEmpScore = empEvaluations.reduce((sum: number, e: any) => sum + (e.overallScore || 0), 0) / empEvaluations.length;
        return avgEmpScore;
      });
      const totalAvg = employeeScores.reduce((a, b) => a + b, 0) / employees.length;
      avgScore = totalAvg.toFixed(1);
    }
    
    return {
      completedTasksToday: completedToday.length,
      pendingTasks: pending.length,
      avgPerformance: avgScore,
    };
  }, [tasks, employees, evaluations]);
};
