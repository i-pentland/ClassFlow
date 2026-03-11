import { useEffect, useState } from "react";
import { useLoaderData, useLocation } from "react-router-dom";

import { StudentWorkReviewPanel } from "@/components/embedded/student-work-review-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getIframeLaunchContextFromLocation } from "@/features/iframe-context/iframe-context.service";
import type { ResolvedAnalysisPattern, StudentWorkReviewPageData } from "@/types/view-models";

export function AddonStudentWorkReviewPage() {
  const {
    assignmentData,
    assignmentContextIssue,
    submissionReferences,
    submissionLoadIssue,
    submissionPreparationSummary,
    observationPatterns,
    observationIssue,
    selectedSubmission,
    debugState,
  } = useLoaderData() as StudentWorkReviewPageData;
  const location = useLocation();
  const launchContext = getIframeLaunchContextFromLocation(location.pathname, location.search);
  const hasStructuredObservationState = observationPatterns.length > 0 || Boolean(observationIssue);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(hasStructuredObservationState);
  const [patterns, setPatterns] = useState<ResolvedAnalysisPattern[]>(observationPatterns);
  const [acknowledgedPatternIds, setAcknowledgedPatternIds] = useState<string[]>([]);

  useEffect(() => {
    setIsAnalyzing(false);
    setHasAnalyzed(hasStructuredObservationState);
    setPatterns(observationPatterns);
    setAcknowledgedPatternIds([]);
  }, [assignmentData?.assignment.id, hasStructuredObservationState, observationPatterns]);

  if (!assignmentData) {
    return (
      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="border-white/80 bg-white/92">
          <CardHeader>
            <CardTitle>Student work review context not available</CardTitle>
            <CardDescription>
              {assignmentContextIssue ??
                "This hosted add-on route expects an assignment context from Google Classroom. For local simulation, add `courseId` and `assignmentId` query params that match a known class and assignment reference."}
            </CardDescription>
          </CardHeader>
        </Card>
        {import.meta.env.DEV && debugState ? (
          <Card className="mt-4 border-dashed border-amber-300/80 bg-amber-50/70">
            <CardHeader>
              <CardTitle className="text-base">Debug: assignment lookup failed</CardTitle>
              <CardDescription>
                Provider: {debugState.providerName} · courseId: {debugState.courseId ?? "none"} · assignmentId:{" "}
                {debugState.assignmentId ?? "none"}
              </CardDescription>
              {debugState.apiError ? <CardDescription>{debugState.apiError}</CardDescription> : null}
            </CardHeader>
          </Card>
        ) : null}
      </section>
    );
  }

  const { assignment, targetedObjectives } = assignmentData;
  const canAnalyze = false;
  const analysisNotice =
    observationIssue ??
    ((submissionPreparationSummary?.analyzableCount ?? 0) > 0
      ? "Structured observations on this embedded surface are generated automatically from the transient analyzable submission set."
      : submissionReferences.length === 0
        ? null
        : "Submission metadata is available, but no supported text content could be extracted transiently for analysis from this submission set yet.");

  const handleAnalyze = async () => {
    return Promise.resolve();
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
    <>
      <section className="mx-auto max-w-5xl px-4 pt-6 sm:px-6 lg:px-8">
        {launchContext.lmsSubmissionId ? (
          <Card className="border-amber-200/70 bg-amber-50/80">
            <CardHeader className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="w-fit border-amber-200 bg-white text-amber-900">
                  Submission context scaffold
                </Badge>
              </div>
              <CardTitle className="text-lg">Assignment context resolved, submission context still scaffolded</CardTitle>
              <CardDescription className="text-amber-900/80">
                ClassFlow resolved the assignment from Google Classroom and is rendering the
                assignment-level review surface. Submission-specific context for
                `{launchContext.lmsSubmissionId}` is not implemented yet, so this view does not
                narrow to a single student submission.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}
      </section>
      <StudentWorkReviewPanel
        assignmentTitle={assignment.title}
        assignmentSummary={assignment.summary}
        submissionCount={submissionReferences.length || assignment.submissionCount}
        submissionReferences={submissionReferences}
        selectedSubmission={selectedSubmission}
        submissionLoadIssue={submissionLoadIssue}
        submissionPreparationSummary={submissionPreparationSummary}
        targetedObjectives={targetedObjectives}
        patterns={patterns}
        hasAnalyzed={hasAnalyzed}
        isAnalyzing={isAnalyzing}
        canAnalyze={canAnalyze}
        analysisNotice={observationIssue ?? analysisNotice}
        debugState={debugState}
        onAnalyze={handleAnalyze}
        onDismissPattern={handleDismissPattern}
        acknowledgedPatternIds={acknowledgedPatternIds}
        onToggleAcknowledge={handleToggleAcknowledge}
      />
    </>
  );
}
