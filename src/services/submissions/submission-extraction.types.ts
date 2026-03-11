export interface StudentSubmissionInput {
  studentRef: string;
  studentName: string;
  contentType: "google_doc" | "plain_text" | "short_answer" | "pdf" | "text" | "metadata";
  textContent: string;
  sourceSubmissionRef: string;
  sourceAttachmentId?: string;
  sourceMimeType?: string;
}

export interface SubmissionPreparationItem {
  submissionRef: string;
  studentRef: string;
  studentName: string;
  status: "analyzable" | "unsupported" | "failed";
  contentType: "google_doc" | "plain_text" | "short_answer" | "pdf" | "metadata" | "unsupported";
  reason?: string;
  attachmentCount?: number;
  detectedAttachmentTypes?: string[];
  attemptedStrategies?: string[];
  tokenAvailable?: boolean;
  errorCategory?:
    | "no_attachments"
    | "unsupported_attachment"
    | "attachment_lookup"
    | "drive_scope"
    | "google_docs_export"
    | "media_download"
    | "normalization"
    | "unexpected_empty_content";
}

export interface SubmissionPreparationSummary {
  totalSubmissions: number;
  analyzableCount: number;
  unsupportedCount: number;
  failedCount: number;
  items: SubmissionPreparationItem[];
}
