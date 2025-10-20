import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useEmployees } from '@/hooks/useEmployees';

interface AddEmployeeModalProps {
  onClose: () => void;
}

export const AddEmployeeModal = ({ onClose }: AddEmployeeModalProps) => {
  const { addEmployee } = useEmployees();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'employee' as 'admin' | 'employee',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.department || !formData.position) {
      toast.error('Please fill in all fields');
      return;
    }

    // Add employee to store
    const newEmployee = addEmployee({
      name: formData.name,
      email: formData.email,
      department: formData.department,
      position: formData.position,
      role: formData.role,
    } as any);

    toast.success(`Employee ${formData.name} added successfully!`);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="john.doe@company.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="department">Department</Label>
            <Select value={formData.department} onValueChange={(val) => setFormData({ ...formData, department: val })}>
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Engineering">Engineering</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
                <SelectItem value="Finance">Finance</SelectItem>
                <SelectItem value="Operations">Operations</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              placeholder="e.g., Senior Developer"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role} onValueChange={(val: any) => setFormData({ ...formData, role: val })}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="employee">Employee</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              <UserPlus className="w-4 h-4 mr-2" />
              Add Employee
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
