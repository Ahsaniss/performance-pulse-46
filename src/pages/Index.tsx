import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Users, BarChart3, Shield } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-4xl w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <h1 className="text-6xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            HRM Performance System
          </h1>
          <p className="text-xl text-muted-foreground">
            Complete Performance Evaluation & Employee Management Platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <Card 
            className="p-8 bg-card border-border hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => navigate("/admin")}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-primary/10 rounded-lg group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Admin Dashboard</h2>
              <p className="text-muted-foreground">
                Manage employees, track performance, and assign tasks
              </p>
              <Button className="w-full">Access Admin</Button>
            </div>
          </Card>

          <Card 
            className="p-8 bg-card border-border hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => navigate("/employee")}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-secondary/10 rounded-lg group-hover:scale-110 transition-transform">
                <Users className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="text-2xl font-bold">Employee Portal</h2>
              <p className="text-muted-foreground">
                View your tasks, performance, and team updates
              </p>
              <Button variant="secondary" className="w-full">Employee Login</Button>
            </div>
          </Card>

          <Card 
            className="p-8 bg-card border-border hover:shadow-glow transition-all duration-300 cursor-pointer group"
            onClick={() => navigate("/evaluation")}
          >
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-chart-3/10 rounded-lg group-hover:scale-110 transition-transform">
                <BarChart3 className="w-8 h-8 text-chart-3" />
              </div>
              <h2 className="text-2xl font-bold">Performance Evaluation</h2>
              <p className="text-muted-foreground">
                Complete evaluation reports and analytics
              </p>
              <Button variant="outline" className="w-full">View Reports</Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;
