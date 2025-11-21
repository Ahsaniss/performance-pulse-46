import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Attendance } from '@/types';
import { toast } from 'sonner';

export const useAttendance = (employeeId?: string) => {
  const queryClient = useQueryClient();

  const { data: attendance = [], isLoading: loading, refetch } = useQuery({
    queryKey: ['attendance', employeeId],
    queryFn: async () => {
      const params = employeeId ? { employeeId } : {};
      const response = await api.get('/attendance', { params });
      if (response.data.success) {
        return response.data.data.map((att: any) => ({
          ...att,
          id: att._id,
          employeeId: att.employeeId?._id || att.employeeId,
        }));
      }
      return [];
    },
    enabled: true,
  });

  const addAttendanceMutation = useMutation({
    mutationFn: async (attendanceData: Partial<Attendance>) => {
      const response = await api.post('/attendance', attendanceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance recorded successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record attendance');
    },
  });

  const updateAttendanceMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Attendance> }) => {
      const response = await api.put(`/attendance/${id}`, updates);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Attendance updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    },
  });

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find((a: Attendance) => a.date && a.date.startsWith(today));
  };

  return {
    attendance,
    loading,
    addAttendance: (attendanceData: Partial<Attendance>) => addAttendanceMutation.mutateAsync(attendanceData),
    updateAttendance: (id: string, updates: Partial<Attendance>) => updateAttendanceMutation.mutateAsync({ id, updates }),
    getTodayAttendance,
    refetch,
  };
};
