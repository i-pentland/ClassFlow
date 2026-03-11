import { useEffect, useState } from "react";
import { ArrowLeft, LoaderCircle, Sparkles } from "lucide-react";
import { Link, Navigate, useLoaderData, useLocation, useParams } from "react-router-dom";

import { AppShell } from "@/components/layouts/app-shell";
import { StudentWorkReviewPanel } from "@/components/embedded/student-work-review-panel";
import { PatternCard } from "@/components/pattern-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  getIframeLaunchContextFromLocation,
  isGoogleClassroomAddonLaunch,
  isStudentWorkReviewContext,
} from "@/features/iframe-context/iframe-context.service";
import { classflowService } from "@/services/classflowService";
import type { AssignmentPageData, ResolvedAnalysisPattern } from "@/types/view-models";

function formatIframeType(iframeType: string) {
  return iframeType.split("_").join(" ");
}

export function AssignmentPage() {
  const { classId, assignmentId } = useParams<{ classId: string; assignmentId: string }>();
  const location = useLocation();
  const loaderData = useLoaderData() as AssignmentPageData | null;
  const classRoom = loaderData?.classRoom;
  const assignment = loaderData?.assignment;
  const targetedObjectives = loaderData?.targetedObjectives ?? [];

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [patterns, setPatterns] = useState<ResolvedAnalysisPattern[]>([]);
  const [acknowledgedPatternIds, setAcknowledgedPatternIds] = useState<string[]>([]);
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);

  useEffect(() => {
    setIsAnalyzing(false);
    setHasAnalyzed(false);
    setPatterns([]);
    setAcknowledgedPatternIds([]);
  }, [assignmentId]);

  if (!classId || !assignmentId || !classRoom || !assignment || assignment.classId !== classRoom.id) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const results = await classflowService.analyzeAssignment(classId, assignment.id, launchContext);
    setPatterns(results);
    setHasAnalyzed(true);
    setIsAnalyzing(false);
  };

  const handleDismissPattern = (patternId: string) => {
    setPatterns((current) => current.filter((item) => item.id !== patternId));
    setAcknowledgedPatternIds((current) => current.filter((item) => item !== patternId));
  };

  const handleToggleAcknowledge = (patternId: string) => {
    setAcknowledgedPatternIds((current) =>
      current.includes(patternId) ? current.filter((item) => item !== patternId) : [...current, patternId],
    );
  };

  if (isStudentWorkReviewContext(launchContext)) {
    return (
      <AppShell>
        <StudentWorkReviewPanel
          assignmentTitle={assignment.title}
          assignmentSummary={assignment.summary}
          submissionCount={assignment.submissionCount}
          targetedObjectives={targetedObjectives}
          patterns={patterns}
          hasAnalyzed={hasAnalyzed}
          isAnalyzing={isAnalyzing}
          onAnalyze={handleAnalyze}
          onDismissPattern={handleDismissPattern}
          acknowledgedPatternIds={acknowledgedPatternIds}
          onToggleAcknowledge={handleToggleAcknowledge}
        />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8 lg:py-16">
        <Button asChild variant="ghost" className="mb-6 px-0 text-muted-foreground">
          <Link to={`/class/${classRoom.id}`}>
            <ArrowLeft className="h-4 w-4" />
            Back to class
          </Link>
        </Button>

        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="h-fit border-white/80 bg-white/92">
            <CardHeader>
              {isGoogleClassroomAddonLaunch(launchContext) ? (
                <Badge variant="outline" className="w-fit">
                  Add-on iframe preview{launchContext.iframeType ? ` · ${formatIframeType(launchContext.iframeType)}` : ""}
                </Badge>
              ) : null}
              <Badge variant="accent" className="w-fit">
                Assignment overview
              </Badge>
              <CardTitle className="text-3xl">{assignment.title}</CardTitle>
              <CardDescription>{assignment.summary}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">Due date</p>
                  <p className="mt-2 font-semibold">{assignment.dueDate}</p>
                </div>
                <div className="rounded-[1.25rem] bg-secondary/60 p-4">
                  <p className="text-sm text-muted-foreground">Submissions reviewed</p>
                  <p className="mt-2 font-semibold">{assignment.submissionCount}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground">Targeted objectives</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {targetedObjectives.map((objective) => (
                    <Badge key={objective.id} variant="outline">
                      {objective.title}
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4 rounded-[1.5rem] bg-slate-900 p-5 text-white">
                <div className="flex items-center gap-2 text-sm text-slate-300">
                  <Sparkles className="h-4 w-4" />
                  Mock analysis
                </div>
                <p className="text-sm leading-7 text-slate-200">
                  Run a simulated analysis to surface repeated observations across student submissions. Results stay in local state for this MVP.
                </p>
                <Button onClick={handleAnalyze} disabled={isAnalyzing} variant="accent" className="w-full justify-center">
                  {isAnalyzing ? (
                    <>
                      <LoaderCircle className="h-4 w-4 animate-spin" />
                      Analyzing submissions...
                    </>
                  ) : (
                    "Analyze"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {!hasAnalyzed ? (
              <Card className="border-dashed border-white/80 bg-white/70">
                <CardHeader>
                  <CardTitle>Pattern observations will appear here</CardTitle>
                  <CardDescription>
                    Use Analyze to simulate how ClassFlow could summarize recurring learning-objective-related struggle patterns.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {hasAnalyzed && patterns.length === 0 ? (
              <Card className="border-white/80 bg-white/90">
                <CardHeader>
                  <CardTitle>No recurring patterns found in this mock result</CardTitle>
                  <CardDescription>
                    This view is designed to stay observational. When no clear pattern appears, ClassFlow stays quiet.
                  </CardDescription>
                </CardHeader>
              </Card>
            ) : null}

            {patterns.map((pattern) => (
              <PatternCard
                key={pattern.id}
                pattern={pattern}
                onDismiss={handleDismissPattern}
              />
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
