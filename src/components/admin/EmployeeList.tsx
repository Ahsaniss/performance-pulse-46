import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Employee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

export const EmployeeList = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, department')
        .order('full_name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="p-6 bg-card border-border animate-pulse">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-primary/10 rounded w-3/4" />
                <div className="h-3 bg-primary/10 rounded w-1/2" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-slide-up">
      {employees.map((employee) => (
        <Card 
          key={employee.id}
          className="p-6 bg-card border-border hover:shadow-glow transition-all duration-300 cursor-pointer group"
          onClick={() => navigate(`/employee/${employee.id}`)}
        >
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 border-2 border-primary">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(employee.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {employee.full_name}
              </h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" />
                {employee.email}
              </p>
              {employee.department && (
                <p className="text-sm text-muted-foreground mt-1">
                  {employee.department}
                </p>
              )}
            </div>
          </div>
        </Card>
      ))}
      {employees.length === 0 && (
        <div className="col-span-full text-center py-12 text-muted-foreground">
          No employees found
        </div>
      )}
    </div>
  );
};
