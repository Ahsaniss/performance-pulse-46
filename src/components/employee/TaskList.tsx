import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle, BarChart2, History } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";
import { ProgressUpdateModal } from "./ProgressUpdateModal";
import { Task, TaskStatus } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TaskListProps {
  employeeId?: string;
}

export const TaskList = ({ employeeId }: TaskListProps) => {
  const { tasks, loading, updateTask, refetch } = useTasks(employeeId);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isProgressModalOpen, setIsProgressModalOpen] = useState(false);
  const [historyTask, setHistoryTask] = useState<Task | null>(null);

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    try {
      await updateTask(taskId, { status: newStatus });
    } catch (error: any) {
      toast.error('Failed to update task');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-chart-3" />;
      case "in_progress":
        return <Clock className="w-5 h-5 text-chart-4" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-chart-3/10 text-chart-3",
      in_progress: "bg-chart-4/10 text-chart-4",
      pending: "bg-muted text-muted-foreground",
    };
    return variants[status] || variants.pending;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, string> = {
      high: "bg-chart-5/10 text-chart-5",
      medium: "bg-chart-4/10 text-chart-4",
      low: "bg-muted text-muted-foreground",
    };
    return variants[priority] || variants.low;
  };

  const handleOpenProgressModal = (task: Task) => {
    setSelectedTask(task);
    setIsProgressModalOpen(true);
  };

  if (loading) {
    return <div className="text-center py-8 text-muted-foreground">Loading tasks...</div>;
  }

  if (tasks.length === 0) {
    return <div className="text-center py-8 text-muted-foreground">No tasks assigned</div>;
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-300"
        >
          <div className="flex items-center gap-4 flex-1">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <h4 className="font-medium">{task.title}</h4>
              {task.description && (
                <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
              )}
              {task.deadline && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(task.deadline).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getPriorityBadge(task.priority)}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge className={getStatusBadge(task.status)}>
              {task.status.replace("_", " ").toUpperCase()}
            </Badge>
            
            {/* View History Button */}
            {(task.progressUpdates && task.progressUpdates.length > 0) && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setHistoryTask(task)}
                title="View History"
              >
                <History className="w-4 h-4" />
              </Button>
            )}

            {task.status === "pending" && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTaskStatus(task.id, "in_progress")}
              >
                Start
              </Button>
            )}
            {task.status === "in_progress" && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenProgressModal(task)}
                >
                  <BarChart2 className="w-4 h-4 mr-1" />
                  Report Progress
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTaskStatus(task.id, "completed")}
                >
                  Complete
                </Button>
              </>
            )}
          </div>
        </div>
      ))}
      
      {selectedTask && (
        <ProgressUpdateModal
          isOpen={isProgressModalOpen}
          onClose={() => setIsProgressModalOpen(false)}
          taskId={selectedTask.id}
          currentProgress={selectedTask.currentProgress || 0}
          onUpdateSuccess={() => {
            refetch();
          }}
        />
      )}

      {/* History Dialog */}
      <Dialog open={!!historyTask} onOpenChange={(open) => !open && setHistoryTask(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Progress History: {historyTask?.title}</DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[300px] w-full rounded-md border p-4">
            {historyTask?.progressUpdates?.slice().reverse().map((update, index) => (
              <div key={index} className="mb-4 border-b pb-2 last:border-0">
                <div className="flex justify-between text-sm text-muted-foreground mb-1">
                  <span>{update.timestamp ? new Date(update.timestamp).toLocaleString() : 'N/A'}</span>
                  <Badge variant="outline">{update.percentage}%</Badge>
                </div>
                <p className="text-sm font-medium">{update.comment}</p>
                {update.strategy && <p className="text-xs text-muted-foreground mt-1"><strong>Strategy:</strong> {update.strategy}</p>}
                {update.blockers && <p className="text-xs text-red-500 mt-1"><strong>Blockers:</strong> {update.blockers}</p>}
              </div>
            ))}
            {(!historyTask?.progressUpdates || historyTask.progressUpdates.length === 0) && (
              <p className="text-center text-muted-foreground">No updates yet.</p>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
};
