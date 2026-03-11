import { CalendarDays, ChevronRight, FileText } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssignmentListItem } from "@/types/view-models";

type AssignmentListProps = {
  assignments: AssignmentListItem[];
};

export function AssignmentList({ assignments }: AssignmentListProps) {
  return (
    <Card className="border-white/80 bg-white/90">
      <CardHeader>
        <CardTitle>Assignments</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {assignments.length === 0 ? (
          <div className="rounded-[1.25rem] border border-dashed border-border bg-secondary/30 px-4 py-5 text-sm text-muted-foreground">
            No assignments are available for this class yet.
          </div>
        ) : null}
        {assignments.map((assignment) => {
          return (
            <Link
              key={assignment.id}
              to={`/class/${assignment.classId}/assignment/${assignment.id}`}
              className="flex flex-col gap-4 rounded-[1.25rem] border border-border bg-white p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">{assignment.title}</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">{assignment.summary}</p>
                </div>
                <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-primary" />
                  <span>{assignment.dueDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <span>{assignment.submissionCount} submissions</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {assignment.targetedObjectives.map((objective) => (
                  <Badge key={objective.id} variant="outline">
                    {objective.title}
                  </Badge>
                ))}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
