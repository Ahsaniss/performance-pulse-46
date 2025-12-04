import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Employee } from '@/types';
import { toast } from 'sonner';

export const useEmployees = (options?: { includeAdmins?: boolean }) => {
  const queryClient = useQueryClient();

  const { data: employees = [], isLoading: loading, error } = useQuery({
    queryKey: ['employees', options?.includeAdmins],
    queryFn: async () => {
      const response = await api.get('/employees');
      if (response.data.success) {
        return response.data.data
          .map((emp: any) => ({
            ...emp,
            id: emp._id, // Map _id to id
          }))
          .filter((emp: any) => options?.includeAdmins ? true : emp.role !== 'admin');
      }
      return [];
    },
  });

  const addEmployeeMutation = useMutation({
    mutationFn: async (employee: Omit<Employee, 'id'>) => {
      const response = await api.post('/employees', employee);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee added successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add employee');
    },
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Employee> }) => {
      const response = await api.put(`/employees/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update employee');
    },
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/employees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Employee deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete employee');
    },
  });

  return {
    employees,
    loading,
    addEmployee: (employee: Omit<Employee, 'id'>) => addEmployeeMutation.mutateAsync(employee),
    updateEmployee: (id: string, updates: Partial<Employee>) => updateEmployeeMutation.mutateAsync({ id, updates }),
    deleteEmployee: (id: string) => deleteEmployeeMutation.mutateAsync(id),
  };
};
