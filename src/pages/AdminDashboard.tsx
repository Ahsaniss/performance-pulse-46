import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, TrendingUp, Award, Activity, BarChart3 } from "lucide-react";
import { EmployeeList } from "@/components/admin/EmployeeList";
import { PerformanceChart } from "@/components/admin/PerformanceChart";
import { DepartmentStats } from "@/components/admin/DepartmentStats";

const AdminDashboard = () => {
  const [selectedView, setSelectedView] = useState<"overview" | "employees" | "performance">("overview");

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-muted-foreground mt-2">Manage your organization's performance</p>
          </div>
          <Badge className="bg-primary text-primary-foreground px-4 py-2 text-sm">
            Admin Access
          </Badge>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <h3 className="text-3xl font-bold mt-2">24</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                <h3 className="text-3xl font-bold mt-2">4.2</h3>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Tasks</p>
                <h3 className="text-3xl font-bold mt-2">48</h3>
              </div>
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Activity className="w-6 h-6 text-chart-3" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Performers</p>
                <h3 className="text-3xl font-bold mt-2">8</h3>
              </div>
              <div className="p-3 bg-chart-4/10 rounded-lg">
                <Award className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2">
          <Button
            variant={selectedView === "overview" ? "default" : "outline"}
            onClick={() => setSelectedView("overview")}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button
            variant={selectedView === "employees" ? "default" : "outline"}
            onClick={() => setSelectedView("employees")}
          >
            <Users className="w-4 h-4 mr-2" />
            Employees
          </Button>
          <Button
            variant={selectedView === "performance" ? "default" : "outline"}
            onClick={() => setSelectedView("performance")}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Performance
          </Button>
        </div>

        {/* Content Area */}
        {selectedView === "overview" && <DepartmentStats />}
        {selectedView === "employees" && <EmployeeList />}
        {selectedView === "performance" && <PerformanceChart />}
      </div>
    </div>
  );
};

export default AdminDashboard;
