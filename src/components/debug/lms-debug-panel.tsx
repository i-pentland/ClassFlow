import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardClassCard } from "@/types/view-models";

type LmsDebugPanelProps = {
  classes: DashboardClassCard[];
};

export function LmsDebugPanel({ classes }: LmsDebugPanelProps) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);

  if (!import.meta.env.DEV) {
    return null;
  }

  const handleCopy = async (value: string) => {
    await navigator.clipboard.writeText(value);
    setCopiedValue(value);
    window.setTimeout(() => {
      setCopiedValue((current) => (current === value ? null : current));
    }, 1500);
  };

  return (
    <Card className="border-dashed border-sky-200 bg-sky-50/70">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="w-fit border-sky-200 bg-white text-sky-900">
            Dev only
          </Badge>
          <CardTitle className="text-base">Google Classroom ID debug panel</CardTitle>
        </div>
        <CardDescription>
          Raw LMS ids already fetched by the app. Use these to build hosted add-on test URLs.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {classes.map((classItem) => {
          const courseId = classItem.classRoom.sourceCourseRef || classItem.classRoom.id;

          return (
            <div key={classItem.classRoom.id} className="rounded-[1.25rem] border border-sky-100 bg-white/90 p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{classItem.classRoom.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">courseId: {courseId}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => void handleCopy(courseId)}>
                  {copiedValue === courseId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  Copy courseId
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                {classItem.debugAssignments && classItem.debugAssignments.length > 0 ? (
                  classItem.debugAssignments.map((assignment) => {
                    const assignmentId = assignment.sourceAssignmentRef || assignment.id;

                    return (
                      <div
                        key={`${classItem.classRoom.id}-${assignment.id}`}
                        className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-3"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium">{assignment.title}</p>
                            <p className="mt-1 text-xs text-muted-foreground">assignmentId: {assignmentId}</p>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => void handleCopy(assignmentId)}>
                            {copiedValue === assignmentId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                            Copy assignmentId
                          </Button>
                        </div>

                        <div className="mt-3 space-y-2">
                          {assignment.debugSubmissions && assignment.debugSubmissions.length > 0 ? (
                            assignment.debugSubmissions.map((submission) => {
                              const submissionId = submission.sourceSubmissionRef || submission.id;

                              return (
                                <div
                                  key={`${assignment.id}-${submission.id}`}
                                  className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white/80 px-3 py-2"
                                >
                                  <div>
                                    <p className="text-xs font-medium text-foreground">{submission.studentName}</p>
                                    <p className="mt-1 text-xs text-muted-foreground">submissionId: {submissionId}</p>
                                  </div>
                                  <Button variant="outline" size="sm" onClick={() => void handleCopy(submissionId)}>
                                    {copiedValue === submissionId ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    Copy submissionId
                                  </Button>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-xs text-muted-foreground">No submission ids are available for this assignment yet.</p>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground">No assignment ids are available for this course yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
