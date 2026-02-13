import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, Shield, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import api from "@/lib/api";

interface EvaluationDetails {
  taskCompletionRate: number;
  taskCompletionRawValue: number;
  onTimeRate: number;
  onTimeRawValue: number;
  communicationScore: number;
  communicationRawValue: number;
  totalTasks: number;
  completedTasks: number;
  onTimeTasks: number;
  tasksWithUpdates: number;
  weightedCompletionScore: number;
  weightedOnTimeScore: number;
  weightedCommunicationScore: number;
}

interface Evaluation {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
  };
  score: number;
  rating: string;
  type: string;
  month: number;
  year: number;
  details?: EvaluationDetails;
  isOverridden?: boolean;
  overrideJustification?: string;
  originalScore?: number;
  comments?: string;
  date: string;
}

interface AutomatedEvaluationDetailsProps {
  evaluation: Evaluation;
  open: boolean;
  onClose: () => void;
  onUpdate?: () => void;
  canOverride?: boolean;
}

export const AutomatedEvaluationDetails: React.FC<AutomatedEvaluationDetailsProps> = ({
  evaluation,
  open,
  onClose,
  onUpdate,
  canOverride = false
}) => {
  const { toast } = useToast();
  const [isOverriding, setIsOverriding] = useState(false);
  const [overrideScore, setOverrideScore] = useState(evaluation.score.toString());
  const [justification, setJustification] = useState('');
  const [loading, setLoading] = useState(false);

  const details = evaluation.details;

  const handleOverride = async () => {
    if (!justification.trim()) {
      toast({
        title: "Justification Required",
        description: "Please provide a reason for overriding this score.",
        variant: "destructive"
      });
      return;
    }

    const score = parseInt(overrideScore);
    if (isNaN(score) || score < 0 || score > 100) {
      toast({
        title: "Invalid Score",
        description: "Score must be between 0 and 100.",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      await api.put(`/evaluations/${evaluation._id}/override`, {
        score,
        justification
      });

      toast({
        title: "Score Overridden",
        description: "The evaluation score has been updated successfully.",
      });

      setIsOverriding(false);
      if (onUpdate) onUpdate();
      onClose();
    } catch (error: any) {
      toast({
        title: "Override Failed",
        description: error.response?.data?.message || "Failed to override evaluation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'Good': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Average': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Automated Performance Evaluation</span>
            {evaluation.isOverridden && (
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                <Shield className="w-3 h-3 mr-1" />
                Manually Adjusted
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            {evaluation.employeeId?.name} - {evaluation.month}/{evaluation.year}
          </DialogDescription>
        </DialogHeader>

        {/* Final Score Card */}
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Final Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-5xl font-bold text-primary">{evaluation.score}/100</div>
                <Badge className={`mt-2 ${getRatingColor(evaluation.rating)}`}>
                  {evaluation.rating}
                </Badge>
              </div>
              {evaluation.isOverridden && evaluation.originalScore !== undefined && (
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Original Score</p>
                  <p className="text-2xl font-semibold line-through text-muted-foreground">
                    {evaluation.originalScore}/100
                  </p>
                  <div className="mt-2 p-3 bg-orange-50 rounded-lg border border-orange-200">
                    <p className="text-xs font-semibold text-orange-900">Override Reason:</p>
                    <p className="text-sm text-orange-800">{evaluation.overrideJustification}</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Score Breakdown */}
        {details && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Calculation Breakdown</CardTitle>
                <CardDescription>Transparent view of how the score was calculated</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Task Completion Rate */}
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Task Completion Rate (40% weight)</h4>
                        <p className="text-sm text-blue-700">
                          {details.completedTasks} completed out of {details.totalTasks} assigned tasks
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-900">{details.taskCompletionRate}%</p>
                      <p className="text-sm text-blue-700">
                        Weighted: {details.weightedCompletionScore?.toFixed(1) || (details.taskCompletionRate * 0.4).toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                </div>

                {/* On-Time Delivery */}
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-semibold text-green-900">On-Time Delivery (40% weight)</h4>
                        <p className="text-sm text-green-700">
                          {details.onTimeTasks || 0} tasks delivered on time out of {details.completedTasks} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-green-900">{details.onTimeRate}%</p>
                      <p className="text-sm text-green-700">
                        Weighted: {details.weightedOnTimeScore?.toFixed(1) || (details.onTimeRate * 0.4).toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                </div>

                {/* Communication Score */}
                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-purple-600" />
                      <div>
                        <h4 className="font-semibold text-purple-900">Communication Score (20% weight)</h4>
                        <p className="text-sm text-purple-700">
                          {details.tasksWithUpdates} tasks with progress updates out of {details.totalTasks}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-900">{details.communicationScore}%</p>
                      <p className="text-sm text-purple-700">
                        Weighted: {details.weightedCommunicationScore?.toFixed(1) || (details.communicationScore * 0.2).toFixed(1)} pts
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formula Explanation */}
            <Card className="bg-gray-50">
              <CardHeader>
                <CardTitle className="text-sm">Calculation Formula</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="font-mono text-sm bg-white p-3 rounded border">
                  Final Score = (Task Completion × 0.40) + (On-Time Delivery × 0.40) + (Communication × 0.20)
                </div>
                <div className="mt-2 font-mono text-sm bg-white p-3 rounded border">
                  {evaluation.score} = ({details.taskCompletionRate} × 0.40) + ({details.onTimeRate} × 0.40) + ({details.communicationScore} × 0.20)
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* System Comments */}
        {evaluation.comments && (
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">System Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground italic">{evaluation.comments}</p>
            </CardContent>
          </Card>
        )}

        {/* Admin Override Section */}
        {canOverride && !isOverriding && !evaluation.isOverridden && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsOverriding(true)}>
              <Shield className="w-4 h-4 mr-2" />
              Override Score
            </Button>
          </div>
        )}

        {isOverriding && (
          <Card className="border-orange-300 bg-orange-50">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Override Evaluation Score
              </CardTitle>
              <CardDescription>
                Provide a new score and justification for this manual adjustment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="override-score">New Score (0-100)</Label>
                <Input
                  id="override-score"
                  type="number"
                  min="0"
                  max="100"
                  value={overrideScore}
                  onChange={(e) => setOverrideScore(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="justification">Justification (Required)</Label>
                <Textarea
                  id="justification"
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  placeholder="Explain why this score is being manually adjusted..."
                  className="mt-1"
                  rows={4}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsOverriding(false)} disabled={loading}>
                  Cancel
                </Button>
                <Button onClick={handleOverride} disabled={loading}>
                  {loading ? 'Saving...' : 'Confirm Override'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </DialogContent>
    </Dialog>
  );
};
