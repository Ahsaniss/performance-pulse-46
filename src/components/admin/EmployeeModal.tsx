import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Mail, Calendar, MapPin, Plus, CheckCircle2, Clock, AlertCircle, Download, MessageSquare, Video, Trash2 } from 'lucide-react';
import { PerformanceChart } from '@/components/admin/PerformanceChart';
import { CreateTaskModal } from '@/components/admin/CreateTaskModal';
import { AddEvaluationModal } from '@/components/admin/AddEvaluationModal';
import { SendMessageModal } from '@/components/admin/SendMessageModal';
import { ScheduleMeetingModal } from '@/components/admin/ScheduleMeetingModal';
import { useTasks } from '@/hooks/useTasks';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useAttendance } from '@/hooks/useAttendance';
import { useProfiles } from '@/hooks/useProfiles';
import { exportToCSV, exportToPDF } from '@/lib/exportUtils';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface EmployeeModalProps {
  employeeId: string;
  onClose: () => void;
}

export const EmployeeModal = ({ employeeId, onClose }: EmployeeModalProps) => {
  const { profiles } = useProfiles();
  const { tasks, deleteTask } = useTasks(employeeId);
  const { evaluations, deleteEvaluation } = useEvaluations(employeeId);
  const { attendance } = useAttendance(employeeId);
  
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddEvaluationModal, setShowAddEvaluationModal] = useState(false);
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'task' | 'evaluation', id: string } | null>(null);

  const employee = profiles.find(emp => emp.id === employeeId);

  if (!employee) return null;

  const completedTasks = tasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  const handleExportCSV = () => {
    exportToCSV({
      name: employee.full_name,
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
      name: employee.full_name,
      email: employee.email,
      department: employee.department || 'N/A',
      position: employee.position || 'N/A',
      tasks,
      evaluations,
      attendance,
    });
  };

  const handleDelete = () => {
    if (!itemToDelete) return;
    
    if (itemToDelete.type === 'task') {
      deleteTask(itemToDelete.id);
    } else {
      deleteEvaluation(itemToDelete.id);
    }
    
    setDeleteDialogOpen(false);
    setItemToDelete(null);
  };

  return (
    <>
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Employee Dashboard</span>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>

          {/* Employee Header */}
          <div className="flex items-start gap-6 pb-6 border-b">
            <img
              src={employee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.full_name}`}
              alt={employee.full_name}
              className="w-24 h-24 rounded-full border-4 border-primary"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{employee.full_name}</h2>
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
                  <span>Joined {employee.join_date ? new Date(employee.join_date).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="mb-2">{employee.status || 'active'}</Badge>
              <div className="text-2xl font-bold text-primary">
                {employee.performance_score || 0}/5.0
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
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="evaluations">Evaluations</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
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
                              Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={
                              task.status === 'completed'
                                ? 'bg-green-500/10 text-green-500'
                                : task.status === 'in_progress'
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
                        <h4 className="font-semibold">Evaluation Report</h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(evaluation.evaluation_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <div className="text-2xl font-bold text-primary">{evaluation.satisfaction_score}/5</div>
                          <p className="text-sm text-muted-foreground">Score</p>
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

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Meetings Held</p>
                        <p className="font-semibold">{evaluation.meetings_held}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Training Applied</p>
                        <p className="font-semibold">{evaluation.training_applied}</p>
                      </div>
                    </div>

                    {evaluation.outcome_summary && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-semibold mb-2">Outcome Summary:</p>
                        <p className="text-sm text-muted-foreground">{evaluation.outcome_summary}</p>
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
                            {record.check_in && `Check-in: ${record.check_in}`}
                            {record.check_out && ` | Check-out: ${record.check_out}`}
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
              <h3 className="text-lg font-semibold">Performance Trends</h3>
              <PerformanceChart employeeId={employeeId} />
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
