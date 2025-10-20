import { Employee, Task, Message, Meeting } from '@/types';
import { mockEmployees, mockTasks, mockMessages, mockMeetings } from './mockData';

class DataStore {
  private employees: Employee[] = [];
  private tasks: Task[] = [];
  private messages: Message[] = [];
  private meetings: Meeting[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initialize with mock data
    this.employees = [...mockEmployees];
    this.tasks = [...mockTasks];
    this.messages = [...mockMessages];
    this.meetings = [...mockMeetings];
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

  addEmployee(employee: Omit<Employee, 'id'>) {
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}`,
      avatar: employee.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${employee.email}`,
      joinDate: new Date().toISOString().split('T')[0],
      status: 'active',
      performanceScore: 0,
    };
    this.employees.push(newEmployee);
    this.notify();
    return newEmployee;
  }

  updateEmployee(id: string, updates: Partial<Employee>) {
    const index = this.employees.findIndex(emp => emp.id === id);
    if (index !== -1) {
      this.employees[index] = { ...this.employees[index], ...updates };
      this.notify();
    }
  }

  deleteEmployee(id: string) {
    this.employees = this.employees.filter(emp => emp.id !== id);
    this.notify();
  }

  // Task methods
  getTasks() {
    return [...this.tasks];
  }

  addTask(task: Omit<Task, 'id' | 'createdAt'>) {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.tasks.push(newTask);
    this.notify();
    return newTask;
  }

  updateTask(id: string, updates: Partial<Task>) {
    const index = this.tasks.findIndex(t => t.id === id);
    if (index !== -1) {
      this.tasks[index] = { ...this.tasks[index], ...updates };
      this.notify();
    }
  }

  // Message methods
  getMessages() {
    return [...this.messages];
  }

  addMessage(message: Omit<Message, 'id' | 'timestamp'>) {
    const newMessage: Message = {
      ...message,
      id: `msg-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    this.messages.push(newMessage);
    this.notify();
    return newMessage;
  }

  // Meeting methods
  getMeetings() {
    return [...this.meetings];
  }

  addMeeting(meeting: Omit<Meeting, 'id'>) {
    const newMeeting: Meeting = {
      ...meeting,
      id: `meet-${Date.now()}`,
    };
    this.meetings.push(newMeeting);
    this.notify();
    return newMeeting;
  }
}

export const dataStore = new DataStore();
