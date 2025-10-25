import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { mockEmployees } from '@/lib/mockData';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { CalendarIcon, Video } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ScheduleMeetingModalProps {
  onClose: () => void;
  preSelectedEmployeeId?: string;
}

export const ScheduleMeetingModal = ({ onClose, preSelectedEmployeeId }: ScheduleMeetingModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState('');
  const [link, setLink] = useState('');
  const [selectedAttendees, setSelectedAttendees] = useState<string[]>(preSelectedEmployeeId ? [preSelectedEmployeeId] : []);

  const toggleAttendee = (employeeId: string) => {
    setSelectedAttendees(prev =>
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  const handleSchedule = () => {
    if (!title || !date || !time || selectedAttendees.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    toast.success(`Meeting scheduled with ${selectedAttendees.length} attendees!`);
    onClose();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Meeting</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <Label htmlFor="title">Meeting Title</Label>
            <Input
              id="title"
              placeholder="e.g., Weekly Team Sync"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Meeting agenda and details..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="link">Meeting Link (Optional)</Label>
            <div className="flex gap-2">
              <Input
                id="link"
                placeholder="https://meet.google.com/..."
                value={link}
                onChange={(e) => setLink(e.target.value)}
              />
              <Button variant="outline" size="icon">
                <Video className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label className="mb-3 block">Select Attendees</Label>
            <div className="border rounded-lg p-4 space-y-3 max-h-48 overflow-y-auto">
              {mockEmployees.map((emp) => (
                <div key={emp.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={emp.id}
                    checked={selectedAttendees.includes(emp.id)}
                    onCheckedChange={() => toggleAttendee(emp.id)}
                  />
                  <label
                    htmlFor={emp.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                  >
                    <img src={emp.avatar} alt={emp.name} className="w-6 h-6 rounded-full" />
                    <span>{emp.name}</span>
                    <span className="text-muted-foreground">- {emp.position}</span>
                  </label>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedAttendees.length} attendee(s) selected
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSchedule}>
              <CalendarIcon className="w-4 h-4 mr-2" />
              Schedule Meeting
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
