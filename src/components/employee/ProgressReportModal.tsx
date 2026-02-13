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
  Upload, X, ChevronDown, ChevronUp, History, Tag, BarChart3,
  Sparkles, FileText, Image, File, Plus, Trash2, Save, Clock,
  CheckCircle2, AlertTriangle, Lightbulb, Target
} from 'lucide-react';
import { Task, UpdateTag, KPIMetric } from '@/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const UPDATE_TAGS: UpdateTag[] = [
  'Frontend', 'Backend', 'Design', 'Testing', 'DevOps', 'Documentation', 'Research', 'Bug Fix'
];

const TAG_COLORS: Record<UpdateTag, string> = {
  Frontend: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300',
  Backend: 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300',
  Design: 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300',
  Testing: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300',
  DevOps: 'bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-300',
  Documentation: 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300',
  Research: 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300',
  'Bug Fix': 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-300',
};

const COMMON_STRATEGIES = [
  'Breaking down into smaller sub-tasks',
  'Pair programming / code review',
  'Research & prototyping first',
  'Following existing design patterns',
  'Test-driven development approach',
  'Incremental delivery with feedback loops',
];

const COMMON_BLOCKERS = [
  'Waiting for API/backend integration',
  'Dependency on another team member',
  'Unclear requirements — need clarification',
  'Technical debt / legacy code issues',
  'Environment / tooling setup issues',
  'Design assets not available yet',
];

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

function generateAISuggestion(task: Task, percentage: number): string {
  const difficulty = task.difficulty || 'medium';
  const deadlineDate = task.deadline ? new Date(task.deadline) : null;
  const now = new Date();
  const daysRemaining = deadlineDate ? Math.ceil((deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const remaining = 100 - percentage;

  let suggestion = '';

  if (percentage === 0) {
    suggestion = `Start with breaking this ${difficulty}-difficulty task into smaller milestones. `;
    if (daysRemaining !== null && daysRemaining > 0) {
      suggestion += `You have ${daysRemaining} day(s) — aim for ${Math.min(25, Math.round(100 / Math.max(daysRemaining, 1)))}% daily progress.`;
    }
  } else if (percentage < 30) {
    suggestion = `Good start! At this pace, consider focusing on core functionality first. `;
    if (daysRemaining !== null && daysRemaining > 0) {
      const dailyNeeded = Math.round(remaining / daysRemaining);
      suggestion += `Target ~${dailyNeeded}% per day to finish on time.`;
    }
  } else if (percentage < 70) {
    suggestion = `Solid progress! You're in the mid-phase — prioritize testing and edge cases. `;
    if (daysRemaining !== null && daysRemaining <= 3) {
      suggestion += `⚠️ Deadline approaching in ${daysRemaining} day(s) — consider focusing on must-haves.`;
    }
  } else if (percentage < 100) {
    suggestion = `Almost done! Focus on code review, documentation, and final polish. `;
    if (remaining <= 10) {
      suggestion += `Just ${remaining}% left — you're in the home stretch!`;
    }
  } else {
    suggestion = `🎉 Task complete! Consider documenting lessons learned for future reference.`;
  }

  return suggestion;
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
  const [selectedTags, setSelectedTags] = useState<UpdateTag[]>([]);
  const [kpiMetrics, setKpiMetrics] = useState<KPIMetric[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showKPI, setShowKPI] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const sliderColor = useMemo(() => getSliderColor(percentage), [percentage]);
  const aiSuggestion = useMemo(() => generateAISuggestion(task, percentage), [task, percentage]);

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
        if (draft.selectedTags) setSelectedTags(draft.selectedTags);
        if (draft.kpiMetrics) setKpiMetrics(draft.kpiMetrics);
        setDraftSaved(true);
      }
    } catch { /* ignore parse errors */ }
  }, [draftKey]);

  // ── Auto-save Draft (debounced) ──
  useEffect(() => {
    const timer = setTimeout(() => {
      const draft = { percentage, comment, strategy, blockers, selectedTags, kpiMetrics };
      localStorage.setItem(draftKey, JSON.stringify(draft));
      if (comment || strategy || blockers || selectedTags.length > 0) {
        setDraftSaved(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [percentage, comment, strategy, blockers, selectedTags, kpiMetrics, draftKey]);

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

  // ── Tag Toggle ──
  const toggleTag = useCallback((tag: UpdateTag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  // ── KPI Metrics ──
  const addKPIMetric = useCallback(() => {
    setKpiMetrics(prev => [...prev, { label: '', value: 0, unit: '', target: 0 }]);
  }, []);

  const updateKPIMetric = useCallback((index: number, field: keyof KPIMetric, value: string | number) => {
    setKpiMetrics(prev => prev.map((m, i) => i === index ? { ...m, [field]: value } : m));
  }, []);

  const removeKPIMetric = useCallback((index: number) => {
    setKpiMetrics(prev => prev.filter((_, i) => i !== index));
  }, []);

  // ── Strategy/Blocker Suggestion Pick ──
  const applySuggestion = useCallback((field: 'strategy' | 'blockers', value: string) => {
    if (field === 'strategy') {
      setStrategy(prev => prev ? `${prev}\n• ${value}` : `• ${value}`);
    } else {
      setBlockers(prev => prev ? `${prev}\n• ${value}` : `• ${value}`);
    }
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
      formData.append('tags', JSON.stringify(selectedTags));
      formData.append('aiSuggestion', aiSuggestion);
      formData.append('estimatedCompletion', '');

      // KPI Metrics
      const validMetrics = kpiMetrics.filter(m => m.label.trim());
      if (validMetrics.length > 0) {
        formData.append('kpiMetrics', JSON.stringify(validMetrics));
      }

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
    } catch (error) {
      console.error('Failed to submit progress', error);
      toast.error('Failed to submit progress report. Please try again.');
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

            {/* ═══ SECTION 2: AI Suggestion ═══ */}
            <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 border border-violet-200 dark:border-violet-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-violet-100 dark:bg-violet-900/50 rounded-md shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-violet-700 dark:text-violet-300 uppercase tracking-wide mb-1">
                    AI Suggestion
                  </p>
                  <p className="text-sm text-violet-900 dark:text-violet-100 leading-relaxed">
                    {aiSuggestion}
                  </p>
                </div>
              </div>
            </div>

            {/* ═══ SECTION 3: Tags ═══ */}
            <div className="space-y-2">
              <Label className="text-sm font-semibold flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Categorize Update
              </Label>
              <p className="text-xs text-muted-foreground">Select tags that describe the type of work done</p>
              <div className="flex flex-wrap gap-2">
                {UPDATE_TAGS.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`
                      px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-200
                      ${selectedTags.includes(tag)
                        ? `${TAG_COLORS[tag]} ring-2 ring-offset-1 ring-current/20 scale-105`
                        : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:scale-105'
                      }
                    `}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <Separator />

            {/* ═══ SECTION 4: Description ═══ */}
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

            {/* ═══ SECTION 5: Strategy & Blockers (side by side on desktop) ═══ */}
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
                  rows={3}
                  className="resize-none text-sm"
                />
                {/* Quick suggestions dropdown */}
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Quick add:</p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_STRATEGIES.map((s, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applySuggestion('strategy', s)}
                        className="text-[11px] bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded hover:bg-blue-100 dark:hover:bg-blue-950/50 transition-colors border border-blue-200 dark:border-blue-800"
                      >
                        + {s}
                      </button>
                    ))}
                  </div>
                </div>
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
                  rows={3}
                  className="resize-none text-sm"
                />
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Quick add:</p>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_BLOCKERS.map((b, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applySuggestion('blockers', b)}
                        className="text-[11px] bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 px-2 py-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors border border-red-200 dark:border-red-800"
                      >
                        + {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* ═══ SECTION 6: KPI Metrics ═══ */}
            <Collapsible open={showKPI} onOpenChange={setShowKPI}>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center justify-between w-full text-sm font-semibold hover:bg-muted/50 rounded-md px-2 py-2 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    KPI Metrics (Optional)
                  </span>
                  {showKPI ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">
                  Track numeric progress indicators for this task
                </p>
                {kpiMetrics.map((metric, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-end bg-muted/30 rounded-lg p-3">
                    <div className="col-span-12 sm:col-span-4 space-y-1">
                      <Label className="text-xs">Metric Name</Label>
                      <Input
                        placeholder="e.g., API Endpoints"
                        value={metric.label}
                        onChange={(e) => updateKPIMetric(index, 'label', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Current</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={metric.value || ''}
                        onChange={(e) => updateKPIMetric(index, 'value', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-4 sm:col-span-2 space-y-1">
                      <Label className="text-xs">Target</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={metric.target || ''}
                        onChange={(e) => updateKPIMetric(index, 'target', Number(e.target.value))}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-3 sm:col-span-3 space-y-1">
                      <Label className="text-xs">Unit</Label>
                      <Input
                        placeholder="e.g., count"
                        value={metric.unit}
                        onChange={(e) => updateKPIMetric(index, 'unit', e.target.value)}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="col-span-1 flex items-end justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKPIMetric(index)}
                        className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    {/* Progress bar for this KPI */}
                    {metric.target && metric.target > 0 && (
                      <div className="col-span-12 mt-1">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                (metric.value / metric.target) >= 1 ? 'bg-emerald-500'
                                  : (metric.value / metric.target) >= 0.5 ? 'bg-amber-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(100, (metric.value / metric.target) * 100)}%` }}
                            />
                          </div>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {Math.round((metric.value / metric.target) * 100)}%
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addKPIMetric}
                  className="w-full border-dashed"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" /> Add KPI Metric
                </Button>
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* ═══ SECTION 7: File Attachments ═══ */}
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
                          {update.tags && update.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {update.tags.map((tag, ti) => (
                                <span key={ti} className={`text-[10px] px-1.5 py-0.5 rounded-full border ${TAG_COLORS[tag] || 'bg-muted'}`}>
                                  {tag}
                                </span>
                              ))}
                            </div>
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
              {selectedTags.length > 0 && (
                <span className="flex items-center gap-1">
                  <Tag className="w-3 h-3" /> {selectedTags.length} tag(s)
                </span>
              )}
              {kpiMetrics.filter(m => m.label).length > 0 && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> {kpiMetrics.filter(m => m.label).length} KPI(s)
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
