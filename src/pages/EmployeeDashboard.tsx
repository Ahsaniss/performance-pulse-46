import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingUp, Calendar, ArrowLeft, Mail, LogOut, User, AlertCircle, Bell, MessageSquare } from "lucide-react";
import { PersonalPerformanceChart } from "@/components/employee/PersonalPerformanceChart";
import { TaskList } from "@/components/employee/TaskList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/admin/PerformanceChart";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

interface TaskStats {
  completed: number;
  inProgress: number;
  total: number;
}

const EmployeeDashboard = () => {
  const { employeeId } = useParams();
  const auth = useAuth();
  const user = (auth as any).user;
  const signOut = (auth as any).signOut;
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({ completed: 0, inProgress: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState<string>('');

  const targetUserId = employeeId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchProfile();
      fetchTaskStats();
      fetchMessages();
    }
  }, [targetUserId]);

  useEffect(() => {
    if (!targetUserId) return;

    const channel = supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `to_user=eq.${targetUserId}`
        },
        (payload) => {
          setMessages(prev => [payload.new, ...prev]);
          toast.success('New message received!');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaskStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('status')
        .eq('assigned_to', targetUserId);

      if (error) throw error;

      const stats = {
        total: data?.length || 0,
        completed: data?.filter(t => t.status === 'completed').length || 0,
        inProgress: data?.filter(t => t.status === 'in_progress').length || 0,
      };
      setTaskStats(stats);
    } catch (error) {
      console.error('Error fetching task stats:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`to_user.eq.${targetUserId},and(is_broadcast.eq.true,to_user.is.null)`)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleLogout = () => {
    if (typeof signOut === 'function') {
      signOut();
    }
    navigate('/signin');
  };

  const handleCheckIn = () => {
    const now = new Date().toLocaleTimeString();
    setCheckedIn(true);
    setCheckInTime(now);
    toast.success(`Checked in at ${now}`);
  };

  const handleCheckOut = () => {
    const now = new Date().toLocaleTimeString();
    setCheckedIn(false);
    toast.success(`Checked out at ${now}`);
  };

  const handleTaskStatusUpdate = (taskId: string, newStatus: string) => {
    toast.success(`Task status updated to ${newStatus}`);
  };

  const myTasks = [];
  const myMessages = [];
  const myMeetings = [];
  const myEvaluations = [];

  const completedTasks = myTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = myTasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = myTasks.filter(t => t.status === 'pending').length;
  const unreadMessages = myMessages.filter(m => !m.read).length;

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
              <div className="text-right">
                <p className="text-sm font-semibold">{user?.full_name}</p>
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
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.full_name}!</h2>
          <p className="text-muted-foreground">Here's your performance overview</p>
        </div>

        {/* Check-in/Check-out */}
        <Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold mb-1">Attendance</h3>
              <p className="text-sm text-muted-foreground">
                {checkedIn ? `Checked in at ${checkInTime}` : 'Not checked in yet'}
              </p>
            </div>
            <Button onClick={checkedIn ? handleCheckOut : handleCheckIn} size="lg">
              <Clock className="w-5 h-5 mr-2" />
              {checkedIn ? 'Check Out' : 'Check In'}
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
                <p className="text-2xl font-bold">3</p>
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
            {myTasks.map((task) => (
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
                      <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
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
                      {task.status}
                    </Badge>
                    <select
                      className="text-sm border rounded p-1"
                      value={task.status}
                      onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value)}
                    >
                      <option value="pending">Pending</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            {myMessages.map((message) => (
              <Card key={message.id} className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold">{message.subject}</h3>
                    <p className="text-sm text-muted-foreground">
                      From: Admin • {new Date(message.timestamp).toLocaleDateString()}
                    </p>
                  </div>
                  {!message.read && (
                    <Badge className="bg-blue-500">New</Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{message.content}</p>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="meetings" className="space-y-4">
            {myMeetings.map((meeting) => (
              <Card key={meeting.id} className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
                    <p className="text-muted-foreground mb-3">{meeting.description}</p>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{new Date(meeting.date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        <span>{meeting.time}</span>
                      </div>
                    </div>
                    {meeting.link && (
                      <Button variant="link" className="p-0 h-auto mt-2" asChild>
                        <a href={meeting.link} target="_blank" rel="noopener noreferrer">
                          Join Meeting →
                        </a>
                      </Button>
                    )}
                  </div>
                  <Badge>{meeting.status}</Badge>
                </div>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Performance Over Time</h3>
              <PerformanceChart employeeId={user?.id || ''} />
            </Card>

            {myEvaluations.map((evaluation) => (
              <Card key={evaluation.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Performance Evaluation</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(evaluation.date).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-primary">{evaluation.score}/5.0</div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Productivity</p>
                    <p className="text-xl font-semibold">{evaluation.categories.productivity}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quality</p>
                    <p className="text-xl font-semibold">{evaluation.categories.quality}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Teamwork</p>
                    <p className="text-xl font-semibold">{evaluation.categories.teamwork}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Communication</p>
                    <p className="text-xl font-semibold">{evaluation.categories.communication}</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm font-semibold mb-2">Feedback:</p>
                  <p className="text-muted-foreground">{evaluation.comments}</p>
                </div>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
