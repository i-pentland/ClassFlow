import { LoaderCircle, MessageSquareWarning, Sparkles } from "lucide-react";

import { PatternCard } from "@/components/pattern-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { SubmissionReference } from "@/services/lms/lms.types";
import type { LearningObjective } from "@/types/domain";
import type { ResolvedAnalysisPattern } from "@/types/view-models";

type StudentWorkReviewPanelProps = {
  assignmentTitle: string;
  assignmentSummary: string;
  submissionCount: number;
  submissionReferences: SubmissionReference[];
  selectedSubmission: SubmissionReference | null;
  submissionLoadIssue?: string | null;
  targetedObjectives: LearningObjective[];
  patterns: ResolvedAnalysisPattern[];
  hasAnalyzed: boolean;
  isAnalyzing: boolean;
  canAnalyze?: boolean;
  analysisNotice?: string | null;
  onAnalyze: () => Promise<void>;
  onDismissPattern: (patternId: string) => void;
  acknowledgedPatternIds: string[];
  onToggleAcknowledge: (patternId: string) => void;
};

export function StudentWorkReviewPanel({
  assignmentTitle,
  assignmentSummary,
  submissionCount,
  submissionReferences,
  selectedSubmission,
  submissionLoadIssue,
  targetedObjectives,
  patterns,
  hasAnalyzed,
  isAnalyzing,
  canAnalyze = true,
  analysisNotice = null,
  onAnalyze,
  onDismissPattern,
  acknowledgedPatternIds,
  onToggleAcknowledge,
}: StudentWorkReviewPanelProps) {
  return (
    <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <Card className="border-white/80 bg-white/92">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              {import.meta.env.DEV ? (
                <Badge variant="outline" className="w-fit">
                  Embedded mode
                </Badge>
              ) : null}
              <Badge variant="accent" className="w-fit">
                Student work review
              </Badge>
            </div>
            <CardTitle className="text-2xl">{assignmentTitle}</CardTitle>
            <CardDescription>{assignmentSummary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-[1.25rem] bg-secondary/60 p-4">
              <p className="text-sm text-muted-foreground">Submission set in view</p>
              <p className="mt-2 font-semibold">{submissionCount}</p>
            </div>

            {selectedSubmission ? (
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/70 p-4">
                <p className="text-sm font-semibold text-amber-900">Current submission context</p>
                <p className="mt-2 text-sm text-amber-900/80">
                  {selectedSubmission.studentName} · {selectedSubmission.contentPreview}
                </p>
              </div>
            ) : null}

            {submissionLoadIssue ? (
              <div className="rounded-[1.25rem] border border-amber-200 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900/80">
                {submissionLoadIssue}
              </div>
            ) : null}

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

            <div className="space-y-3 rounded-[1.25rem] bg-slate-900 p-4 text-white">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <Sparkles className="h-4 w-4" />
                Add-on insight preview
              </div>
              <p className="text-sm leading-6 text-slate-200">
                ClassFlow reviews recurring patterns across the current work set and keeps the
                summary observational for teacher review.
              </p>
              {analysisNotice ? <p className="text-sm leading-6 text-slate-300">{analysisNotice}</p> : null}
              <Button
                onClick={onAnalyze}
                disabled={isAnalyzing || !canAnalyze}
                variant="accent"
                className="w-full justify-center"
              >
                {isAnalyzing ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Reviewing work...
                  </>
                ) : (
                  "Review submissions"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {submissionReferences.length > 0 ? (
          <Card className="border-white/80 bg-white/92">
            <CardHeader>
              <CardTitle className="text-lg">Submission metadata in view</CardTitle>
              <CardDescription>
                Real Google Classroom submission metadata is available for this assignment. Raw work
                content is not stored here.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {submissionReferences.slice(0, 6).map((submission) => (
                <div
                  key={submission.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium">{submission.studentName}</p>
                    <p className="mt-1 text-muted-foreground">{submission.contentPreview}</p>
                  </div>
                  <Badge variant="outline">{submission.sourceSubmissionRef}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <div className="space-y-4">
          {!hasAnalyzed ? (
            <Card className="border-dashed border-white/80 bg-white/70">
              <CardHeader>
                <CardTitle className="text-lg">Pattern observations will appear here</CardTitle>
                <CardDescription>
                  This compact view is intended for the Google Classroom student work review iframe.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {hasAnalyzed && patterns.length === 0 ? (
            <Card className="border-white/80 bg-white/90">
              <CardHeader>
                <CardTitle className="text-lg">No recurring patterns found</CardTitle>
                <CardDescription>
                  When the signal is weak, ClassFlow stays quiet and lets the teacher decide what to
                  inspect next.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : null}

          {patterns.map((pattern) => {
            const acknowledged = acknowledgedPatternIds.includes(pattern.id);

            return (
              <div key={pattern.id} className="space-y-2">
                <PatternCard pattern={pattern} onDismiss={onDismissPattern} showConfidence />
                <div className="flex items-center justify-between rounded-[1.25rem] border border-border bg-white/80 px-4 py-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquareWarning className="h-4 w-4 text-primary" />
                    <span>Teacher-facing note only. No student action is sent from this view.</span>
                  </div>
                  <Button
                    variant={acknowledged ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => onToggleAcknowledge(pattern.id)}
                  >
                    {acknowledged ? "Acknowledged" : "Acknowledge"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
