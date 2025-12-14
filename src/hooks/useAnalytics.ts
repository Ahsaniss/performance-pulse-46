import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { EmployeeAnalytics } from '../types';
import { useToast } from './use-toast';

export const useAnalytics = (employeeId?: string) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const fetchAnalytics = async (id: string): Promise<EmployeeAnalytics> => {
    const token = localStorage.getItem('token');
    const response = await axios.get(`http://localhost:5000/api/analytics/employee/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch analytics data');
    }

    const backendData = response.data.data;
    
    // Transform backend data to match frontend interface
    const transformedData: EmployeeAnalytics = {
      employeeId: id,
      metrics: {
        completionRate: Number(backendData.completionRate),
        onTimeRate: Number(backendData.timelinessScore),
        averageTurnaroundTime: Number(backendData.avgTurnaroundTime),
        efficiencyScore: Number(backendData.efficiencyScore),
        tasksCompleted: backendData.completed,
        tasksPending: backendData.pending,
        tasksOverdue: backendData.overdue
      },
      taskHistory: backendData.tasks.map((t: any) => ({
        ...t,
        id: t._id
      })),
      aiInsight: {
        summary: "Loading AI insights...",
        strengths: [],
        weaknesses: [],
        recommendations: []
      }
    };

    // Fetch AI Insight separately
    try {
      const aiResponse = await axios.post(
        `http://localhost:5000/api/analytics/ai-insight`,
        { 
          metrics: backendData,
          employeeName: "Employee"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (aiResponse.data.success) {
        transformedData.aiInsight = {
          ...transformedData.aiInsight,
          summary: aiResponse.data.data,
        };
      }
    } catch (aiError: any) {
      console.error('Error fetching AI insight:', aiError);
      const errorMessage = aiError.response?.data?.error || aiError.message || "Unable to generate AI insights at this time.";
      transformedData.aiInsight = {
        ...transformedData.aiInsight,
        summary: `AI Error: ${errorMessage}`
      };
    }

    return transformedData;
  };

  const query = useQuery({
    queryKey: ['analytics', employeeId],
    queryFn: () => fetchAnalytics(employeeId!),
    enabled: !!employeeId,
    staleTime: 30000, // Cache for 30 seconds
    retry: 1,
    onError: (error: any) => {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
  });

  return {
    analytics: query.data ?? null,
    loading: query.isLoading,
    error: query.error?.message ?? null,
    refetch: query.refetch
  };
};
