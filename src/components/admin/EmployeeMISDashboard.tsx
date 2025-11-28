import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis, ComposedChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EmployeeAnalytics, Task } from '../../types';
import { format, parseISO, differenceInDays, startOfWeek, endOfWeek, eachWeekOfInterval, subMonths, isWithinInterval } from 'date-fns';

import { EmployeeAIChat } from './EmployeeAIChat';
import { GraphDetailModal } from './GraphDetailModal';
import { TaskListModal } from './TaskListModal';

interface EmployeeMISDashboardProps {
  analytics: EmployeeAnalytics;
  employeeName: string;
}

const COLORS = ['#0088FE', '#8884d8', '#FFBB28', '#FF8042', '#00C49F'];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 border rounded shadow-lg z-50">
        <p className="font-bold mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
            {entry.payload.details && entry.payload.details[entry.dataKey] && (
              <ul className="list-disc list-inside ml-2 text-xs text-gray-500 mt-1">
                {entry.payload.details[entry.dataKey].slice(0, 3).map((t: string, i: number) => (
                  <li key={i}>{t}</li>
                ))}
                {entry.payload.details[entry.dataKey].length > 3 && <li>...</li>}
              </ul>
            )}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const EmployeeMISDashboard: React.FC<EmployeeMISDashboardProps> = ({ analytics, employeeName }) => {
  const { metrics, taskHistory, aiInsight } = analytics;
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Task List Modal State
  const [taskListOpen, setTaskListOpen] = useState(false);
  const [taskListTitle, setTaskListTitle] = useState('');
  const [taskListTasks, setTaskListTasks] = useState<Task[]>([]);

  const handleTaskClick = (taskId: string) => {
    const task = taskHistory.find(t => t.id === taskId);
    if (task) {
      setSelectedTask(task);
      setIsModalOpen(true);
    }
  };

  const handlePieClick = (entry: any) => {
    const status = entry.name;
    let tasks: Task[] = [];
    if (status === 'Completed') tasks = taskHistory.filter(t => t.status === 'completed');
    else if (status === 'In Progress') tasks = taskHistory.filter(t => t.status === 'in-progress');
    else if (status === 'Pending') tasks = taskHistory.filter(t => t.status === 'pending' && (!t.deadline || new Date(t.deadline) >= new Date()));
    else if (status === 'Overdue') tasks = taskHistory.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date());

    setTaskListTitle(`${status} Tasks`);
    setTaskListTasks(tasks);
    setTaskListOpen(true);
  };

  const handleEfficiencyClick = (data: any, index: number) => {
    // Recharts onClick on Bar gives (data, index)
    // But we need to know if it's 'onTime' or 'late'
    // We can attach onClick to the specific Bar component
  };

  // 1. Completion Rate Donut Data
  // Calculate locally to ensure mutual exclusivity for the chart
  const completedCount = taskHistory.filter(t => t.status === 'completed').length;
  const inProgressCount = taskHistory.filter(t => t.status === 'in-progress').length;
  const overdueCount = taskHistory.filter(t => t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date()).length;
  // Pending is strictly 'pending' status, excluding overdue
  const pendingCount = taskHistory.filter(t => t.status === 'pending' && (!t.deadline || new Date(t.deadline) >= new Date())).length;

  const completionData = [
    { name: 'Completed', value: completedCount },
    { name: 'In Progress', value: inProgressCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Overdue', value: overdueCount },
  ];

  // 2. Efficiency Stacked Bar Data (Last 6 Months)
  const getEfficiencyData = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthKey = format(date, 'MMM yyyy');
      months.push({ 
        name: monthKey, 
        onTime: 0, 
        late: 0, 
        overdue: 0,
        deptAvg: 4, // Mock Department Average
        details: { onTime: [], late: [], overdue: [] } as any
      });
    }

    taskHistory.forEach(task => {
      // Handle Completed Tasks
      if (task.status === 'completed' && task.completedAt) {
        const completedDate = parseISO(task.completedAt);
        const monthKey = format(completedDate, 'MMM yyyy');
        const monthData = months.find(m => m.name === monthKey);
        
        if (monthData) {
          if (task.deadline) {
            const deadline = parseISO(task.deadline);
            if (completedDate <= deadline) {
              monthData.onTime++;
              monthData.details.onTime.push(task.title);
            } else {
              monthData.late++;
              monthData.details.late.push(task.title);
            }
          }
        }
      }
      // Handle Overdue Tasks (Not completed, but deadline passed)
      else if (task.status !== 'completed' && task.deadline) {
        const deadline = parseISO(task.deadline);
        if (new Date() > deadline) {
          const monthKey = format(deadline, 'MMM yyyy'); // Group by deadline month
          const monthData = months.find(m => m.name === monthKey);
          if (monthData) {
            monthData.overdue++;
            monthData.details.overdue.push(task.title);
          }
        }
      }
    });
    return months;
  };
  const efficiencyData = getEfficiencyData();

  // 3. Timeline Variance Data
  const timelineVarianceData = taskHistory
    .filter(t => {
      // Include completed tasks OR overdue tasks
      const isCompleted = t.status === 'completed' && t.completedAt && t.deadline;
      const isOverdue = t.status !== 'completed' && t.deadline && new Date() > parseISO(t.deadline);
      return isCompleted || isOverdue;
    })
    .map(t => {
      const planned = differenceInDays(parseISO(t.deadline!), parseISO(t.createdAt));
      // For overdue tasks, actual duration is time from creation until NOW
      const actualEndDate = t.completedAt ? parseISO(t.completedAt) : new Date();
      const actual = differenceInDays(actualEndDate, parseISO(t.createdAt));
      
      return {
        id: t.id,
        name: t.title.substring(0, 10) + '...',
        planned: Math.max(0, planned),
        actual: Math.max(0, actual),
        variance: actual - planned,
        isOverdue: !t.completedAt // Flag to color differently if needed
      };
    })
    .slice(-10); // Last 10 tasks

  // 4. Velocity Area Chart (Tasks per week)
  const getVelocityData = () => {
    const weeks = [];
    const end = new Date();
    const start = subMonths(end, 3);
    const interval = eachWeekOfInterval({ start, end });

    interval.forEach(date => {
      const weekStart = startOfWeek(date);
      const weekEnd = endOfWeek(date);
      const label = format(weekStart, 'MMM d');
      
      const completedCount = taskHistory.filter(t => {
        if (!t.completedAt) return false;
        const completed = parseISO(t.completedAt);
        return completed >= weekStart && completed <= weekEnd;
      }).length;

      const assignedCount = taskHistory.filter(t => {
        if (!t.createdAt) return false;
        const created = parseISO(t.createdAt);
        return created >= weekStart && created <= weekEnd;
      }).length;

      weeks.push({ name: label, completed: completedCount, assigned: assignedCount });
    });
    return weeks;
  };
  const velocityData = getVelocityData();

  // 5. Burnout Matrix (Difficulty vs Avg Duration)
  const burnoutData = [
    { difficulty: 'Easy', count: 0, completedCount: 0, totalDays: 0, avgDays: 0 },
    { difficulty: 'Medium', count: 0, completedCount: 0, totalDays: 0, avgDays: 0 },
    { difficulty: 'Hard', count: 0, completedCount: 0, totalDays: 0, avgDays: 0 },
  ];

  taskHistory.forEach(task => {
    let difficulty: string = task.difficulty || 'medium';
    // Map backend values (low, medium, high) to chart labels (Easy, Medium, Hard)
    if (difficulty === 'low') difficulty = 'Easy';
    else if (difficulty === 'medium') difficulty = 'Medium';
    else if (difficulty === 'high') difficulty = 'Hard';

    const item = burnoutData.find(b => b.difficulty.toLowerCase() === difficulty.toLowerCase());
    if (item) {
      item.count++; // Count all assigned tasks
      
      if (task.completedAt) {
        item.completedCount++;
        const days = differenceInDays(parseISO(task.completedAt), parseISO(task.createdAt));
        item.totalDays += Math.max(1, days); // Ensure at least 1 day
      }
    }
  });

  burnoutData.forEach(item => {
    if (item.completedCount > 0) item.avgDays = Number((item.totalDays / item.completedCount).toFixed(1));
  });

  // Filtered Tasks for Evidence Table
  const filteredTasks = filterStatus
    ? taskHistory.filter(t => {
        if (filterStatus === 'Completed') return t.status === 'completed';
        if (filterStatus === 'In Progress') return t.status === 'in-progress';
        if (filterStatus === 'Pending') return t.status === 'pending' && (!t.deadline || new Date(t.deadline) >= new Date());
        if (filterStatus === 'Overdue') return t.status !== 'completed' && t.deadline && new Date(t.deadline) < new Date();
        return true;
      })
    : taskHistory;

  return (
    <div className="space-y-6">
      {/* AI Insight Section */}
      <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
        <CardHeader>
          <CardTitle className="text-indigo-900 flex items-center gap-2">
            ✨ AI Performance Insight
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-700 italic">"{aiInsight.summary}"</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              {aiInsight.strengths.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-green-700 mb-2">Strengths</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {aiInsight.strengths.map((s, i) => <li key={i}>{s}</li>)}
                  </ul>
                </div>
              )}
              {aiInsight.weaknesses.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-orange-700 mb-2">Areas for Improvement</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {aiInsight.weaknesses.map((w, i) => <li key={i}>{w}</li>)}
                  </ul>
                </div>
              )}
              {aiInsight.recommendations.length > 0 && (
                <div className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-semibold text-blue-700 mb-2">Recommendations</h4>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {aiInsight.recommendations.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* 1. Completion Rate */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Status</CardTitle>
            <CardDescription>Click slices to filter evidence table</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={completionData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  onClick={handlePieClick}
                  cursor="pointer"
                >
                  {completionData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]} 
                      stroke={filterStatus === entry.name ? '#000' : 'none'}
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 2. Efficiency Trends */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Efficiency Trends</CardTitle>
            <CardDescription>On-time vs Late completions (Last 6 Months)</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar 
                  dataKey="onTime" 
                  stackId="a" 
                  fill="#00C49F" 
                  name="On Time" 
                  onClick={(data) => {
                    const month = data.name;
                    const tasks = taskHistory.filter(t => {
                      if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
                      const completedDate = parseISO(t.completedAt);
                      const deadline = parseISO(t.deadline);
                      return format(completedDate, 'MMM yyyy') === month && completedDate <= deadline;
                    });
                    setTaskListTitle(`On Time Tasks - ${month}`);
                    setTaskListTasks(tasks);
                    setTaskListOpen(true);
                  }}
                  cursor="pointer"
                />
                <Bar 
                  dataKey="late" 
                  stackId="a" 
                  fill="#FF8042" 
                  name="Late" 
                  onClick={(data) => {
                    const month = data.name;
                    const tasks = taskHistory.filter(t => {
                      if (t.status !== 'completed' || !t.completedAt || !t.deadline) return false;
                      const completedDate = parseISO(t.completedAt);
                      const deadline = parseISO(t.deadline);
                      return format(completedDate, 'MMM yyyy') === month && completedDate > deadline;
                    });
                    setTaskListTitle(`Late Tasks - ${month}`);
                    setTaskListTasks(tasks);
                    setTaskListOpen(true);
                  }}
                  cursor="pointer"
                />
                <Bar 
                  dataKey="overdue" 
                  stackId="a" 
                  fill="#FF0000" 
                  name="Overdue" 
                  onClick={(data) => {
                    const month = data.name;
                    const tasks = taskHistory.filter(t => {
                      if (t.status === 'completed' || !t.deadline) return false;
                      const deadline = parseISO(t.deadline);
                      return format(deadline, 'MMM yyyy') === month && new Date() > deadline;
                    });
                    setTaskListTitle(`Overdue Tasks - Due in ${month}`);
                    setTaskListTasks(tasks);
                    setTaskListOpen(true);
                  }}
                  cursor="pointer"
                />
                <Line type="monotone" dataKey="deptAvg" stroke="#8884d8" name="Dept Avg" strokeDasharray="5 5" />
              </ComposedChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 3. Timeline Variance */}
        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline Variance</CardTitle>
            <CardDescription>Planned vs Actual Duration (Days) - Click bar for details</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={timelineVarianceData}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const payload = data.activePayload[0].payload;
                    handleTaskClick(payload.id);
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="planned" fill="#8884d8" name="Planned Days" />
                <Bar 
                  dataKey="actual" 
                  fill="#82ca9d" 
                  name="Actual Days" 
                  // Use a custom shape or fill to distinguish overdue tasks?
                  // For now, let's just rely on the tooltip or data
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 4. Velocity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Task Velocity</CardTitle>
            <CardDescription>Tasks completed per week</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={velocityData}
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const payload = data.activePayload[0].payload;
                    const weekLabel = payload.name;
                    // We need to reconstruct the week range or just filter by label match
                    // Since we formatted label as 'MMM d', let's try to match it
                    // Or better, we can filter tasks that fall into that week
                    // But we don't have the exact date range here easily without recalculating
                    // Let's recalculate based on label match which is simpler for now
                    // Actually, let's just filter tasks where format(startOfWeek(completedAt), 'MMM d') === label
                    
                    const tasks = taskHistory.filter(t => {
                      if (!t.completedAt) return false;
                      const completedDate = parseISO(t.completedAt);
                      const weekStart = startOfWeek(completedDate);
                      return format(weekStart, 'MMM d') === weekLabel;
                    });
                    
                    setTaskListTitle(`Completed Tasks - Week of ${weekLabel}`);
                    setTaskListTasks(tasks);
                    setTaskListOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="assigned" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} name="Assigned" />
                <Area type="monotone" dataKey="completed" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Completed" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 5. Burnout Matrix */}
        <Card>
          <CardHeader>
            <CardTitle>Burnout Matrix</CardTitle>
            <CardDescription>Total Tasks vs Avg Days Spent</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={burnoutData} 
                layout="vertical"
                onClick={(data) => {
                  if (data && data.activePayload && data.activePayload.length > 0) {
                    const payload = data.activePayload[0].payload;
                    const difficulty = payload.difficulty; // 'Easy', 'Medium', 'Hard'
                    
                    // Map back to 'low', 'medium', 'high'
                    let backendDifficulty = 'medium';
                    if (difficulty === 'Easy') backendDifficulty = 'low';
                    else if (difficulty === 'Hard') backendDifficulty = 'high';
                    
                    const tasks = taskHistory.filter(t => (t.difficulty || 'medium') === backendDifficulty);
                    
                    setTaskListTitle(`${difficulty} Difficulty Tasks`);
                    setTaskListTasks(tasks);
                    setTaskListOpen(true);
                  }
                }}
                className="cursor-pointer"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="difficulty" type="category" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Total Tasks" radius={[0, 4, 4, 0]} />
                <Bar dataKey="avgDays" fill="#ff7300" name="Avg Days (Completed)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Level 3: Evidence Table */}
      <Card>
        <CardHeader>
          <CardTitle>Task Evidence Drill-Down</CardTitle>
          <CardDescription>
            {filterStatus ? `Showing ${filterStatus} tasks` : 'All tasks'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Difficulty</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Completed At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTasks.length > 0 ? (
                filteredTasks.map(task => (
                  <TableRow 
                    key={task.id} 
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => handleTaskClick(task.id)}
                  >
                    <TableCell className="font-medium">{task.title}</TableCell>
                    <TableCell>
                      <Badge variant={task.status === 'completed' ? 'default' : task.status === 'in-progress' ? 'secondary' : 'outline'}>
                        {task.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{task.difficulty || 'Medium'}</TableCell>
                    <TableCell>{task.deadline ? format(parseISO(task.deadline), 'MMM d, yyyy') : '-'}</TableCell>
                    <TableCell>{task.completedAt ? format(parseISO(task.completedAt), 'MMM d, yyyy') : '-'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4">No tasks found</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Graph Detail Modal */}
      <GraphDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        taskDetails={selectedTask}
      />

      {/* Task List Modal */}
      <TaskListModal
        isOpen={taskListOpen}
        onClose={() => setTaskListOpen(false)}
        title={taskListTitle}
        tasks={taskListTasks}
        onTaskClick={handleTaskClick}
      />

      {/* AI Chatbot */}
      <EmployeeAIChat employeeName={employeeName} analytics={analytics} />
    </div>
  );
};
