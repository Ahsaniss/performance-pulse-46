import { useState, useEffect } from 'react';
import axios from 'axios';
import { EmployeeAnalytics } from '../types';
import { useToast } from './use-toast';

export const useAnalytics = (employeeId?: string) => {
  const [analytics, setAnalytics] = useState<EmployeeAnalytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchAnalytics = async (id: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`http://localhost:5000/api/analytics/employee/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.data) {
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

        setAnalytics(transformedData);

        // Fetch AI Insight separately
        try {
          const aiResponse = await axios.post(
            `http://localhost:5000/api/analytics/ai-insight`,
            { 
              metrics: backendData,
              employeeName: "Employee" // You might want to pass the actual name if available
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );

          if (aiResponse.data.success) {
            // Parse the AI text response into structured data if possible, 
            // or just put the whole text in summary for now since the backend returns raw text
            setAnalytics(prev => prev ? ({
              ...prev,
              aiInsight: {
                ...prev.aiInsight,
                summary: aiResponse.data.data,
                // The current backend returns a single string, so we'll leave lists empty for now
                // or parse the string if it follows a specific format.
                // For this fix, we'll just display the text.
              }
            }) : null);
          }
        } catch (aiError: any) {
          console.error('Error fetching AI insight:', aiError);
          const errorMessage = aiError.response?.data?.error || aiError.message || "Unable to generate AI insights at this time.";
          setAnalytics(prev => prev ? ({
            ...prev,
            aiInsight: {
              ...prev.aiInsight,
              summary: `AI Error: ${errorMessage}`
            }
          }) : null);
        }
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching analytics:', err);
      setError(err.message);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) {
      fetchAnalytics(employeeId);
    }
  }, [employeeId]);

  return { analytics, loading, error, refetch: () => employeeId && fetchAnalytics(employeeId) };
};
