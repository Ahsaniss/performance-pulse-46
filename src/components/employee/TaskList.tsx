import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

const mockTasks = [
  { id: 1, title: "Complete Q3 Performance Report", status: "in-progress", priority: "high", deadline: "2024-10-25" },
  { id: 2, title: "Review Team Code Changes", status: "pending", priority: "medium", deadline: "2024-10-22" },
  { id: 3, title: "Attend Training Session", status: "completed", priority: "low", deadline: "2024-10-20" },
  { id: 4, title: "Update Project Documentation", status: "in-progress", priority: "medium", deadline: "2024-10-24" },
  { id: 5, title: "Client Meeting Preparation", status: "pending", priority: "high", deadline: "2024-10-21" },
];

export const TaskList = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="w-5 h-5 text-chart-3" />;
      case "in-progress":
        return <Clock className="w-5 h-5 text-chart-4" />;
      default:
        return <AlertCircle className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      completed: "bg-chart-3/10 text-chart-3",
      "in-progress": "bg-chart-4/10 text-chart-4",
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

  return (
    <div className="space-y-3">
      {mockTasks.map((task) => (
        <div
          key={task.id}
          className="flex items-center justify-between p-4 bg-muted/30 border border-border rounded-lg hover:bg-muted/50 transition-all duration-300"
        >
          <div className="flex items-center gap-4 flex-1">
            {getStatusIcon(task.status)}
            <div className="flex-1">
              <h4 className="font-medium">{task.title}</h4>
              <p className="text-sm text-muted-foreground mt-1">Due: {task.deadline}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge className={getPriorityBadge(task.priority)}>
              {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
            </Badge>
            <Badge className={getStatusBadge(task.status)}>
              {task.status.replace("-", " ").toUpperCase()}
            </Badge>
            {task.status !== "completed" && (
              <Button size="sm" variant="outline">
                Update
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
