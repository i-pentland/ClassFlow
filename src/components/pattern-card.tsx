import { Lightbulb, Users, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResolvedAnalysisPattern } from "@/types/view-models";

type PatternCardProps = {
  pattern: ResolvedAnalysisPattern;
  onDismiss: (patternId: string) => void;
  showConfidence?: boolean;
};

export function PatternCard({ pattern, onDismiss, showConfidence = false }: PatternCardProps) {
  return (
    <Card className="border-white/80 bg-white/95">
      <CardHeader className="gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <Badge className="w-fit gap-2">
            <Lightbulb className="h-3.5 w-3.5" />
            Observation
          </Badge>
          <CardTitle>{pattern.title}</CardTitle>
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">{pattern.description}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={() => onDismiss(pattern.id)} aria-label="Dismiss pattern">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="accent">{pattern.relatedObjective?.title ?? "Related objective"}</Badge>
          {showConfidence ? (
            <Badge variant="outline">Confidence {Math.round(pattern.confidence * 100)}%</Badge>
          ) : null}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Users className="h-4 w-4 text-primary" />
            <span>{pattern.studentsAffected} students showed this pattern</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">Affected students</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {pattern.affectedStudents.map((student) => (
              <Badge key={student.id} variant="outline">
                {student.name}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
