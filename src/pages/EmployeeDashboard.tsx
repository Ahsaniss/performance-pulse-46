import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, TrendingUp, Calendar, LogOut, User, AlertCircle, MessageSquare } from "lucide-react";
import { NotificationBell } from "@/components/employee/NotificationBell";
import { PersonalPerformanceChart } from "@/components/employee/PersonalPerformanceChart";
import { TaskList } from "@/components/employee/TaskList";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceChart } from "@/components/admin/PerformanceChart";
import { useAttendance } from "@/hooks/useAttendance";
import { Task, Message as MessageType, Meeting, Evaluation } from "@/types";

interface Profile {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

interface TaskStats {
  completed: number;
  inProgress: number;
  pending: number;
  total: number;
}

const EmployeeDashboard = () => {
	const { employeeId } = useParams();
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [profile, setProfile] = useState<Profile | null>(null);
	const [tasks, setTasks] = useState<Task[]>([]);
	const [meetings, setMeetings] = useState<Meeting[]>([]);
	const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [loading, setLoading] = useState(true);
	const [checkedIn, setCheckedIn] = useState(false);
	const [checkInTime, setCheckInTime] = useState<string>('');
	const { attendance, addAttendance, getTodayAttendance } = useAttendance(user?.id);

	const targetUserId = employeeId || user?.id;
	const todayAttendance = getTodayAttendance();
	const taskStats = useMemo<TaskStats>(() => {
		const completed = tasks.filter(t => t.status === 'completed').length;
		const inProgress = tasks.filter(t => t.status === 'in-progress' || t.status === 'in_progress').length;
		const pending = tasks.filter(t => t.status === 'pending').length;
		return { total: tasks.length, completed, inProgress, pending };
	}, [tasks]);
	const unreadMessages = useMemo(() => messages.filter(message => !message.read).length, [messages]);
	const completedTaskHistory = useMemo(
		() => tasks
			.filter(task => task.status === 'completed')
			.sort((a, b) => new Date(b.completedAt ?? b.deadline ?? '').getTime() - new Date(a.completedAt ?? a.deadline ?? '').getTime()),
		[tasks]
	);

	useEffect(() => {
		if (employeeId && user && user.role !== 'admin' && user.id !== employeeId) {
			navigate('/employee');
		}
	}, [employeeId, user, navigate]);

	const mapTask = useCallback(
		(task: any): Task => ({
			id: task.id,
			title: task.title,
			description: task.description,
			assignedTo: task.assigned_to,
			assignedBy: task.assigned_by,
			status: task.status === 'in_progress' ? 'in-progress' : task.status,
			priority: task.priority,
			deadline: task.deadline,
			createdAt: task.created_at,
			completedAt: task.completed_at ?? undefined,
		}),
		[]
	);
	const mapMessage = useCallback(
		(message: any): MessageType => ({
			id: message.id,
			from: message.from_user ?? message.from ?? 'admin',
			to: message.to_user ?? message.to ?? (message.is_broadcast ? 'all' : targetUserId ?? ''),
			subject: message.subject ?? 'Update',
			content: message.content ?? '',
			timestamp: message.timestamp ?? message.created_at ?? new Date().toISOString(),
			read: Boolean(message.read),
			type: message.is_broadcast ? 'broadcast' : (message.type as MessageType['type'] ?? 'individual'),
		}),
		[targetUserId]
	);
	const mapMeeting = useCallback(
		(meeting: any): Meeting => ({
			id: meeting.id,
			title: meeting.title,
			description: meeting.description,
			scheduledBy: meeting.scheduled_by,
			attendees: Array.isArray(meeting.attendees)
				? meeting.attendees
				: meeting.attendees
				? String(meeting.attendees).split(',')
				: [],
			date: meeting.date,
			time: meeting.time,
			link: meeting.link ?? undefined,
			status: meeting.status,
		}),
		[]
	);
	const mapEvaluation = useCallback(
		(evaluation: any): Evaluation => ({
			id: evaluation.id,
			employeeId: evaluation.employee_id,
			evaluatedBy: evaluation.evaluated_by,
			score: evaluation.score,
			date: evaluation.date,
			comments: evaluation.comments ?? '',
			categories:
				evaluation.categories ?? {
					productivity: evaluation.productivity ?? 0,
					quality: evaluation.quality ?? 0,
					teamwork: evaluation.teamwork ?? 0,
					communication: evaluation.communication ?? 0,
				},
		}),
		[]
	);

	useEffect(() => {
		if (!targetUserId) return;

		const channel = supabase
			.channel('messages')
			.on(
				'postgres_changes',
				{ event: 'INSERT', schema: 'public', table: 'messages', filter: `to_user=eq.${targetUserId}` },
				(payload) => {
					if (payload.new) {
						setMessages((prev) => [mapMessage(payload.new), ...prev]);
						toast.success('New message received!');
					}
				}
			)
			.subscribe();

		return () => {
			supabase.removeChannel(channel);
		};
	}, [targetUserId, mapMessage]);

	const fetchProfile = useCallback(async () => {
		if (!targetUserId) return;
		const { data, error } = await supabase
			.from('profiles')
			.select('*')
			.eq('id', targetUserId)
			.single();
		if (error) throw error;
		setProfile(data);
	}, [targetUserId]);

	const fetchTasks = useCallback(async () => {
		if (!targetUserId) return;
		const { data, error } = await supabase
			.from('tasks')
			.select('*')
			.eq('assigned_to', targetUserId)
			.order('created_at', { ascending: false });

		if (error) throw error;
		setTasks((data ?? []).map(mapTask));
	}, [targetUserId, mapTask]);

	const fetchMessages = useCallback(async () => {
		if (!targetUserId) return;
		const { data, error } = await supabase
			.from('messages')
			.select('*')
			.or(`to_user.eq.${targetUserId},and(is_broadcast.eq.true,to_user.is.null)`)
			.order('created_at', { ascending: false })
			.limit(5);

		if (error) throw error;
		setMessages((data ?? []).map(mapMessage));
	}, [targetUserId, mapMessage]);

	const fetchMeetings = useCallback(async () => {
		if (!targetUserId) return;
		const { data, error } = await supabase
			.from('meetings')
			.select('*')
			.or(`scheduled_by.eq.${targetUserId},attendee_id.eq.${targetUserId}`)
			.order('date', { ascending: true });

		if (error) throw error;
		setMeetings((data ?? []).map(mapMeeting));
	}, [targetUserId, mapMeeting]);
	const fetchEvaluations = useCallback(async () => {
		if (!targetUserId) return;
		const { data, error } = await supabase
			.from('evaluations')
			.select('*')
			.eq('employee_id', targetUserId)
			.order('date', { ascending: false });

		if (error) throw error;
		setEvaluations((data ?? []).map(mapEvaluation));
	}, [targetUserId, mapEvaluation]);

	useEffect(() => {
		if (!targetUserId) return;
		setLoading(true);
		Promise.all([fetchProfile(), fetchTasks(), fetchMessages(), fetchMeetings(), fetchEvaluations()])
			.catch(() => toast.error('Failed to load dashboard data'))
			.finally(() => setLoading(false));
	}, [targetUserId, fetchProfile, fetchTasks, fetchMessages, fetchMeetings, fetchEvaluations]);

	const handleLogout = () => {
		logout();
		navigate('/signin');
	};

	const handleCheckIn = async () => {
		if (!user?.id) return;
		
		const now = new Date();
		const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
		
		try {
			await addAttendance({
				employee_id: user.id,
				date: now.toISOString().split('T')[0],
				check_in: time,
				status: 'present',
			});
			
			toast.success(`Checked in at ${time}`);
		} catch (error) {
			console.error('Check-in error:', error);
		}
	};

	const handleCheckOut = async () => {
		if (!user?.id || !todayAttendance) return;
		
		const now = new Date();
		const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
		
		try {
			const { error } = await supabase
				.from('attendance')
				.update({ check_out: time })
				.eq('id', todayAttendance.id);

			if (error) throw error;
			toast.success(`Checked out at ${time}`);
		} catch (error) {
			console.error('Check-out error:', error);
			toast.error('Failed to check out');
		}
	};

	const handleTaskStatusUpdate = async (taskId: string, newStatus: Task['status']) => {
		const supabaseStatus = newStatus === 'in-progress' ? 'in_progress' : newStatus;
		try {
			const { error } = await supabase
				.from('tasks')
				.update({
					status: supabaseStatus,
					completed_at: supabaseStatus === 'completed' ? new Date().toISOString() : null,
				})
				.eq('id', taskId);
			if (error) throw error;
			setTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: newStatus, completedAt: supabaseStatus === 'completed' ? new Date().toISOString() : task.completedAt } : task));
			toast.success(`Task status updated to ${newStatus.replace('-', ' ')}`);
		} catch (error) {
			console.error('Error updating task status:', error);
			toast.error('Failed to update task status');
		}
	};

	const handleMarkMessageRead = useCallback(async (messageId: string) => {
		try {
			const { error } = await supabase.from('messages').update({ read: true }).eq('id', messageId);
			if (error) throw error;
			setMessages((prev) => prev.map((msg) => (msg.id === messageId ? { ...msg, read: true } : msg)));
		} catch (error) {
			console.error('Error marking message as read:', error);
		}
	}, []);

	if (loading) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-6 animate-fade-in">
			<div className="max-w-7xl mx-auto space-y-6">
				{/* Header */}
				<div className="bg-card border-b border-border sticky top-0 z-50">
					<div className="container mx-auto px-4 py-4 flex justify-between items-center">
						<div className="flex items-center gap-3">
							<User className="w-6 h-6 text-primary" />
							<h1 className="text-2xl font-bold">Employee Dashboard</h1>
						</div>
						<div className="flex items-center gap-4">
							{user?.id && <NotificationBell userId={user.id} />}
							<div className="text-right">
								<p className="text-sm font-semibold">{profile?.full_name || user?.email}</p>
								<p className="text-xs text-muted-foreground">{user?.email}</p>
							</div>
							<Button onClick={handleLogout} variant="outline" size="sm">
								<LogOut className="w-4 h-4 mr-2" />
								Logout
							</Button>
						</div>
					</div>
				</div>

				<div className="mb-6">
					<h2 className="text-3xl font-bold mb-2">Welcome back, {profile?.full_name || user?.email}!</h2>
					<p className="text-muted-foreground">Here's your performance overview</p>
				</div>

				{/* Check-in/Check-out */}
				<Card className="p-6 mb-8 bg-gradient-to-r from-primary/10 to-secondary/10">
					<div className="flex justify-between items-center">
						<div>
							<h3 className="text-lg font-semibold mb-1">Attendance</h3>
							<p className="text-sm text-muted-foreground">
								{todayAttendance?.check_in 
									? `Checked in at ${todayAttendance.check_in}` 
									: 'Not checked in yet'}
								{todayAttendance?.check_out && ` | Checked out at ${todayAttendance.check_out}`}
							</p>
						</div>
						<Button 
							onClick={todayAttendance?.check_in ? handleCheckOut : handleCheckIn} 
							size="lg"
							disabled={!!todayAttendance?.check_out}
						>
							<Clock className="w-5 h-5 mr-2" />
							{todayAttendance?.check_out ? 'Checked Out' : todayAttendance?.check_in ? 'Check Out' : 'Check In'}
						</Button>
					</div>
				</Card>

				{/* Quick Stats */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
					<Card className="p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-green-500/10 rounded-lg">
								<CheckCircle2 className="w-6 h-6 text-green-500" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Completed Tasks</p>
								<p className="text-2xl font-bold">{taskStats.completed}</p>
							</div>
						</div>
					</Card>

					<Card className="p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-blue-500/10 rounded-lg">
								<Clock className="w-6 h-6 text-blue-500" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">In Progress</p>
								<p className="text-2xl font-bold">{taskStats.inProgress}</p>
							</div>
						</div>
					</Card>

					<Card className="p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-amber-500/10 rounded-lg">
								<AlertCircle className="w-6 h-6 text-amber-500" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Pending Review</p>
								<p className="text-2xl font-bold">{taskStats.pending}</p>
							</div>
						</div>
					</Card>

					<Card className="p-6 hover:shadow-lg transition-shadow">
						<div className="flex items-center gap-4">
							<div className="p-3 bg-purple-500/10 rounded-lg">
								<MessageSquare className="w-6 h-6 text-purple-500" />
							</div>
							<div>
								<p className="text-sm text-muted-foreground">Messages</p>
								<p className="text-2xl font-bold">{unreadMessages}</p>
							</div>
						</div>
					</Card>
				</div>

				{/* Tabs */}
				<Tabs defaultValue="tasks" className="space-y-6">
					<TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
						<TabsTrigger value="tasks">My Tasks</TabsTrigger>
						<TabsTrigger value="messages">Messages</TabsTrigger>
						<TabsTrigger value="meetings">Meetings</TabsTrigger>
						<TabsTrigger value="performance">Performance</TabsTrigger>
					</TabsList>

					<TabsContent value="tasks" className="space-y-4">
						{tasks.length === 0 ? (
							<Card className="p-12 text-center">
								<AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">No tasks assigned</h3>
								<p className="text-muted-foreground">You don't have any tasks at the moment.</p>
							</Card>
						) : (
							tasks.map((task) => (
								<Card key={task.id} className="p-6">
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<div className="flex items-center gap-3 mb-2">
												<h3 className="text-lg font-semibold">{task.title}</h3>
												<Badge variant={task.priority === 'high' ? 'destructive' : 'default'}>
													{task.priority}
												</Badge>
											</div>
											<p className="text-muted-foreground mb-3">{task.description}</p>
											<div className="flex items-center gap-4 text-sm text-muted-foreground">
												<span>Due: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}</span>
												<span>•</span>
												<span>Created: {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}</span>
											</div>
										</div>
										<div className="flex flex-col gap-2">
											<Badge
												className={
													task.status === 'completed'
														? 'bg-green-500/10 text-green-500'
														: task.status === 'in-progress'
														? 'bg-blue-500/10 text-blue-500'
														: 'bg-amber-500/10 text-amber-500'
												}
											>
												{task.status === 'in-progress' ? 'in progress' : task.status}
											</Badge>
											<select
												className="text-sm border rounded p-1"
												value={task.status}
												onChange={(e) => handleTaskStatusUpdate(task.id, e.target.value as Task['status'])}
											>
												<option value="pending">Pending</option>
												<option value="in-progress">In Progress</option>
												<option value="completed">Completed</option>
											</select>
										</div>
									</div>
								</Card>
							))
						)}
					</TabsContent>

					<TabsContent value="messages" className="space-y-4">
						{messages.length === 0 ? (
							<Card className="p-12 text-center">
								<AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">No messages</h3>
								<p className="text-muted-foreground">You don't have any messages at the moment.</p>
							</Card>
						) : (
							messages.map((message) => (
								<Card
									key={message.id}
									className="p-6 cursor-pointer"
									onClick={() => !message.read && handleMarkMessageRead(message.id)}
								>
									<div className="flex justify-between items-start mb-3">
										<div>
											<h3 className="font-semibold">{message.subject}</h3>
											<p className="text-sm text-muted-foreground">
												From: Admin • {new Date(message.timestamp).toLocaleDateString()}
											</p>
										</div>
										{!message.read && (
											<Badge className="bg-blue-500">New</Badge>
										)}
									</div>
									<p className="text-muted-foreground">{message.content}</p>
								</Card>
							))
						)}
					</TabsContent>

					<TabsContent value="meetings" className="space-y-4">
						{meetings.length === 0 ? (
							<Card className="p-12 text-center">
								<AlertCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">No meetings scheduled</h3>
								<p className="text-muted-foreground">You don't have any meetings at the moment.</p>
							</Card>
						) : (
							meetings.map((meeting) => (
								<Card key={meeting.id} className="p-6">
									<div className="flex justify-between items-start">
										<div className="flex-1">
											<h3 className="text-lg font-semibold mb-2">{meeting.title}</h3>
											<p className="text-muted-foreground mb-3">{meeting.description}</p>
											<div className="flex items-center gap-4 text-sm">
												<div className="flex items-center gap-2">
													<Calendar className="w-4 h-4" />
													<span>{new Date(meeting.date).toLocaleDateString()}</span>
												</div>
												<div className="flex items-center gap-2">
													<Clock className="w-4 h-4" />
													<span>{meeting.time}</span>
												</div>
											</div>
											{meeting.link && (
												<Button variant="link" className="p-0 h-auto mt-2" asChild>
													<a href={meeting.link} target="_blank" rel="noopener noreferrer">
														Join Meeting →
													</a>
												</Button>
											)}
										</div>
										<Badge>{meeting.status}</Badge>
									</div>
								</Card>
							))
						)}
					</TabsContent>

					<TabsContent value="performance" className="space-y-6">
						<Card className="p-6">
							<h3 className="text-xl font-semibold mb-4">Performance Over Time</h3>
							<PerformanceChart employeeId={user?.id || ''} />
						</Card>

						<Card className="p-6">
							<h3 className="text-xl font-semibold mb-4">Completed Work History</h3>
							{completedTaskHistory.length === 0 ? (
								<p className="text-sm text-muted-foreground">No completed tasks yet.</p>
							) : (
								<div className="space-y-2">
									{completedTaskHistory.slice(0, 10).map((task) => (
										<div key={task.id} className="flex justify-between text-sm border-b last:border-b-0 pb-2">
											<span className="font-medium">{task.title}</span>
											<span className="text-muted-foreground">
												{new Date(task.completedAt ?? task.deadline ?? '').toLocaleDateString()}
											</span>
										</div>
									))}
								</div>
							)}
						</Card>

						{evaluations.length === 0 ? (
							<Card className="p-12 text-center">
								<TrendingUp className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
								<h3 className="text-xl font-semibold mb-2">No evaluations yet</h3>
								<p className="text-muted-foreground">Your performance evaluations will appear here.</p>
							</Card>
						) : (
							evaluations.map((evaluation) => (
								<Card key={evaluation.id} className="p-6">
									<div className="flex justify-between items-start mb-4">
										<div>
											<h3 className="text-lg font-semibold">Performance Evaluation</h3>
											<p className="text-sm text-muted-foreground">
												{new Date(evaluation.date).toLocaleDateString()}
											</p>
										</div>
										<div className="text-right">
											<div className="text-3xl font-bold text-primary">{evaluation.score}/5.0</div>
											<p className="text-sm text-muted-foreground">Overall Score</p>
										</div>
									</div>

									<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
										<div>
											<p className="text-sm text-muted-foreground">Productivity</p>
											<p className="text-xl font-semibold">{evaluation.categories.productivity}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Quality</p>
											<p className="text-xl font-semibold">{evaluation.categories.quality}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Teamwork</p>
											<p className="text-xl font-semibold">{evaluation.categories.teamwork}</p>
										</div>
										<div>
											<p className="text-sm text-muted-foreground">Communication</p>
											<p className="text-xl font-semibold">{evaluation.categories.communication}</p>
										</div>
									</div>

									<div className="pt-4 border-t">
										<p className="text-sm font-semibold mb-2">Feedback:</p>
										<p className="text-muted-foreground">{evaluation.comments}</p>
									</div>
								</Card>
							))
						)}
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
};

export default EmployeeDashboard;
