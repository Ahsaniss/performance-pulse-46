import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TrendingUp, TrendingDown } from "lucide-react";

const mockEmployees = [
  { id: 1, name: "John Smith", department: "Engineering", satisfaction: 4.5, trend: "up" },
  { id: 2, name: "Sarah Johnson", department: "Marketing", satisfaction: 4.2, trend: "up" },
  { id: 3, name: "Michael Chen", department: "Sales", satisfaction: 3.8, trend: "down" },
  { id: 4, name: "Emily Davis", department: "Engineering", satisfaction: 4.7, trend: "up" },
  { id: 5, name: "David Wilson", department: "HR", satisfaction: 4.1, trend: "up" },
  { id: 6, name: "Lisa Anderson", department: "Marketing", satisfaction: 3.9, trend: "down" },
];

export const EmployeeList = () => {
  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("");
  };

  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return "text-chart-3";
    if (score >= 4.0) return "text-chart-2";
    if (score >= 3.5) return "text-chart-4";
    return "text-chart-5";
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
      {mockEmployees.map((employee) => (
        <Card 
          key={employee.id}
          className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300 cursor-pointer group"
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(employee.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {employee.name}
              </h3>
              <p className="text-sm text-muted-foreground">{employee.department}</p>
              <div className="flex items-center gap-2 mt-3">
                <span className={`text-2xl font-bold ${getSatisfactionColor(employee.satisfaction)}`}>
                  {employee.satisfaction}
                </span>
                {employee.trend === "up" ? (
                  <TrendingUp className="w-5 h-5 text-chart-3" />
                ) : (
                  <TrendingDown className="w-5 h-5 text-chart-5" />
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
