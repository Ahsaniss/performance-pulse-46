import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LogOut, LayoutDashboard, Users, Search, MessageSquare, Calendar, FileText, Plus, Download } from "lucide-react";
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
import { useEmployees } from "@/hooks/useEmployees";
import { useTasks } from "@/hooks/useTasks";
import { useMeetings } from "@/hooks/useMeetings";
import { useEvaluations } from "@/hooks/useEvaluations";
import { useAdminStats } from "@/hooks/useAdminStats";
import { exportPerformanceSummary } from "@/lib/exportUtils";
import { getAvatarUrl } from "@/lib/utils";
import ChatInterface from "@/components/chat/ChatInterface";

export const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { employees, loading: employeesLoading } = useEmployees();
  const { tasks, loading: tasksLoading } = useTasks();
  const { meetings, loading: meetingsLoading } = useMeetings(user?.id);
  const { evaluations, loading: evaluationsLoading } = useEvaluations();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showAddEvaluationModal, setShowAddEvaluationModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const stats = useAdminStats(tasks, employees, evaluations);

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalEmployees = employees.length;
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled').length;

  const handleExportReports = async () => {
    try {
      setIsExporting(true);
      exportPerformanceSummary(employees, tasks, evaluations);
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
                <img src={getAvatarUrl(user?.avatar, user?.email)} alt={user?.name} className="w-10 h-10 rounded-full object-cover" />
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="employees">Employees</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => setShowMessageModal(true)}
                className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-500/10 text-blue-600 rounded-lg group-hover:bg-blue-500 group-hover:text-white transition-colors">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Send Message</h3>
                    <p className="text-sm text-muted-foreground">Broadcast or direct message</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setShowTaskModal(true)}
                className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 text-green-600 rounded-lg group-hover:bg-green-500 group-hover:text-white transition-colors">
                    <Plus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Assign Task</h3>
                    <p className="text-sm text-muted-foreground">Create new assignments</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setShowMeetingModal(true)}
                className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-500/10 text-purple-600 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-colors">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Schedule Meeting</h3>
                    <p className="text-sm text-muted-foreground">Set up team syncs</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={() => setShowAddEvaluationModal(true)}
                className="bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-amber-500/10 text-amber-600 rounded-lg group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Add Evaluation</h3>
                    <p className="text-sm text-muted-foreground">Manual performance review</p>
                  </div>
                </div>
              </div>

              <div 
                onClick={handleExportReports}
                className={`bg-card p-6 rounded-xl border shadow-sm hover:shadow-md transition-all cursor-pointer group ${isExporting ? 'opacity-50 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-500/10 text-gray-600 rounded-lg group-hover:bg-gray-500 group-hover:text-white transition-colors">
                    <Download className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Export Data</h3>
                    <p className="text-sm text-muted-foreground">Download CSV summary</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Employees Preview */}
            <Card className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Recent Employees</h3>
                <Button variant="link" onClick={() => setActiveTab("employees")}>
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

          <TabsContent value="messages" className="space-y-6">
            <ChatInterface />
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
