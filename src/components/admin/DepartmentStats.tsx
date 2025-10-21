import { Card } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { useMemo } from "react";
import { TrendingUp, Users, Briefcase } from "lucide-react";

export const DepartmentStats = () => {
  const { employees } = useEmployees();

  const departmentData = useMemo(() => {
    const deptMap = new Map<string, { employees: number; tasks: number; satisfaction: number }>();

    employees.forEach(emp => {
      const current = deptMap.get(emp.department) || { employees: 0, tasks: 0, satisfaction: 0 };
      deptMap.set(emp.department, {
        employees: current.employees + 1,
        tasks: current.tasks + Math.floor(Math.random() * 5 + 3),
        satisfaction: current.satisfaction + emp.performanceScore,
      });
    });

    return Array.from(deptMap.entries()).map(([department, stats]) => ({
      department,
      employees: stats.employees,
      tasks: stats.tasks,
      satisfaction: stats.employees > 0 ? Number((stats.satisfaction / stats.employees).toFixed(1)) : 0,
    }));
  }, [employees]);

  const maxEmployees = Math.max(...departmentData.map(d => d.employees), 1);
  const maxTasks = Math.max(...departmentData.map(d => d.tasks), 1);

  if (departmentData.length === 0) {
    return (
      <Card className="p-12 text-center">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-4">Department Overview</h2>
        <p className="text-muted-foreground">No department data available. Add employees to see statistics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Department Overview</h2>
        </div>
        
        <div className="space-y-6">
          {departmentData.map((dept) => (
            <div key={dept.department} className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-lg">{dept.department}</span>
                <span className="text-sm text-muted-foreground">
                  {dept.employees} employees • {dept.tasks} tasks
                </span>
              </div>
              
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Employee Count
                    </span>
                    <span className="text-sm font-semibold">{dept.employees}</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full transition-all duration-500 ease-out"
                      style={{ width: `${(dept.employees / maxEmployees) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Active Tasks
                    </span>
                    <span className="text-sm font-semibold">{dept.tasks}</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${(dept.tasks / maxTasks) * 100}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Avg Performance
                    </span>
                    <span className="text-sm font-semibold">{dept.satisfaction}/5.0</span>
                  </div>
                  <div className="w-full bg-secondary h-3 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full transition-all duration-500 ease-out"
                      style={{ width: `${(dept.satisfaction / 5) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departmentData.map((dept) => (
          <Card key={dept.department} className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300 hover:scale-105">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              {dept.department}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="font-semibold text-lg">{dept.employees}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Performance</span>
                <span className="font-semibold text-lg text-primary">{dept.satisfaction}/5.0</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Active Tasks</span>
                <span className="font-semibold text-lg">{dept.tasks}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
