import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Task } from '@/types';
import { format, parseISO } from 'date-fns';
import { Clock, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface ScoringComparisonProps {
  taskHistory: Task[];
}

interface DataPoint {
  day: string;
  target: number;
  actual: number;
  tasks: Task[];
  completed: number;
  total: number;
  date: Date;
}

export const ScoringComparison: React.FC<ScoringComparisonProps> = ({ taskHistory }) => {
  const [selectedPoint, setSelectedPoint] = useState<DataPoint | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Generate last 30 days of data
  const generateScoringData = (): DataPoint[] => {
    const data: DataPoint[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Get tasks for this day
      const dayTasks = taskHistory.filter(t => {
        if (!t.createdAt) return false;
        const taskDate = parseISO(t.createdAt);
        return format(taskDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
      });
      
      const completedCount = dayTasks.filter(t => t.status === 'completed').length;
      const totalCount = dayTasks.length;
      
      // Target is cumulative expected (e.g., 5 tasks per day target)
      const targetCumulative = (29 - i + 1) * 5;
      
      // Actual is cumulative completed tasks up to this day
      const actualCumulative = taskHistory.filter(t => {
        if (t.status !== 'completed' || !t.completedAt) return false;
        const completedDate = parseISO(t.completedAt);
        return completedDate <= date;
      }).length;
      
      data.push({
        day: format(date, 'dd MMM'),
        target: targetCumulative,
        actual: actualCumulative,
        tasks: dayTasks,
        completed: completedCount,
        total: totalCount,
        date: date
      });
    }
    
    return data;
  };

  const scoringData = generateScoringData();

  const handlePointClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const point = data.activePayload[0].payload as DataPoint;
      setSelectedPoint(point);
      setSheetOpen(true);
    }
  };

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload as DataPoint;
      return (
        <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{data.day}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-blue-600">Target:</span>
              <span className="font-semibold">{data.target}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-red-600">Actual:</span>
              <span className="font-semibold">{data.actual}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-gray-600">Gap:</span>
              <span className={`font-semibold ${data.actual >= data.target ? 'text-green-600' : 'text-red-600'}`}>
                {data.actual >= data.target ? '+' : ''}{data.actual - data.target}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomDot = (props: any) => {
    const { cx, cy, payload, dataKey } = props;
    
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={6}
          fill={dataKey === 'target' ? '#3b82f6' : '#ef4444'}
          stroke="white"
          strokeWidth={2}
          style={{ cursor: 'pointer' }}
          className="transition-all hover:r-8"
        />
        <circle
          cx={cx}
          cy={cy}
          r={3}
          fill="white"
          style={{ pointerEvents: 'none' }}
        />
      </g>
    );
  };

  const tasksInSelectedDay = selectedPoint?.tasks || [];
  const completedTasks = tasksInSelectedDay.filter(t => t.status === 'completed');
  const delayedTasks = tasksInSelectedDay.filter(t => 
    t.deadline && t.completedAt && parseISO(t.completedAt) > parseISO(t.deadline)
  );
  const completionRate = tasksInSelectedDay.length > 0 
    ? Math.round((completedTasks.length / tasksInSelectedDay.length) * 100) 
    : 0;

  return (
    <>
      <Card className="col-span-1 lg:col-span-3 bg-white/80 backdrop-blur-xl border border-gray-200/50 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200/50">
          <CardTitle className="text-xl font-bold text-gray-900">Scoring Comparison</CardTitle>
          <CardDescription className="text-gray-600">
            Target vs Actual Performance - Click any point for detailed breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={scoringData} 
                onClick={handlePointClick}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <defs>
                  <linearGradient id="gapGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                  </linearGradient>
                </defs>
                
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="day" 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="#6b7280"
                  style={{ fontSize: '12px' }}
                  label={{ value: 'Tasks', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip content={<CustomTooltip />} />
                
                {/* Shaded gap area between target and actual */}
                <Area
                  type="monotone"
                  dataKey="target"
                  stroke="none"
                  fill="url(#gapGradient)"
                  fillOpacity={0.3}
                />
                
                {/* Target line (blue) */}
                <Line
                  type="monotone"
                  dataKey="target"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={<CustomDot dataKey="target" />}
                  activeDot={{ r: 8 }}
                  name="Target"
                />
                
                {/* Actual line (red) */}
                <Line
                  type="monotone"
                  dataKey="actual"
                  stroke="#ef4444"
                  strokeWidth={3}
                  dot={<CustomDot dataKey="actual" />}
                  activeDot={{ r: 8 }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
              <span className="text-sm font-medium text-gray-700">Target</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow"></div>
              <span className="text-sm font-medium text-gray-700">Actual</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Side Panel */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto bg-white/95 backdrop-blur-xl">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold text-gray-900">
              Performance Details
            </SheetTitle>
            <SheetDescription className="text-gray-600">
              {selectedPoint?.day} - Detailed Breakdown
            </SheetDescription>
          </SheetHeader>
          
          {selectedPoint && (
            <div className="mt-6 space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-blue-700 mb-1">Target</div>
                    <div className="text-3xl font-bold text-blue-900">{selectedPoint.target}</div>
                  </CardContent>
                </Card>
                <Card className="border-red-200 bg-red-50/50">
                  <CardContent className="pt-4">
                    <div className="text-sm text-red-700 mb-1">Actual</div>
                    <div className="text-3xl font-bold text-red-900">{selectedPoint.actual}</div>
                  </CardContent>
                </Card>
              </div>

              {/* Daily Statistics */}
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-600" />
                    Daily Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Tasks on this day:</span>
                    <Badge variant="outline" className="bg-white">{selectedPoint.total}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Completed:</span>
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      {selectedPoint.completed}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-700">Completion Rate:</span>
                    <Badge className={completionRate >= 80 ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {completionRate}%
                    </Badge>
                  </div>
                  {delayedTasks.length > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-700">Delayed:</span>
                      <Badge variant="destructive">{delayedTasks.length}</Badge>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Task Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Task Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  {tasksInSelectedDay.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">No tasks for this day</p>
                  ) : (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                      {tasksInSelectedDay.map((task, idx) => (
                        <div 
                          key={task.id || idx} 
                          className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm text-gray-900">{task.title}</p>
                              {task.description && (
                                <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                  {task.description}
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                {task.status === 'completed' ? (
                                  <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Completed
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {task.status}
                                  </Badge>
                                )}
                                {task.deadline && (
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Clock className="w-3 h-3" />
                                    {format(parseISO(task.deadline), 'MMM dd')}
                                  </div>
                                )}
                              </div>
                            </div>
                            {task.deadline && task.completedAt && parseISO(task.completedAt) > parseISO(task.deadline) && (
                              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Delays Section */}
              {delayedTasks.length > 0 && (
                <Card className="border-red-200 bg-red-50/30">
                  <CardHeader>
                    <CardTitle className="text-lg text-red-900 flex items-center gap-2">
                      <AlertCircle className="w-5 h-5" />
                      Delays ({delayedTasks.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {delayedTasks.map((task, idx) => (
                        <div key={task.id || idx} className="p-2 bg-white rounded border border-red-200">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-red-600 mt-1">
                            Completed {Math.abs(Math.round((new Date(task.completedAt!).getTime() - new Date(task.deadline!).getTime()) / (1000 * 60 * 60 * 24)))} days late
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
};
