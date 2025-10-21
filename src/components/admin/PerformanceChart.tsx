import { Card } from "@/components/ui/card";

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
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-semibold">Performance Trends</h3>
          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary"></div>
              <span>Performance Score</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Tasks Completed</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{item.month}</span>
                <div className="flex gap-4 text-xs text-muted-foreground">
                  <span>Score: {item.performance}</span>
                  <span>Tasks: {item.tasks}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all"
                    style={{ width: `${(item.performance / maxPerformance) * 100}%` }}
                  />
                </div>
                <div className="bg-secondary h-4 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all"
                    style={{ width: `${(item.tasks / maxTasks) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
