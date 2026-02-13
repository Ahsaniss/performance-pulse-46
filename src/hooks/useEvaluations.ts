import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Evaluation } from '@/types';
import { toast } from 'sonner';

export const useEvaluations = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['evaluations', employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const response = await api.get('/evaluations', { params });
      if (response.data.success) {
        return response.data.data.map((evalItem: any) => ({
          ...evalItem,
          id: evalItem._id,
          employeeId: evalItem.employeeId?._id || evalItem.employeeId,
          evaluatedBy: evalItem.evaluatedBy?._id || evalItem.evaluatedBy,
          taskId: evalItem.taskId, // Keep the populated object or ID
        }));
      }
      return [];
    },
    enabled: true,
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/evaluations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Evaluation deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete evaluation');
    },
  });

  const createEvaluationMutation = useMutation({
    mutationFn: async (evaluationData: Partial<Evaluation>) => {
      const response = await api.post('/evaluations', evaluationData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      toast.success('Evaluation created successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create evaluation');
    },
  });

  return {
    evaluations,
    loading,
    error: error?.message || null,
    createEvaluation: (data: Partial<Evaluation>) => createEvaluationMutation.mutateAsync(data),
    deleteEvaluation: (id: string) => deleteEvaluationMutation.mutateAsync(id),
    refetch,
    fetchEvaluations: refetch,
  };
};
