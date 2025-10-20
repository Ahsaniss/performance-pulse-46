import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingUp, Calendar } from "lucide-react";
import { PersonalPerformanceChart } from "@/components/employee/PersonalPerformanceChart";
import { TaskList } from "@/components/employee/TaskList";

const EmployeeDashboard = () => {
  const employeeName = "John Smith";
  const department = "Engineering";

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Welcome back, {employeeName}
            </h1>
            <p className="text-muted-foreground mt-2">{department} Department</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Clock className="w-4 h-4 mr-2" />
              Check In
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <h3 className="text-3xl font-bold mt-2">12</h3>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <h3 className="text-3xl font-bold mt-2">5</h3>
              </div>
              <div className="p-3 bg-chart-4/10 rounded-lg">
                <Clock className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <h3 className="text-3xl font-bold mt-2">4.5</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Meetings</p>
                <h3 className="text-3xl font-bold mt-2">8</h3>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Calendar className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Performance Section */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-2xl font-bold mb-4">Your Performance Trend</h2>
          <PersonalPerformanceChart />
        </Card>

        {/* Tasks Section */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Your Tasks</h2>
            <Badge className="bg-primary/10 text-primary">5 Active</Badge>
          </div>
          <TaskList />
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
