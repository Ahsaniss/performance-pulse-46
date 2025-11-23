import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useAuth } from "@/contexts/AuthContext";
import { useMemo } from "react";

export const PersonalPerformanceChart = () => {
  const { user } = useAuth();
  const { evaluations } = useEvaluations(user?.id);

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

    // Calculate averages
    return last6Months.map(m => ({
      month: m.month,
      performance: m.evalCount > 0 ? Number((m.performance / m.evalCount).toFixed(1)) : null
    }));
  }, [evaluations]);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
        <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 5]} tickCount={6} />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "hsl(var(--card))", 
            border: "1px solid hsl(var(--border))",
            borderRadius: "var(--radius)"
          }}
          formatter={(value: number | null) => [value ? value : 'No Data', 'Score']}
        />
        <Line 
          connectNulls
          type="monotone" 
          dataKey="performance" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={{ fill: "hsl(var(--primary))", r: 6 }}
          activeDot={{ r: 8 }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
