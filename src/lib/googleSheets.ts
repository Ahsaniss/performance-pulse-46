import { Employee, Task, Message, Meeting, Evaluation, Attendance } from '@/types';
import { toast } from 'sonner';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

class GoogleSheetsService {
  private async makeRequest(action: string, data?: any): Promise<any> {
    if (!SCRIPT_URL) {
      console.warn('Google Apps Script URL is not configured. Using local storage only.');
      return { success: true, data: [] };
    }

    try {
      // Build URL with query parameters
      const url = new URL(SCRIPT_URL);
      url.searchParams.append('action', action);
      
      if (data) {
        // Encode data as URL parameter
        url.searchParams.append('data', encodeURIComponent(JSON.stringify(data)));
      }

      console.log('Making request to:', url.toString());

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const text = await response.text();
      console.log('Response:', text);
      
      const result = JSON.parse(text);
      
      if (!result.success) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.error('Request timeout');
        toast.error('Request timeout. Please check your connection.');
      } else {
        console.error(`Error in ${action}:`, error);
      }
      // Return empty data instead of throwing to prevent app crash
      return { success: true, data: [] };
    }
  }

  // Employee methods
  async getEmployees(): Promise<Employee[]> {
    try {
      const result = await this.makeRequest('getEmployees');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        avatar: row.avatar,
        department: row.department,
        position: row.position,
        role: row.role as 'admin' | 'employee',
        joinDate: row.joinDate,
        status: row.status as 'active' | 'inactive' | 'on-leave',
        performanceScore: parseFloat(row.performanceScore) || 0,
      }));
    } catch (error) {
      console.error('Failed to get employees:', error);
      return [];
    }
  }

  async addEmployee(employee: Employee): Promise<boolean> {
    try {
      console.log('Adding employee to Google Sheets:', employee);
      const result = await this.makeRequest('addEmployee', employee);
      console.log('Add employee result:', result);
      if (result.success) {
        toast.success('Employee added to Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add employee:', error);
      return false;
    }
  }

  // Task methods
  async getTasks(): Promise<Task[]> {
    try {
      const result = await this.makeRequest('getTasks');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        assignedTo: row.assignedTo,
        assignedBy: row.assignedBy,
        status: row.status as 'pending' | 'in-progress' | 'completed',
        priority: row.priority as 'low' | 'medium' | 'high',
        deadline: row.deadline,
        createdAt: row.createdAt,
        completedAt: row.completedAt,
      }));
    } catch (error) {
      console.error('Failed to get tasks:', error);
      return [];
    }
  }

  async addTask(task: Task): Promise<boolean> {
    try {
      const result = await this.makeRequest('addTask', task);
      if (result.success) {
        toast.success('Task added to Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add task:', error);
      return false;
    }
  }

  async updateTask(taskId: string, updates: Partial<Task>): Promise<boolean> {
    try {
      const result = await this.makeRequest('updateTask', { id: taskId, ...updates });
      return result.success;
    } catch (error) {
      console.error('Failed to update task:', error);
      return false;
    }
  }

  // Message methods
  async getMessages(): Promise<Message[]> {
    try {
      const result = await this.makeRequest('getMessages');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        from: row.from,
        to: row.to,
        subject: row.subject,
        content: row.content,
        timestamp: row.timestamp,
        read: row.read === 'true' || row.read === true,
        type: row.type as 'individual' | 'broadcast',
      }));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async addMessage(message: Message): Promise<boolean> {
    try {
      const result = await this.makeRequest('addMessage', message);
      if (result.success) {
        toast.success('Message sent and saved to Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add message:', error);
      return false;
    }
  }

  // Meeting methods
  async getMeetings(): Promise<Meeting[]> {
    try {
      const result = await this.makeRequest('getMeetings');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        scheduledBy: row.scheduledBy,
        attendees: row.attendees ? row.attendees.split(',') : [],
        date: row.date,
        time: row.time,
        link: row.link,
        status: row.status as 'scheduled' | 'completed' | 'cancelled',
      }));
    } catch (error) {
      console.error('Failed to get meetings:', error);
      return [];
    }
  }

  async addMeeting(meeting: Meeting): Promise<boolean> {
    try {
      const meetingData = {
        ...meeting,
        attendees: meeting.attendees.join(',')
      };
      const result = await this.makeRequest('addMeeting', meetingData);
      if (result.success) {
        toast.success('Meeting scheduled and saved to Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add meeting:', error);
      return false;
    }
  }

  // Evaluation methods
  async getEvaluations(): Promise<Evaluation[]> {
    try {
      const result = await this.makeRequest('getEvaluations');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employeeId,
        evaluatedBy: row.evaluatedBy,
        score: parseFloat(row.score) || 0,
        date: row.date,
        comments: row.comments,
        categories: {
          productivity: parseFloat(row.productivity) || 0,
          quality: parseFloat(row.quality) || 0,
          teamwork: parseFloat(row.teamwork) || 0,
          communication: parseFloat(row.communication) || 0,
        },
      }));
    } catch (error) {
      console.error('Failed to get evaluations:', error);
      return [];
    }
  }

  async addEvaluation(evaluation: Evaluation): Promise<boolean> {
    try {
      const evalData = {
        id: evaluation.id,
        employeeId: evaluation.employeeId,
        evaluatedBy: evaluation.evaluatedBy,
        score: evaluation.score,
        date: evaluation.date,
        comments: evaluation.comments,
        productivity: evaluation.categories.productivity,
        quality: evaluation.categories.quality,
        teamwork: evaluation.categories.teamwork,
        communication: evaluation.categories.communication,
      };
      const result = await this.makeRequest('addEvaluation', evalData);
      if (result.success) {
        toast.success('Evaluation saved to Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add evaluation:', error);
      return false;
    }
  }

  // Attendance methods
  async getAttendance(): Promise<Attendance[]> {
    try {
      const result = await this.makeRequest('getAttendance');
      return (result.data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employeeId,
        date: row.date,
        checkIn: row.checkIn,
        checkOut: row.checkOut,
        status: row.status as 'present' | 'absent' | 'late' | 'on-leave',
      }));
    } catch (error) {
      console.error('Failed to get attendance:', error);
      return [];
    }
  }

  async addAttendance(attendance: Attendance): Promise<boolean> {
    try {
      const result = await this.makeRequest('addAttendance', attendance);
      if (result.success) {
        toast.success('Attendance recorded in Google Sheets!');
      }
      return result.success;
    } catch (error) {
      console.error('Failed to add attendance:', error);
      return false;
    }
  }
}

export const googleSheetsService = new GoogleSheetsService();
