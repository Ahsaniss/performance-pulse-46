import { Card } from '@/components/ui/card';
import { Users, CheckCircle2, TrendingUp, Calendar } from 'lucide-react';

interface AdminOverviewProps {
  totalEmployees: number;
  completedTasksToday: number;
  pendingTasks: number;
  avgPerformance: string;
  upcomingMeetings: number;
}

export const AdminOverview = ({ 
  totalEmployees, 
  completedTasksToday, 
  pendingTasks, 
  avgPerformance, 
  upcomingMeetings 
}: AdminOverviewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Users className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Employees</p>
            <p className="text-2xl font-bold">{totalEmployees}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-green-500/10 rounded-lg">
            <CheckCircle2 className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Completed Today</p>
            <p className="text-2xl font-bold">{completedTasksToday}</p>
            <p className="text-xs text-muted-foreground">Pending: {pendingTasks}</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-lg">
            <TrendingUp className="w-6 h-6 text-amber-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Avg Performance</p>
            <p className="text-2xl font-bold">{avgPerformance}/5.0</p>
          </div>
        </div>
      </Card>

      <Card className="p-6 hover:shadow-lg transition-shadow">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-purple-500/10 rounded-lg">
            <Calendar className="w-6 h-6 text-purple-500" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Upcoming Meetings</p>
            <p className="text-2xl font-bold">{upcomingMeetings}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
