import { useState, useEffect } from 'react';
import { dataStore } from '@/lib/store';
import { Attendance } from '@/types';

export const useAttendance = (employeeId?: string) => {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataStore.initialize().then(() => {
      const allAttendance = dataStore.getAttendance();
      const filtered = employeeId 
        ? allAttendance.filter(a => a.employeeId === employeeId)
        : allAttendance;
      setAttendance(filtered);
      setLoading(false);
    });

    const unsubscribe = dataStore.subscribe(() => {
      const allAttendance = dataStore.getAttendance();
      const filtered = employeeId 
        ? allAttendance.filter(a => a.employeeId === employeeId)
        : allAttendance;
      setAttendance(filtered);
    });

    return () => {
      // call unsubscribe and ignore its return value so the cleanup returns void
      unsubscribe();
    };
  }, [employeeId]);

  const addAttendance = async (attendanceData: Omit<Attendance, 'id'>) => {
    return await dataStore.addAttendance(attendanceData);
  };

  const getTodayAttendance = () => {
    const today = new Date().toISOString().split('T')[0];
    return attendance.find(a => a.date === today);
  };

  return {
    attendance,
    loading,
    addAttendance,
    getTodayAttendance,
  };
};
