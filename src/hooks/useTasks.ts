import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Task } from '@/types';
import { toast } from 'sonner';

export const useTasks = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const { data: tasks = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['tasks', employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const response = await api.get('/tasks', { params });
      if (response.data.success) {
        return response.data.data.map((task: any) => ({
          ...task,
          id: task._id,
          assignedTo: task.assignedTo?._id || task.assignedTo, // Handle populated or ID
          assignedBy: task.assignedBy?._id || task.assignedBy,
        }));
      }
      return [];
    },
    enabled: true, // Always fetch, filter on backend if needed
  });

  const createTaskMutation = useMutation({
    mutationFn: async (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
      const response = await api.post('/tasks', task);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create task');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Task> }) => {
      const response = await api.put(`/tasks/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update task');
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/tasks/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete task');
    },
  });

  return {
    tasks,
    loading,
    createTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => createTaskMutation.mutateAsync(task),
    updateTask: (id: string, updates: Partial<Task>) => updateTaskMutation.mutateAsync({ id, updates }),
    deleteTask: (id: string) => deleteTaskMutation.mutateAsync(id),
    refetch,
  };
};
