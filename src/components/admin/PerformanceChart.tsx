import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

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

  return (
    <Card className="p-6">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="performance" stroke="hsl(var(--primary))" strokeWidth={2} name="Performance Score" />
          <Line type="monotone" dataKey="tasks" stroke="hsl(var(--secondary))" strokeWidth={2} name="Tasks Completed" />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
