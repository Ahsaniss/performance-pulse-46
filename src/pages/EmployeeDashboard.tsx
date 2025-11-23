import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingUp, Calendar, LogOut, User, AlertCircle, MessageSquare } from "lucide-react";
import { NotificationBell } from "@/components/employee/NotificationBell";
import { PersonalPerformanceChart } from "@/components/employee/PersonalPerformanceChart";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAttendance } from "@/hooks/useAttendance";
import { useTasks } from "@/hooks/useTasks";
import { useMessages } from "@/hooks/useMessages";
import { useMeetings } from "@/hooks/useMeetings";
import { useEvaluations } from "@/hooks/useEvaluations";
import { Task } from "@/types";

interface TaskStats {
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
}

const EmployeeDashboard = () => {
  const { employeeId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const targetUserId = employeeId || user?.id;

  const { attendance, addAttendance, updateAttendance, getTodayAttendance } = useAttendance(targetUserId);
  const { tasks, loading: tasksLoading, updateTask } = useTasks(targetUserId);
  const { messages, loading: messagesLoading, markAsRead } = useMessages(targetUserId);
  const { meetings, loading: meetingsLoading } = useMeetings(targetUserId);
  const { evaluations, loading: evaluationsLoading } = useEvaluations(targetUserId);

  const todayAttendance = getTodayAttendance();
  
  const taskStats = useMemo<TaskStats>(() => {
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
    const pending = tasks.filter(t => t.status === 'pending').length;
    return { total: tasks.length, completed, inProgress, pending };
  }, [tasks]);

  const unreadMessages = useMemo(() => messages.filter(message => !message.read).length, [messages]);
  
  const completedTaskHistory = useMemo(
    () => tasks
      .filter(task => task.status === 'completed')
      .sort((a, b) => new Date(b.completedAt ?? b.deadline ?? '').getTime() - new Date(a.completedAt ?? a.deadline ?? '').getTime()),
    [tasks]
  );

  useEffect(() => {
    if (employeeId && user && user.role !== 'admin' && user.id !== employeeId) {
      navigate('/employee');
    }
  }, [employeeId, user, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const handleCheckIn = async () => {
    if (!user?.id) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await addAttendance({
        employeeId: user.id,
        date: now.toISOString().split('T')[0],
        checkIn: now.toISOString(),
        status: 'present',
      });
      
      toast.success(`Checked in at ${time}`);
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!user?.id || !todayAttendance) return;
    
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    
    try {
      await updateAttendance(todayAttendance.id, { checkOut: now.toISOString() });
      toast.success(`Checked out at ${time}`);
    } catch (error) {
      console.error('Check-out error:', error);
      toast.error('Failed to check out');
    }
  };

  const handleTaskStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
    try {
      await updateTask(taskId, { status: newStatus });
      toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Failed to update task status');
    }
  };

  const handleMarkMessageRead = async (messageId: string) => {
    try {
      await markAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  };

  const loading = tasksLoading || messagesLoading || meetingsLoading || evaluationsLoading;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-card border-b border-border sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <User className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Employee Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              {user?.id && <NotificationBell userId={user.id} />}
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.name || user?.email}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name || user?.email}!</h2>
          <p className="text-muted-foreground">Here's your performance overview</p>
        </div>

        {/* Check-in/Check-out */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1">Attendance</h3>
              <p className="text-sm text-muted-foreground">
                {todayAttendance?.checkIn 
                  ? `Checked in at ${new Date(todayAttendance.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}` 
                  : 'Not checked in yet'}
                {todayAttendance?.checkOut && ` | Checked out at ${new Date(todayAttendance.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
            <Button 
              onClick={todayAttendance?.checkIn ? handleCheckOut : handleCheckIn} 
              size="lg"
              disabled={!!todayAttendance?.checkOut}
            >
              <Clock className="w-5 h-5 mr-2" />
              {todayAttendance?.checkOut ? 'Checked Out' : todayAttendance?.checkIn ? 'Check Out' : 'Check In'}
            </Button>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Completed Tasks</p>
                <p className="text-2xl font-bold">{taskStats.completed}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Clock className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold">{taskStats.inProgress}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-lg">
                <AlertCircle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Review</p>
                <p className="text-2xl font-bold">{taskStats.pending}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <MessageSquare className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{unreadMessages}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="tasks" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="tasks">My Tasks</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="meetings">Meetings</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="tasks" className="space-y-4">
            {tasks.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No tasks assigned</h3>
                <p className="text-muted-foreground">You don't have any tasks at the moment.</p>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{task.title}</h3>
                        <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
                          {task.priority}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{task.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
                        <span>•</span>
                        <span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Badge
                        className={
                          task.status === 'completed'
                            ? 'bg-green-500/10 text-green-500'
                            : task.status === 'in-progress'
                            ? 'bg-blue-500/10 text-blue-500'
                            : 'bg-amber-500/10 text-amber-500'
                        }
                      >
                        {task.status === 'in-progress' ? 'in progress' : task.status}
                      </Badge>
                      <Select
                        value={task.status}
                        onValueChange={(value) => handleTaskStatusUpdate(task.id, value as Task['status'])}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in-progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>

                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {messages.length === 0 ? (
              <Card className="p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No messages</h3>
                <p className="text-muted-foreground">You don't have any messages at the moment.</p>
              </Card>
            ) : (
              messages.map((message) => (
                <Card
                  key={message.id}
                  className="p-6 cursor-pointer"
                  onClick={() => !message.read && handleMarkMessageRead(message.id)}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{message.subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        From: {typeof message.from === 'string' ? message.from : message.from?.name || 'Admin'} • {new Date(message.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                    {!message.read && (
                      <Badge className="bg-blue-500">New</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground">{message.content}</p>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            {meetings.length === 0 ? (
              <Card className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No meetings scheduled</h3>
                <p className="text-muted-foreground">You don't have any upcoming meetings.</p>
              </Card>
            ) : (
              meetings.map((meeting) => (
                <Card key={meeting.id} className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                      <p className="text-muted-foreground mb-3">{meeting.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(meeting.date).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {meeting.time}
                        </span>
                      </div>
                      {meeting.link && (
                        <a
                          href={meeting.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline text-sm mt-2 inline-block"
                        >
                          Join Meeting →
                        </a>
                      )}
                    </div>
                    <Badge className={meeting.status === 'scheduled' ? 'bg-blue-500/10 text-blue-500' : 'bg-gray-500/10 text-gray-500'}>
                      {meeting.status}
                    </Badge>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Performance Overview</h3>
              {evaluations.length > 0 ? (
                <div className="space-y-6">
                  <PersonalPerformanceChart />
                  <div className="mt-6">
                    <h4 className="font-semibold mb-3">Recent Evaluations</h4>
                    {evaluations.slice(0, 3).map((evaluation) => (
                      <Card key={evaluation.id} className="p-4 mb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(evaluation.date).toLocaleDateString()}
                            </p>
                            {evaluation.taskId && typeof evaluation.taskId === 'object' && (
                              <p className="text-sm font-medium text-primary mt-1">
                                Task: {(evaluation.taskId as any).title}
                              </p>
                            )}
                            <p className="mt-1">{evaluation.comments}</p>
                          </div>
                          <Badge className="bg-primary/10 text-primary">
                            Score: {evaluation.score}/5.0
                          </Badge>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No evaluations yet</h4>
                  <p className="text-muted-foreground">Your performance evaluations will appear here.</p>
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Completed Tasks History</h3>
              {completedTaskHistory.length > 0 ? (
                <div className="space-y-3">
                  {completedTaskHistory.slice(0, 5).map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <div>
                          <p className="font-medium">{task.title}</p>
                          <p className="text-sm text-muted-foreground">
                            Completed: {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
                        {task.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h4 className="text-lg font-semibold mb-2">No completed tasks yet</h4>
                  <p className="text-muted-foreground">Completed tasks will appear here.</p>
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
