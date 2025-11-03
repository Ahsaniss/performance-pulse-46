import { useState, useEffect } from 'react';
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

const STORAGE_KEY = 'attendance_data';

export const useAttendance = (employeeId?: string) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchAttendance();
    }
  }, [employeeId]);

  const fetchAttendance = async () => {
    if (!employeeId) return;

    try {
      // TODO: Replace with your backend API
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allAttendance = storedData ? JSON.parse(storedData) : [];
      const filtered = allAttendance.filter((a: Attendance) => a.employee_id === employeeId);
      setAttendance(filtered);
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
      // TODO: Replace with your backend API
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allAttendance = storedData ? JSON.parse(storedData) : [];
      
      const newRecord: Attendance = {
        id: `attendance_${Date.now()}`,
        employee_id: attendanceData.employee_id,
        date: attendanceData.date,
        check_in: attendanceData.check_in || null,
        check_out: attendanceData.check_out || null,
        status: attendanceData.status,
        created_at: new Date().toISOString(),
      };

      allAttendance.push(newRecord);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allAttendance));
      fetchAttendance();
    } catch (error: any) {
      toast.error('Failed to record attendance');
      console.error(error);
      throw error;
    }
  };

  const updateAttendance = async (id: string, updates: Partial<Attendance>) => {
    try {
      // TODO: Replace with your backend API
      const storedData = localStorage.getItem(STORAGE_KEY);
      const allAttendance = storedData ? JSON.parse(storedData) : [];
      
      const updatedAttendance = allAttendance.map((a: Attendance) =>
        a.id === id ? { ...a, ...updates } : a
      );
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAttendance));
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
