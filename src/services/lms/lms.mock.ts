import type { LmsProvider } from "@/services/lms/lms.provider";
import type {
  Assignment,
  Class,
  LearningObjective,
  LmsAddonContext,
  Student,
  SubmissionAttachment,
  SubmissionReference,
} from "@/services/lms/lms.types";

const mockStudents: Student[] = [
  { id: "s1", name: "Ava Brooks", lmsStudentRef: "gc-student-1" },
  { id: "s2", name: "Liam Torres", lmsStudentRef: "gc-student-2" },
  { id: "s3", name: "Nora Patel", lmsStudentRef: "gc-student-3" },
  { id: "s4", name: "Elijah Kim", lmsStudentRef: "gc-student-4" },
  { id: "s5", name: "Mia Chen", lmsStudentRef: "gc-student-5" },
  { id: "s6", name: "Jonah Rivera", lmsStudentRef: "gc-student-6" },
  { id: "s7", name: "Ruby Coleman", lmsStudentRef: "gc-student-7" },
  { id: "s8", name: "Theo Nguyen", lmsStudentRef: "gc-student-8" },
  { id: "s9", name: "Layla Brooks", lmsStudentRef: "gc-student-9" },
  { id: "s10", name: "Mateo James", lmsStudentRef: "gc-student-10" },
];

const mockObjectives: LearningObjective[] = [
  {
    id: "obj1",
    title: "Support claims with textual evidence",
    description: "Students cite precise details from the text to justify an interpretation.",
  },
  {
    id: "obj2",
    title: "Compare fractions with unlike denominators",
    description: "Students use equivalent fractions or visual models to compare values accurately.",
  },
  {
    id: "obj3",
    title: "Identify cause-and-effect relationships",
    description: "Students explain how events, actions, or conditions influence one another.",
  },
  {
    id: "obj4",
    title: "Explain multi-step problem solving",
    description: "Students communicate their reasoning clearly across each step of a solution.",
  },
  {
    id: "obj5",
    title: "Use domain vocabulary precisely",
    description: "Students use subject-specific terms accurately when explaining ideas.",
  },
  {
    id: "obj6",
    title: "Interpret line plots and data clusters",
    description: "Students describe what grouped data suggests and identify noticeable outliers.",
  },
];

const mockAssignments: Assignment[] = [
  {
    id: "a1",
    classId: "c1",
    title: "Character Motivation Exit Ticket",
    dueDate: "2026-03-05",
    targetedObjectiveIds: ["obj1", "obj3", "obj5"],
    summary: "Students explain a character decision using evidence from a short story.",
    sourceAssignmentRef: "gc-assignment-1",
    sourceCourseRef: "gc-course-1",
  },
  {
    id: "a2",
    classId: "c1",
    title: "Theme and Evidence Paragraph",
    dueDate: "2026-03-08",
    targetedObjectiveIds: ["obj1", "obj5"],
    summary: "A single paragraph connecting theme to two quoted details.",
    sourceAssignmentRef: "gc-assignment-2",
    sourceCourseRef: "gc-course-1",
  },
  {
    id: "a3",
    classId: "c2",
    title: "Fraction Reasoning Check-In",
    dueDate: "2026-03-04",
    targetedObjectiveIds: ["obj2", "obj4"],
    summary: "Students compare three fraction pairs and explain their method.",
    sourceAssignmentRef: "gc-assignment-3",
    sourceCourseRef: "gc-course-2",
  },
  {
    id: "a4",
    classId: "c2",
    title: "Data Story Problem",
    dueDate: "2026-03-09",
    targetedObjectiveIds: ["obj4", "obj6"],
    summary: "Students interpret a line plot, then write a response using the data.",
    sourceAssignmentRef: "gc-assignment-4",
    sourceCourseRef: "gc-course-2",
  },
  {
    id: "a5",
    classId: "c3",
    title: "Cause and Effect News Analysis",
    dueDate: "2026-03-06",
    targetedObjectiveIds: ["obj3", "obj5"],
    summary: "Students annotate an article and explain the chain of events described.",
    sourceAssignmentRef: "gc-assignment-5",
    sourceCourseRef: "gc-course-3",
  },
];

const mockClasses: Class[] = [
  {
    id: "c1",
    title: "ELA 7",
    section: "Section A",
    periodLabel: "Period 2",
    studentIds: ["s1", "s2", "s3", "s4", "s5", "s6"],
    learningObjectiveIds: ["obj1", "obj3", "obj5"],
    assignmentIds: ["a1", "a2"],
    sourceCourseRef: "gc-course-1",
  },
  {
    id: "c2",
    title: "Math 5",
    section: "Homeroom 5B",
    periodLabel: "Morning Block",
    studentIds: ["s3", "s4", "s7", "s8", "s9", "s10"],
    learningObjectiveIds: ["obj2", "obj4", "obj6"],
    assignmentIds: ["a3", "a4"],
    sourceCourseRef: "gc-course-2",
  },
  {
    id: "c3",
    title: "Social Studies 6",
    section: "Section C",
    periodLabel: "Period 5",
    studentIds: ["s1", "s5", "s6", "s8", "s9"],
    learningObjectiveIds: ["obj3", "obj5"],
    assignmentIds: ["a5"],
    sourceCourseRef: "gc-course-3",
  },
];

const mockSubmissionReferences: SubmissionReference[] = [
  { id: "sub1", assignmentId: "a1", studentId: "s1", studentName: "Ava Brooks", submittedAt: "2026-03-05T12:01:00Z", contentType: "text", contentPreview: "The quote shows the choice, but I did not explain why it matters.", sourceSubmissionRef: "gc-sub-1" },
  { id: "sub2", assignmentId: "a1", studentId: "s2", studentName: "Liam Torres", submittedAt: "2026-03-05T12:04:00Z", contentType: "text", contentPreview: "I listed what happened in order instead of naming the cause.", sourceSubmissionRef: "gc-sub-2" },
  { id: "sub3", assignmentId: "a1", studentId: "s3", studentName: "Nora Patel", submittedAt: "2026-03-05T12:08:00Z", contentType: "text", contentPreview: "The character changed because of the storm and the warning from her friend.", sourceSubmissionRef: "gc-sub-3" },
  { id: "sub4", assignmentId: "a1", studentId: "s4", studentName: "Elijah Kim", submittedAt: "2026-03-05T12:10:00Z", contentType: "text", contentPreview: "I used a detail, but my explanation stayed short.", sourceSubmissionRef: "gc-sub-4" },
  { id: "sub5", assignmentId: "a1", studentId: "s5", studentName: "Mia Chen", submittedAt: "2026-03-05T12:12:00Z", contentType: "text", contentPreview: "The sequence is correct, but the relationship between events is still fuzzy.", sourceSubmissionRef: "gc-sub-5" },
  { id: "sub6", assignmentId: "a1", studentId: "s6", studentName: "Jonah Rivera", submittedAt: "2026-03-05T12:14:00Z", contentType: "text", contentPreview: "My reasoning is there, but the evidence link is incomplete.", sourceSubmissionRef: "gc-sub-6" },
  { id: "sub7", assignmentId: "a2", studentId: "s1", studentName: "Ava Brooks", submittedAt: "2026-03-08T11:02:00Z", contentType: "text", contentPreview: "The theme is good because the character changes.", sourceSubmissionRef: "gc-sub-7" },
  { id: "sub8", assignmentId: "a2", studentId: "s3", studentName: "Nora Patel", submittedAt: "2026-03-08T11:04:00Z", contentType: "text", contentPreview: "Important details are present, but the vocabulary is broad.", sourceSubmissionRef: "gc-sub-8" },
  { id: "sub9", assignmentId: "a2", studentId: "s4", studentName: "Elijah Kim", submittedAt: "2026-03-08T11:08:00Z", contentType: "text", contentPreview: "I used the evidence, but my analysis words stayed general.", sourceSubmissionRef: "gc-sub-9" },
  { id: "sub10", assignmentId: "a2", studentId: "s5", studentName: "Mia Chen", submittedAt: "2026-03-08T11:14:00Z", contentType: "text", contentPreview: "The paragraph needs stronger theme language.", sourceSubmissionRef: "gc-sub-10" },
  { id: "sub11", assignmentId: "a3", studentId: "s3", studentName: "Nora Patel", submittedAt: "2026-03-04T09:01:00Z", contentType: "text", contentPreview: "I made equivalent fractions, then compared the numerators too early.", sourceSubmissionRef: "gc-sub-11" },
  { id: "sub12", assignmentId: "a3", studentId: "s4", studentName: "Elijah Kim", submittedAt: "2026-03-04T09:06:00Z", contentType: "text", contentPreview: "My answer is right, but the written steps are missing.", sourceSubmissionRef: "gc-sub-12" },
  { id: "sub13", assignmentId: "a3", studentId: "s7", studentName: "Ruby Coleman", submittedAt: "2026-03-04T09:10:00Z", contentType: "text", contentPreview: "I knew which fraction was larger, but I did not show the model.", sourceSubmissionRef: "gc-sub-13" },
  { id: "sub14", assignmentId: "a3", studentId: "s8", studentName: "Theo Nguyen", submittedAt: "2026-03-04T09:12:00Z", contentType: "text", contentPreview: "I started finding a common denominator and then stopped.", sourceSubmissionRef: "gc-sub-14" },
  { id: "sub15", assignmentId: "a3", studentId: "s9", studentName: "Layla Brooks", submittedAt: "2026-03-04T09:15:00Z", contentType: "text", contentPreview: "The reasoning stayed in my head instead of on the page.", sourceSubmissionRef: "gc-sub-15" },
  { id: "sub16", assignmentId: "a3", studentId: "s10", studentName: "Mateo James", submittedAt: "2026-03-04T09:17:00Z", contentType: "text", contentPreview: "I compared the numbers, but not the fraction size carefully.", sourceSubmissionRef: "gc-sub-16" },
  { id: "sub17", assignmentId: "a4", studentId: "s3", studentName: "Nora Patel", submittedAt: "2026-03-09T14:01:00Z", contentType: "text", contentPreview: "I noticed the outlier but did not say what it means.", sourceSubmissionRef: "gc-sub-17" },
  { id: "sub18", assignmentId: "a4", studentId: "s8", studentName: "Theo Nguyen", submittedAt: "2026-03-09T14:04:00Z", contentType: "text", contentPreview: "The graph has one unusual value, though I left the explanation brief.", sourceSubmissionRef: "gc-sub-18" },
  { id: "sub19", assignmentId: "a4", studentId: "s9", studentName: "Layla Brooks", submittedAt: "2026-03-09T14:07:00Z", contentType: "text", contentPreview: "I called out the cluster and the extreme point.", sourceSubmissionRef: "gc-sub-19" },
  { id: "sub20", assignmentId: "a5", studentId: "s1", studentName: "Ava Brooks", submittedAt: "2026-03-06T10:01:00Z", contentType: "text", contentPreview: "I found the trigger event but did not finish the consequence chain.", sourceSubmissionRef: "gc-sub-20" },
  { id: "sub21", assignmentId: "a5", studentId: "s5", studentName: "Mia Chen", submittedAt: "2026-03-06T10:05:00Z", contentType: "text", contentPreview: "My annotation stops after the first effect.", sourceSubmissionRef: "gc-sub-21" },
  { id: "sub22", assignmentId: "a5", studentId: "s6", studentName: "Jonah Rivera", submittedAt: "2026-03-06T10:09:00Z", contentType: "text", contentPreview: "The article sequence is there, but the later effect is missing.", sourceSubmissionRef: "gc-sub-22" },
];

const mockSubmissionAttachments: SubmissionAttachment[] = [];

export function createMockLmsProvider(): LmsProvider {
  return {
    async resolveAddonContext(context: LmsAddonContext) {
      return context;
    },
    async listCourses() {
      return mockClasses;
    },
    async listAssignments(courseId: string) {
      return mockAssignments.filter((item) => item.classId === courseId);
    },
    async getAssignment(courseId: string, assignmentId: string) {
      const assignment = mockAssignments.find((item) => item.id === assignmentId) ?? null;
      return assignment && assignment.classId === courseId ? assignment : null;
    },
    async listStudentSubmissionsForAssignment(courseId: string, assignmentId: string) {
      const assignment = mockAssignments.find((item) => item.id === assignmentId && item.classId === courseId);
      return assignment ? mockSubmissionReferences.filter((item) => item.assignmentId === assignment.id) : [];
    },
    async listStudentSubmissions(assignmentId: string) {
      return mockSubmissionReferences.filter((item) => item.assignmentId === assignmentId);
    },
    async getSubmissionAttachments(submissionRef: string) {
      return mockSubmissionAttachments.filter((item) => item.submissionRef === submissionRef);
    },
    async getClasses() {
      return mockClasses;
    },
    async getClassById(classId: string) {
      return mockClasses.find((item) => item.id === classId) ?? null;
    },
    async getAssignmentsByClass(classId: string) {
      return mockAssignments.filter((item) => item.classId === classId);
    },
    async getAssignmentById(assignmentId: string) {
      return mockAssignments.find((item) => item.id === assignmentId) ?? null;
    },
    async getLearningObjectivesByClass(classId: string) {
      const classRoom = mockClasses.find((item) => item.id === classId);

      if (!classRoom) {
        return [];
      }

      const objectiveIds = new Set(classRoom.learningObjectiveIds);
      return mockObjectives.filter((item) => objectiveIds.has(item.id));
    },
    async getLearningObjectivesByIds(ids: string[]) {
      const objectiveIds = new Set(ids);
      return mockObjectives.filter((item) => objectiveIds.has(item.id));
    },
    async getStudentsByIds(ids: string[]) {
      const studentIds = new Set(ids);
      return mockStudents.filter((item) => studentIds.has(item.id));
    },
    async getSubmissionReferencesByAssignment(assignmentId: string) {
      return this.listStudentSubmissions(assignmentId);
    },
  };
}
