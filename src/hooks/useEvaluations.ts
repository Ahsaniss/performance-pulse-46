import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

      const channel = supabase
        .channel('evaluations-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'evaluations',
            filter: `employee_id=eq.${employeeId}`
          },
          () => {
            fetchEvaluations();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [employeeId]);

  const fetchEvaluations = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('evaluations')
        .select('*')
        .eq('employee_id', employeeId)
        .order('evaluation_date', { ascending: false });

      if (error) throw error;
      setEvaluations(data || []);
    } catch (error: any) {
      console.error('Failed to load evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteEvaluation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('evaluations')
        .delete()
        .eq('id', id);

      if (error) throw error;
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
