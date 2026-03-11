import type { AnalysisResult } from "@/services/analysis/analysis.types";
import type { AnalysisRun, ErrorPattern } from "@/services/insights/insights.types";

type PersistedInsightsSnapshot = {
  analysisRun: AnalysisRun;
  patterns: ErrorPattern[];
};

const persistedAnalysisRuns: AnalysisRun[] = [];
const persistedErrorPatterns: ErrorPattern[] = [];

function buildPersistedPatterns(result: AnalysisResult): ErrorPattern[] {
  return result.patterns.map((pattern, index) => ({
    id: `${result.assignmentId}-pattern-${index + 1}`,
    assignmentId: result.assignmentId,
    sourceAssignmentRef: result.sourceAssignmentRef,
    sourceCourseRef: result.sourceCourseRef,
    title: pattern.title,
    description: pattern.description,
    objectiveId: pattern.objectiveId,
    affectedStudentRefs: pattern.affectedStudentRefs,
    studentsAffected: pattern.affectedStudentRefs.length,
    confidence: pattern.confidence,
    dismissed: false,
  }));
}

// Persist only derived instructional insights. Raw submission text must never cross this boundary.
export async function persistDerivedInsights(result: AnalysisResult): Promise<PersistedInsightsSnapshot> {
  const persistedPatterns = buildPersistedPatterns(result);
  const analysisRun: AnalysisRun = {
    id: `${result.assignmentId}-${Date.now()}`,
    assignmentId: result.assignmentId,
    sourceAssignmentRef: result.sourceAssignmentRef,
    sourceCourseRef: result.sourceCourseRef,
    status: "completed",
    provider: "mock-analysis",
    createdAt: new Date().toISOString(),
    objectiveIds: [...new Set(result.patterns.map((pattern) => pattern.objectiveId))],
    affectedStudentRefs: [...new Set(result.patterns.flatMap((pattern) => pattern.affectedStudentRefs))],
    patternCount: result.patterns.length,
  };

  // Demo persistence is intentionally in-memory only, but still models the real storage contract:
  // analysis metadata plus derived patterns, never raw submission text.
  persistedAnalysisRuns.push(analysisRun);
  persistedErrorPatterns.push(...persistedPatterns);

  return {
    analysisRun,
    patterns: persistedPatterns,
  };
}

export async function listPersistedAnalysisRuns(): Promise<AnalysisRun[]> {
  return [...persistedAnalysisRuns];
}

export async function listPersistedErrorPatterns(assignmentId?: string): Promise<ErrorPattern[]> {
  if (!assignmentId) {
    return [...persistedErrorPatterns];
  }

  return persistedErrorPatterns.filter((pattern) => pattern.assignmentId === assignmentId);
}
