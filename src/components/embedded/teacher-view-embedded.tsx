import { ArrowRight, PanelsTopLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { AssignmentListItem, DashboardClassCard } from "@/types/view-models";
import type { ClassRoom } from "@/types/domain";

type TeacherViewEmbeddedProps = {
  classCards?: DashboardClassCard[];
  classRoom?: ClassRoom;
  assignments?: AssignmentListItem[];
  reviewHref?: string;
};

export function TeacherViewEmbedded({
  classCards = [],
  classRoom,
  assignments = [],
  reviewHref,
}: TeacherViewEmbeddedProps) {
  const primaryClass = classRoom ?? classCards[0]?.classRoom ?? null;
  const primaryAssignment = assignments[0] ?? null;
  const totalAssignments =
    assignments.length > 0
      ? assignments.length
      : classCards.reduce((sum, item) => sum + item.assignmentCount, 0);

  return (
    <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
      <Card className="border-white/80 bg-white/92">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {import.meta.env.DEV ? (
              <Badge variant="outline" className="w-fit">
                Embedded mode
              </Badge>
            ) : null}
            <Badge variant="accent" className="w-fit">
              Teacher view
            </Badge>
          </div>
          <CardTitle className="text-2xl">
            {primaryClass ? `${primaryClass.title} insight preview` : "Classroom insight preview"}
          </CardTitle>
          <CardDescription>
            A compact teacher-facing panel for quick review inside Google Classroom. ClassFlow stays
            observational and points to patterns that may deserve a closer look.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[1.25rem] bg-secondary/60 p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <PanelsTopLeft className="h-4 w-4 text-primary" />
              <span>Current context</span>
            </div>
            <div className="mt-3 space-y-2 text-sm leading-6">
              <p>
                {primaryClass
                  ? `${primaryClass.title}${primaryClass.section ? ` · ${primaryClass.section}` : ""}`
                  : "No specific class context was supplied in this simulation."}
              </p>
              <p className="text-muted-foreground">
                {totalAssignments} assignment{totalAssignments === 1 ? "" : "s"} available for review.
              </p>
            </div>
          </div>

          <div className="space-y-3 rounded-[1.25rem] bg-slate-900 p-4 text-white">
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <Sparkles className="h-4 w-4" />
              Insight summary
            </div>
            <p className="text-sm leading-6 text-slate-200">
              Open the deeper student work review surface when you want recurring patterns,
              objective alignment, and affected student refs in one place.
            </p>
            <Button asChild variant="accent" className="w-full justify-center">
              <Link
                to={
                  reviewHref ??
                  (primaryClass && primaryAssignment
                    ? `/class/${primaryClass.id}/assignment/${primaryAssignment.id}?source=classroom_addon&iframeType=student_work_review&courseId=${encodeURIComponent(primaryClass.sourceCourseRef)}&assignmentId=${encodeURIComponent(primaryAssignment.sourceAssignmentRef)}`
                    : "/dashboard")
                }
              >
                Open student work review
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
