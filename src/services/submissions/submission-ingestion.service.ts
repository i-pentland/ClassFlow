import { lmsProvider } from "@/services/lms/lms.provider";
import type { SubmissionAttachment, SubmissionReference } from "@/services/lms/lms.types";
import { getGoogleAccessToken } from "@/services/auth/auth.service";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import pdfWorkerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";
import type {
  StudentSubmissionInput,
  SubmissionPreparationItem,
  SubmissionPreparationSummary,
} from "@/services/submissions/submission-extraction.types";

type PrepareAssignmentSubmissionInputsParams = {
  courseId?: string;
  assignmentId: string;
  submissionReferences?: SubmissionReference[];
};

type PrepareAssignmentSubmissionInputsResult = {
  inputs: StudentSubmissionInput[];
  summary: SubmissionPreparationSummary;
};

let isPdfWorkerConfigured = false;

function ensurePdfWorkerConfigured() {
  if (isPdfWorkerConfigured) {
    return;
  }

  GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  isPdfWorkerConfigured = true;

  if (import.meta.env.DEV) {
    console.info("[classflow][submission-extraction] PDF worker configured.", {
      workerSrc: GlobalWorkerOptions.workerSrc,
    });
  }
}

function unsupportedItem(
  submission: SubmissionReference,
  contentType: SubmissionPreparationItem["contentType"],
  reason: string,
  debug?: Partial<SubmissionPreparationItem>,
): SubmissionPreparationItem {
  return {
    submissionRef: submission.sourceSubmissionRef,
    studentRef: submission.studentId,
    studentName: submission.studentName,
    status: "unsupported",
    contentType,
    reason,
    ...debug,
  };
}

function failedItem(
  submission: SubmissionReference,
  reason: string,
  debug?: Partial<SubmissionPreparationItem>,
): SubmissionPreparationItem {
  return {
    submissionRef: submission.sourceSubmissionRef,
    studentRef: submission.studentId,
    studentName: submission.studentName,
    status: "failed",
    contentType: "metadata",
    reason,
    ...debug,
  };
}

function analyzableItem(
  submission: SubmissionReference,
  contentType: SubmissionPreparationItem["contentType"],
  debug?: Partial<SubmissionPreparationItem>,
): SubmissionPreparationItem {
  return {
    submissionRef: submission.sourceSubmissionRef,
    studentRef: submission.studentId,
    studentName: submission.studentName,
    status: "analyzable",
    contentType,
    ...debug,
  };
}

function summarizePreparedInputs(
  submissionReferences: SubmissionReference[],
  preparedItems: SubmissionPreparationItem[],
): SubmissionPreparationSummary {
  return {
    totalSubmissions: submissionReferences.length,
    analyzableCount: preparedItems.filter((item) => item.status === "analyzable").length,
    unsupportedCount: preparedItems.filter((item) => item.status === "unsupported").length,
    failedCount: preparedItems.filter((item) => item.status === "failed").length,
    items: preparedItems,
  };
}

function clearTransientSubmissionInputs(inputs: StudentSubmissionInput[]) {
  for (const input of inputs) {
    input.textContent = "";
  }
  inputs.length = 0;
}

function classifyExtractionFailure(error: unknown): SubmissionPreparationItem["errorCategory"] {
  const message = error instanceof Error ? error.message.toLowerCase() : "";

  if (message.includes("insufficient authentication scopes") || message.includes("insufficientpermissions")) {
    return "drive_scope";
  }

  if (message.includes("export")) {
    return "google_docs_export";
  }

  if (message.includes("alt=media") || message.includes("media")) {
    return "media_download";
  }

  if (message.includes("empty")) {
    return "unexpected_empty_content";
  }

  return "normalization";
}

function getConfiguredGoogleScopes() {
  return (import.meta.env.VITE_GOOGLE_CLASSROOM_SCOPES ?? "")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}

async function extractPdfText(binary: ArrayBuffer) {
  ensurePdfWorkerConfigured();

  if (import.meta.env.DEV) {
    console.info("[classflow][submission-extraction] PDF parse started.", {
      workerConfigured: Boolean(GlobalWorkerOptions.workerSrc),
      binarySize: binary.byteLength,
    });
  }

  const pdf = await getDocument({
    data: binary,
    useWorkerFetch: false,
    isEvalSupported: false,
    disableFontFace: true,
  }).promise;

  const pageTexts: string[] = [];

  for (let pageIndex = 1; pageIndex <= pdf.numPages; pageIndex += 1) {
    const page = await pdf.getPage(pageIndex);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      pageTexts.push(pageText);
    }
  }

  if (import.meta.env.DEV) {
    console.info("[classflow][submission-extraction] PDF parse succeeded.", {
      pageCount: pdf.numPages,
      extractedCharacters: pageTexts.join("\n\n").trim().length,
    });
  }

  return {
    pageCount: pdf.numPages,
    textContent: pageTexts.join("\n\n").trim(),
  };
}

async function prepareSubmissionInputFromAttachments(
  courseId: string,
  assignmentId: string,
  submission: SubmissionReference,
): Promise<{ input: StudentSubmissionInput | null; item: SubmissionPreparationItem }> {
  let attachments: SubmissionAttachment[] = [];
  const attemptedStrategies: string[] = [];
  const configuredScopes = getConfiguredGoogleScopes();
  const driveScopeConfigured = configuredScopes.includes("https://www.googleapis.com/auth/drive.readonly");
  let tokenAvailable = false;

  try {
    tokenAvailable = Boolean(await getGoogleAccessToken());
  } catch {
    tokenAvailable = false;
  }

  try {
    if (import.meta.env.DEV) {
      console.info("[classflow][submission-extraction] Looking up submission attachments.", {
        courseId,
        assignmentId,
        submissionRef: submission.sourceSubmissionRef,
      });
    }
    attachments = await lmsProvider.getSubmissionAttachmentsForAssignment(
      courseId,
      assignmentId,
      submission.sourceSubmissionRef,
    );
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[classflow][submission-extraction] Attachment lookup failed.", {
        courseId,
        assignmentId,
        submissionRef: submission.sourceSubmissionRef,
        error,
      });
    }
    return {
      input: null,
      item: failedItem(
        submission,
        error instanceof Error ? error.message : "Attachment lookup failed for this submission.",
        {
          attachmentCount: 0,
          detectedAttachmentTypes: [],
          attemptedStrategies,
          tokenAvailable,
          errorCategory:
            classifyExtractionFailure(error) === "drive_scope"
              ? "drive_scope"
              : "attachment_lookup",
        },
      ),
    };
  }

  const detectedAttachmentTypes = attachments.map((attachment) => `${attachment.kind}:${attachment.mimeType}`);
  if (import.meta.env.DEV) {
    console.info("[classflow][submission-extraction] Attachment metadata resolved.", {
      courseId,
      assignmentId,
      submissionRef: submission.sourceSubmissionRef,
      attachmentCount: attachments.length,
      detectedAttachmentTypes,
    });
  }

  if (attachments.length === 0) {
    return {
      input: null,
      item: unsupportedItem(
        submission,
        "metadata",
        "No supported submission attachment metadata was available for this submission.",
        {
          attachmentCount: 0,
          detectedAttachmentTypes,
          attemptedStrategies,
          tokenAvailable,
          errorCategory: "no_attachments",
        },
      ),
    };
  }

  for (const attachment of attachments) {
    if (attachment.kind === "short_answer" && attachment.textContent) {
      attemptedStrategies.push("short_answer_inline");
      if (import.meta.env.DEV) {
        console.info("[classflow][submission-extraction] Using inline short-answer content.", {
          submissionRef: submission.sourceSubmissionRef,
          attachmentId: attachment.id,
        });
      }
      return {
        input: {
          studentRef: submission.studentId,
          studentName: submission.studentName,
          contentType: "short_answer",
          textContent: attachment.textContent,
          sourceSubmissionRef: submission.sourceSubmissionRef,
          sourceAttachmentId: attachment.id,
          sourceMimeType: attachment.mimeType,
        },
        item: analyzableItem(submission, "short_answer", {
          attachmentCount: attachments.length,
          detectedAttachmentTypes,
          attemptedStrategies,
          tokenAvailable,
        }),
      };
    }

    if (attachment.mimeType === "application/pdf") {
      try {
        attemptedStrategies.push("pdf_binary_download");
        if (import.meta.env.DEV) {
          console.info("[classflow][submission-extraction] Attempting transient PDF extraction.", {
            submissionRef: submission.sourceSubmissionRef,
            attachmentId: attachment.id,
            driveFileId: attachment.driveFileId ?? null,
            tokenAvailable,
            driveScopeConfigured,
          });
        }

        const binary = await lmsProvider.readSubmissionAttachmentBinary(attachment);
        attemptedStrategies.push("pdf_text_parse");
        const extracted = await extractPdfText(binary);

        if (!extracted.textContent) {
          return {
            input: null,
            item: failedItem(submission, "PDF appears image-only or does not contain readable text.", {
              attachmentCount: attachments.length,
              detectedAttachmentTypes,
              attemptedStrategies,
              tokenAvailable,
              errorCategory: "unexpected_empty_content",
            }),
          };
        }

        return {
          input: {
            studentRef: submission.studentId,
            studentName: submission.studentName,
            contentType: "pdf",
            textContent: extracted.textContent,
            sourceSubmissionRef: submission.sourceSubmissionRef,
            sourceAttachmentId: attachment.id,
            sourceMimeType: attachment.mimeType,
          },
        item: analyzableItem(submission, "pdf", {
          attachmentCount: attachments.length,
          detectedAttachmentTypes,
          attemptedStrategies: [...attemptedStrategies, "pdf_worker_configured", "pdf_normalized"],
          tokenAvailable,
          reason: `PDF text extracted from ${extracted.pageCount} page(s). Worker configured successfully.`,
        }),
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[classflow][submission-extraction] PDF extraction failed.", {
            submissionRef: submission.sourceSubmissionRef,
            attachmentId: attachment.id,
            driveFileId: attachment.driveFileId ?? null,
            tokenAvailable,
            driveScopeConfigured,
            error,
          });
        }
        return {
          input: null,
          item: failedItem(
            submission,
            error instanceof Error ? error.message : "PDF extraction failed.",
            {
              attachmentCount: attachments.length,
              detectedAttachmentTypes,
              attemptedStrategies: [...attemptedStrategies, "pdf_worker_configured"],
              tokenAvailable,
              errorCategory: classifyExtractionFailure(error),
            },
          ),
        };
      }
    }

    if (
      attachment.mimeType !== "application/vnd.google-apps.document" &&
      attachment.mimeType !== "text/plain"
    ) {
      continue;
    }

    try {
      attemptedStrategies.push(
        attachment.mimeType === "application/vnd.google-apps.document"
          ? "google_docs_export"
          : "drive_media_download",
      );
      if (import.meta.env.DEV) {
        console.info("[classflow][submission-extraction] Attempting attachment text read.", {
          submissionRef: submission.sourceSubmissionRef,
          attachmentId: attachment.id,
          mimeType: attachment.mimeType,
          driveFileId: attachment.driveFileId ?? null,
          tokenAvailable,
          driveScopeConfigured,
        });
      }
      const extracted = await lmsProvider.readSubmissionAttachmentText(attachment);

      if (!extracted.textContent.trim()) {
        return {
          input: null,
          item: failedItem(submission, "Attachment text extraction returned empty content.", {
            attachmentCount: attachments.length,
            detectedAttachmentTypes,
            attemptedStrategies,
            tokenAvailable,
            errorCategory: "unexpected_empty_content",
          }),
        };
      }

      return {
        input: {
          studentRef: submission.studentId,
          studentName: submission.studentName,
          contentType: extracted.contentType,
          textContent: extracted.textContent,
          sourceSubmissionRef: submission.sourceSubmissionRef,
          sourceAttachmentId: attachment.id,
          sourceMimeType: attachment.mimeType,
        },
        item: analyzableItem(submission, extracted.contentType, {
          attachmentCount: attachments.length,
          detectedAttachmentTypes,
          attemptedStrategies,
          tokenAvailable,
        }),
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn("[classflow][submission-extraction] Attachment text read failed.", {
          submissionRef: submission.sourceSubmissionRef,
          attachmentId: attachment.id,
          mimeType: attachment.mimeType,
          driveFileId: attachment.driveFileId ?? null,
          tokenAvailable,
          driveScopeConfigured,
          error,
        });
      }
      return {
        input: null,
        item: failedItem(
          submission,
          error instanceof Error ? error.message : "Attachment text extraction failed.",
          {
            attachmentCount: attachments.length,
            detectedAttachmentTypes,
            attemptedStrategies,
            tokenAvailable,
            errorCategory: classifyExtractionFailure(error),
          },
        ),
      };
    }
  }

  return {
    input: null,
    item: unsupportedItem(
      submission,
      "unsupported",
      "This submission only contains attachment types that are not supported yet.",
      {
        attachmentCount: attachments.length,
        detectedAttachmentTypes,
        attemptedStrategies,
        tokenAvailable,
        errorCategory: "unsupported_attachment",
      },
    ),
  };
}

async function prepareSingleSubmissionInput(
  courseId: string | undefined,
  assignmentId: string,
  submission: SubmissionReference,
): Promise<{ input: StudentSubmissionInput | null; item: SubmissionPreparationItem }> {
  if (submission.contentType === "text" && submission.textContent) {
    if (import.meta.env.DEV) {
      console.info("[classflow][submission-extraction] Submission normalized from inline text content.", {
        submissionRef: submission.sourceSubmissionRef,
      });
    }
    return {
      input: {
        studentRef: submission.studentId,
        studentName: submission.studentName,
        contentType: "text",
        textContent: submission.textContent,
        sourceSubmissionRef: submission.sourceSubmissionRef,
      },
      item: analyzableItem(submission, "short_answer", {
        attachmentCount: 0,
        detectedAttachmentTypes: ["inline_submission_text"],
        attemptedStrategies: ["inline_submission_text"],
        tokenAvailable: true,
      }),
    };
  }

  if (!courseId) {
    return {
      input: null,
      item: unsupportedItem(
        submission,
        "metadata",
        "Course-scoped submission attachment lookup is required for live extraction.",
      ),
    };
  }

  return prepareSubmissionInputFromAttachments(courseId, assignmentId, submission);
}

// Raw submission text is fetched just-in-time from the LMS, normalized in memory,
// and handed to the analysis pipeline only for the duration of a single run.
// This service must never write raw text to persistence.
export async function prepareAssignmentSubmissionInputs(
  params: PrepareAssignmentSubmissionInputsParams,
): Promise<PrepareAssignmentSubmissionInputsResult> {
  const submissionReferences =
    params.submissionReferences ??
    (params.courseId
      ? await lmsProvider.listStudentSubmissionsForAssignment(params.courseId, params.assignmentId)
      : await lmsProvider.listStudentSubmissions(params.assignmentId));

  const preparedResults = await Promise.all(
    submissionReferences.map((submission) =>
      prepareSingleSubmissionInput(params.courseId, params.assignmentId, submission),
    ),
  );

  const inputs = preparedResults
    .map((result) => result.input)
    .filter((input): input is StudentSubmissionInput => Boolean(input));
  const summary = summarizePreparedInputs(
    submissionReferences,
    preparedResults.map((result) => result.item),
  );

  if (import.meta.env.DEV) {
    console.info("[classflow][submission-extraction] Preparation summary.", {
      courseId: params.courseId ?? null,
      assignmentId: params.assignmentId,
      totalSubmissions: summary.totalSubmissions,
      analyzableCount: summary.analyzableCount,
      unsupportedCount: summary.unsupportedCount,
      failedCount: summary.failedCount,
      items: summary.items,
    });
  }

  return {
    inputs,
    summary,
  };
}

export async function ingestAssignmentSubmissions(params: PrepareAssignmentSubmissionInputsParams): Promise<StudentSubmissionInput[]> {
  const { inputs } = await prepareAssignmentSubmissionInputs(params);
  return inputs;
}

export function discardPreparedSubmissionInputs(inputs: StudentSubmissionInput[]) {
  clearTransientSubmissionInputs(inputs);
}
