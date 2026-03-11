import {
  lmsProvider,
} from "@/services/lms/lms.provider";
import type { Assignment } from "@/services/lms/lms.types";
import { runAssignmentAnalysis } from "@/services/analysis/analysis-orchestrator.service";
import type { DerivedPattern } from "@/services/analysis/analysis.types";
import type { IframeLaunchContext } from "@/features/iframe-context/iframe-context.types";
import type { ClassRoom, LearningObjective, Student } from "@/types/domain";
import type { ErrorPattern } from "@/services/insights/insights.types";
import type { AssignmentPageData, AssignmentListItem, ClassPageData, DashboardClassCard, ResolvedAnalysisPattern } from "@/types/view-models";

async function withSubmissionCount(assignment: Assignment): Promise<AssignmentListItem> {
  const submissions = await lmsProvider.getSubmissionReferencesByAssignment(assignment.id);
  const targetedObjectives = await lmsProvider.getLearningObjectivesByIds(assignment.targetedObjectiveIds);

  return {
    ...assignment,
    submissionCount: submissions.length,
    targetedObjectives,
  };
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
        const assignments = await lmsProvider.getAssignmentsByClass(classRoom.id);

        return {
          classRoom,
          assignmentCount: assignments.length,
        };
      }),
    );
  },

  async getClassPageData(classId: string): Promise<ClassPageData | null> {
    const classRoom = await lmsProvider.getClassById(classId);

    if (!classRoom) {
      return null;
    }

    const [assignments, allObjectives] = await Promise.all([
      lmsProvider.getAssignmentsByClass(classRoom.id),
      lmsProvider.getLearningObjectivesByClass(classRoom.id),
    ]);

    const assignmentItems = await Promise.all(assignments.map(withSubmissionCount));
    const activeObjectiveIdSet = new Set(classRoom.learningObjectiveIds);
    const activeObjectives = allObjectives.filter((objective) => activeObjectiveIdSet.has(objective.id));
    const availableObjectives = allObjectives.filter((objective) => !activeObjectiveIdSet.has(objective.id));

    return {
      classRoom,
      assignments: assignmentItems,
      activeObjectives,
      availableObjectives,
    };
  },

  async getAssignmentPageData(classId: string, assignmentId: string): Promise<AssignmentPageData | null> {
    const [classRoom, assignment] = await Promise.all([
      lmsProvider.getClassById(classId),
      lmsProvider.getAssignmentById(assignmentId),
    ]);

    if (!classRoom || !assignment || assignment.classId !== classRoom.id) {
      return null;
    }

    const assignmentItem = await withSubmissionCount(assignment);

    return {
      classRoom,
      assignment: assignmentItem,
      targetedObjectives: assignmentItem.targetedObjectives,
    };
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
        return this.getAssignmentPageData(classRoom.id, matchedAssignment.id);
      }
    }

    return null;
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
