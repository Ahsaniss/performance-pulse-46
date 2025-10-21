import { useState, useEffect } from 'react';
import { dataStore } from '@/lib/store';
import { Employee } from '@/types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize data from Google Sheets
    dataStore.initialize().then(() => {
      setEmployees(dataStore.getEmployees());
      setLoading(false);
    });

    const maybeUnsubscribe = dataStore.subscribe(() => {
      setEmployees(dataStore.getEmployees());
    });

    // dataStore.subscribe may return a cleanup function or a boolean; ensure we return a valid cleanup.
    if (typeof maybeUnsubscribe === 'function') {
      return maybeUnsubscribe;
    }

    return () => {
      // no-op cleanup
    };
  }, []);

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    return await dataStore.addEmployee(employee);
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await dataStore.updateEmployee(id, updates);
  };

  const deleteEmployee = (id: string) => {
    dataStore.deleteEmployee(id);
  };

  return {
    employees,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
