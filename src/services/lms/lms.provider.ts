import { createGoogleClassroomProvider } from "@/services/lms/lms.google-classroom";
import { createMockLmsProvider } from "@/services/lms/lms.mock";
import type {
  Assignment,
  Class,
  Course,
  LearningObjective,
  LmsAddonContext,
  Student,
  SubmissionAttachment,
  SubmissionReference,
} from "@/services/lms/lms.types";

export interface LmsProvider {
  resolveAddonContext(context: LmsAddonContext): Promise<LmsAddonContext>;
  listCourses(): Promise<Course[]>;
  listAssignments(courseId: string): Promise<Assignment[]>;
  getAssignment(courseId: string, assignmentId: string): Promise<Assignment | null>;
  listStudentSubmissions(assignmentId: string): Promise<SubmissionReference[]>;
  getSubmissionAttachments(submissionRef: string): Promise<SubmissionAttachment[]>;
  getClasses(): Promise<Class[]>;
  getClassById(classId: string): Promise<Class | null>;
  getAssignmentsByClass(classId: string): Promise<Assignment[]>;
  getAssignmentById(assignmentId: string): Promise<Assignment | null>;
  getLearningObjectivesByClass(classId: string): Promise<LearningObjective[]>;
  getLearningObjectivesByIds(ids: string[]): Promise<LearningObjective[]>;
  getStudentsByIds(ids: string[]): Promise<Student[]>;
  getSubmissionReferencesByAssignment(assignmentId: string): Promise<SubmissionReference[]>;
}

let lastLmsProviderIssue: string | null = null;

function getConfiguredLmsProvider(): LmsProvider {
  const provider = import.meta.env.VITE_LMS_PROVIDER ?? import.meta.env.VITE_CLASSROOM_PROVIDER ?? "mock";

  if (provider === "google_classroom") {
    return createGoogleClassroomProvider();
  }

  return createMockLmsProvider();
}

const mockProvider = createMockLmsProvider();
const configuredProvider = getConfiguredLmsProvider();

async function withFallback<T>(operation: (provider: LmsProvider) => Promise<T>): Promise<T> {
  try {
    const result = await operation(configuredProvider);
    lastLmsProviderIssue = null;
    return result;
  } catch (error) {
    lastLmsProviderIssue =
      configuredProvider === mockProvider
        ? null
        : `Google Classroom provider failed. Falling back to mock LMS data. ${error instanceof Error ? error.message : ""}`.trim();
    console.warn("Falling back to mock LMS provider.", error);
    return operation(mockProvider);
  }
}

export const lmsProvider: LmsProvider = {
  resolveAddonContext: (context) => withFallback((provider) => provider.resolveAddonContext(context)),
  listCourses: () => withFallback((provider) => provider.listCourses()),
  listAssignments: (courseId) => withFallback((provider) => provider.listAssignments(courseId)),
  getAssignment: (courseId, assignmentId) =>
    withFallback((provider) => provider.getAssignment(courseId, assignmentId)),
  listStudentSubmissions: (assignmentId) =>
    withFallback((provider) => provider.listStudentSubmissions(assignmentId)),
  getSubmissionAttachments: (submissionRef) =>
    withFallback((provider) => provider.getSubmissionAttachments(submissionRef)),
  getClasses: () => withFallback((provider) => provider.getClasses()),
  getClassById: (classId) => withFallback((provider) => provider.getClassById(classId)),
  getAssignmentsByClass: (classId) => withFallback((provider) => provider.getAssignmentsByClass(classId)),
  getAssignmentById: (assignmentId) => withFallback((provider) => provider.getAssignmentById(assignmentId)),
  getLearningObjectivesByClass: (classId) =>
    withFallback((provider) => provider.getLearningObjectivesByClass(classId)),
  getLearningObjectivesByIds: (ids) => withFallback((provider) => provider.getLearningObjectivesByIds(ids)),
  getStudentsByIds: (ids) => withFallback((provider) => provider.getStudentsByIds(ids)),
  getSubmissionReferencesByAssignment: (assignmentId) =>
    withFallback((provider) => provider.getSubmissionReferencesByAssignment(assignmentId)),
};

export function getLastLmsProviderIssue() {
  return lastLmsProviderIssue;
}
