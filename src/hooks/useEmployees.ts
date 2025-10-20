import { useState, useEffect } from 'react';
import { dataStore } from '@/lib/store';
import { Employee } from '@/types';

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>(dataStore.getEmployees());

  useEffect(() => {
    const unsubscribe = dataStore.subscribe(() => {
      setEmployees(dataStore.getEmployees());
    });

    return () => {
      // Call unsubscribe and ignore its return value so the cleanup returns void
      unsubscribe();
    };
  }, []);

  const addEmployee = (employee: Omit<Employee, 'id'>) => {
    return dataStore.addEmployee(employee);
  };

  const updateEmployee = (id: string, updates: Partial<Employee>) => {
    dataStore.updateEmployee(id, updates);
  };

  const deleteEmployee = (id: string) => {
    dataStore.deleteEmployee(id);
  };

  return {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
  };
};
