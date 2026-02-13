import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Calendar } from "lucide-react";
import { useEvaluations } from "@/hooks/useEvaluations";
import { AutomatedEvaluationDetails } from "./AutomatedEvaluationDetails";
import { useAuth } from "@/contexts/AuthContext";

interface Evaluation {
  _id: string;
  employeeId: {
    _id: string;
    name: string;
    email: string;
    department?: string;
  };
  score: number;
  rating: string;
  type: string;
  month: number;
  year: number;
  details?: any;
  isOverridden?: boolean;
  overrideJustification?: string;
  originalScore?: number;
  comments?: string;
  date: string;
}

export const EvaluationTable = () => {
  const { user } = useAuth();
  const { evaluations, loading, error, fetchEvaluations } = useEvaluations();
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'Excellent': return "bg-green-100 text-green-800 border-green-300";
      case 'Good': return "bg-blue-100 text-blue-800 border-blue-300";
      case 'Average': return "bg-yellow-100 text-yellow-800 border-yellow-300";
      default: return "bg-red-100 text-red-800 border-red-300";
    }
  };

  const getTypeColor = (type: string) => {
    return type === 'Automated' 
      ? "bg-purple-100 text-purple-800 border-purple-300"
      : "bg-gray-100 text-gray-800 border-gray-300";
  };

  const handleViewDetails = (evaluation: Evaluation) => {
    setSelectedEvaluation(evaluation);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-muted-foreground">Loading evaluations...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-600">Error: {error}</div>
      </div>
    );
  }

  const displayEvaluations = evaluations.filter((e: Evaluation) => e.type === 'Automated');

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-border hover:bg-muted/50">
              <TableHead className="font-bold">Employee</TableHead>
              <TableHead className="font-bold">Period</TableHead>
              <TableHead className="font-bold">Type</TableHead>
              <TableHead className="font-bold">Score</TableHead>
              <TableHead className="font-bold">Rating</TableHead>
              <TableHead className="font-bold">Status</TableHead>
              <TableHead className="font-bold text-center">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayEvaluations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No automated evaluations found. Generate monthly evaluations to see data here.
                </TableCell>
              </TableRow>
            ) : (
              displayEvaluations.map((evaluation: Evaluation) => (
                <TableRow key={evaluation._id} className="border-border hover:bg-muted/30">
                  <TableCell>
                    <div>
                      <p className="font-medium">{evaluation.employeeId?.name || 'Unknown'}</p>
                      <p className="text-sm text-muted-foreground">
                        {evaluation.employeeId?.department || evaluation.employeeId?.email || ''}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="w-3 h-3" />
                      {evaluation.month}/{evaluation.year}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(evaluation.type)}>
                      {evaluation.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-lg">
                      {evaluation.score}
                      <span className="text-sm text-muted-foreground">/100</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getRatingColor(evaluation.rating)}>
                      {evaluation.rating}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {evaluation.isOverridden ? (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        Adjusted
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                        Original
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDetails(evaluation)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {selectedEvaluation && (
        <AutomatedEvaluationDetails
          evaluation={selectedEvaluation}
          open={detailsOpen}
          onClose={() => {
            setDetailsOpen(false);
            setSelectedEvaluation(null);
          }}
          onUpdate={fetchEvaluations}
          canOverride={user?.role === 'admin'}
        />
      )}
    </>
  );
};
