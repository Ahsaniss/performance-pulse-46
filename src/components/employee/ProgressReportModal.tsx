import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTasks } from '@/hooks/useTasks';
import { toast } from 'sonner';
import {
  Upload, X, ChevronDown, ChevronUp, History,
  FileText, Image, File, Save, Clock,
  CheckCircle2, AlertTriangle, Lightbulb, Target
} from 'lucide-react';
import { Task, UpdateTag, KPIMetric } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const DRAFT_KEY_PREFIX = 'progress_draft_';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSliderColor(percentage: number) {
  if (percentage <= 30) return { track: 'bg-red-500', glow: 'shadow-red-500/20', text: 'text-red-600', label: 'Getting Started' };
  if (percentage <= 70) return { track: 'bg-amber-500', glow: 'shadow-amber-500/20', text: 'text-amber-600', label: 'In Progress' };
  return { track: 'bg-emerald-500', glow: 'shadow-emerald-500/20', text: 'text-emerald-600', label: 'Almost There!' };
}

function getFileIcon(mimetype: string) {
  if (mimetype?.startsWith('image/')) return <Image className="w-4 h-4 text-blue-500" />;
  if (mimetype?.includes('pdf')) return <FileText className="w-4 h-4 text-red-500" />;
  return <File className="w-4 h-4 text-gray-500" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ProgressReportModalProps {
  task: Task;
  onClose: () => void;
}

export const ProgressReportModal = ({ task, onClose }: ProgressReportModalProps) => {
  const { addProgressUpdate } = useTasks();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const draftKey = DRAFT_KEY_PREFIX + task.id;

  // ── Form State ──
  const [percentage, setPercentage] = useState(task.currentProgress || 0);
  const [comment, setComment] = useState('');
  const [strategy, setStrategy] = useState('');
  const [blockers, setBlockers] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<{ url: string; name: string; size: number; type: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const sliderColor = useMemo(() => getSliderColor(percentage), [percentage]);

  // ── Load Draft ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const draft = JSON.parse(saved);
        if (draft.percentage !== undefined) setPercentage(draft.percentage);
        if (draft.comment) setComment(draft.comment);
        if (draft.strategy) setStrategy(draft.strategy);
        if (draft.blockers) setBlockers(draft.blockers);
        setDraftSaved(true);
      }
    } catch { /* ignore parse errors */ }
  }, [draftKey]);

  // ── Auto-save Draft (debounced) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = { percentage, comment, strategy, blockers };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      if (comment || strategy || blockers) {
        setDraftSaved(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [percentage, comment, strategy, blockers, draftKey]);

  // ── File Handling ──
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);

    newFiles.forEach(file => {
      const preview = {
        url: file.type.startsWith('image/') ? URL.createObjectURL(file) : '',
        name: file.name,
        size: file.size,
        type: file.type,
      };
      setFilePreviews(prev => [...prev, preview]);
    });

    // Reset input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => {
      if (prev[index]?.url) URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => { if (p.url) URL.revokeObjectURL(p.url); });
    };
  }, []);

  // ── Submit ──
  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Please add a progress description before submitting.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('percentage', percentage.toString());
      formData.append('comment', comment);
      formData.append('strategy', strategy);
      formData.append('blockers', blockers);
      formData.append('tags', JSON.stringify([]));
      formData.append('aiSuggestion', '');
      formData.append('estimatedCompletion', '');
      formData.append('kpiMetrics', JSON.stringify([]));

      files.forEach(file => {
        formData.append('documents', file);
      });

      await addProgressUpdate(task.id, formData);

      // Clear draft after successful submission
      localStorage.removeItem(draftKey);

      toast.success('Progress report submitted successfully! 🎉', {
        description: `${task.title} updated to ${percentage}%`,
        duration: 4000,
      });

      onClose();
    } catch (error: any) {
      console.error('Failed to submit progress', error);
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to submit progress report';
      
      if (error?.response?.status === 401) {
        toast.error('Session expired. Please login again.');
      } else if (error?.response?.status === 403) {
        toast.error('You do not have permission to update this task.');
      } else if (error?.response?.status === 404) {
        toast.error('Task not found. It may have been deleted.');
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Past Updates ──
  const pastUpdates = useMemo(() =>
    (task.progressUpdates || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp || b.updatedAt || '').getTime() - new Date(a.timestamp || a.updatedAt || '').getTime()),
    [task.progressUpdates]
  );

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[95vh] p-0 gap-0 overflow-hidden">
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <DialogTitle className="text-xl font-bold leading-tight truncate">
                  Update Progress
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1 truncate">{task.title}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {draftSaved && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Save className="w-3 h-3" /> Draft saved
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {task.priority} priority
                </Badge>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* ── Scrollable Body ── */}
        <ScrollArea className="flex-1 max-h-[calc(95vh-140px)]">
          <div className="px-6 py-5 space-y-6">

            {/* ═══ SECTION 1: Completion Slider ═══ */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Completion Progress
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-2xl font-bold tabular-nums ${sliderColor.text}`}>
                    {percentage}%
                  </span>
                </div>
              </div>

              {/* Color-coded slider */}
              <div className="relative pt-2 pb-1">
                <div className="relative w-full h-3 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`absolute h-full rounded-full transition-all duration-300 ${sliderColor.track}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <Slider
                  value={[percentage]}
                  onValueChange={(vals) => setPercentage(vals[0])}
                  max={100}
                  step={5}
                  className="absolute inset-0 [&_[role=slider]]:h-6 [&_[role=slider]]:w-6 [&_[role=slider]]:border-2 [&_[role=slider]]:shadow-lg"
                />
              </div>

              {/* Progress markers */}
              <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                <span>0%</span>
                <span className={percentage >= 25 ? sliderColor.text : ''}>25%</span>
                <span className={percentage >= 50 ? sliderColor.text : ''}>50%</span>
                <span className={percentage >= 75 ? sliderColor.text : ''}>75%</span>
                <span className={percentage >= 100 ? sliderColor.text : ''}>100%</span>
              </div>

              {/* Status label */}
              <div className={`text-center text-xs font-medium ${sliderColor.text} bg-muted/50 rounded-md py-1.5`}>
                {sliderColor.label} {percentage === 100 && '🎉'}
              </div>
            </div>

            <Separator />

            {/* ═══ SECTION 2: Description ═══ */}
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-sm font-semibold">
                Progress Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="comment"
                placeholder="Describe what you've accomplished since the last update. Include metrics if possible (e.g., 'Completed 3 out of 5 API endpoints, wrote 12 unit tests')..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none text-sm"
              />
              <p className="text-xs text-muted-foreground">
                💡 Tip: Be specific about deliverables and measurable outcomes
              </p>
            </div>

            {/* ═══ SECTION 3: Strategy & Blockers (side by side on desktop) ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strategy */}
              <div className="space-y-2">
                <Label htmlFor="strategy" className="text-sm font-semibold flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Strategy / Approach
                </Label>
                <Textarea
                  id="strategy"
                  placeholder="What approach are you taking? E.g., 'Using component-based architecture with reusable hooks...'"
                  value={strategy}
                  onChange={(e) => setStrategy(e.target.value)}
                  rows={8}
                  className="resize-y text-sm"
                />
              </div>

              {/* Blockers */}
              <div className="space-y-2">
                <Label htmlFor="blockers" className="text-sm font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                  Blockers / Challenges
                </Label>
                <Textarea
                  id="blockers"
                  placeholder="Any obstacles? E.g., 'Waiting for design review on the dashboard layout...'"
                  value={blockers}
                  onChange={(e) => setBlockers(e.target.value)}
                  rows={8}
                  className="resize-y text-sm"
                />
              </div>
            </div>

            <Separator />

            {/* ═══ SECTION 4: File Attachments ═══ */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Attachments
              </Label>

              {/* Drop zone */}
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer relative group"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                />
                <Upload className="w-8 h-8 mx-auto text-muted-foreground/50 group-hover:text-primary/70 mb-2 transition-colors" />
                <p className="text-sm text-muted-foreground">
                  Click to upload or drag & drop
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1">
                  Images, PDF, Word, Excel — Max 5 files
                </p>
              </div>

              {/* File Previews */}
              {filePreviews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filePreviews.map((preview, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-muted/40 rounded-lg p-2.5 border group hover:border-primary/30 transition-colors"
                    >
                      {/* Preview thumbnail */}
                      {preview.url ? (
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-10 h-10 rounded object-cover border shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center shrink-0 border">
                          {getFileIcon(preview.type)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{preview.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {formatFileSize(preview.size)}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                        className="p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600 transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* ═══ SECTION 8: Task History ═══ */}
            {pastUpdates.length > 0 && (
              <Collapsible open={showHistory} onOpenChange={setShowHistory}>
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full text-sm font-semibold hover:bg-muted/50 rounded-md px-2 py-2 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-500" />
                      Past Updates ({pastUpdates.length})
                    </span>
                    {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-3">
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {pastUpdates.map((update, idx) => {
                      const updateColor = getSliderColor(update.percentage);
                      return (
                        <div
                          key={idx}
                          className="border-l-[3px] pl-4 py-3 bg-muted/20 rounded-r-lg"
                          style={{ borderLeftColor: update.percentage <= 30 ? '#ef4444' : update.percentage <= 70 ? '#f59e0b' : '#10b981' }}
                        >
                          <div className="flex items-center justify-between mb-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${updateColor.text}`}
                            >
                              {update.percentage}%
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(update.timestamp || update.updatedAt || '').toLocaleDateString('en-US', {
                                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{update.comment}</p>
                          {update.strategy && (
                            <p className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium text-blue-600">Strategy:</span> {update.strategy}
                            </p>
                          )}
                          {update.blockers && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              <span className="font-medium text-red-600">Blockers:</span> {update.blockers}
                            </p>
                          )}
                          {update.attachments && update.attachments.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5">
                              {update.attachments.map((file, fi) => (
                                <a
                                  key={fi}
                                  href={`http://localhost:5000/${file.path}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] bg-muted px-2 py-0.5 rounded flex items-center gap-1 hover:bg-muted/80"
                                >
                                  {getFileIcon(file.mimetype)}
                                  <span className="truncate max-w-[100px]">{file.originalName}</span>
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        </ScrollArea>

        {/* ── Sticky Footer ── */}
        <div className="sticky bottom-0 z-10 bg-background border-t px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {files.length > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> {files.length} file(s)
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !comment.trim()}
                className={`min-w-[140px] ${
                  percentage <= 30 ? 'bg-red-600 hover:bg-red-700'
                    : percentage <= 70 ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-emerald-600 hover:bg-emerald-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Submitting...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Submit Report
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
