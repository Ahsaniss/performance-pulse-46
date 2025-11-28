import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import axios from 'axios';

interface ProgressUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskId: string;
  currentProgress: number;
  onUpdateSuccess: () => void;
}

export const ProgressUpdateModal: React.FC<ProgressUpdateModalProps> = ({
  isOpen,
  onClose,
  taskId,
  currentProgress,
  onUpdateSuccess
}) => {
  const [percentage, setPercentage] = useState(currentProgress);
  const [comment, setComment] = useState('');
  const [strategy, setStrategy] = useState('');
  const [blockers, setBlockers] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('percentage', percentage.toString());
    formData.append('comment', comment);
    formData.append('strategy', strategy);
    formData.append('blockers', blockers);
    
    if (files) {
      for (let i = 0; i < files.length; i++) {
        formData.append('documents', files[i]);
      }
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/tasks/${taskId}/progress`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast({
        title: "Success",
        description: "Progress updated successfully",
      });
      onUpdateSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Task Progress</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Progress Percentage: {percentage}%</Label>
            <Slider
              value={[percentage]}
              onValueChange={(val) => setPercentage(val[0])}
              max={100}
              step={5}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Comment / Status Update</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you accomplish?"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="strategy">Strategy (Optional)</Label>
            <Textarea
              id="strategy"
              value={strategy}
              onChange={(e) => setStrategy(e.target.value)}
              placeholder="How did you approach this?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="blockers">Blockers (Optional)</Label>
            <Textarea
              id="blockers"
              value={blockers}
              onChange={(e) => setBlockers(e.target.value)}
              placeholder="Any issues facing you?"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="files">Proof of Work (Files)</Label>
            <Input
              id="files"
              type="file"
              multiple
              onChange={(e) => setFiles(e.target.files)}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Updating...' : 'Submit Update'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
