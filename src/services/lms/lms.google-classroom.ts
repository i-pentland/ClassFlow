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

type GoogleClassroomDueDate = {
  year?: number;
  month?: number;
  day?: number;
};

type GoogleClassroomCourseWork = {
  id: string;
  title: string;
  description?: string;
  updateTime?: string;
  dueDate?: GoogleClassroomDueDate;
};

type GoogleClassroomCourseWorkListResponse = {
  courseWork?: GoogleClassroomCourseWork[];
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

async function getAccessTokenOrThrow() {
  const accessToken = await getGoogleAccessToken();

  if (!accessToken) {
    throw new Error(
      "No Google provider token is available in the current session. Reauthenticate with Classroom scopes enabled.",
    );
  }

  return accessToken;
}

async function fetchGoogleClassroomJson<T>(config: GoogleClassroomScaffoldConfig, path: string, searchParams?: URLSearchParams) {
  const accessToken = await getAccessTokenOrThrow();
  const requestUrl = new URL(path, config.apiBaseUrl ?? "https://classroom.googleapis.com");

  if (searchParams) {
    requestUrl.search = searchParams.toString();
  }

  const response = await fetch(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`Classroom request failed with ${response.status} ${response.statusText}.`);
  }

  return (await response.json()) as T;
}

function formatDueDate(dueDate?: GoogleClassroomDueDate) {
  if (!dueDate?.year || !dueDate.month || !dueDate.day) {
    return "No due date";
  }

  const month = `${dueDate.month}`.padStart(2, "0");
  const day = `${dueDate.day}`.padStart(2, "0");

  return `${dueDate.year}-${month}-${day}`;
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

function mapGoogleCourseWorkToAssignment(courseId: string, courseWork: GoogleClassroomCourseWork): Assignment {
  return {
    id: courseWork.id,
    classId: courseId,
    title: courseWork.title,
    dueDate: formatDueDate(courseWork.dueDate),
    targetedObjectiveIds: [],
    summary: courseWork.description?.trim() || "Imported from Google Classroom.",
    sourceAssignmentRef: courseWork.id,
    sourceCourseRef: courseId,
  };
}

async function listCoursesPlaceholder(config: GoogleClassroomScaffoldConfig): Promise<Course[]> {
  const courses: Course[] = [];
  let nextPageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams();
    searchParams.set("teacherId", "me");
    searchParams.set("pageSize", "50");
    searchParams.set("courseStates", "ACTIVE");

    if (nextPageToken) {
      searchParams.set("pageToken", nextPageToken);
    }

    const payload = await fetchGoogleClassroomJson<GoogleClassroomCoursesResponse>(
      config,
      "/v1/courses",
      searchParams,
    );

    if (!payload) {
      break;
    }

    courses.push(...(payload.courses ?? []).map(mapGoogleCourseToCourse));
    nextPageToken = payload.nextPageToken;
  } while (nextPageToken);

  if (courses.length === 0) {
    logPlaceholderBoundary("listCourses() reached Google Classroom successfully but no courses were returned.");
  }

  return courses;
}

async function listAssignmentsPlaceholder(
  config: GoogleClassroomScaffoldConfig,
  courseId: string,
): Promise<Assignment[]> {
  const assignments: Assignment[] = [];
  let nextPageToken: string | undefined;

  do {
    const searchParams = new URLSearchParams();
    searchParams.set("pageSize", "50");

    if (nextPageToken) {
      searchParams.set("pageToken", nextPageToken);
    }

    const payload = await fetchGoogleClassroomJson<GoogleClassroomCourseWorkListResponse>(
      config,
      `/v1/courses/${encodeURIComponent(courseId)}/courseWork`,
      searchParams,
    );

    if (!payload) {
      return [];
    }

    assignments.push(...(payload.courseWork ?? []).map((courseWork) => mapGoogleCourseWorkToAssignment(courseId, courseWork)));
    nextPageToken = payload.nextPageToken;
  } while (nextPageToken);

  if (assignments.length === 0) {
    logPlaceholderBoundary(`listAssignments() found no Classroom coursework for course ${courseId}.`);
  }

  return assignments;
}

async function getAssignmentPlaceholder(
  config: GoogleClassroomScaffoldConfig,
  courseId: string,
  assignmentId: string,
): Promise<Assignment | null> {
  const payload = await fetchGoogleClassroomJson<GoogleClassroomCourseWork>(
    config,
    `/v1/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(assignmentId)}`,
  );

  if (!payload) {
    return null;
  }

  return mapGoogleCourseWorkToAssignment(courseId, payload);
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
      return listAssignmentsPlaceholder(config, courseId);
    },
    async getAssignment(courseId: string, assignmentId: string) {
      return getAssignmentPlaceholder(config, courseId, assignmentId);
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
