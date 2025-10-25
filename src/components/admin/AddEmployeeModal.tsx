import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface AddEmployeeModalProps {
  onClose: () => void;
}

export const AddEmployeeModal = ({ onClose }: AddEmployeeModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; password: string } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    position: '',
    role: 'employee' as 'admin' | 'employee',
  });

  type EdgeFunctionError = {
	message: string;
	details?: string;
	context?: { response?: Response; body?: unknown };
};

const EDGE_ERROR_PREFIX = 'Edge function error';

const isEdgeFunctionError = (error: unknown): error is EdgeFunctionError =>
	typeof error === 'object' &&
	error !== null &&
	typeof (error as EdgeFunctionError).message === 'string' &&
	(error as EdgeFunctionError).message.includes('Edge Function returned a non-2xx status code');

const parseEdgeErrorPayload = (payload: unknown): string | null => {
	if (!payload || typeof payload !== 'object') return null;
	const candidate = payload as Record<string, unknown>;

	const directMessageFields = [
		'message',
		'error',
		'error_message',
		'error_description',
		'description',
	];
	for (const field of directMessageFields) {
		const value = candidate[field];
		if (typeof value === 'string' && value.trim()) return value.trim();
	}

	const nestedFields = ['error', 'data', 'details', 'payload'];
	for (const nestedKey of nestedFields) {
		const nestedValue = candidate[nestedKey];
		if (nestedValue && typeof nestedValue === 'object') {
			const nested = parseEdgeErrorPayload(nestedValue);
			if (nested) return nested;
		}
	}

	return null;
};

const extractEdgeFunctionError = async (edgeError: EdgeFunctionError) => {
	if (edgeError.details?.trim()) return edgeError.details.trim();

	const body = edgeError.context?.body;
	if (body) {
		try {
			if (typeof body === 'string') {
				const trimmed = body.trim();
				if (!trimmed) return null;
				try {
					const parsed = JSON.parse(trimmed);
					const message = parseEdgeErrorPayload(parsed);
					if (message) return message;
				} catch {
					return trimmed;
				}
			} else if (typeof body === 'object') {
				const parsed = parseEdgeErrorPayload(body);
				if (parsed) return parsed;
			}
		} catch {
			/* ignore */
		}
	}

	const response = edgeError.context?.response;
	if (!response) return null;

	const headerMessage = response.headers?.get?.('x-supabase-edge-error');
	if (headerMessage?.trim()) return headerMessage.trim();

	try {
		const clone = response.clone();
		const contentType = clone.headers.get('content-type') ?? '';

		if (contentType.includes('application/json')) {
			const json = await clone.json();
			const parsed = parseEdgeErrorPayload(json);
			if (parsed) return parsed;
		}

		const text = await clone.text();
		if (text.trim()) return text.trim();
	} catch {
		try {
			const fallback = await response.text();
			if (fallback.trim()) return fallback.trim();
		} catch {
			/* ignore */
		}
	}

	return null;
};

const formatEdgeFunctionFallback = (edgeError: EdgeFunctionError) => {
	const status = edgeError.context?.response?.status;
	const statusText = edgeError.context?.response?.statusText;
	const suffix = status ? ` (${status}${statusText ? ` ${statusText}` : ''})` : '';
	return `${EDGE_ERROR_PREFIX}${suffix}: ${edgeError.message}`;
};

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.department || !formData.position) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-employee', {
        body: {
          email: formData.email,
          full_name: formData.name,
          department: formData.department,
          position: formData.position,
          role: formData.role,
        }
      });

      if (error) throw error;

      setCredentials({
        email: formData.email,
        password: data.temporary_password
      });

      toast.success('Employee account created successfully!');
    } catch (error: any) {
		let errorMessage = error?.message || 'Failed to create employee account';
		if (isEdgeFunctionError(error)) {
			const detail = await extractEdgeFunctionError(error);
			errorMessage = detail ?? formatEdgeFunctionFallback(error);
			console.error('create-employee edge error', {
				message: errorMessage,
				status: error.context?.response?.status,
				error,
			});
		} else {
			console.error('Error creating employee:', error);
		}
		toast.error(errorMessage);
	} finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const handleClose = () => {
    setCredentials(null);
    onClose();
  };

  if (credentials) {
    return (
      <AlertDialog open={true} onOpenChange={handleClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Employee Account Created</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>The employee account has been created successfully. Please share these credentials with the employee:</p>
              
              <div className="bg-secondary p-4 rounded-md space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Email:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{credentials.email}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(credentials.email)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Temporary Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="text-sm">{credentials.password}</code>
                    <Button size="sm" variant="ghost" onClick={() => copyToClipboard(credentials.password)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                The employee should change their password after first login.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={handleClose}>
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
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              <UserPlus className="w-4 h-4 mr-2" />
              {isLoading ? 'Creating...' : 'Add Employee'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
