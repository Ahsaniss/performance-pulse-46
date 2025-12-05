import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

const mockData = [
  {
    no: 1,
    name: "John Smith",
    department: "Engineering",
    meetings: 5,
    training: 85,
    outcome: "Successfully delivered 3 major features",
    satisfaction: 4.5,
  },
  {
    no: 2,
    name: "Sarah Johnson",
    department: "Marketing",
    meetings: 4,
    training: 90,
    outcome: "Led successful campaign launch",
    satisfaction: 4.2,
  },
  {
    no: 3,
    name: "Michael Chen",
    department: "Sales",
    meetings: 6,
    training: 75,
    outcome: "Exceeded quarterly targets by 15%",
    satisfaction: 3.8,
  },
];

export const EvaluationTable = () => {
  const getSatisfactionColor = (score: number) => {
    if (score >= 4.5) return "bg-chart-3/10 text-chart-3";
    if (score >= 4.0) return "bg-chart-2/10 text-chart-2";
    if (score >= 3.5) return "bg-chart-4/10 text-chart-4";
    return "bg-chart-5/10 text-chart-5";
  };

  const calculateOverall = (satisfaction: number) => {
    return ((satisfaction / 5) * 100).toFixed(0);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-muted/50">
            <TableHead className="font-bold">No</TableHead>
            <TableHead className="font-bold">Name / Department</TableHead>
            <TableHead className="font-bold">Meetings Held</TableHead>
            <TableHead className="font-bold">Training Applied (%)</TableHead>
            <TableHead className="font-bold">Key Outcome</TableHead>
            <TableHead className="font-bold">Satisfaction (1-100)</TableHead>
            <TableHead className="font-bold">Overall %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockData.map((row) => (
            <TableRow key={row.no} className="border-border hover:bg-muted/30">
              <TableCell className="font-medium">{row.no}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{row.name}</p>
                  <p className="text-sm text-muted-foreground">{row.department}</p>
                </div>
              </TableCell>
              <TableCell>{row.meetings}</TableCell>
              <TableCell>
                <Badge variant="outline">{row.training}%</Badge>
              </TableCell>
              <TableCell className="max-w-xs">{row.outcome}</TableCell>
              <TableCell>
                <Badge className={getSatisfactionColor(row.satisfaction)}>
                  {row.satisfaction * 20}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className="bg-primary/10 text-primary">
                  {calculateOverall(row.satisfaction)}%
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
