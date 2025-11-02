import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useTasks } from "@/hooks/useTasks";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  due_date: string | null;
}

interface TaskListProps {
  employeeId?: string;
}

export const TaskList = ({ employeeId }: TaskListProps) => {
  const { tasks, loading, updateTask } = useTasks(employeeId);

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
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
              {task.due_date && (
                <p className="text-xs text-muted-foreground mt-1">
                  Due: {new Date(task.due_date).toLocaleDateString()}
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
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateTaskStatus(task.id, "completed")}
              >
                Complete
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
