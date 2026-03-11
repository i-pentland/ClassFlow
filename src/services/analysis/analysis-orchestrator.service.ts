import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";
import { analysisProvider } from "@/services/analysis/analysis.provider";
import type { AnalysisResult } from "@/services/analysis/analysis.types";
import { persistDerivedInsights } from "@/services/insights/insights.repository";
import { lmsProvider } from "@/services/lms/lms.provider";
import {
  discardPreparedSubmissionInputs,
  ingestAssignmentSubmissions,
} from "@/services/submissions/submission-ingestion.service";

export async function runAssignmentAnalysis(params: {
  classId: string;
  assignmentId: string;
  launchContext: IframeLaunchContext;
  persistInsights?: boolean;
}): Promise<AnalysisResult> {
  const [classRoom, assignment] = await Promise.all([
    lmsProvider.getClassById(params.classId),
    lmsProvider.getAssignmentById(params.assignmentId),
  ]);

  if (!classRoom || !assignment || assignment.classId !== classRoom.id) {
    return {
      assignmentId: params.assignmentId,
      sourceAssignmentRef: params.assignmentId,
      sourceCourseRef: params.classId,
      patterns: [],
    };
  }

  // Step 1: fetch LMS-linked instructional context plus transient submission text inputs.
  // This is the add-on style boundary: ClassFlow is launched from LMS context, fetches
  // assignment work just-in-time, analyzes it, and avoids storing raw student content.
  const [objectives, ingestedSubmissions] = await Promise.all([
    lmsProvider.getLearningObjectivesByIds(assignment.targetedObjectiveIds),
    ingestAssignmentSubmissions({
      courseId: classRoom.sourceCourseRef,
      assignmentId: assignment.sourceAssignmentRef,
    }),
  ]);

  let result: AnalysisResult;

  try {
    // Step 2: run analysis over normalized in-memory submissions only.
    result = await analysisProvider.runAssignmentAnalysis({
      class: classRoom,
      assignment,
      objectives,
      submissions: ingestedSubmissions,
      launchContext: params.launchContext,
    });
  } finally {
    // Step 3: explicitly clear the transient array reference after analysis.
    // Derived insights may persist downstream, but raw text content must not.
    discardPreparedSubmissionInputs(ingestedSubmissions);
  }

  if (params.persistInsights ?? true) {
    // Step 4: persist derived metadata only. No raw submission text crosses this boundary.
    await persistDerivedInsights(result);
  }

  return result;
}
