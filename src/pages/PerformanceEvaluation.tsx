import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";
import { EvaluationTable } from "@/components/evaluation/EvaluationTable";
import { SatisfactionGuide } from "@/components/evaluation/SatisfactionGuide";

const PerformanceEvaluation = () => {
  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Performance Evaluation
            </h1>
            <p className="text-muted-foreground mt-2">3-Week Performance Report</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>

        {/* Evaluation Table */}
        <Card className="p-6 bg-card border-border">
          <EvaluationTable />
        </Card>

        {/* Satisfaction Guide */}
        <SatisfactionGuide />
      </div>
    </div>
  );
};

export default PerformanceEvaluation;
