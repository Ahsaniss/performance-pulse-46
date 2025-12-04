import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Calendar, MapPin, Plus, CheckCircle2, Clock, AlertCircle, Download, MessageSquare, Video, Trash2, Pencil, Upload, Eye, EyeOff, Maximize2, Minimize2 } from 'lucide-react';
import { PerformanceChart } from '@/components/admin/PerformanceChart';
import { EmployeeMISDashboard } from '@/components/admin/EmployeeMISDashboard';
import { CreateTaskModal } from '@/components/admin/CreateTaskModal';
import { AddEvaluationModal } from '@/components/admin/AddEvaluationModal';
import { SendMessageModal } from '@/components/admin/SendMessageModal';
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal';
import { useTasks } from '@/hooks/useTasks';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { useAnalytics } from '@/hooks/useAnalytics';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getAvatarUrl } from '@/lib/utils';
import api from '@/lib/api';
import { toast } from 'sonner';
import ChatInterface from '@/components/chat/ChatInterface';

interface EmployeeModalProps {
  employeeId: string;
  onClose: () => void;
}

export const EmployeeModal = ({ employeeId, onClose }: EmployeeModalProps) => {
  const { employees, deleteEmployee, updateEmployee } = useEmployees();
  const { tasks, deleteTask } = useTasks(employeeId);
  const { evaluations, deleteEvaluation } = useEvaluations(employeeId);
  const { attendance } = useAttendance(employeeId);
  const { analytics, loading: analyticsLoading, refetch: refetchAnalytics } = useAnalytics(employeeId);
  
  // Refetch analytics when tasks change to ensure graphs are real-time
  useEffect(() => {
    refetchAnalytics();
  }, [tasks]);

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddEvaluationModal, setShowAddEvaluationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'task' | 'evaluation' | 'employee', id: string } | null>(null);
  
  const [isEditing, setIsEditing] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'employee' as 'employee' | 'admin',
    password: '',
    avatar: '',
  });

  const employee = employees.find(emp => emp.id === employeeId);

  if (!employee) return null;

  const handleEditClick = () => {
    setEditFormData({
      name: employee.name,
      email: employee.email,
      department: employee.department,
      position: employee.position,
      role: employee.role || 'employee',
      password: '',
      avatar: employee.avatar || '',
    });
    setIsEditing(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.data.success) {
        setEditFormData({ ...editFormData, avatar: response.data.data });
        toast.success('Image uploaded successfully');
      }
    } catch (error) {
      console.error('Upload failed', error);
      toast.error('Failed to upload image');
    }
  };

  const handleSave = async () => {
    try {
      await updateEmployee(employeeId, editFormData);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update employee:', error);
    }
  };

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  const handleExportCSV = () => {
    exportToCSV({
      name: employee.name,
      email: employee.email,
      department: employee.department || 'N/A',
      position: employee.position || 'N/A',
      tasks,
      evaluations,
      attendance,
    });
  };

  const handleExportPDF = () => {
    exportToPDF({
      name: employee.name,
      email: employee.email,
      department: employee.department || 'N/A',
      position: employee.position || 'N/A',
      tasks,
      evaluations,
      attendance,
    });
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'task') {
      await deleteTask(itemToDelete.id);
    } else if (itemToDelete.type === 'evaluation') {
      await deleteEvaluation(itemToDelete.id);
    } else if (itemToDelete.type === 'employee') {
      await deleteEmployee(itemToDelete.id);
      onClose(); // Close modal after deleting employee
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className={isFullScreen ? "max-w-[100vw] w-screen h-screen max-h-screen rounded-none overflow-y-auto" : "max-w-7xl max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Employee Dashboard</span>
              <div className="flex items-center gap-2">
                {!isEditing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleEditClick}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave}>
                      Save Changes
                    </Button>
                  </div>
                )}
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setItemToDelete({ type: 'employee', id: employee.id });
                    setDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Employee
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          {/* Employee Header */}
          <div className="flex items-start gap-6 pb-6 border-b">
            <div className="relative">
              <img
                src={isEditing ? getAvatarUrl(editFormData.avatar, editFormData.name) : getAvatarUrl(employee.avatar, employee.name)}
                alt={employee.name}
                className="w-24 h-24 rounded-full border-4 border-primary object-cover"
              />
              {isEditing && (
                <div className="absolute bottom-0 right-0">
                  <input
                    type="file"
                    id="avatar-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                  <Label
                    htmlFor="avatar-upload"
                    className="flex items-center justify-center w-8 h-8 bg-primary text-primary-foreground rounded-full cursor-pointer hover:bg-primary/90"
                  >
                    <Upload className="w-4 h-4" />
                  </Label>
                </div>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={editFormData.email}
                        onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="department">Department</Label>
                      <Select 
                        value={editFormData.department} 
                        onValueChange={(val) => setEditFormData({ ...editFormData, department: val })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Engineering">Engineering</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="HR">HR</SelectItem>
                          <SelectItem value="Finance">Finance</SelectItem>
                          <SelectItem value="Operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={editFormData.position}
                        onChange={(e) => setEditFormData({ ...editFormData, position: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">New Password (optional)</Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={editFormData.password}
                          onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                          placeholder="Leave blank to keep current"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold">{employee.name}</h2>
                  <p className="text-muted-foreground">{employee.position || 'N/A'}</p>
                  <div className="flex items-center gap-4 mt-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <span>{employee.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{employee.department || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Joined {employee.joinDate ? new Date(employee.joinDate).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="text-right">
              <Badge className="mb-2">{employee.status || 'active'}</Badge>
              <div className="text-2xl font-bold text-primary">
                {employee.performanceScore || 0}/5.0
              </div>
              <p className="text-sm text-muted-foreground">Performance Score</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 pb-4">
            <Button onClick={() => setShowMessageModal(true)} size="sm">
              <MessageSquare className="w-4 h-4 mr-2" />
              Send Message
            </Button>
            <Button onClick={() => setShowMeetingModal(true)} size="sm" variant="outline">
              <Video className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
            <Button onClick={handleExportCSV} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button onClick={handleExportPDF} size="sm" variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>

          <Tabs defaultValue="tasks" className="mt-6">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
              <TabsTrigger value="messages">Messages</TabsTrigger>
            </TabsList>

            <TabsContent value="tasks" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Assigned Tasks</h3>
                <Button size="sm" onClick={() => setShowAddTaskModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Assign New Task
                </Button>
              </div>

              {/* Task Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                    <div>
                      <p className="text-2xl font-bold">{completedTasks}</p>
                      <p className="text-sm text-muted-foreground">Completed</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-blue-500" />
                    <div>
                      <p className="text-2xl font-bold">{inProgressTasks}</p>
                      <p className="text-sm text-muted-foreground">In Progress</p>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-8 h-8 text-amber-500" />
                    <div>
                      <p className="text-2xl font-bold">{pendingTasks}</p>
                      <p className="text-sm text-muted-foreground">Pending</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Task List */}
              <div className="space-y-3">
                {tasks.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No tasks assigned yet</p>
                  </Card>
                ) : (
                  tasks.map((task) => (
                    <Card key={task.id} className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold">{task.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{task.description || 'No description'}</p>
                          <div className="flex items-center gap-4 mt-3 text-sm">
                            <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
                              {task.priority}
                            </Badge>
                            <span className="text-muted-foreground">
                              Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              task.status === 'completed'
                                ? 'bg-green-500/10 text-green-500'
                                : task.status === 'in-progress'
                                ? 'bg-blue-500/10 text-blue-500'
                                : 'bg-amber-500/10 text-amber-500'
                            }
                          >
                            {task.status.replace('_', ' ')}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setItemToDelete({ type: 'task', id: task.id });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Progress Reports</h3>
              <div className="space-y-6">
                {tasks.flatMap(t => (t.progressUpdates || []).map(u => ({ ...u, taskTitle: t.title, taskId: t.id })))
                  .sort((a, b) => new Date(b.timestamp || b.updatedAt).getTime() - new Date(a.timestamp || a.updatedAt).getTime())
                  .length === 0 ? (
                    <Card className="p-8 text-center">
                      <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No progress reports submitted yet</p>
                    </Card>
                  ) : (
                    tasks.flatMap(t => (t.progressUpdates || []).map(u => ({ ...u, taskTitle: t.title, taskId: t.id })))
                      .sort((a, b) => new Date(b.timestamp || b.updatedAt).getTime() - new Date(a.timestamp || a.updatedAt).getTime())
                      .map((update, idx) => (
                        <Card key={idx} className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-semibold text-lg">{update.taskTitle}</h4>
                              <p className="text-sm text-muted-foreground">
                                {new Date(update.timestamp || update.updatedAt).toLocaleString()}
                              </p>
                            </div>
                            <Badge className="text-md px-3 py-1">{update.percentage}% Completed</Badge>
                          </div>
                          
                          <div className="space-y-4">
                            <div>
                              <h5 className="text-sm font-semibold text-gray-700 mb-1">Progress Description</h5>
                              <p className="text-gray-600 bg-gray-50 p-3 rounded-md">{update.comment}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {update.strategy && (
                                <div>
                                  <h5 className="text-sm font-semibold text-blue-700 mb-1">Strategy / Approach</h5>
                                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">{update.strategy}</p>
                                </div>
                              )}
                              {update.blockers && (
                                <div>
                                  <h5 className="text-sm font-semibold text-red-700 mb-1">Blockers / Challenges</h5>
                                  <p className="text-sm text-gray-600 bg-red-50 p-3 rounded-md">{update.blockers}</p>
                                </div>
                              )}
                            </div>

                            {update.attachments && update.attachments.length > 0 && (
                              <div>
                                <h5 className="text-sm font-semibold text-gray-700 mb-2">Attachments</h5>
                                <div className="flex flex-wrap gap-2">
                                  {update.attachments.map((file: any, i: number) => (
                                    <a 
                                      key={i} 
                                      href={`http://localhost:5000/${file.path}`} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-md hover:bg-gray-50 transition-colors text-sm text-blue-600 hover:underline"
                                    >
                                      <Download className="w-4 h-4" />
                                      <span className="truncate max-w-[200px]">{file.originalName}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      ))
                  )}
              </div>
            </TabsContent>

            <TabsContent value="evaluations" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Performance Evaluations</h3>
                <Button size="sm" onClick={() => setShowAddEvaluationModal(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Evaluation
                </Button>
              </div>

              {evaluations.length === 0 ? (
                <Card className="p-8 text-center">
                  <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No evaluations yet</p>
                </Card>
              ) : (
                evaluations.map((evaluation) => (
                  <Card key={evaluation.id} className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">Evaluation Report</h4>
                          {evaluation.type === 'Automated' && (
                            <Badge variant="secondary" className="text-xs">Automated</Badge>
                          )}
                        </div>
                        {evaluation.taskId && typeof evaluation.taskId === 'object' && (
                          <p className="text-sm font-medium text-primary">
                            Task: {(evaluation.taskId as any).title}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {new Date(evaluation.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{evaluation.score}/{evaluation.type === 'Automated' ? '100' : '5.0'}</div>
                          <p className="text-sm text-muted-foreground">Score</p>
                          {evaluation.rating && (
                            <p className="text-xs font-semibold mt-1">{evaluation.rating}</p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setItemToDelete({ type: 'evaluation', id: evaluation.id });
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {evaluation.type === 'Automated' && evaluation.details ? (
                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="bg-muted p-3 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
                          <p className="text-xl font-bold">{evaluation.details.taskCompletionRate}%</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">On-Time Rate</p>
                          <p className="text-xl font-bold">{evaluation.details.onTimeRate}%</p>
                        </div>
                        <div className="bg-muted p-3 rounded-lg text-center">
                          <p className="text-sm text-muted-foreground mb-1">Communication</p>
                          <p className="text-xl font-bold">{evaluation.details.communicationScore}%</p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Meetings Held</p>
                          <p className="font-semibold">{evaluation.meetingsHeld || 0}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Training Applied</p>
                          <p className="font-semibold">{evaluation.trainingApplied || 0}</p>
                        </div>
                      </div>
                    )}

                    {evaluation.feedback && (
                      <div className="pt-4 border-t mt-4">
                        <p className="text-sm font-semibold mb-2">System Feedback:</p>
                        <p className="text-sm text-muted-foreground italic">{evaluation.feedback}</p>
                      </div>
                    )}

                    {evaluation.outcomeSummary && (
                      <div className="pt-4 border-t mt-4">
                        <p className="text-sm font-semibold mb-2">Outcome Summary:</p>
                        <p className="text-sm text-muted-foreground">{evaluation.outcomeSummary}</p>
                      </div>
                    )}
                  </Card>
                ))
              )}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Attendance Record</h3>
              <div className="space-y-3">
                {attendance.length === 0 ? (
                  <Card className="p-8 text-center">
                    <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No attendance records yet</p>
                  </Card>
                ) : (
                  attendance.map((record) => (
                    <Card key={record.id} className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">
                            {record.checkIn && `Check-in: ${new Date(record.checkIn).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                            {record.checkOut && ` | Check-out: ${new Date(record.checkOut).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                          </p>
                        </div>
                        <Badge
                          className={
                            record.status === 'present'
                              ? 'bg-green-500/10 text-green-500'
                              : record.status === 'late'
                              ? 'bg-amber-500/10 text-amber-500'
                              : 'bg-red-500/10 text-red-500'
                          }
                        >
                          {record.status}
                        </Badge>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="performance" className="space-y-4 mt-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Performance Trends</h3>
                <Button variant="outline" size="sm" onClick={() => setIsFullScreen(!isFullScreen)}>
                  {isFullScreen ? <Minimize2 className="w-4 h-4 mr-2" /> : <Maximize2 className="w-4 h-4 mr-2" />}
                  {isFullScreen ? "Exit Full Screen" : "Full Screen"}
                </Button>
              </div>
              {analyticsLoading ? (
                <div className="flex justify-center p-8">Loading analytics...</div>
              ) : analytics ? (
                <EmployeeMISDashboard analytics={analytics} employeeName={employee.name} />
              ) : (
                <PerformanceChart employeeId={employeeId} />
              )}
            </TabsContent>

            <TabsContent value="messages" className="space-y-4 mt-4">
              <ChatInterface defaultSelectedUser={employeeId} hideSidebar={true} />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {showAddTaskModal && (
        <CreateTaskModal
          onClose={() => setShowAddTaskModal(false)}
          preSelectedEmployeeId={employeeId}
        />
      )}

      {showAddEvaluationModal && (
        <AddEvaluationModal
          onClose={() => setShowAddEvaluationModal(false)}
          preSelectedEmployeeId={employeeId}
        />
      )}

      {showMessageModal && (
        <SendMessageModal
          onClose={() => setShowMessageModal(false)}
          preSelectedEmployeeId={employeeId}
        />
      )}

      {showMeetingModal && (
        <ScheduleMeetingModal
          onClose={() => setShowMeetingModal(false)}
          preSelectedEmployeeId={employeeId}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {itemToDelete?.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
