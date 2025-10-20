import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const satisfactionLevels = [
  { score: 1, label: "Very Dissatisfied", color: "bg-chart-5/10 text-chart-5" },
  { score: 2, label: "Needs Improvement", color: "bg-chart-5/10 text-chart-5" },
  { score: 3, label: "Moderate Satisfaction", color: "bg-chart-4/10 text-chart-4" },
  { score: 4, label: "Satisfied", color: "bg-chart-2/10 text-chart-2" },
  { score: 5, label: "Highly Satisfied", color: "bg-chart-3/10 text-chart-3" },
];

export const SatisfactionGuide = () => {
  return (
    <Card className="p-6 bg-card border-border">
      <h3 className="text-xl font-bold mb-4">Satisfaction Scale Guide</h3>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {satisfactionLevels.map((level) => (
          <div key={level.score} className="text-center">
            <Badge className={`${level.color} text-lg px-4 py-2 mb-2`}>
              {level.score}
            </Badge>
            <p className="text-sm text-muted-foreground">{level.label}</p>
          </div>
        ))}
      </div>
    </Card>
  );
};
