export interface Employee {
  id: string;
  name: string;
  email: string;
  password?: string;
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
export type TaskDifficulty = 'easy' | 'medium' | 'hard' | 'low' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo: string;
  assignedBy: string;
  status: TaskStatus;
  priority: TaskPriority;
  difficulty?: TaskDifficulty;
  currentProgress?: number;
  progressUpdates?: ProgressUpdate[];
  deadline: string;
  createdAt: string;
  completedAt?: string;
  updatedAt?: string;
}

export interface Attachment {
  filename: string;
  originalName: string;
  path: string;
  mimetype: string;
}

export interface ProgressUpdate {
  percentage: number;
  comment: string;
  strategy?: string;
  blockers?: string;
  attachments?: Attachment[];
  timestamp?: string;
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
  attachments?: Attachment[];
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
  taskId: string | { _id: string; title: string };
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
  type?: 'Manual' | 'Automated';
  rating?: string;
  feedback?: string;
  details?: {
    taskCompletionRate: number;
    onTimeRate: number;
    communicationScore: number;
    totalTasks: number;
    completedTasks: number;
    tasksWithUpdates: number;
  };
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

export interface AnalyticsMetrics {
  completionRate: number;
  onTimeRate: number;
  averageTurnaroundTime: number;
  efficiencyScore: number;
  tasksCompleted: number;
  tasksPending: number;
  tasksOverdue: number;
}

export interface AIInsight {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export interface EmployeeAnalytics {
  employeeId: string;
  metrics: AnalyticsMetrics;
  aiInsight: AIInsight;
  taskHistory: Task[];
}
