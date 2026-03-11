import type { LmsProvider } from "@/services/lms/lms.provider";
import type {
  Assignment,
  Course,
  GoogleClassroomScaffoldConfig,
  LmsAddonContext,
  SubmissionAttachment,
  SubmissionReference,
} from "@/services/lms/lms.types";
import { getGoogleAccessToken } from "@/services/auth/auth.service";

type GoogleClassroomCourse = {
  id: string;
  name: string;
  section?: string;
};

type GoogleClassroomCoursesResponse = {
  courses?: GoogleClassroomCourse[];
  nextPageToken?: string;
};

// Official Google Classroom add-on style scaffold.
// This file is the future integration seam for Classroom launch context, coursework,
// submissions, and attachment references. It is intentionally not wired to live APIs yet.
function getScaffoldConfig(): GoogleClassroomScaffoldConfig {
  return {
    clientId: import.meta.env.VITE_GOOGLE_CLASSROOM_CLIENT_ID,
    apiBaseUrl: import.meta.env.VITE_GOOGLE_CLASSROOM_API_BASE_URL ?? "https://classroom.googleapis.com",
    scopes: (import.meta.env.VITE_GOOGLE_CLASSROOM_SCOPES ?? "")
      .split(",")
      .map((scope) => scope.trim())
      .filter(Boolean),
  };
}

function logPlaceholderBoundary(message: string) {
  console.info(`[google-classroom-scaffold] ${message}`);
}

function mapGoogleCourseToCourse(course: GoogleClassroomCourse): Course {
  return {
    id: course.id,
    title: course.name,
    section: course.section ?? "",
    periodLabel: course.section ?? "",
    studentIds: [],
    learningObjectiveIds: [],
    assignmentIds: [],
    sourceCourseRef: course.id,
  };
}

async function listCoursesPlaceholder(config: GoogleClassroomScaffoldConfig): Promise<Course[]> {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    throw new Error(
      "No Google provider token is available in the current session. Reauthenticate with Classroom scopes enabled.",
    );
  }

  const courses: Course[] = [];
  let nextPageToken: string | undefined;

  do {
    const requestUrl = new URL("/v1/courses", config.apiBaseUrl ?? "https://classroom.googleapis.com");
    requestUrl.searchParams.set("teacherId", "me");
    requestUrl.searchParams.set("pageSize", "50");
    requestUrl.searchParams.set("courseStates", "ACTIVE");

    if (nextPageToken) {
      requestUrl.searchParams.set("pageToken", nextPageToken);
    }

    const response = await fetch(requestUrl.toString(), {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Classroom courses request failed with ${response.status} ${response.statusText}.`);
    }

    const payload = (await response.json()) as GoogleClassroomCoursesResponse;
    courses.push(...(payload.courses ?? []).map(mapGoogleCourseToCourse));
    nextPageToken = payload.nextPageToken;
  } while (nextPageToken);

  if (courses.length === 0) {
    logPlaceholderBoundary("listCourses() reached Google Classroom successfully but no courses were returned.");
  }

  return courses;
}

async function listAssignmentsPlaceholder(
  _config: GoogleClassroomScaffoldConfig,
  _courseId: string,
): Promise<Assignment[]> {
  // TODO: Map Google Classroom coursework objects into ClassFlow assignments.
  logPlaceholderBoundary("listAssignments() is using the development scaffold.");
  return [];
}

async function listStudentSubmissionsPlaceholder(
  _config: GoogleClassroomScaffoldConfig,
  _assignmentId: string,
): Promise<SubmissionReference[]> {
  // TODO: Fetch submission metadata from Google Classroom. Keep raw work transient.
  logPlaceholderBoundary("listStudentSubmissions() is using the development scaffold.");
  return [];
}

async function getSubmissionAttachmentsPlaceholder(
  _config: GoogleClassroomScaffoldConfig,
  _submissionRef: string,
): Promise<SubmissionAttachment[]> {
  // TODO: Return attachment metadata only. Actual file/text extraction belongs in the
  // transient submission ingestion layer and must not persist raw student files.
  logPlaceholderBoundary("getSubmissionAttachments() is using the development scaffold.");
  return [];
}

export function createGoogleClassroomProvider(): LmsProvider {
  const config = getScaffoldConfig();

  return {
    async resolveAddonContext(context: LmsAddonContext) {
      // TODO: Map official Google Classroom add-on launch payloads into stable LMS refs.
      // Keep this seam explicit rather than inferring iframe state throughout the UI.
      logPlaceholderBoundary("resolveAddonContext() is using the development scaffold.");
      return context;
    },
    async listCourses() {
      return listCoursesPlaceholder(config);
    },
    async listAssignments(courseId: string) {
      // TODO: Replace with live Google Classroom coursework list once coursework mapping is implemented.
      return listAssignmentsPlaceholder(config, courseId);
    },
    async getAssignment(courseId: string, assignmentId: string) {
      const assignments = await listAssignmentsPlaceholder(config, courseId);

      return (
        assignments.find(
          (assignment) =>
            assignment.sourceAssignmentRef === assignmentId || assignment.id === assignmentId,
        ) ?? null
      );
    },
    async listStudentSubmissions(assignmentId: string) {
      // TODO: Replace with live student submission metadata list after coursework wiring is complete.
      return listStudentSubmissionsPlaceholder(config, assignmentId);
    },
    async getSubmissionAttachments(submissionRef: string) {
      return getSubmissionAttachmentsPlaceholder(config, submissionRef);
    },
    async getClasses() {
      return this.listCourses();
    },
    async getClassById(classId: string) {
      const courses = await this.listCourses();
      return courses.find((course) => course.id === classId || course.sourceCourseRef === classId) ?? null;
    },
    async getAssignmentsByClass(classId: string) {
      return this.listAssignments(classId);
    },
    async getAssignmentById(assignmentId: string) {
      const courses = await this.listCourses();

      for (const course of courses) {
        const assignment = await this.getAssignment(course.id, assignmentId);

        if (assignment) {
          return assignment;
        }
      }

      return null;
    },
    async getLearningObjectivesByClass() {
      // TODO: Replace this placeholder when ClassFlow objective config is associated
      // with Classroom course context in the backend.
      return [];
    },
    async getLearningObjectivesByIds() {
      return [];
    },
    async getStudentsByIds() {
      return [];
    },
    async getSubmissionReferencesByAssignment(assignmentId: string) {
      return this.listStudentSubmissions(assignmentId);
    },
  };
}
