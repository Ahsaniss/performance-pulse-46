import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockEmployees, mockTasks, mockEvaluations, mockAttendance } from '@/lib/mockData';
import { X, Mail, Phone, Calendar, MapPin, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { PerformanceChart } from '@/components/admin/PerformanceChart';
import { CreateTaskModal } from '@/components/admin/CreateTaskModal';
import { AddEvaluationModal } from '@/components/admin/AddEvaluationModal';

interface EmployeeModalProps {
  employeeId: string;
  onClose: () => void;
}

export const EmployeeModal = ({ employeeId, onClose }: EmployeeModalProps) => {
  const employee = mockEmployees.find(emp => emp.id === employeeId);
  const employeeTasks = mockTasks.filter(task => task.assignedTo === employeeId);
  const employeeEvaluations = mockEvaluations.filter(evaluation => evaluation.employeeId === employeeId);
  const employeeAttendance = mockAttendance.filter(att => att.employeeId === employeeId);
  
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [showAddEvaluationModal, setShowAddEvaluationModal] = useState(false);

  if (!employee) return null;

  const completedTasks = employeeTasks.filter(t => t.status === 'completed').length;
  const inProgressTasks = employeeTasks.filter(t => t.status === 'in-progress').length;
  const pendingTasks = employeeTasks.filter(t => t.status === 'pending').length;

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
              src={employee.avatar}
              alt={employee.name}
              className="w-24 h-24 rounded-full border-4 border-primary"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{employee.name}</h2>
              <p className="text-muted-foreground">{employee.position}</p>
              <div className="flex items-center gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <span>{employee.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>{employee.department}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {new Date(employee.joinDate).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <Badge className="mb-2">{employee.status}</Badge>
              <div className="text-2xl font-bold text-primary">
                {employee.performanceScore}/5.0
              </div>
              <p className="text-sm text-muted-foreground">Performance Score</p>
            </div>
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
                {employeeTasks.map((task) => (
                  <Card key={task.id} className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        <div className="flex items-center gap-4 mt-3 text-sm">
                          <Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
                            {task.priority}
                          </Badge>
                          <span className="text-muted-foreground">
                            Due: {new Date(task.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
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
                    </div>
                  </Card>
                ))}
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

              {employeeEvaluations.map((evaluation) => (
                <Card key={evaluation.id} className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-semibold">Evaluation Report</h4>
                      <p className="text-sm text-muted-foreground">
                        {new Date(evaluation.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{evaluation.score}/5.0</div>
                      <p className="text-sm text-muted-foreground">Overall Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Productivity</p>
                      <p className="font-semibold">{evaluation.categories.productivity}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Quality</p>
                      <p className="font-semibold">{evaluation.categories.quality}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Teamwork</p>
                      <p className="font-semibold">{evaluation.categories.teamwork}/5.0</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Communication</p>
                      <p className="font-semibold">{evaluation.categories.communication}/5.0</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm font-semibold mb-2">Comments:</p>
                    <p className="text-sm text-muted-foreground">{evaluation.comments}</p>
                  </div>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="attendance" className="space-y-4 mt-4">
              <h3 className="text-lg font-semibold">Attendance Record</h3>
              <div className="space-y-3">
                {employeeAttendance.map((record) => (
                  <Card key={record.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold">{new Date(record.date).toLocaleDateString()}</p>
                        <p className="text-sm text-muted-foreground">
                          {record.checkIn && `Check-in: ${record.checkIn}`}
                          {record.checkOut && ` | Check-out: ${record.checkOut}`}
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
                ))}
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
    </>
  );
};
