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
  listStudentSubmissionsForAssignment(courseId: string, assignmentId: string): Promise<SubmissionReference[]>;
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
const configuredProviderName = import.meta.env.VITE_LMS_PROVIDER ?? import.meta.env.VITE_CLASSROOM_PROVIDER ?? "mock";
const isGoogleClassroomConfigured = configuredProviderName === "google_classroom";
const unsafeEntityFallbackOperations = new Set([
  "getClassById",
  "getAssignmentsByClass",
  "getAssignment",
  "listStudentSubmissionsForAssignment",
  "getAssignmentById",
  "listStudentSubmissions",
  "getSubmissionAttachments",
  "getSubmissionReferencesByAssignment",
]);

function getConfiguredLmsProvider(): LmsProvider {
  if (configuredProviderName === "google_classroom") {
    return createGoogleClassroomProvider();
  }

  return createMockLmsProvider();
}

const mockProvider = createMockLmsProvider();
const configuredProvider = getConfiguredLmsProvider();

async function withFallback<T>(operationName: string, operation: (provider: LmsProvider) => Promise<T>): Promise<T> {
  try {
    const result = await operation(configuredProvider);
    lastLmsProviderIssue = null;
    return result;
  } catch (error) {
    // Per-method mock fallback is dangerous once the app is operating on real Google
    // Classroom entity ids. A failed live assignment fetch followed by a mock lookup
    // against a real course id produces misleading empty arrays that look like "no data".
    if (isGoogleClassroomConfigured && unsafeEntityFallbackOperations.has(operationName)) {
      lastLmsProviderIssue = `Google Classroom ${operationName} failed. ${error instanceof Error ? error.message : ""}`.trim();
      throw error;
    }

    lastLmsProviderIssue =
      configuredProvider === mockProvider
        ? null
        : `Google Classroom provider failed. Falling back to mock LMS data. ${error instanceof Error ? error.message : ""}`.trim();
    console.warn("Falling back to mock LMS provider.", error);
    return operation(mockProvider);
  }
}

export const lmsProvider: LmsProvider = {
  resolveAddonContext: (context) => withFallback("resolveAddonContext", (provider) => provider.resolveAddonContext(context)),
  listCourses: () => withFallback("listCourses", (provider) => provider.listCourses()),
  listAssignments: (courseId) => withFallback("listAssignments", (provider) => provider.listAssignments(courseId)),
  getAssignment: (courseId, assignmentId) =>
    withFallback("getAssignment", (provider) => provider.getAssignment(courseId, assignmentId)),
  listStudentSubmissionsForAssignment: (courseId, assignmentId) =>
    withFallback("listStudentSubmissionsForAssignment", (provider) =>
      provider.listStudentSubmissionsForAssignment(courseId, assignmentId),
    ),
  listStudentSubmissions: (assignmentId) =>
    withFallback("listStudentSubmissions", (provider) => provider.listStudentSubmissions(assignmentId)),
  getSubmissionAttachments: (submissionRef) =>
    withFallback("getSubmissionAttachments", (provider) => provider.getSubmissionAttachments(submissionRef)),
  getClasses: () => withFallback("getClasses", (provider) => provider.getClasses()),
  getClassById: (classId) => withFallback("getClassById", (provider) => provider.getClassById(classId)),
  getAssignmentsByClass: (classId) => withFallback("getAssignmentsByClass", (provider) => provider.getAssignmentsByClass(classId)),
  getAssignmentById: (assignmentId) => withFallback("getAssignmentById", (provider) => provider.getAssignmentById(assignmentId)),
  getLearningObjectivesByClass: (classId) =>
    withFallback("getLearningObjectivesByClass", (provider) => provider.getLearningObjectivesByClass(classId)),
  getLearningObjectivesByIds: (ids) => withFallback("getLearningObjectivesByIds", (provider) => provider.getLearningObjectivesByIds(ids)),
  getStudentsByIds: (ids) => withFallback("getStudentsByIds", (provider) => provider.getStudentsByIds(ids)),
  getSubmissionReferencesByAssignment: (assignmentId) =>
    withFallback("getSubmissionReferencesByAssignment", (provider) => provider.getSubmissionReferencesByAssignment(assignmentId)),
};

export function getLastLmsProviderIssue() {
  return lastLmsProviderIssue;
}
