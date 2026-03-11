import { createMockClassroomProvider } from "@/services/classroom/classroom.mock";
import { createSupabaseClassroomProvider } from "@/services/classroom/classroom.supabase";
import type {
  Assignment,
  Class,
  LearningObjective,
  Student,
  StudentSubmission,
} from "@/services/classroom/classroom.types";

export interface ClassroomProvider {
  getClasses(): Promise<Class[]>;
  getClassById(classId: string): Promise<Class | null>;
  getAssignmentsForClass(classId: string): Promise<Assignment[]>;
  getLearningObjectivesByClass(classId: string): Promise<LearningObjective[]>;
  getAssignmentById(assignmentId: string): Promise<Assignment | null>;
  getObjectives(): Promise<LearningObjective[]>;
  getObjectivesByIds(ids: string[]): Promise<LearningObjective[]>;
  getStudentsByIds(ids: string[]): Promise<Student[]>;
  getSubmissionsForAssignment(assignmentId: string): Promise<StudentSubmission[]>;
}

function getConfiguredClassroomProvider(): ClassroomProvider {
  const preferredProvider = import.meta.env.VITE_CLASSROOM_PROVIDER ?? "mock";

  if (preferredProvider === "supabase") {
    return createSupabaseClassroomProvider();
  }

  return createMockClassroomProvider();
}

const mockProvider = createMockClassroomProvider();
const configuredProvider = getConfiguredClassroomProvider();

async function withFallback<T>(operation: (provider: ClassroomProvider) => Promise<T>): Promise<T> {
  try {
    return await operation(configuredProvider);
  } catch (error) {
    console.warn("Falling back to mock classroom provider.", error);
    return operation(mockProvider);
  }
}

export const classroomProvider: ClassroomProvider = {
  getClasses: () => withFallback((provider) => provider.getClasses()),
  getClassById: (classId) => withFallback((provider) => provider.getClassById(classId)),
  getAssignmentsForClass: (classId) => withFallback((provider) => provider.getAssignmentsForClass(classId)),
  getLearningObjectivesByClass: (classId) =>
    withFallback((provider) => provider.getLearningObjectivesByClass(classId)),
  getAssignmentById: (assignmentId) => withFallback((provider) => provider.getAssignmentById(assignmentId)),
  getObjectives: () => withFallback((provider) => provider.getObjectives()),
  getObjectivesByIds: (ids) => withFallback((provider) => provider.getObjectivesByIds(ids)),
  getStudentsByIds: (ids) => withFallback((provider) => provider.getStudentsByIds(ids)),
  getSubmissionsForAssignment: (assignmentId) =>
    withFallback((provider) => provider.getSubmissionsForAssignment(assignmentId)),
};

export async function getClasses() {
  return classroomProvider.getClasses();
}

export async function getClassById(classId: string) {
  return classroomProvider.getClassById(classId);
}

export async function getAssignmentsForClass(classId: string) {
  return classroomProvider.getAssignmentsForClass(classId);
}

export async function getLearningObjectivesByClass(classId: string) {
  return classroomProvider.getLearningObjectivesByClass(classId);
}

export async function getAssignmentById(assignmentId: string) {
  return classroomProvider.getAssignmentById(assignmentId);
}

export async function getObjectives() {
  return classroomProvider.getObjectives();
}

export async function getObjectivesByIds(ids: string[]) {
  return classroomProvider.getObjectivesByIds(ids);
}

export async function getStudentsByIds(ids: string[]) {
  return classroomProvider.getStudentsByIds(ids);
}

export async function getSubmissionsForAssignment(assignmentId: string) {
  return classroomProvider.getSubmissionsForAssignment(assignmentId);
}
