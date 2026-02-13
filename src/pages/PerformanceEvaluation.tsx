import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download, Zap } from "lucide-react";
import { EvaluationTable } from "@/components/evaluation/EvaluationTable";
import { SatisfactionGuide } from "@/components/evaluation/SatisfactionGuide";
import { GenerateEvaluationModal } from "@/components/evaluation/GenerateEvaluationModal";
import { useAuth } from "@/contexts/AuthContext";

const PerformanceEvaluation = () => {
  const { user } = useAuth();
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleGenerateSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Performance Evaluation
            </h1>
            <p className="text-muted-foreground mt-2">Automated Performance Scoring System</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            {user?.role === 'admin' && (
              <Button onClick={() => setGenerateModalOpen(true)}>
                <Zap className="w-4 h-4 mr-2" />
                Generate Monthly
              </Button>
            )}
          </div>
        </div>

        {/* Info Card */}
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
          <h3 className="font-semibold text-lg text-blue-900 mb-2">
            Automated Performance Scoring System
          </h3>
          <p className="text-sm text-blue-800 mb-3">
            Monthly performance scores are automatically calculated using a transparent, weighted formula:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 text-sm">Task Completion (40%)</h4>
              <p className="text-xs text-blue-700 mt-1">
                Percentage of assigned tasks completed within the month
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-green-900 text-sm">On-Time Delivery (40%)</h4>
              <p className="text-xs text-green-700 mt-1">
                Tasks delivered on time without delay
              </p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-purple-900 text-sm">Communication (20%)</h4>
              <p className="text-xs text-purple-700 mt-1">
                Consistent use of progress reporting features
              </p>
            </div>
          </div>
        </Card>

        {/* Evaluation Table */}
        <Card className="p-6 bg-card border-border">
          <EvaluationTable key={refreshKey} />
        </Card>

        {/* Satisfaction Guide */}
        <SatisfactionGuide />
      </div>

      {/* Generate Modal */}
      <GenerateEvaluationModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        onSuccess={handleGenerateSuccess}
      />
    </div>
  );
};

export default PerformanceEvaluation;
