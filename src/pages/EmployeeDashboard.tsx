import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingUp, Calendar, ArrowLeft, Mail } from "lucide-react";
import { PersonalPerformanceChart } from "@/components/employee/PersonalPerformanceChart";
import { TaskList } from "@/components/employee/TaskList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

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
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStats>({ completed: 0, inProgress: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);

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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {isAdmin && employeeId && (
              <Button variant="outline" size="sm" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin
              </Button>
            )}
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                {profile?.full_name}
              </h1>
              <p className="text-muted-foreground mt-2">
                {profile?.department || 'No Department'} Department
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign Out
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
                <h3 className="text-3xl font-bold mt-2">{taskStats.completed}</h3>
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
                <h3 className="text-3xl font-bold mt-2">{taskStats.inProgress}</h3>
              </div>
              <div className="p-3 bg-chart-4/10 rounded-lg">
                <Clock className="w-6 h-6 text-chart-4" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <h3 className="text-3xl font-bold mt-2">{taskStats.total}</h3>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <h3 className="text-3xl font-bold mt-2">{messages.length}</h3>
              </div>
              <div className="p-3 bg-secondary/10 rounded-lg">
                <Mail className="w-6 h-6 text-secondary" />
              </div>
            </div>
          </Card>
        </div>

        {/* Messages Section */}
        {messages.length > 0 && (
          <Card className="p-6 bg-card border-border">
            <h2 className="text-2xl font-bold mb-4">Recent Messages</h2>
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className="p-4 bg-primary/5 rounded-lg border border-border">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold">{msg.subject}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{msg.content}</p>
                    </div>
                    {msg.is_broadcast && (
                      <Badge variant="outline" className="ml-2">Broadcast</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Performance Section */}
        <Card className="p-6 bg-card border-border">
          <h2 className="text-2xl font-bold mb-4">Performance Trend</h2>
          <PersonalPerformanceChart />
        </Card>

        {/* Tasks Section */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Tasks</h2>
            <Badge className="bg-primary/10 text-primary">{taskStats.inProgress} Active</Badge>
          </div>
          <TaskList employeeId={targetUserId} />
        </Card>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
