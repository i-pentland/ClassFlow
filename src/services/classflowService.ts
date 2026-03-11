import {
  getConfiguredLmsProviderName,
  getLastLmsProviderIssue,
  lmsProvider,
} from "@/services/lms/lms.provider";
import { getLastGoogleSubmissionFetchDebugState } from "@/services/lms/lms.google-classroom";
import { analysisProvider } from "@/services/analysis/analysis.provider";
import type { Assignment, SubmissionReference } from "@/services/lms/lms.types";
import { runAssignmentAnalysis } from "@/services/analysis/analysis-orchestrator.service";
import type { DerivedPattern } from "@/services/analysis/analysis.types";
import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";
import {
  discardPreparedSubmissionInputs,
  prepareAssignmentSubmissionInputs,
} from "@/services/submissions/submission-ingestion.service";
import type { SubmissionPreparationSummary } from "@/services/submissions/submission-extraction.types";
import type { ClassRoom, LearningObjective, Student } from "@/types/domain";
import type { ErrorPattern } from "@/services/insights/insights.types";
import type {
  AssignmentPageData,
  AssignmentListItem,
  ClassPageData,
  DashboardClassCard,
  ResolvedAnalysisPattern,
  StudentWorkReviewDebugState,
  StudentWorkReviewPageData,
} from "@/types/view-models";

async function withSubmissionCount(assignment: Assignment): Promise<AssignmentListItem> {
  let submissionsCount = 0;
  let targetedObjectives: LearningObjective[] = [];

  try {
    submissionsCount = (await lmsProvider.getSubmissionReferencesByAssignment(assignment.id)).length;
  } catch (error) {
    // Add-on assignment context should still render even when submission-specific LMS
    // metadata is not implemented yet. Keep the route usable and surface submission
    // context separately in the embedded UI instead of discarding the assignment.
    if (import.meta.env.DEV) {
      console.warn("Student submission metadata is unavailable for this assignment context.", error);
    }
  }

  try {
    targetedObjectives = await lmsProvider.getLearningObjectivesByIds(assignment.targetedObjectiveIds);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("Learning objective metadata is unavailable for this assignment context.", error);
    }
  }

  return {
    ...assignment,
    submissionCount: submissionsCount,
    targetedObjectives,
  };
}

async function buildAssignmentPageData(classRoom: ClassRoom, assignment: Assignment): Promise<AssignmentPageData | null> {
  if (assignment.classId !== classRoom.id) {
    return null;
  }

  const assignmentItem = await withSubmissionCount(assignment);

  return {
    classRoom,
    assignment: assignmentItem,
    targetedObjectives: assignmentItem.targetedObjectives,
  };
}

function getProviderIssueMessage(fallback: string) {
  return getLastLmsProviderIssue() ?? fallback;
}

function mapDerivedPatternToInsight(pattern: DerivedPattern, assignment: Assignment): ErrorPattern {
  return {
    id: `${assignment.id}-${pattern.objectiveId}-${pattern.title}`,
    assignmentId: assignment.id,
    sourceAssignmentRef: assignment.sourceAssignmentRef,
    sourceCourseRef: assignment.sourceCourseRef,
    title: pattern.title,
    description: pattern.description,
    objectiveId: pattern.objectiveId,
    affectedStudentRefs: pattern.affectedStudentRefs,
    studentsAffected: pattern.affectedStudentRefs.length,
    confidence: pattern.confidence,
    dismissed: false,
  };
}

async function resolvePatterns(patterns: ErrorPattern[]): Promise<ResolvedAnalysisPattern[]> {
  return Promise.all(
    patterns.map(async (pattern) => {
      const [objective] = await lmsProvider.getLearningObjectivesByIds([pattern.objectiveId]);
      const affectedStudents = await lmsProvider.getStudentsByIds(pattern.affectedStudentRefs);

      return {
        ...pattern,
        relatedObjective: objective ?? null,
        affectedStudents,
      };
    }),
  );
}

async function buildStructuredObservationPreview(params: {
  classRoom: ClassRoom;
  assignment: AssignmentListItem;
  targetedObjectives: LearningObjective[];
  submissionReferences: SubmissionReference[];
  launchContext: IframeLaunchContext;
}): Promise<{ patterns: ResolvedAnalysisPattern[]; issue: string | null }> {
  const { classRoom, assignment, targetedObjectives, submissionReferences, launchContext } = params;
  const { inputs, summary } = await prepareAssignmentSubmissionInputs({
    courseId: classRoom.sourceCourseRef,
    assignmentId: assignment.sourceAssignmentRef,
    submissionReferences,
  });

  if (summary.analyzableCount < 2) {
    discardPreparedSubmissionInputs(inputs);
    return {
      patterns: [],
      issue:
        summary.analyzableCount === 0
          ? "No analyzable submissions are available for recurring observation yet."
          : "Only one analyzable submission is available, so recurring multi-student observations are not shown yet.",
    };
  }

  try {
    const result = await analysisProvider.generateStructuredObservations({
      class: classRoom,
      assignment,
      objectives: targetedObjectives,
      submissions: inputs,
      launchContext,
    });

    const studentNameByRef = new Map(
      submissionReferences.map((submission) => [
        submission.studentId,
        { id: submission.studentId, name: submission.studentName, lmsStudentRef: submission.studentId },
      ]),
    );

    const resolvedPatterns = result.patterns
      .filter((pattern) => pattern.affectedStudentRefs.length >= 2)
      .map((pattern) => ({
        id: `${assignment.id}-preview-${pattern.objectiveId}-${pattern.title}`,
        assignmentId: assignment.id,
        sourceAssignmentRef: assignment.sourceAssignmentRef,
        sourceCourseRef: assignment.sourceCourseRef,
        title: pattern.title,
        description: pattern.description,
        objectiveId: pattern.objectiveId,
        relatedObjective:
          targetedObjectives.find((objective) => objective.id === pattern.objectiveId) ??
          targetedObjectives[0] ??
          null,
        affectedStudentRefs: pattern.affectedStudentRefs,
        affectedStudents: pattern.affectedStudentRefs
          .map((studentRef) => studentNameByRef.get(studentRef))
          .filter((student): student is Student => Boolean(student)),
        studentsAffected: pattern.affectedStudentRefs.length,
        confidence: pattern.confidence,
        dismissed: false,
      }));

    return {
      patterns: resolvedPatterns,
      issue:
        resolvedPatterns.length === 0
          ? "No recurring observations are available from the current analyzable submission set yet."
          : null,
    };
  } finally {
    discardPreparedSubmissionInputs(inputs);
  }
}

export const classflowService = {
  async resolveLaunchTarget(launchContext: IframeLaunchContext): Promise<string | null> {
    const classes = await lmsProvider.getClasses();

    if (launchContext.lmsAssignmentId) {
      for (const classRoom of classes) {
        const assignments = await lmsProvider.getAssignmentsByClass(classRoom.id);
        const matchedAssignment = assignments.find(
          (assignment) =>
            assignment.sourceAssignmentRef === launchContext.lmsAssignmentId ||
            assignment.id === launchContext.lmsAssignmentId,
        );

        if (matchedAssignment) {
          return `/class/${classRoom.id}/assignment/${matchedAssignment.id}`;
        }
      }
    }

    if (launchContext.lmsCourseId) {
      const matchedClass = classes.find(
        (classRoom) =>
          classRoom.sourceCourseRef === launchContext.lmsCourseId || classRoom.id === launchContext.lmsCourseId,
      );

      if (matchedClass) {
        return `/class/${matchedClass.id}`;
      }
    }

    return null;
  },

  async resolveAnalysisPatterns(patterns: ErrorPattern[]): Promise<ResolvedAnalysisPattern[]> {
    return resolvePatterns(patterns);
  },

  async getDashboardClasses(): Promise<DashboardClassCard[]> {
    const classes = await lmsProvider.getClasses();

    return Promise.all(
      classes.map(async (classRoom) => {
        try {
          const assignments = await lmsProvider.getAssignmentsByClass(classRoom.id);
          const debugAssignments = await Promise.all(
            assignments.map(async (assignment) => {
              let submissions: SubmissionReference[] = [];

              try {
                submissions = await lmsProvider.listStudentSubmissionsForAssignment(
                  assignment.sourceCourseRef,
                  assignment.sourceAssignmentRef,
                );
              } catch {
                submissions = [];
              }

              return {
                id: assignment.id,
                title: assignment.title,
                sourceAssignmentRef: assignment.sourceAssignmentRef,
                debugSubmissions: submissions.map((submission) => ({
                  id: submission.id,
                  sourceSubmissionRef: submission.sourceSubmissionRef,
                  studentName: submission.studentName,
                })),
              };
            }),
          );

          return {
            classRoom,
            assignmentCount: assignments.length,
            debugAssignments,
          };
        } catch {
          return {
            classRoom,
            assignmentCount: 0,
            debugAssignments: [],
          };
        }
      }),
    );
  },

  async getClassPageData(classId: string): Promise<ClassPageData | null> {
    const classRoom = await lmsProvider.getClassById(classId);

    if (!classRoom) {
      return null;
    }

    let assignments: Assignment[] = [];
    let assignmentLoadIssue: string | null = null;

    try {
      assignments = await lmsProvider.getAssignmentsByClass(classRoom.id);
    } catch {
      assignmentLoadIssue = getProviderIssueMessage(
        "We could not load assignments from Google Classroom for this class.",
      );
    }

    const allObjectives = await lmsProvider.getLearningObjectivesByClass(classRoom.id);

    const assignmentItems = await Promise.all(assignments.map(withSubmissionCount));
    const activeObjectiveIdSet = new Set(classRoom.learningObjectiveIds);
    const activeObjectives = allObjectives.filter((objective) => activeObjectiveIdSet.has(objective.id));
    const availableObjectives = allObjectives.filter((objective) => !activeObjectiveIdSet.has(objective.id));

    return {
      classRoom,
      assignments: assignmentItems,
      assignmentLoadIssue,
      activeObjectives,
      availableObjectives,
    };
  },

  async getAssignmentPageData(classId: string, assignmentId: string): Promise<AssignmentPageData | null> {
    const [classRoom, assignment] = await Promise.all([
      lmsProvider.getClassById(classId),
      lmsProvider.getAssignmentById(assignmentId),
    ]);

    if (!classRoom || !assignment) {
      return null;
    }

    return buildAssignmentPageData(classRoom, assignment);
  },

  async getClassPageDataForLaunchContext(launchContext: IframeLaunchContext): Promise<ClassPageData | null> {
    const resolvedContext = await lmsProvider.resolveAddonContext({
      iframeType: launchContext.iframeType,
      lmsCourseId: launchContext.lmsCourseId,
      lmsAssignmentId: launchContext.lmsAssignmentId,
      lmsSubmissionId: launchContext.lmsSubmissionId,
      lmsAttachmentId: launchContext.lmsAttachmentId,
    });

    if (!resolvedContext.lmsCourseId) {
      return null;
    }

    const classes = await lmsProvider.getClasses();
    const matchedClass = classes.find(
      (classRoom) =>
        classRoom.sourceCourseRef === resolvedContext.lmsCourseId || classRoom.id === resolvedContext.lmsCourseId,
    );

    return matchedClass ? this.getClassPageData(matchedClass.id) : null;
  },

  async getAssignmentPageDataForLaunchContext(launchContext: IframeLaunchContext): Promise<AssignmentPageData | null> {
    const resolvedContext = await lmsProvider.resolveAddonContext({
      iframeType: launchContext.iframeType,
      lmsCourseId: launchContext.lmsCourseId,
      lmsAssignmentId: launchContext.lmsAssignmentId,
      lmsSubmissionId: launchContext.lmsSubmissionId,
      lmsAttachmentId: launchContext.lmsAttachmentId,
    });

    if (resolvedContext.lmsCourseId && resolvedContext.lmsAssignmentId) {
      const [classRoom, assignment] = await Promise.all([
        lmsProvider.getClassById(resolvedContext.lmsCourseId),
        lmsProvider.getAssignment(resolvedContext.lmsCourseId, resolvedContext.lmsAssignmentId),
      ]);

      if (classRoom && assignment) {
        return buildAssignmentPageData(classRoom, assignment);
      }
    }

    const classes = await lmsProvider.getClasses();

    for (const classRoom of classes) {
      if (
        resolvedContext.lmsCourseId &&
        classRoom.sourceCourseRef !== resolvedContext.lmsCourseId &&
        classRoom.id !== resolvedContext.lmsCourseId
      ) {
        continue;
      }

      const assignments = await lmsProvider.getAssignmentsByClass(classRoom.id);
      const matchedAssignment = assignments.find(
        (assignment) =>
          assignment.sourceAssignmentRef === resolvedContext.lmsAssignmentId ||
          assignment.id === resolvedContext.lmsAssignmentId,
      );

      if (matchedAssignment) {
        return buildAssignmentPageData(classRoom, matchedAssignment);
      }
    }

    return null;
  },

  async getStudentWorkReviewPageDataForLaunchContext(
    launchContext: IframeLaunchContext,
  ): Promise<StudentWorkReviewPageData> {
    const providerName = getConfiguredLmsProviderName();
    const debugState: StudentWorkReviewDebugState = {
      providerName,
      courseId: launchContext.lmsCourseId ?? null,
      assignmentId: launchContext.lmsAssignmentId ?? null,
      currentSubmissionId: launchContext.lmsSubmissionId ?? null,
      requestMade: false,
      assignmentResolved: false,
      submissionFetchStatus: "not_attempted",
      rawSubmissionCount: null,
      mappedSubmissionCount: 0,
      apiError: null,
      rawSubmissionStateCounts: {},
      notes: [],
    };
    const assignmentData = await this.getAssignmentPageDataForLaunchContext(launchContext);

    if (!assignmentData) {
      debugState.apiError = "Assignment lookup failed before submission metadata could be requested.";
      debugState.notes.push("The embedded route could not resolve the assignment context.");
      if (import.meta.env.DEV) {
        console.info("[classflow][student-work-review] Assignment context resolution failed.", debugState);
      }
      return {
        assignmentData: null,
        assignmentContextIssue: launchContext.lmsAssignmentId
          ? "We could not resolve that Google Classroom assignment for student work review."
          : null,
        submissionReferences: [],
        submissionLoadIssue: null,
        submissionPreparationSummary: null,
        observationPatterns: [],
        observationIssue: null,
        selectedSubmission: null,
        debugState,
      };
    }

    debugState.assignmentResolved = true;

    let submissionReferences: SubmissionReference[] = [];
    let submissionLoadIssue: string | null = null;
    let submissionPreparationSummary: SubmissionPreparationSummary | null = null;

    try {
      submissionReferences = await lmsProvider.listStudentSubmissionsForAssignment(
        assignmentData.classRoom.sourceCourseRef,
        assignmentData.assignment.sourceAssignmentRef,
      );
    } catch {
      submissionLoadIssue =
        getLastLmsProviderIssue() ??
        "We could not load Google Classroom submission metadata for this assignment.";
    }

    const providerDebugState =
      providerName === "google_classroom"
        ? getLastGoogleSubmissionFetchDebugState()
        : null;

    if (providerDebugState) {
      debugState.requestMade = providerDebugState.requestMade;
      debugState.submissionFetchStatus = providerDebugState.submissionFetchStatus;
      debugState.rawSubmissionCount = providerDebugState.rawSubmissionCount;
      debugState.mappedSubmissionCount = providerDebugState.mappedSubmissionCount;
      debugState.apiError = providerDebugState.apiError;
      debugState.rawSubmissionStateCounts = providerDebugState.rawSubmissionStateCounts;
      debugState.notes = providerDebugState.notes;
    } else {
      debugState.requestMade = true;
      debugState.mappedSubmissionCount = submissionReferences.length;
      debugState.submissionFetchStatus = submissionLoadIssue
        ? "failed"
        : submissionReferences.length === 0
          ? "empty"
          : "success";
      debugState.apiError = submissionLoadIssue;
    }

    if (!submissionLoadIssue && debugState.submissionFetchStatus === "failed") {
      submissionLoadIssue =
        debugState.apiError ??
        "Google Classroom submission metadata could not be loaded for this assignment.";
    }

    if (submissionReferences.length > 0) {
      try {
        const { inputs, summary } = await prepareAssignmentSubmissionInputs({
          courseId: assignmentData.classRoom.sourceCourseRef,
          assignmentId: assignmentData.assignment.sourceAssignmentRef,
          submissionReferences,
        });
        submissionPreparationSummary = summary;

        for (const input of inputs) {
          input.textContent = "";
        }
        inputs.length = 0;
      } catch (error) {
        submissionLoadIssue =
          submissionLoadIssue ??
          (error instanceof Error
            ? error.message
            : "Transient submission extraction failed for this assignment.");
      }
    }

    let observationPatterns: ResolvedAnalysisPattern[] = [];
    let observationIssue: string | null = null;

    if (submissionPreparationSummary) {
      try {
        const preview = await buildStructuredObservationPreview({
          classRoom: assignmentData.classRoom,
          assignment: assignmentData.assignment,
          targetedObjectives: assignmentData.targetedObjectives,
          submissionReferences,
          launchContext,
        });
        observationPatterns = preview.patterns;
        observationIssue = preview.issue;
      } catch (error) {
        observationIssue =
          error instanceof Error
            ? error.message
            : "Structured observation generation failed for the current analyzable set.";
      }
    }

    const selectedSubmission =
      submissionReferences.find(
        (submission) =>
          submission.sourceSubmissionRef === launchContext.lmsSubmissionId ||
          submission.id === launchContext.lmsSubmissionId,
      ) ?? null;

    return {
      assignmentData,
      assignmentContextIssue: null,
      submissionReferences,
      submissionLoadIssue,
      submissionPreparationSummary,
      observationPatterns,
      observationIssue,
      selectedSubmission,
      debugState,
    };
  },

  async analyzeAssignment(
    classId: string,
    assignmentId: string,
    launchContext: IframeLaunchContext = { launchSource: "standalone" },
  ): Promise<ResolvedAnalysisPattern[]> {
    const [classRoom, assignment] = await Promise.all([
      lmsProvider.getClassById(classId),
      lmsProvider.getAssignmentById(assignmentId),
    ]);

    if (!classRoom || !assignment || assignment.classId !== classRoom.id) {
      return [];
    }

    const result = await runAssignmentAnalysis({
      classId,
      assignmentId,
      launchContext,
      persistInsights: true,
    });
    return resolvePatterns(result.patterns.map((pattern) => mapDerivedPatternToInsight(pattern, assignment)));
  },

  async getObjectives(): Promise<LearningObjective[]> {
    const classes = await lmsProvider.getClasses();
    const objectiveIds = [...new Set(classes.flatMap((classRoom) => classRoom.learningObjectiveIds))];

    return lmsProvider.getLearningObjectivesByIds(objectiveIds);
  },

  async getObjectivesByIds(ids: string[]): Promise<LearningObjective[]> {
    return lmsProvider.getLearningObjectivesByIds(ids);
  },

  async getStudentsByIds(ids: string[]): Promise<Student[]> {
    return lmsProvider.getStudentsByIds(ids);
  },

  async getClassById(classId: string): Promise<ClassRoom | null> {
    return lmsProvider.getClassById(classId);
  },
};
