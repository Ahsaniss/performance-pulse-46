import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Evaluation } from '@/types';
import { toast } from 'sonner';

export const useEvaluations = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const { data: evaluations = [], isLoading: loading, refetch } = useQuery({
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
        }));
      }
      return [];
    },
    enabled: !!employeeId,
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/evaluations/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      toast.success('Evaluation deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete evaluation');
    },
  });

  return {
    evaluations,
    loading,
    deleteEvaluation: (id: string) => deleteEvaluationMutation.mutateAsync(id),
    refetch,
  };
};
