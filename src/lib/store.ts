import { Employee, Task, Message, Meeting, Evaluation, Attendance } from '@/types';
import { mockEmployees, mockTasks, mockMessages, mockMeetings, mockEvaluations, mockAttendance } from './mockData';

class DataStore {
  private employees: Employee[] = [];
  private tasks: Task[] = [];
  private messages: Message[] = [];
  private meetings: Meeting[] = [];
  private evaluations: Evaluation[] = [];
  private attendance: Attendance[] = [];
  private listeners: Set<() => void> = new Set();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load data from localStorage or use mock data
      const savedEmployees = localStorage.getItem('hrm_employees');
      const savedTasks = localStorage.getItem('hrm_tasks');
      const savedMessages = localStorage.getItem('hrm_messages');
      const savedMeetings = localStorage.getItem('hrm_meetings');
      const savedEvaluations = localStorage.getItem('hrm_evaluations');
      const savedAttendance = localStorage.getItem('hrm_attendance');

      this.employees = savedEmployees ? JSON.parse(savedEmployees) : [...mockEmployees];
      this.tasks = savedTasks ? JSON.parse(savedTasks) : [...mockTasks];
      this.messages = savedMessages ? JSON.parse(savedMessages) : [...mockMessages];
      this.meetings = savedMeetings ? JSON.parse(savedMeetings) : [...mockMeetings];
      this.evaluations = savedEvaluations ? JSON.parse(savedEvaluations) : [...mockEvaluations];
      this.attendance = savedAttendance ? JSON.parse(savedAttendance) : [...mockAttendance];
      
      this.initialized = true;
      this.notify();
    } catch (error) {
      console.error('Failed to initialize data:', error);
      // Use mock data as fallback
      this.employees = [...mockEmployees];
      this.tasks = [...mockTasks];
      this.messages = [...mockMessages];
      this.meetings = [...mockMeetings];
      this.evaluations = [...mockEvaluations];
      this.attendance = [...mockAttendance];
      this.initialized = true;
    }
  }

  private saveToLocalStorage() {
    try {
      localStorage.setItem('hrm_employees', JSON.stringify(this.employees));
      localStorage.setItem('hrm_tasks', JSON.stringify(this.tasks));
      localStorage.setItem('hrm_messages', JSON.stringify(this.messages));
      localStorage.setItem('hrm_meetings', JSON.stringify(this.meetings));
      localStorage.setItem('hrm_evaluations', JSON.stringify(this.evaluations));
      localStorage.setItem('hrm_attendance', JSON.stringify(this.attendance));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener());
  }

  // Employee methods
  getEmployees() {
    return [...this.employees];
  }

  async addEmployee(employee: Omit<Employee, 'id'>) {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      avatar: employee.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.email}`,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      performanceScore: 0,
    };
    
    this.employees.push(newEmployee);
    this.saveToLocalStorage();
    this.notify();
    
    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updates };
      this.saveToLocalStorage();
      this.notify();
    }
  }

  deleteEmployee(id: string) {
    this.employees = this.employees.filter(emp => emp.id !== id);
    this.saveToLocalStorage();
    this.notify();
  }

  // Task methods
  getTasks() {
    return [...this.tasks];
  }

  async addTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    
    this.tasks.push(newTask);
    this.saveToLocalStorage();
    this.notify();
    
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.saveToLocalStorage();
      this.notify();
    }
  }

  // Message methods
  getMessages() {
    return [...this.messages];
  }

  async addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    this.messages.push(newMessage);
    this.saveToLocalStorage();
    this.notify();
    
    return newMessage;
  }

  // Meeting methods
  getMeetings() {
    return [...this.meetings];
  }

  async addMeeting(meeting: Omit<Meeting, 'id'>) {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
    };
    
    this.meetings.push(newMeeting);
    this.saveToLocalStorage();
    this.notify();
    
    return newMeeting;
  }

  // Evaluation methods
  async addEvaluation(evaluation: Omit<Evaluation, 'id'>) {
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: `eval-${Date.now()}`,
    };
    
    this.evaluations.push(newEvaluation);
    this.saveToLocalStorage();
    this.notify();
    
    return newEvaluation;
  }

  getEvaluations() {
    return [...this.evaluations];
  }

  // Attendance methods
  async addAttendance(attendance: Omit<Attendance, 'id'>) {
    const newAttendance: Attendance = {
      ...attendance,
      id: `att-${Date.now()}`,
    };
    
    this.attendance.push(newAttendance);
    this.saveToLocalStorage();
    this.notify();
    
    return newAttendance;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>) {
    const index = this.attendance.findIndex(a => a.id === id);
    if (index !== -1) {
      this.attendance[index] = { ...this.attendance[index], ...updates };
      this.saveToLocalStorage();
      this.notify();
    }
  }

  getAttendance() {
    return [...this.attendance];
  }
}

export const dataStore = new DataStore();
