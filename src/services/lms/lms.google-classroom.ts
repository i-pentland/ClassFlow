import type { LmsProvider } from "@/services/lms/lms.provider";
import type {
  Assignment,
  Course,
  GoogleClassroomScaffoldConfig,
  LmsAddonContext,
  SubmissionAttachment,
  SubmissionReference,
} from "@/services/lms/lms.types";
import type { StudentWorkReviewDebugState } from "@/types/view-models";
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

type GoogleClassroomStudentSubmission = {
  id: string;
  userId?: string;
  state?: string;
  updateTime?: string;
  creationTime?: string;
  late?: boolean;
  assignmentSubmission?: {
    attachments?: GoogleClassroomAttachment[];
  };
  shortAnswerSubmission?: {
    answer?: string;
  };
};

type GoogleClassroomStudentSubmissionsResponse = {
  studentSubmissions?: GoogleClassroomStudentSubmission[];
  nextPageToken?: string;
};

type GoogleClassroomAttachment = {
  driveFile?: {
    id: string;
    title?: string;
    alternateLink?: string;
  };
  link?: {
    url?: string;
    title?: string;
  };
  form?: {
    url?: string;
    title?: string;
  };
  youtubeVideo?: {
    id?: string;
    title?: string;
    alternateLink?: string;
  };
};

type GoogleDriveFileMetadata = {
  id: string;
  name?: string;
  mimeType?: string;
  webViewLink?: string;
};

let lastGoogleSubmissionFetchDebugState: StudentWorkReviewDebugState | null = null;

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
    let errorDetails = "";

    try {
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        const body = (await response.json()) as { error?: { message?: string; status?: string } };
        errorDetails = body.error?.message ?? body.error?.status ?? "";
      } else {
        errorDetails = (await response.text()).trim();
      }
    } catch {
      errorDetails = "";
    }

    throw new Error(
      `Classroom request failed with ${response.status} ${response.statusText}.${errorDetails ? ` ${errorDetails}` : ""}`,
    );
  }

  return (await response.json()) as T;
}

async function fetchGoogleApiText(path: string, searchParams?: URLSearchParams) {
  const accessToken = await getAccessTokenOrThrow();
  const requestUrl = new URL(path, "https://www.googleapis.com");

  if (searchParams) {
    requestUrl.search = searchParams.toString();
  }

  const response = await fetch(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorDetails = (await response.text()).trim();
    throw new Error(
      `Google API text request failed with ${response.status} ${response.statusText}.${errorDetails ? ` ${errorDetails}` : ""}`,
    );
  }

  return response.text();
}

async function fetchGoogleApiBinary(path: string, searchParams?: URLSearchParams) {
  const accessToken = await getAccessTokenOrThrow();
  const requestUrl = new URL(path, "https://www.googleapis.com");

  if (searchParams) {
    requestUrl.search = searchParams.toString();
  }

  const response = await fetch(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorDetails = (await response.text()).trim();
    throw new Error(
      `Google API binary request failed with ${response.status} ${response.statusText}.${errorDetails ? ` ${errorDetails}` : ""}`,
    );
  }

  return response.arrayBuffer();
}

async function fetchGoogleApiJson<T>(path: string, searchParams?: URLSearchParams) {
  const accessToken = await getAccessTokenOrThrow();
  const requestUrl = new URL(path, "https://www.googleapis.com");

  if (searchParams) {
    requestUrl.search = searchParams.toString();
  }

  const response = await fetch(requestUrl.toString(), {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorDetails = (await response.text()).trim();
    throw new Error(
      `Google API metadata request failed with ${response.status} ${response.statusText}.${errorDetails ? ` ${errorDetails}` : ""}`,
    );
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

async function getCoursePlaceholder(
  config: GoogleClassroomScaffoldConfig,
  courseId: string,
): Promise<Course | null> {
  const payload = await fetchGoogleClassroomJson<GoogleClassroomCourse>(
    config,
    `/v1/courses/${encodeURIComponent(courseId)}`,
  );

  if (!payload) {
    return null;
  }

  return mapGoogleCourseToCourse(payload);
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

function mapGoogleStudentSubmissionToReference(
  assignmentId: string,
  submission: GoogleClassroomStudentSubmission,
): SubmissionReference {
  const studentRef = submission.userId ?? "unknown-student";
  const status = submission.state?.split("_").join(" ").toLowerCase() ?? "unknown status";
  const lateLabel = submission.late ? "Late" : "On time";
  const shortAnswerText = submission.shortAnswerSubmission?.answer?.trim() || undefined;

  return {
    id: submission.id,
    assignmentId,
    studentId: studentRef,
    studentName: `Student ${studentRef}`,
    submittedAt: submission.updateTime ?? submission.creationTime ?? "",
    contentType: shortAnswerText ? "text" : "metadata",
    contentPreview: shortAnswerText ? shortAnswerText.slice(0, 140) : `${status} · ${lateLabel}`,
    sourceSubmissionRef: submission.id,
    textContent: shortAnswerText,
  };
}

async function listStudentSubmissionsForAssignmentPlaceholder(
  config: GoogleClassroomScaffoldConfig,
  courseId: string,
  assignmentId: string,
): Promise<SubmissionReference[]> {
  lastGoogleSubmissionFetchDebugState = {
    providerName: "google_classroom",
    courseId,
    assignmentId,
    currentSubmissionId: null,
    requestMade: false,
    assignmentResolved: true,
    submissionFetchStatus: "not_attempted",
    rawSubmissionCount: null,
    mappedSubmissionCount: 0,
    apiError: null,
    rawSubmissionStateCounts: {},
    notes: [],
  };
  const submissions: SubmissionReference[] = [];
  let nextPageToken: string | undefined;

  try {
    do {
      const searchParams = new URLSearchParams();
      searchParams.set("pageSize", "50");

      if (nextPageToken) {
        searchParams.set("pageToken", nextPageToken);
      }

      lastGoogleSubmissionFetchDebugState.requestMade = true;
      if (import.meta.env.DEV) {
        console.info("[classflow][student-work-review] Requesting Google Classroom student submissions.", {
          courseId,
          assignmentId,
          pageToken: nextPageToken ?? null,
        });
      }

      const payload = await fetchGoogleClassroomJson<GoogleClassroomStudentSubmissionsResponse>(
        config,
        `/v1/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(assignmentId)}/studentSubmissions`,
        searchParams,
      );

      if (!payload) {
        lastGoogleSubmissionFetchDebugState.submissionFetchStatus = "failed";
        lastGoogleSubmissionFetchDebugState.apiError =
          "Google Classroom returned 404 for student submissions. Verify courseId, assignmentId, and teacher access.";
        lastGoogleSubmissionFetchDebugState.notes.push(
          "The student submissions endpoint returned 404 before any submission metadata could be mapped.",
        );
        if (import.meta.env.DEV) {
          console.warn("[classflow][student-work-review] Student submissions request returned 404.", {
            courseId,
            assignmentId,
          });
        }
        return [];
      }

      const rawSubmissions = payload.studentSubmissions ?? [];
      lastGoogleSubmissionFetchDebugState.rawSubmissionCount =
        (lastGoogleSubmissionFetchDebugState.rawSubmissionCount ?? 0) + rawSubmissions.length;
      for (const submission of rawSubmissions) {
        const stateKey = submission.state ?? "UNKNOWN";
        lastGoogleSubmissionFetchDebugState.rawSubmissionStateCounts[stateKey] =
          (lastGoogleSubmissionFetchDebugState.rawSubmissionStateCounts[stateKey] ?? 0) + 1;
      }

      submissions.push(...rawSubmissions.map((submission) => mapGoogleStudentSubmissionToReference(assignmentId, submission)));
      nextPageToken = payload.nextPageToken;
    } while (nextPageToken);
  } catch (error) {
    lastGoogleSubmissionFetchDebugState.submissionFetchStatus = "failed";
    lastGoogleSubmissionFetchDebugState.apiError = error instanceof Error ? error.message : "Unknown submission fetch error.";
    lastGoogleSubmissionFetchDebugState.notes.push(
      "The Google Classroom request threw before submission metadata could be returned to the embedded view.",
    );
    if (import.meta.env.DEV) {
      console.warn("[classflow][student-work-review] Student submissions request failed.", {
        courseId,
        assignmentId,
        error,
      });
    }
    throw error;
  }

  lastGoogleSubmissionFetchDebugState.mappedSubmissionCount = submissions.length;

  if (submissions.length === 0) {
    lastGoogleSubmissionFetchDebugState.submissionFetchStatus =
      (lastGoogleSubmissionFetchDebugState.rawSubmissionCount ?? 0) > 0 ? "mapping_zero" : "empty";
    lastGoogleSubmissionFetchDebugState.notes.push(
      (lastGoogleSubmissionFetchDebugState.rawSubmissionCount ?? 0) > 0
        ? "Google returned submission records, but none survived mapping."
        : "Google returned zero student submissions for this assignment.",
    );
    logPlaceholderBoundary(
      `listStudentSubmissionsForAssignment() found no student submissions for coursework ${assignmentId}.`,
    );
  } else {
    lastGoogleSubmissionFetchDebugState.submissionFetchStatus = "success";
  }

  if (import.meta.env.DEV) {
    console.info("[classflow][student-work-review] Student submission mapping complete.", {
      courseId,
      assignmentId,
      rawSubmissionCount: lastGoogleSubmissionFetchDebugState.rawSubmissionCount,
      mappedSubmissionCount: submissions.length,
      rawSubmissionStateCounts: lastGoogleSubmissionFetchDebugState.rawSubmissionStateCounts,
      filteringApplied: "none",
      status: lastGoogleSubmissionFetchDebugState.submissionFetchStatus,
    });
  }

  return submissions;
}

async function listStudentSubmissionsPlaceholder(
  config: GoogleClassroomScaffoldConfig,
  assignmentId: string,
): Promise<SubmissionReference[]> {
  const courses = await listCoursesPlaceholder(config);

  for (const course of courses) {
    const assignment = await getAssignmentPlaceholder(config, course.id, assignmentId);

    if (!assignment) {
      continue;
    }

    return listStudentSubmissionsForAssignmentPlaceholder(
      config,
      assignment.sourceCourseRef,
      assignment.sourceAssignmentRef,
    );
  }

  logPlaceholderBoundary(`listStudentSubmissions() could not resolve coursework ${assignmentId}.`);
  return [];
}

async function getSubmissionAttachmentsPlaceholder(
  config: GoogleClassroomScaffoldConfig,
  courseId: string,
  assignmentId: string,
  submissionRef: string,
): Promise<SubmissionAttachment[]> {
  const payload = await fetchGoogleClassroomJson<GoogleClassroomStudentSubmission>(
    config,
    `/v1/courses/${encodeURIComponent(courseId)}/courseWork/${encodeURIComponent(assignmentId)}/studentSubmissions/${encodeURIComponent(submissionRef)}`,
  );

  if (!payload) {
    return [];
  }

  const attachments: SubmissionAttachment[] = [];
  const shortAnswerText = payload.shortAnswerSubmission?.answer?.trim();

  if (shortAnswerText) {
    attachments.push({
      id: `${submissionRef}-short-answer`,
      submissionRef,
      title: "Short answer response",
      mimeType: "text/plain",
      kind: "short_answer",
      textContent: shortAnswerText,
    });
  }

  for (const attachment of payload.assignmentSubmission?.attachments ?? []) {
    if (attachment.driveFile?.id) {
      const driveMetadata = await fetchGoogleApiJson<GoogleDriveFileMetadata>(
        `/drive/v3/files/${encodeURIComponent(attachment.driveFile.id)}`,
        new URLSearchParams({
          fields: "id,name,mimeType,webViewLink",
        }),
      );

      attachments.push({
        id: attachment.driveFile.id,
        submissionRef,
        title: driveMetadata.name ?? attachment.driveFile.title ?? "Drive attachment",
        mimeType: driveMetadata.mimeType ?? "application/octet-stream",
        kind: "drive_file",
        url: driveMetadata.webViewLink ?? attachment.driveFile.alternateLink,
        driveFileId: attachment.driveFile.id,
      });
      continue;
    }

    if (attachment.link?.url) {
      attachments.push({
        id: `${submissionRef}-link-${attachments.length + 1}`,
        submissionRef,
        title: attachment.link.title ?? "Link attachment",
        mimeType: "text/uri-list",
        kind: "link",
        url: attachment.link.url,
      });
      continue;
    }

    if (attachment.form?.url) {
      attachments.push({
        id: `${submissionRef}-form-${attachments.length + 1}`,
        submissionRef,
        title: attachment.form.title ?? "Form attachment",
        mimeType: "application/vnd.google-apps.form",
        kind: "form",
        url: attachment.form.url,
      });
      continue;
    }

    if (attachment.youtubeVideo?.alternateLink || attachment.youtubeVideo?.id) {
      attachments.push({
        id: `${submissionRef}-youtube-${attachments.length + 1}`,
        submissionRef,
        title: attachment.youtubeVideo.title ?? "YouTube attachment",
        mimeType: "video/youtube",
        kind: "youtube",
        url: attachment.youtubeVideo.alternateLink,
      });
    }
  }

  if (attachments.length === 0) {
    logPlaceholderBoundary(`No supported submission attachments were returned for ${submissionRef}.`);
  }

  return attachments;
}

async function readSubmissionAttachmentTextPlaceholder(
  attachment: SubmissionAttachment,
): Promise<{ textContent: string; contentType: "google_doc" | "plain_text" | "short_answer" }> {
  if (attachment.kind === "short_answer" && attachment.textContent) {
    return {
      textContent: attachment.textContent,
      contentType: "short_answer",
    };
  }

  if (!attachment.driveFileId) {
    throw new Error(`Attachment ${attachment.id} does not expose a readable Drive file id.`);
  }

  if (attachment.mimeType === "application/vnd.google-apps.document") {
    const textContent = await fetchGoogleApiText(
      `/drive/v3/files/${encodeURIComponent(attachment.driveFileId)}/export`,
      new URLSearchParams({
        mimeType: "text/plain",
      }),
    );

    return {
      textContent,
      contentType: "google_doc",
    };
  }

  if (attachment.mimeType === "text/plain") {
    const textContent = await fetchGoogleApiText(
      `/drive/v3/files/${encodeURIComponent(attachment.driveFileId)}`,
      new URLSearchParams({
        alt: "media",
      }),
    );

    return {
      textContent,
      contentType: "plain_text",
    };
  }

  throw new Error(`Attachment ${attachment.id} has unsupported mime type ${attachment.mimeType}.`);
}

async function readSubmissionAttachmentBinaryPlaceholder(
  attachment: SubmissionAttachment,
): Promise<ArrayBuffer> {
  if (!attachment.driveFileId) {
    throw new Error(`Attachment ${attachment.id} does not expose a readable Drive file id.`);
  }

  if (attachment.mimeType !== "application/pdf") {
    throw new Error(`Attachment ${attachment.id} has unsupported binary mime type ${attachment.mimeType}.`);
  }

  return fetchGoogleApiBinary(
    `/drive/v3/files/${encodeURIComponent(attachment.driveFileId)}`,
    new URLSearchParams({
      alt: "media",
    }),
  );
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
    async listStudentSubmissionsForAssignment(courseId: string, assignmentId: string) {
      return listStudentSubmissionsForAssignmentPlaceholder(config, courseId, assignmentId);
    },
    async listStudentSubmissions(assignmentId: string) {
      // TODO: Replace with live student submission metadata list after coursework wiring is complete.
      return listStudentSubmissionsPlaceholder(config, assignmentId);
    },
    async getSubmissionAttachmentsForAssignment(courseId: string, assignmentId: string, submissionRef: string) {
      return getSubmissionAttachmentsPlaceholder(config, courseId, assignmentId, submissionRef);
    },
    async getSubmissionAttachments(submissionRef: string) {
      // Legacy assignment-id-only attachment lookup remains unsupported for live Google
      // routes because student submissions are scoped by course + assignment.
      logPlaceholderBoundary(`getSubmissionAttachments(${submissionRef}) requires course-scoped context.`);
      return [];
    },
    async readSubmissionAttachmentText(attachment: SubmissionAttachment) {
      return readSubmissionAttachmentTextPlaceholder(attachment);
    },
    async readSubmissionAttachmentBinary(attachment: SubmissionAttachment) {
      return readSubmissionAttachmentBinaryPlaceholder(attachment);
    },
    async getClasses() {
      return this.listCourses();
    },
    async getClassById(classId: string) {
      // Add-on launches can arrive with a concrete courseId even when that course is not
      // present in the current listCourses() result set. Resolve the course directly by id
      // so hosted add-on routes do not depend on prior dashboard-style course listing.
      return getCoursePlaceholder(config, classId);
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

export function getLastGoogleSubmissionFetchDebugState() {
  return lastGoogleSubmissionFetchDebugState;
}
