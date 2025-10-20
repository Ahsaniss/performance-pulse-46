import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

const data = [
  { department: "Engineering", employees: 8, satisfaction: 4.5, tasks: 24 },
  { department: "Marketing", employees: 6, satisfaction: 4.1, tasks: 18 },
  { department: "Sales", employees: 7, satisfaction: 3.8, tasks: 21 },
  { department: "HR", employees: 3, satisfaction: 4.3, tasks: 9 },
];

export const DepartmentStats = () => {
  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-2xl font-bold mb-6">Department Overview</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="department" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: "hsl(var(--card))", 
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)"
              }}
            />
            <Legend />
            <Bar dataKey="employees" fill="hsl(var(--primary))" name="Employees" />
            <Bar dataKey="tasks" fill="hsl(var(--secondary))" name="Active Tasks" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {data.map((dept) => (
          <Card key={dept.department} className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <h3 className="font-semibold text-lg mb-4">{dept.department}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="font-semibold">{dept.employees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Satisfaction</span>
                <span className="font-semibold text-primary">{dept.satisfaction}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="font-semibold">{dept.tasks}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
