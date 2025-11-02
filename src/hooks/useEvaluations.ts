import { useState, useEffect } from 'react';
import { toast } from 'sonner';

// Mock data store for frontend-only mode
const STORAGE_KEY = 'evaluations_data';

export interface Evaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  satisfaction_score: number;
  meetings_held: number;
  training_applied: number;
  outcome_summary: string | null;
  evaluation_date: string;
  created_at: string;
}

export const useEvaluations = (employeeId?: string) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchEvaluations();
    }
  }, [employeeId]);

  const fetchEvaluations = async () => {
    if (!employeeId) return;

    try {
      // Load from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const filtered = allData.filter((e: Evaluation) => e.employee_id === employeeId)
        .sort((a: Evaluation, b: Evaluation) => 
          new Date(b.evaluation_date).getTime() - new Date(a.evaluation_date).getTime()
        );
      setEvaluations(filtered);
    } catch (error: any) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      // Delete from localStorage
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allData = storedData ? JSON.parse(storedData) : [];
      const updatedData = allData.filter((e: Evaluation) => e.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
      toast.success('Evaluation deleted successfully');
      fetchEvaluations();
    } catch (error: any) {
      toast.error('Failed to delete evaluation');
      console.error(error);
    }
  };

  return {
    evaluations,
    loading,
    deleteEvaluation,
    refetch: fetchEvaluations,
  };
};
