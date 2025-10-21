import { Card } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { useMemo } from "react";

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
        <h2 className="text-2xl font-bold mb-4">Department Overview</h2>
        <p className="text-muted-foreground">No department data available. Add employees to see statistics.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Card className="p-6 bg-card border-border">
        <h2 className="text-2xl font-bold mb-6">Department Overview</h2>
        
        <div className="space-y-6">
          {departmentData.map((dept) => (
            <div key={dept.department} className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold">{dept.department}</span>
                <span className="text-sm text-muted-foreground">
                  {dept.employees} employees, {dept.tasks} tasks
                </span>
              </div>
              
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">Employees</span>
                  <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                    <div 
                      className="bg-primary h-full flex items-center justify-end px-2 transition-all"
                      style={{ width: `${(dept.employees / maxEmployees) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-primary-foreground">
                        {dept.employees}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground w-20">Tasks</span>
                  <div className="flex-1 bg-secondary h-6 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full flex items-center justify-end px-2 transition-all"
                      style={{ width: `${(dept.tasks / maxTasks) * 100}%` }}
                    >
                      <span className="text-xs font-semibold text-white">
                        {dept.tasks}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {departmentData.map((dept) => (
          <Card key={dept.department} className="p-6 bg-card border-border hover:shadow-lg transition-all duration-300">
            <h3 className="font-semibold text-lg mb-4">{dept.department}</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Employees</span>
                <span className="font-semibold">{dept.employees}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Avg Performance</span>
                <span className="font-semibold text-primary">{dept.satisfaction}/5.0</span>
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
