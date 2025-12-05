import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useTasks } from "@/hooks/useTasks";
import { useMemo } from "react";
import { 
  ComposedChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Area
} from "recharts";

interface PerformanceChartProps {
  employeeId: string;
}

export const PerformanceChart = ({ employeeId }: PerformanceChartProps) => {
  const { evaluations } = useEvaluations(employeeId);
  const { tasks } = useTasks(employeeId);

  const data = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
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
        completed: 0,
        pending: 0,
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
        monthData.performance += ev.score;
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
          monthData.completed += 1;
        }
      } else if ((task.status === 'pending' || task.status === 'in-progress') && task.createdAt) {
        const date = new Date(task.createdAt);
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        
        const monthData = last6Months.find(m => m.monthIndex === monthIndex && m.year === year);
        if (monthData) {
          monthData.pending += 1;
        }
      }
    });

    // Calculate averages
    return last6Months.map(m => ({
      month: m.month,
      performance: m.evalCount > 0 ? Number((m.performance / m.evalCount).toFixed(1)) : null,
      completed: m.completed,
      pending: m.pending
    }));
  }, [evaluations, tasks]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg outline-none">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-medium">{entry.value ?? 'No Data'}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Performance Trends</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 20, right: 20, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                dy={10}
              />
              <YAxis 
                yAxisId="left"
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
                domain={[0, 100]}
                tickCount={6}
              />
              <YAxis 
                yAxisId="right" 
                orientation="right" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--muted-foreground))' }} 
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
              
              <Bar 
                yAxisId="right"
                dataKey="completed" 
                name="Completed Tasks" 
                fill="#3b82f6" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
              <Bar 
                yAxisId="right"
                dataKey="pending" 
                name="Pending Tasks" 
                fill="#f59e0b" 
                radius={[4, 4, 0, 0]} 
                barSize={20}
              />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="performance"
                name="Performance Score"
                stroke="#8b5cf6"
                fillOpacity={1}
                fill="url(#colorPerformance)"
                strokeWidth={3}
                connectNulls
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="performance"
                stroke="#8b5cf6"
                strokeWidth={3}
                dot={{ r: 4, fill: "#8b5cf6", strokeWidth: 2, stroke: "#fff" }}
                activeDot={{ r: 6 }}
                hide // Hide line in legend, show area
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};

