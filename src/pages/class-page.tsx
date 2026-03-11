import { useEffect, useState } from "react";
import { Link, Navigate, useLoaderData, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

import { AssignmentList } from "@/components/assignment-list";
import { TeacherViewEmbedded } from "@/components/embedded/teacher-view-embedded";
import { ObjectiveManager } from "@/components/objective-manager";
import { AppShell } from "@/components/layouts/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIframeLaunchContextFromLocation, isTeacherViewContext } from "@/features/iframe-context/iframe-context.service";
import type { LearningObjective } from "@/types/domain";
import type { ClassPageData } from "@/types/view-models";

export function ClassPage() {
  const { classId } = useParams<{ classId: string }>();
  const location = useLocation();
  const loaderData = useLoaderData() as ClassPageData | null;
  const classRoom = loaderData?.classRoom;
  const assignments = loaderData?.assignments ?? [];
  const assignmentLoadIssue = loaderData?.assignmentLoadIssue ?? null;
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);
  const [activeObjectives, setActiveObjectives] = useState<LearningObjective[]>(() => loaderData?.activeObjectives ?? []);
  const [availableObjectives, setAvailableObjectives] = useState<LearningObjective[]>(
    () => loaderData?.availableObjectives ?? [],
  );

  useEffect(() => {
    setActiveObjectives(loaderData?.activeObjectives ?? []);
    setAvailableObjectives(loaderData?.availableObjectives ?? []);
  }, [loaderData]);

  if (!classId || !classRoom) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isTeacherViewContext(launchContext)) {
    return (
      <AppShell>
        <TeacherViewEmbedded classRoom={classRoom} assignments={assignments} />
      </AppShell>
    );
  }

  const objectiveCount = activeObjectives.length;
  const handleAddObjective = (objective: LearningObjective) => {
    setActiveObjectives((current) => [...current, objective]);
    setAvailableObjectives((current) => current.filter((item) => item.id !== objective.id));
  };

  const handleRemoveObjective = (objectiveId: string) => {
    const objective = activeObjectives.find((item) => item.id === objectiveId);

    if (!objective) {
      return;
    }

    setActiveObjectives((current) => current.filter((item) => item.id !== objectiveId));
    setAvailableObjectives((current) => [objective, ...current]);
  };

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        <Button asChild variant="ghost" className="mb-6 px-0 text-muted-foreground">
          <Link to="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Card className="border-white/80 bg-white/90">
              <CardHeader>
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="accent">{classRoom.periodLabel}</Badge>
                  <Badge variant="outline">{classRoom.section}</Badge>
                </div>
                <CardTitle className="text-3xl">{classRoom.title}</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">Students</p>
                  <p className="mt-2 text-2xl font-bold">{classRoom.studentIds.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">Assignments</p>
                  <p className="mt-2 text-2xl font-bold">{assignments.length}</p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">Objectives tracked</p>
                  <p className="mt-2 text-2xl font-bold">{objectiveCount}</p>
                </div>
              </CardContent>
            </Card>

            <AssignmentList assignments={assignments} errorMessage={assignmentLoadIssue} />
          </div>

          <ObjectiveManager
            activeObjectives={activeObjectives}
            availableObjectives={availableObjectives}
            onAddObjective={handleAddObjective}
            onRemoveObjective={handleRemoveObjective}
          />
        </div>
      </section>
    </AppShell>
  );
}
