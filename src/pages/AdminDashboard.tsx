import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, LayoutDashboard, Users, Search, MessageSquare, Calendar, FileText, Plus } from "lucide-react";
import { EmployeeGrid } from "@/components/admin/EmployeeGrid";
import { EmployeeModal } from "@/components/admin/EmployeeModal";
import { SendMessageModal } from "@/components/admin/SendMessageModal";
import { CreateTaskModal } from "@/components/admin/CreateTaskModal";
import { ScheduleMeetingModal } from "@/components/admin/ScheduleMeetingModal";
import { DepartmentStats } from "@/components/admin/DepartmentStats";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AddEmployeeModal } from "@/components/admin/AddEmployeeModal";
import { AddEvaluationModal } from "@/components/admin/AddEvaluationModal";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfiles } from "@/hooks/useProfiles";
import { useMeetings } from "@/hooks/useMeetings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { profiles, loading } = useProfiles();
  const { meetings } = useMeetings(user?.id);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddEvaluationModal, setShowAddEvaluationModal] = useState(false);
  const [stats, setStats] = useState({
    completedTasksToday: 0,
    pendingTasks: 0,
    avgPerformance: '0.0'
  });
  const [isExporting, setIsExporting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayIso = todayStart.toISOString();

      const [{ data: completed }, { data: pending }] = await Promise.all([
        supabase
          .from('tasks')
          .select('id, status, updated_at')
          .eq('status', 'completed')
          .gte('updated_at', todayIso),
        supabase
          .from('tasks')
          .select('id, status')
          .neq('status', 'completed'),
      ]);
      const avgScore = profiles.length > 0
        ? (profiles.reduce((acc, p) => acc + (p.performance_score || 0), 0) / profiles.length).toFixed(1)
        : '0.0';
      setStats({
        completedTasksToday: completed?.length || 0,
        pendingTasks: pending?.length || 0,
        avgPerformance: avgScore,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, [profiles]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-dashboard-tasks')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchStats())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchStats]);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  // Convert profiles to employee format for EmployeeGrid
  const employees = profiles.map(p => ({
    id: p.id,
    name: p.full_name,
    email: p.email,
    avatar: p.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.email}`,
    department: p.department || 'General',
    position: p.position || 'Employee',
    role: 'employee' as const,
    joinDate: p.join_date || new Date().toISOString(),
    status: (p.status || 'active') as 'active' | 'inactive' | 'on-leave',
    performanceScore: p.performance_score || 0
  }));

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEmployees = profiles.length;
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;

  const handleExportReports = async () => {
    try {
      setIsExporting(true);
      const [tasksRes, evalRes] = await Promise.all([
        supabase.from('tasks').select('id, assigned_to, status, priority, deadline, completed_at'),
        supabase.from('evaluations').select('id, employee_id, score, date, meetings_held, training_applied, created_at'),
      ]);
      const tasks = tasksRes.data;
      const evaluations = evalRes.data;
      const tasksList = (tasks ?? []) as any[];
      const evalList = (evaluations ?? []) as any[];
      const rows = employees.map((emp) => {
        const empTasks = tasksList.filter((task) => task.assigned_to === emp.id);
        const completedCount = empTasks.filter((task) => task.status === 'completed').length;
        const pendingCount = empTasks.length - completedCount;
        const latestEvaluation = evalList
          .filter((evaluation) => evaluation.employee_id === emp.id)
          .sort((a, b) => new Date(b.date || b.created_at || '').getTime() - new Date(a.date || a.created_at || '').getTime())[0];
        return {
          Name: emp.name,
          Department: emp.department,
          CompletedTasks: completedCount,
          PendingTasks: pendingCount,
          LatestScore: latestEvaluation?.score ?? 'N/A',
          LastEvaluatedOn: latestEvaluation?.date ?? 'N/A',
        };
      });
      const header = Object.keys(rows[0] ?? { Name: '', Department: '', CompletedTasks: 0, PendingTasks: 0, LatestScore: '', LastEvaluatedOn: '' });
      const csv = [header.join(','), ...rows.map((row) => header.map((key) => `"${String((row as any)[key] ?? '')}"`).join(','))].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `performance-summary-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast.success('Performance summary exported');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export performance summary');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <LayoutDashboard className="w-6 h-6 text-primary" />
              <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img src={user?.avatar} alt={user?.name} className="w-10 h-10 rounded-full" />
                <div className="text-right hidden md:block">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name}!</h2>
          <p className="text-muted-foreground">Here's what's happening in your organization today</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Summary Cards */}
            <AdminOverview 
              totalEmployees={totalEmployees}
              completedTasksToday={stats.completedTasksToday}
              pendingTasks={stats.pendingTasks}
              avgPerformance={stats.avgPerformance}
              upcomingMeetings={upcomingMeetings}
            />

            {/* Quick Actions */}
            <Card className="p-6">
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Button onClick={() => setShowMessageModal(true)} className="h-auto py-4 flex flex-col gap-2">
                  <MessageSquare className="w-6 h-6" />
                  <span>Send Message</span>
                </Button>
                <Button onClick={() => setShowTaskModal(true)} className="h-auto py-4 flex flex-col gap-2">
                  <Plus className="w-6 h-6" />
                  <span>Assign Task</span>
                </Button>
                <Button onClick={() => setShowMeetingModal(true)} className="h-auto py-4 flex flex-col gap-2">
                  <Calendar className="w-6 h-6" />
                  <span>Schedule Meeting</span>
                </Button>
                <Button onClick={() => setShowAddEvaluationModal(true)} className="h-auto py-4 flex flex-col gap-2">
                  <FileText className="w-6 h-6" />
                  <span>Add Evaluation</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-4 flex flex-col gap-2 md:col-span-2"
                  onClick={handleExportReports}
                  disabled={isExporting}
                >
                  <FileText className="w-6 h-6" />
                  <span>{isExporting ? 'Exporting…' : 'Export Performance (CSV)'}</span>
                </Button>
              </div>
            </Card>

            {/* Recent Employees Preview */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Recent Employees</h3>
                <Button variant="link" onClick={() => document.querySelector('[value="employees"]')?.dispatchEvent(new Event('click'))}>
                  View All <Users className="w-4 h-4 ml-2" />
                </Button>
              </div>
              <EmployeeGrid 
                employees={employees.slice(0, 4)} 
                onEmployeeClick={setSelectedEmployee}
                onEmployeeNavigate={(id) => navigate(`/employee/${id}`)}
              />
            </Card>
          </TabsContent>

          <TabsContent value="employees" className="space-y-6">
            {/* Search Bar */}
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search employees by name, department, or position..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={() => setShowAddEmployeeModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Employee
              </Button>
            </div>

            {/* Employee Count */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>Total Employees: {filteredEmployees.length}</span>
            </div>

            {/* Employee Grid */}
            <EmployeeGrid 
              employees={filteredEmployees} 
              onEmployeeClick={setSelectedEmployee}
              onEmployeeNavigate={(id) => navigate(`/employee/${id}`)}
            />

            {filteredEmployees.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No employees found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery ? 'Try adjusting your search' : 'Add your first employee to get started'}
                </p>
                <Button onClick={() => setShowAddEmployeeModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <DepartmentStats />
          </TabsContent>
        </Tabs>
      </main>

      {/* Modals */}
      {selectedEmployee && (
        <EmployeeModal
          employeeId={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
        />
      )}

      {showMessageModal && (
        <SendMessageModal
          onClose={() => setShowMessageModal(false)}
        />
      )}

      {showTaskModal && (
        <CreateTaskModal
          onClose={() => setShowTaskModal(false)}
        />
      )}

      {showMeetingModal && (
        <ScheduleMeetingModal
          onClose={() => setShowMeetingModal(false)}
        />
      )}

      {showAddEmployeeModal && (
        <AddEmployeeModal
          onClose={() => setShowAddEmployeeModal(false)}
        />
      )}

      {showAddEvaluationModal && (
        <AddEvaluationModal
          onClose={() => setShowAddEvaluationModal(false)}
        />
      )}
    </div>
  );
};
