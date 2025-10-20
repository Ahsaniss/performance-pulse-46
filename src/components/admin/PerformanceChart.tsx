import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { week: "Week 1", overall: 3.8, engineering: 4.0, marketing: 3.9, sales: 3.5, hr: 4.1 },
  { week: "Week 2", overall: 4.0, engineering: 4.2, marketing: 4.0, sales: 3.7, hr: 4.2 },
  { week: "Week 3", overall: 4.2, engineering: 4.5, marketing: 4.1, sales: 3.8, hr: 4.3 },
];

export const PerformanceChart = () => {
  return (
    <Card className="p-6 bg-card border-border animate-slide-up">
      <h2 className="text-2xl font-bold mb-6">Department Performance Trends</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
          <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 5]} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)"
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="overall" 
            stroke="hsl(var(--primary))" 
            strokeWidth={3}
            name="Overall"
          />
          <Line 
            type="monotone" 
            dataKey="engineering" 
            stroke="hsl(var(--chart-2))" 
            strokeWidth={2}
            name="Engineering"
          />
          <Line 
            type="monotone" 
            dataKey="marketing" 
            stroke="hsl(var(--chart-3))" 
            strokeWidth={2}
            name="Marketing"
          />
          <Line 
            type="monotone" 
            dataKey="sales" 
            stroke="hsl(var(--chart-4))" 
            strokeWidth={2}
            name="Sales"
          />
          <Line 
            type="monotone" 
            dataKey="hr" 
            stroke="hsl(var(--chart-5))" 
            strokeWidth={2}
            name="HR"
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};
