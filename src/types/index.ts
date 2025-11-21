export interface Employee {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  department: string;
  position: string;
  role: 'admin' | 'employee';
  joinDate: string;
  status: 'active' | 'inactive' | 'on-leave';
  performanceScore: number;
}

export type TaskStatus = 'pending' | 'in-progress' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface Message {
  id: string;
  from: string;
  to: string | 'all';
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'individual' | 'broadcast';
  attachments?: string[];
}

export interface Meeting {
  id: string;
  title: string;
  description: string;
  scheduledBy: string;
  attendees: string[];
  date: string;
  time: string;
  link?: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Evaluation {
  id: string;
  employeeId: string;
  evaluatedBy: string;
  taskId: string;
  score: number;
  date: string;
  comments: string;
  categories: {
    productivity: number;
    quality: number;
    teamwork: number;
    communication: number;
  };
  meetingsHeld?: number;
  trainingApplied?: number;
  outcomeSummary?: string;
  previousWork?: string[];
  satisfactionScore?: number;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'present' | 'absent' | 'late' | 'on-leave';
}

export interface Notification {
  id: string;
  employeeId: string | 'all';
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  type: 'task' | 'message' | 'meeting' | 'evaluation';
}
