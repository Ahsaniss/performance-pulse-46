import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock data store for frontend-only mode
const STORAGE_KEY = 'tasks_data';

export interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
}

export const useTasks = (employeeId?: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchTasks();
    }
  }, [employeeId]);

  const fetchTasks = async () => {
    if (!employeeId) return;

    try {
      // Load from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const filtered = allData.filter((t: Task) => t.assigned_to === employeeId)
        .sort((a: Task, b: Task) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      setTasks(filtered);
    } catch (error: any) {
      console.error('Failed to load tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, updates: Partial<Task>) => {
    try {
      // Update in localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const updatedData = allData.map((t: Task) => 
        t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      toast.success('Task updated successfully');
      fetchTasks();
    } catch (error: any) {
      toast.error('Failed to update task');
      console.error(error);
    }
  };

  const deleteTask = async (id: string) => {
    try {
      // Delete from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const updatedData = allData.filter((t: Task) => t.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      toast.success('Task deleted successfully');
      fetchTasks();
    } catch (error: any) {
      toast.error('Failed to delete task');
      console.error(error);
    }
  };

  return {
    tasks,
    loading,
    updateTask,
    deleteTask,
    refetch: fetchTasks,
  };
};
