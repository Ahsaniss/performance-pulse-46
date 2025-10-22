import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  created_at: string;
}

export const useAttendance = (employeeId?: string) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();

      // Subscribe to realtime changes
      const channel = supabase
        .channel('attendance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance',
            filter: `employee_id=eq.${employeeId}`
          },
          () => {
            fetchAttendance();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [employeeId]);

  const fetchAttendance = async () => {
    if (!employeeId) return;

    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .order('date', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error: any) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const addAttendance = async (attendanceData: {
    employee_id: string;
    date: string;
    check_in?: string;
    check_out?: string;
    status: string;
  }) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .insert(attendanceData);

      if (error) throw error;
      fetchAttendance();
    } catch (error: any) {
      toast.error('Failed to record attendance');
      console.error(error);
      throw error;
    }
  };

  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      fetchAttendance();
    } catch (error: any) {
      toast.error('Failed to update attendance');
      console.error(error);
      throw error;
    }
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.date === today);
  };

  return {
    attendance,
    loading,
    addAttendance,
    updateAttendance,
    getTodayAttendance,
    refetch: fetchAttendance,
  };
};
