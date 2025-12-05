import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useMeetings } from "@/hooks/useMeetings";
import { useMemo } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  RadialBarChart,
  RadialBar
} from "recharts";
import { Users, Briefcase, TrendingUp, CheckCircle2, Clock, Calendar, Star } from "lucide-react";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
const STATUS_COLORS = {
  completed: '#10b981', // Green
  pending: '#f59e0b',   // Amber
  meetings: '#3b82f6',  // Blue
  performance: '#8b5cf6' // Purple
};

export const DepartmentStats = () => {
  const { employees } = useEmployees();
  const { tasks } = useTasks();
  const { meetings } = useMeetings();

  const { departmentData, summaryStats } = useMemo(() => {
    const deptMap = new Map<string, { 
      employees: number; 
      activeTasks: number; 
      completedTasks: number;
      totalTasks: number;
      totalScore: number;
      meetingsCount: number;
      employeeIds: Set<string>;
    }>();

    const empDeptMap = new Map<string, string>();

    // Process Employees
    employees.forEach(emp => {
      empDeptMap.set(emp.id, emp.department);
      
      if (!deptMap.has(emp.department)) {
        deptMap.set(emp.department, { 
          employees: 0, 
          activeTasks: 0, 
          completedTasks: 0,
          totalTasks: 0,
          totalScore: 0,
          meetingsCount: 0,
          employeeIds: new Set()
        });
      }
      
      const stats = deptMap.get(emp.department)!;
      stats.employees += 1;
      stats.totalScore += emp.performanceScore || 0;
      stats.employeeIds.add(emp.id);
    });

    // Process Tasks
    tasks.forEach(task => {
      const dept = empDeptMap.get(task.assignedTo);
      if (dept && deptMap.has(dept)) {
        const stats = deptMap.get(dept)!;
        stats.totalTasks += 1;
        if (task.status === 'completed') {
          stats.completedTasks += 1;
        } else {
          stats.activeTasks += 1;
        }
      }
    });

    // Process Meetings
    meetings.forEach(meeting => {
      // A meeting counts for a department if any attendee is from that department
      // To avoid double counting for the same meeting in the same department, we use a Set of depts per meeting
      const involvedDepts = new Set<string>();
      
      meeting.attendees.forEach((attendeeId: any) => {
        // attendeeId might be an object or string depending on population
        const id = typeof attendeeId === 'object' ? attendeeId._id : attendeeId;
        const dept = empDeptMap.get(id);
        if (dept) involvedDepts.add(dept);
      });

      involvedDepts.forEach(dept => {
        if (deptMap.has(dept)) {
          deptMap.get(dept)!.meetingsCount += 1;
        }
      });
    });

    const data = Array.from(deptMap.entries()).map(([department, stats]) => ({
      department,
      employees: stats.employees,
      activeTasks: stats.activeTasks,
      completedTasks: stats.completedTasks,
      totalTasks: stats.totalTasks,
      meetings: stats.meetingsCount,
      avgPerformance: stats.employees > 0 ? Number((stats.totalScore / stats.employees).toFixed(1)) : 0,
      completionRate: stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0
    }));

    // Calculate Summary Stats
    const totalEmployees = employees.length;
    const totalActiveTasks = tasks.filter(t => t.status !== 'completed').length;
    const totalCompletedTasks = tasks.filter(t => t.status === 'completed').length;
    const avgOrgPerformance = totalEmployees > 0 
      ? (employees.reduce((acc, emp) => acc + (emp.performanceScore || 0), 0) / totalEmployees).toFixed(1) 
      : 0;
    
    const topDept = [...data].sort((a, b) => b.avgPerformance - a.avgPerformance)[0];
    const mostEfficientDept = [...data].sort((a, b) => b.completionRate - a.completionRate)[0];

    return { departmentData: data, summaryStats: { totalEmployees, totalActiveTasks, totalCompletedTasks, avgOrgPerformance, topDept, mostEfficientDept } };
  }, [employees, tasks, meetings]);

  if (departmentData.length === 0) {
    return (
      <Card className="p-12 text-center border-dashed">
        <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
        <p className="text-muted-foreground">Add employees and tasks to generate analytics.</p>
      </Card>
    );
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg outline-none">
          <p className="font-semibold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-2 text-sm">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
              <span className="text-muted-foreground capitalize">{entry.name}:</span>
              <span className="font-medium">{entry.value}{entry.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 1. High-Level Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-200/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Top Performer</p>
              <h3 className="text-lg font-bold mt-1 truncate" title={summaryStats.topDept?.department}>
                {summaryStats.topDept?.department || 'N/A'}
              </h3>
              <p className="text-xs text-purple-600 font-medium">
                {summaryStats.topDept?.avgPerformance} / 5.0 Avg Score
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-200/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Most Efficient</p>
              <h3 className="text-lg font-bold mt-1 truncate" title={summaryStats.mostEfficientDept?.department}>
                {summaryStats.mostEfficientDept?.department || 'N/A'}
              </h3>
              <p className="text-xs text-green-600 font-medium">
                {summaryStats.mostEfficientDept?.completionRate}% Completion Rate
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-500/5 border-amber-200/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Tasks</p>
              <h3 className="text-2xl font-bold mt-1">{summaryStats.totalActiveTasks}</h3>
              <p className="text-xs text-amber-600 font-medium">Across all departments</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-200/20">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Workforce</p>
              <h3 className="text-2xl font-bold mt-1">{summaryStats.totalEmployees}</h3>
              <p className="text-xs text-blue-600 font-medium">Active Employees</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 2. Department Comparison Section */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          Department Comparison
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Leaderboard */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Performance Leaderboard</CardTitle>
              <CardDescription>Average performance score by department (0-5)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={[...departmentData].sort((a, b) => b.avgPerformance - a.avgPerformance)} 
                    margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={true} stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number" 
                      domain={[0, 100]} 
                      axisLine={true} 
                      tickLine={true}
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      tickCount={6}
                    />
                    <YAxis 
                      type="category" 
                      dataKey="department" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                    <Bar 
                      dataKey="avgPerformance" 
                      name="Avg Score" 
                      fill={STATUS_COLORS.performance} 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                      label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Efficiency Leaderboard */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Efficiency Leaderboard</CardTitle>
              <CardDescription>Task completion rate by department</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    layout="vertical" 
                    data={[...departmentData].sort((a, b) => b.completionRate - a.completionRate)} 
                    margin={{ top: 10, right: 30, left: 40, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis 
                      type="category" 
                      dataKey="department" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                      width={100}
                    />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'hsl(var(--muted)/0.2)' }} />
                    <Bar 
                      dataKey="completionRate" 
                      name="Completion Rate" 
                      fill={STATUS_COLORS.completed} 
                      radius={[0, 4, 4, 0]} 
                      barSize={24}
                      label={{ position: 'right', fill: 'hsl(var(--foreground))', fontSize: 12, formatter: (val: any) => `${val}%` }}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. Individual Department Performance */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          Individual Department Performance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departmentData.map((dept, index) => (
            <Card key={dept.department} className="hover:shadow-md transition-shadow overflow-hidden border-t-4" style={{ borderTopColor: COLORS[index % COLORS.length] }}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{dept.department}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Users className="w-3 h-3" /> {dept.employees} Employees
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded text-xs font-semibold">
                    <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                    {dept.avgPerformance}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Activity Graph per Department */}
                <div className="h-[180px] w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={[dept]} margin={{ top: 20, right: 0, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="department" hide />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border p-2 rounded shadow-sm text-xs">
                                {payload.map((entry: any, idx: number) => (
                                  <div key={idx} className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                    <span className="capitalize text-muted-foreground">{entry.name}:</span>
                                    <span className="font-medium">{entry.value}</span>
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="activeTasks" name="Pending Tasks" fill={STATUS_COLORS.pending} radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="completedTasks" name="Completed Tasks" fill={STATUS_COLORS.completed} radius={[4, 4, 0, 0]} barSize={20} />
                      <Bar dataKey="meetings" name="Meetings" fill={STATUS_COLORS.meetings} radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Stats Footer */}
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t text-center">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Pending</p>
                    <p className="font-bold text-amber-600">{dept.activeTasks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Completed</p>
                    <p className="font-bold text-green-600">{dept.completedTasks}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Meetings</p>
                    <p className="font-bold text-blue-600">{dept.meetings}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};
