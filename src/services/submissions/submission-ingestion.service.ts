import { lmsProvider } from "@/services/lms/lms.provider";
import type { StudentSubmissionInput } from "@/services/submissions/submission-extraction.types";

// Raw submission text is fetched just-in-time from the LMS, normalized in memory,
// and handed to the analysis pipeline only for the duration of a single run.
// This service must never write raw text to persistence.
export async function ingestAssignmentSubmissions(assignmentId: string): Promise<StudentSubmissionInput[]> {
  // Boundary 1: LMS fetch. This returns references plus temporary preview text only.
  const submissionReferences = await lmsProvider.listStudentSubmissions(assignmentId);

  // Attachment metadata may exist, but attachment contents should only ever be
  // extracted transiently inside this ingestion boundary when the real LMS provider is added.
  await Promise.all(
    submissionReferences.map((submission) => lmsProvider.getSubmissionAttachments(submission.sourceSubmissionRef)),
  );

  // Boundary 2: temporary extraction and normalization. The resulting text payloads
  // are analysis-only inputs and must not be persisted beyond the current run.
  return submissionReferences.map((submission) => ({
    studentRef: submission.studentId,
    studentName: submission.studentName,
    contentType: submission.contentType,
    textContent: submission.contentPreview,
    sourceSubmissionRef: submission.sourceSubmissionRef,
  }));
}
