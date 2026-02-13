import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";
import { Loader2, Zap } from 'lucide-react';

interface GenerateEvaluationModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const GenerateEvaluationModal: React.FC<GenerateEvaluationModalProps> = ({
  open,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();
  const [month, setMonth] = useState((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [loading, setLoading] = useState(false);

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const months = [
    { value: '1', label: 'January' },
    { value: '2', label: 'February' },
    { value: '3', label: 'March' },
    { value: '4', label: 'April' },
    { value: '5', label: 'May' },
    { value: '6', label: 'June' },
    { value: '7', label: 'July' },
    { value: '8', label: 'August' },
    { value: '9', label: 'September' },
    { value: '10', label: 'October' },
    { value: '11', label: 'November' },
    { value: '12', label: 'December' },
  ];

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const response = await api.post('/evaluations/generate-automated', {
        month: parseInt(month),
        year: parseInt(year)
      });

      toast({
        title: "Evaluations Generated",
        description: response.data.message || `Generated evaluations for ${month}/${year}`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.response?.data?.message || "Failed to generate evaluations",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-600" />
            Generate Automated Evaluations
          </DialogTitle>
          <DialogDescription>
            Calculate monthly performance scores for all employees based on their task completion,
            on-time delivery, and communication metrics.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="month">Month</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger id="year">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y.toString()}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-900 text-sm mb-2">Scoring Formula</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Task Completion Rate: 40% weight</li>
              <li>• On-Time Delivery: 40% weight</li>
              <li>• Communication Score: 20% weight</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {loading ? 'Generating...' : 'Generate Evaluations'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
