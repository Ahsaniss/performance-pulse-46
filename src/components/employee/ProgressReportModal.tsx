import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useTasks } from '@/hooks/useTasks';
import { Upload, X } from 'lucide-react';
import { Task } from '@/types';

interface ProgressReportModalProps {
  task: Task;
  onClose: () => void;
}

export const ProgressReportModal = ({ task, onClose }: ProgressReportModalProps) => {
  const { addProgressUpdate } = useTasks();
  const [percentage, setPercentage] = useState(task.currentProgress || 0);
  const [comment, setComment] = useState('');
  const [strategy, setStrategy] = useState('');
  const [blockers, setBlockers] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('percentage', percentage.toString());
      formData.append('comment', comment);
      formData.append('strategy', strategy);
      formData.append('blockers', blockers);
      
      files.forEach(file => {
        formData.append('documents', file);
      });

      await addProgressUpdate(task.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to submit progress', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Progress: {task.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <Label>Completion Percentage</Label>
              <span className="font-bold text-primary">{percentage}%</span>
            </div>
            <Slider
              value={[percentage]}
              onValueChange={(vals) => setPercentage(vals[0])}
              max={100}
              step={5}
              className="py-4"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Progress Description</Label>
            <Textarea
              id="comment"
              placeholder="What have you accomplished?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="strategy">Strategy / Approach</Label>
              <Textarea
                id="strategy"
                placeholder="How are you tackling this?"
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="blockers">Blockers / Challenges</Label>
              <Textarea
                id="blockers"
                placeholder="Any issues facing?"
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Attachments (Images, Documents)</Label>
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors relative">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                {files.length > 0 
                  ? `${files.length} file(s) selected` 
                  : "Drag & drop files or click to upload"}
              </p>
            </div>
            {files.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {files.map((file, i) => (
                  <div key={i} className="bg-gray-100 px-3 py-1 rounded-full text-xs flex items-center gap-2">
                    {file.name}
                    <button onClick={() => setFiles(files.filter((_, idx) => idx !== i))}>
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
