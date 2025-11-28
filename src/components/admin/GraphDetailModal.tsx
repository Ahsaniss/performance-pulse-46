import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ChevronDown, Clock, Calendar, AlertCircle, CheckCircle2, FileText, Target, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface TaskDetail {
  id: string;
  title: string;
  status: string;
  difficulty?: string;
  createdAt: string; // assignedAt
  startedAt?: string;
  completedAt?: string;
  deadline?: string;
  description?: string;
  progressUpdates?: Array<{
    percentage: number;
    comment: string;
    strategy?: string;
    blockers?: string;
    attachments?: any[];
    updatedAt?: string;
    timestamp?: string;
  }>;
  estimatedHours?: number;
  actualHours?: number;
}

interface GraphDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskDetails: TaskDetail | null;
}

export const GraphDetailModal: React.FC<GraphDetailModalProps> = ({
  isOpen,
  onClose,
  taskDetails,
}) => {
  const [expandedUpdate, setExpandedUpdate] = useState<number | null>(null);

  if (!taskDetails) return null;

  const calculateDaysTaken = () => {
    if (taskDetails.completedAt && taskDetails.startedAt) {
      const start = new Date(taskDetails.startedAt);
      const end = new Date(taskDetails.completedAt);
      return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    }
    return 0;
  };

  const isOverdue = () => {
    if (taskDetails.deadline && taskDetails.status !== 'completed') {
      return new Date() > new Date(taskDetails.deadline);
    }
    return false;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                {taskDetails.title}
                <Badge variant="outline" className={`${getStatusColor(taskDetails.status)} capitalize`}>
                  {taskDetails.status.replace('_', ' ')}
                </Badge>
              </DialogTitle>
              <p className="text-muted-foreground mt-2">{taskDetails.description || "No description provided."}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 p-6">
          <div className="space-y-8">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Target className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Difficulty</span>
                </div>
                <p className="text-lg font-semibold capitalize">{taskDetails.difficulty || 'Medium'}</p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Duration</span>
                </div>
                <p className="text-lg font-semibold">{calculateDaysTaken()} days</p>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Deadline Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {isOverdue() ? (
                    <>
                      <AlertCircle className="w-5 h-5 text-red-500" />
                      <span className="text-lg font-semibold text-red-600">Overdue</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                      <span className="text-lg font-semibold text-green-600">On Track</span>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-lg border">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  <span className="text-xs font-medium uppercase">Updates</span>
                </div>
                <p className="text-lg font-semibold">{taskDetails.progressUpdates?.length || 0} Reports</p>
              </div>
            </div>

            {/* Timeline Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Timeline
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div className="space-y-1">
                  <span className="text-muted-foreground">Assigned Date</span>
                  <p className="font-medium">{new Date(taskDetails.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Started Date</span>
                  <p className="font-medium">{taskDetails.startedAt ? new Date(taskDetails.startedAt).toLocaleDateString() : '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Due Date</span>
                  <p className="font-medium">{taskDetails.deadline ? new Date(taskDetails.deadline).toLocaleDateString() : '-'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-muted-foreground">Completed Date</span>
                  <p className="font-medium">{taskDetails.completedAt ? new Date(taskDetails.completedAt).toLocaleDateString() : '-'}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Progress Updates Section */}
            <div>
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Progress History
              </h3>
              
              <div className="space-y-4">
                {!taskDetails.progressUpdates || taskDetails.progressUpdates.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-dashed">
                    <p className="text-muted-foreground">No progress reports submitted yet.</p>
                  </div>
                ) : (
                  taskDetails.progressUpdates.map((update, idx) => (
                    <div key={idx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => setExpandedUpdate(expandedUpdate === idx ? null : idx)}
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-sm">Report #{taskDetails.progressUpdates!.length - idx}</span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(update.timestamp || update.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          <Badge variant={update.percentage === 100 ? "default" : "secondary"}>
                            {update.percentage}% Complete
                          </Badge>
                        </div>
                        <ChevronDown
                          className={`w-5 h-5 text-muted-foreground transition-transform duration-200 ${
                            expandedUpdate === idx ? 'rotate-180' : ''
                          }`}
                        />
                      </div>

                      {expandedUpdate === idx && (
                        <div className="p-4 pt-0 space-y-4 bg-slate-50/50 border-t">
                          <div className="grid gap-4 mt-4">
                            {update.comment && (
                              <div className="space-y-1">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <FileText className="w-3 h-3" /> Work Done
                                </h4>
                                <p className="text-sm text-gray-600 bg-white p-3 rounded border">
                                  {update.comment}
                                </p>
                              </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {update.strategy && (
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold text-blue-700 flex items-center gap-2">
                                    <Target className="w-3 h-3" /> Strategy
                                  </h4>
                                  <p className="text-sm text-gray-600 bg-blue-50 p-3 rounded border border-blue-100">
                                    {update.strategy}
                                  </p>
                                </div>
                              )}
                              {update.blockers && (
                                <div className="space-y-1">
                                  <h4 className="text-sm font-semibold text-red-700 flex items-center gap-2">
                                    <ShieldAlert className="w-3 h-3" /> Blockers
                                  </h4>
                                  <p className="text-sm text-gray-600 bg-red-50 p-3 rounded border border-red-100">
                                    {update.blockers}
                                  </p>
                                </div>
                              )}
                            </div>

                            {update.attachments && update.attachments.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-semibold flex items-center gap-2">
                                  <Download className="w-3 h-3" /> Attachments
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                  {update.attachments.map((file, fidx) => (
                                    <a
                                      key={fidx}
                                      href={`http://localhost:5000/${file.path.replace(/\\/g, '/')}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center gap-2 px-3 py-2 bg-white border rounded-md hover:bg-gray-50 text-sm text-blue-600 transition-colors"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Download className="w-3 h-3" />
                                      <span className="truncate max-w-[200px]">{file.originalName}</span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="p-4 border-t bg-gray-50 flex justify-end">
          <Button onClick={onClose}>Close Details</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
