import { Card } from "@/components/ui/card";
import { TrendingUp, Briefcase } from "lucide-react";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useTasks } from "@/hooks/useTasks";
import { useMemo } from "react";

interface PerformanceChartProps {
  employeeId: string;
}

export const PerformanceChart = ({ employeeId }: PerformanceChartProps) => {
  const { evaluations } = useEvaluations(employeeId);
  const { tasks } = useTasks(employeeId);

  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    
    // Initialize data for the last 6 months
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      last6Months.push({
        month: months[d.getMonth()],
        year: d.getFullYear(),
        monthIndex: d.getMonth(),
        performance: 0,
        tasks: 0,
        evalCount: 0
      });
    }

    // Aggregate evaluations
    evaluations.forEach(ev => {
      const date = new Date(ev.date);
      const monthIndex = date.getMonth();
      const year = date.getFullYear();
      
      const monthData = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
      if (monthData) {
        monthData.performance += ev.score; // Assuming score is out of 5 or normalized
        monthData.evalCount += 1;
      }
    });

    // Aggregate tasks
    tasks.forEach(task => {
      if (task.status === 'completed' && task.updatedAt) {
        const date = new Date(task.updatedAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        
        const monthData = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
        if (monthData) {
          monthData.tasks += 1;
        }
      }
    });

    // Calculate averages
    return last6Months.map(m => ({
      month: m.month,
      performance: m.evalCount > 0 ? Number((m.performance / m.evalCount).toFixed(1)) : 0,
      tasks: m.tasks
    }));
  }, [evaluations, tasks]);

  const maxPerformance = 5;
  const maxTasks = Math.max(...data.map((d) => d.tasks), 1); // Avoid division by zero

  return (
    <Card className="p-6">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-lg">Performance Trends</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="text-muted-foreground">Performance Score</span>
            </div>
            <div className="flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-blue-500" />
              <span className="text-muted-foreground">Tasks Completed</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{item.month}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {item.performance}
                  </span>
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3" />
                    {item.tasks}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">
                    Performance
                  </span>
                  <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-primary to-primary/80 h-full flex items-center justify-end px-2 transition-all duration-500"
                      style={{
                        width: `${(item.performance / maxPerformance) * 100}%`,
                      }}
                    >
                      <span className="text-xs font-semibold text-primary-foreground">
                        {item.performance}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-24">Tasks</span>
                  <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-blue-400 h-full flex items-center justify-end px-2 transition-all duration-500"
                      style={{ width: `${(item.tasks / maxTasks) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {item.tasks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
