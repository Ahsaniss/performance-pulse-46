import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Employee } from '@/types';
import { Mail, MapPin, Star } from 'lucide-react';

interface EmployeeGridProps {
  employees: Employee[];
  onEmployeeClick: (employeeId: string) => void;
}

export const EmployeeGrid = ({ employees, onEmployeeClick }: EmployeeGridProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'inactive':
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      case 'on-leave':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default:
        return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {employees.map((employee) => (
        <Card
          key={employee.id}
          className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
          onClick={() => onEmployeeClick(employee.id)}
        >
          <div className="flex flex-col items-center text-center space-y-4">
            <img
              src={employee.avatar}
              alt={employee.name}
              className="w-20 h-20 rounded-full border-2 border-primary"
            />
            <div className="w-full">
              <h3 className="font-bold text-lg">{employee.name}</h3>
              <p className="text-sm text-muted-foreground">{employee.position}</p>
            </div>

            <div className="w-full space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{employee.department}</span>
              </div>
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span className="truncate">{employee.email}</span>
              </div>
            </div>

            <div className="flex items-center justify-between w-full pt-2 border-t">
              <Badge className={getStatusColor(employee.status)}>
                {employee.status}
              </Badge>
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <span className="font-semibold">{employee.performanceScore}</span>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
