export interface StudentSubmissionInput {
  studentRef: string;
  studentName: string;
  contentType: "text" | "metadata";
  textContent: string;
  sourceSubmissionRef: string;
}
