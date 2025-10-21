import { Employee, Task, Message, Meeting, Evaluation, Attendance } from '@/types';
import { googleSheetsService } from './googleSheets';

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
      // Load all data from Google Sheets
      this.employees = await googleSheetsService.getEmployees();
      this.tasks = await googleSheetsService.getTasks();
      this.messages = await googleSheetsService.getMessages();
      this.meetings = await googleSheetsService.getMeetings();
      this.evaluations = await googleSheetsService.getEvaluations();
      this.attendance = await googleSheetsService.getAttendance();
      
      this.initialized = true;
      this.notify();
    } catch (error) {
      console.error('Failed to initialize data from Google Sheets:', error);
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
    
    // Add to Google Sheets
    const success = await googleSheetsService.addEmployee(newEmployee);
    
    if (success) {
      this.employees.push(newEmployee);
      this.notify();
    }
    
    return newEmployee;
  }

  async updateEmployee(id: string, updates: Partial<Employee>) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updates };
      
      // Update in Google Sheets (row number is index + 2 because of header row)
      // If googleSheetsService exposes an updateEmployee method implement it there.
      // Use a typed escape here to avoid a compile-time error when the method is not declared.
      if (typeof (googleSheetsService as any).updateEmployee === 'function') {
        await (googleSheetsService as any).updateEmployee(this.employees[index], index + 2);
      }
      
      this.notify();
    }
  }

  deleteEmployee(id: string) {
    this.employees = this.employees.filter(emp => emp.id !== id);
    this.notify();
    // Note: Deletion in Google Sheets requires more complex logic
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
    
    const success = await googleSheetsService.addTask(newTask);
    
    if (success) {
      this.tasks.push(newTask);
      this.notify();
    }
    
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      
      // Update in Google Sheets
      await googleSheetsService.updateTask(id, updates);
      
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
    
    const success = await googleSheetsService.addMessage(newMessage);
    
    if (success) {
      this.messages.push(newMessage);
      this.notify();
    }
    
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
    
    const success = await googleSheetsService.addMeeting(newMeeting);
    
    if (success) {
      this.meetings.push(newMeeting);
      this.notify();
    }
    
    return newMeeting;
  }

  // Evaluation methods
  async addEvaluation(evaluation: Omit<Evaluation, 'id'>) {
    const newEvaluation: Evaluation = {
      ...evaluation,
      id: `eval-${Date.now()}`,
    };
    
    const success = await googleSheetsService.addEvaluation(newEvaluation);
    
    if (success) {
      this.evaluations.push(newEvaluation);
      this.notify();
    }
    
    return newEvaluation;
  }

  // Attendance methods
  async addAttendance(attendance: Omit<Attendance, 'id'>) {
    const newAttendance: Attendance = {
      ...attendance,
      id: `att-${Date.now()}`,
    };
    
    const success = await googleSheetsService.addAttendance(newAttendance);
    
    if (success) {
      this.attendance.push(newAttendance);
      this.notify();
    }
    
    return newAttendance;
  }

  async updateAttendance(id: string, updates: Partial<Attendance>) {
    const index = this.attendance.findIndex(a => a.id === id);
    if (index !== -1) {
      this.attendance[index] = { ...this.attendance[index], ...updates };
      // Note: You may want to add updateAttendance to googleSheetsService
      this.notify();
    }
  }

  getAttendance() {
    return [...this.attendance];
  }
}

export const dataStore = new DataStore();
