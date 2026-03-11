import { useEffect, useState } from "react";
import { useLoaderData, useLocation } from "react-router-dom";

import { StudentWorkReviewPanel } from "@/components/embedded/student-work-review-panel";
import { EmbeddedAppShell } from "@/components/layouts/embedded-app-shell";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIframeLaunchContextFromLocation } from "@/features/iframe-context/iframe-context.service";
import { classflowService } from "@/services/classflowService";
import type { AssignmentPageData, ResolvedAnalysisPattern } from "@/types/view-models";

export function AddonStudentWorkReviewPage() {
  const assignmentData = useLoaderData() as AssignmentPageData | null;
  const location = useLocation();
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);
  const [patterns, setPatterns] = useState<ResolvedAnalysisPattern[]>([]);
  const [acknowledgedPatternIds, setAcknowledgedPatternIds] = useState<string[]>([]);

  useEffect(() => {
    setIsAnalyzing(false);
    setHasAnalyzed(false);
    setPatterns([]);
    setAcknowledgedPatternIds([]);
  }, [assignmentData?.assignment.id]);

  if (!assignmentData) {
    return (
      <EmbeddedAppShell>
        <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
          <Card className="border-white/80 bg-white/92">
            <CardHeader>
              <CardTitle>Student work review context not available</CardTitle>
              <CardDescription>
                This hosted add-on route expects an assignment context from Google Classroom. For
                local simulation, add `courseId` and `assignmentId` query params that match a known
                class and assignment reference.
              </CardDescription>
            </CardHeader>
          </Card>
        </section>
      </EmbeddedAppShell>
    );
  }

  const { classRoom, assignment, targetedObjectives } = assignmentData;

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    const results = await classflowService.analyzeAssignment(classRoom.id, assignment.id, launchContext);
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

  return (
    <EmbeddedAppShell>
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
    </EmbeddedAppShell>
  );
}
