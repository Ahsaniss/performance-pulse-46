import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEmployees } from '@/hooks/useEmployees';
import { useEvaluations } from '@/hooks/useEvaluations';
import { useTasks } from '@/hooks/useTasks';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface AddEvaluationModalProps {
  onClose: () => void;
  preSelectedEmployeeId?: string;
}

export const AddEvaluationModal = ({ onClose, preSelectedEmployeeId }: AddEvaluationModalProps) => {
  const { employees } = useEmployees();
  const { createEvaluation } = useEvaluations();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    employeeId: preSelectedEmployeeId || '',
    taskId: '',
    productivity: 0,
    quality: 0,
    teamwork: 0,
    communication: 0,
    comments: '',
  });

  const { tasks } = useTasks(formData.employeeId);

  const overallScore = ((formData.productivity + formData.quality + formData.teamwork + formData.communication) / 4) * 20; // Convert 5-scale to 100-scale

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.employeeId) {
      toast.error('Please select an employee');
      return;
    }

    if (!formData.taskId) {
      toast.error('Please select a task to evaluate');
      return;
    }

    if (formData.productivity === 0 || formData.quality === 0 || formData.teamwork === 0 || formData.communication === 0) {
      toast.error('Please rate all categories');
      return;
    }

    try {
      await createEvaluation({
        employeeId: formData.employeeId,
        taskId: formData.taskId,
        evaluatedBy: user?.id || 'admin-001',
        score: Math.round(overallScore),
        date: new Date().toISOString(),
        comments: formData.comments,
        categories: {
          productivity: formData.productivity,
          quality: formData.quality,
          teamwork: formData.teamwork,
          communication: formData.communication,
        },
      });

      const employee = employees.find(e => e.id === formData.employeeId);
      // toast.success(`Evaluation added for ${employee?.name}!`); // Handled in hook
      onClose();
    } catch (error) {
      console.error('Failed to create evaluation:', error);
    }
  };

  const renderStarRating = (category: 'productivity' | 'quality' | 'teamwork' | 'communication', label: string) => (
    <div>
      <Label>{label}</Label>
      <div className="flex gap-2 mt-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => setFormData({ ...formData, [category]: rating })}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                rating <= formData[category]
                  ? 'fill-amber-500 text-amber-500'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
        <span className="ml-2 self-center font-semibold">{formData[category]}/5</span>
      </div>
    </div>
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Performance Evaluation</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div>
            <Label htmlFor="employee">Select Employee</Label>
            <Select 
              value={formData.employeeId} 
              onValueChange={(val) => setFormData({ ...formData, employeeId: val })}
              disabled={!!preSelectedEmployeeId}
            >
              <SelectTrigger id="employee">
                <SelectValue placeholder="Choose an employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.filter(e => e.role === 'employee').map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} - {emp.position}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="task">Select Task</Label>
            <Select 
              value={formData.taskId} 
              onValueChange={(val) => setFormData({ ...formData, taskId: val })}
              disabled={!formData.employeeId}
            >
              <SelectTrigger id="task">
                <SelectValue placeholder={formData.employeeId ? "Choose a task" : "Select an employee first"} />
              </SelectTrigger>
              <SelectContent>
                {tasks.filter((t: any) => t.status === 'completed').length === 0 ? (
                  <SelectItem value="no-tasks" disabled>No completed tasks found</SelectItem>
                ) : (
                  tasks.filter((t: any) => t.status === 'completed').map((task: any) => (
                    <SelectItem key={task.id} value={task.id}>
                      {task.title}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">Only completed tasks can be evaluated.</p>
          </div>

          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <h3 className="font-semibold text-lg">Performance Categories</h3>
            
            {renderStarRating('productivity', 'Productivity')}
            {renderStarRating('quality', 'Quality of Work')}
            {renderStarRating('teamwork', 'Teamwork & Collaboration')}
            {renderStarRating('communication', 'Communication Skills')}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Overall Score:</span>
                <span className="text-2xl font-bold text-primary">{overallScore.toFixed(1)}/5.0</span>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="comments">Comments & Feedback</Label>
            <Textarea
              id="comments"
              placeholder="Provide detailed feedback about the employee's performance..."
              rows={4}
              value={formData.comments}
              onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
            />
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <Star className="w-4 h-4 mr-2" />
              Submit Evaluation
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
