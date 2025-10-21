import { Card } from "@/components/ui/card";
import { TrendingUp, Briefcase } from "lucide-react";

interface PerformanceChartProps {
  employeeId: string;
}

export const PerformanceChart = ({ employeeId }: PerformanceChartProps) => {
  const data = [
    { month: "Jan", performance: 4.2, tasks: 8 },
    { month: "Feb", performance: 4.3, tasks: 10 },
    { month: "Mar", performance: 4.5, tasks: 12 },
    { month: "Apr", performance: 4.4, tasks: 11 },
    { month: "May", performance: 4.6, tasks: 14 },
    { month: "Jun", performance: 4.5, tasks: 13 },
  ];

  const maxPerformance = 5;
  const maxTasks = Math.max(...data.map((d) => d.tasks));

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
