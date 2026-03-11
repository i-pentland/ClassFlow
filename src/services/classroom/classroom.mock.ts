import type { ClassroomProvider } from "@/services/classroom/classroom.provider";
import type {
  Assignment,
  Class,
  LearningObjective,
  Student,
  StudentSubmission,
} from "@/services/classroom/classroom.types";

const mockStudents: Student[] = [
  { id: "s1", name: "Ava Brooks" },
  { id: "s2", name: "Liam Torres" },
  { id: "s3", name: "Nora Patel" },
  { id: "s4", name: "Elijah Kim" },
  { id: "s5", name: "Mia Chen" },
  { id: "s6", name: "Jonah Rivera" },
  { id: "s7", name: "Ruby Coleman" },
  { id: "s8", name: "Theo Nguyen" },
  { id: "s9", name: "Layla Brooks" },
  { id: "s10", name: "Mateo James" },
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
  },
  {
    id: "a2",
    classId: "c1",
    title: "Theme and Evidence Paragraph",
    dueDate: "2026-03-08",
    targetedObjectiveIds: ["obj1", "obj5"],
    summary: "A single paragraph connecting theme to two quoted details.",
  },
  {
    id: "a3",
    classId: "c2",
    title: "Fraction Reasoning Check-In",
    dueDate: "2026-03-04",
    targetedObjectiveIds: ["obj2", "obj4"],
    summary: "Students compare three fraction pairs and explain their method.",
  },
  {
    id: "a4",
    classId: "c2",
    title: "Data Story Problem",
    dueDate: "2026-03-09",
    targetedObjectiveIds: ["obj4", "obj6"],
    summary: "Students interpret a line plot, then write a response using the data.",
  },
  {
    id: "a5",
    classId: "c3",
    title: "Cause and Effect News Analysis",
    dueDate: "2026-03-06",
    targetedObjectiveIds: ["obj3", "obj5"],
    summary: "Students annotate an article and explain the chain of events described.",
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
  },
  {
    id: "c2",
    title: "Math 5",
    section: "Homeroom 5B",
    periodLabel: "Morning Block",
    studentIds: ["s3", "s4", "s7", "s8", "s9", "s10"],
    learningObjectiveIds: ["obj2", "obj4", "obj6"],
    assignmentIds: ["a3", "a4"],
  },
  {
    id: "c3",
    title: "Social Studies 6",
    section: "Section C",
    periodLabel: "Period 5",
    studentIds: ["s1", "s5", "s6", "s8", "s9"],
    learningObjectiveIds: ["obj3", "obj5"],
    assignmentIds: ["a5"],
  },
];

const mockSubmissions: StudentSubmission[] = [
  { id: "sub1", assignmentId: "a1", studentId: "s1", submittedAt: "2026-03-05T12:01:00Z", contentPreview: "The quote shows the choice, but I did not explain why it matters." },
  { id: "sub2", assignmentId: "a1", studentId: "s2", submittedAt: "2026-03-05T12:04:00Z", contentPreview: "I listed what happened in order instead of naming the cause." },
  { id: "sub3", assignmentId: "a1", studentId: "s3", submittedAt: "2026-03-05T12:08:00Z", contentPreview: "The character changed because of the storm and the warning from her friend." },
  { id: "sub4", assignmentId: "a1", studentId: "s4", submittedAt: "2026-03-05T12:10:00Z", contentPreview: "I used a detail, but my explanation stayed short." },
  { id: "sub5", assignmentId: "a1", studentId: "s5", submittedAt: "2026-03-05T12:12:00Z", contentPreview: "The sequence is correct, but the relationship between events is still fuzzy." },
  { id: "sub6", assignmentId: "a1", studentId: "s6", submittedAt: "2026-03-05T12:14:00Z", contentPreview: "My reasoning is there, but the evidence link is incomplete." },
  { id: "sub7", assignmentId: "a2", studentId: "s1", submittedAt: "2026-03-08T11:02:00Z", contentPreview: "The theme is good because the character changes." },
  { id: "sub8", assignmentId: "a2", studentId: "s3", submittedAt: "2026-03-08T11:04:00Z", contentPreview: "Important details are present, but the vocabulary is broad." },
  { id: "sub9", assignmentId: "a2", studentId: "s4", submittedAt: "2026-03-08T11:08:00Z", contentPreview: "I used the evidence, but my analysis words stayed general." },
  { id: "sub10", assignmentId: "a2", studentId: "s5", submittedAt: "2026-03-08T11:14:00Z", contentPreview: "The paragraph needs stronger theme language." },
  { id: "sub11", assignmentId: "a3", studentId: "s3", submittedAt: "2026-03-04T09:01:00Z", contentPreview: "I made equivalent fractions, then compared the numerators too early." },
  { id: "sub12", assignmentId: "a3", studentId: "s4", submittedAt: "2026-03-04T09:06:00Z", contentPreview: "My answer is right, but the written steps are missing." },
  { id: "sub13", assignmentId: "a3", studentId: "s7", submittedAt: "2026-03-04T09:10:00Z", contentPreview: "I knew which fraction was larger, but I did not show the model." },
  { id: "sub14", assignmentId: "a3", studentId: "s8", submittedAt: "2026-03-04T09:12:00Z", contentPreview: "I started finding a common denominator and then stopped." },
  { id: "sub15", assignmentId: "a3", studentId: "s9", submittedAt: "2026-03-04T09:15:00Z", contentPreview: "The reasoning stayed in my head instead of on the page." },
  { id: "sub16", assignmentId: "a3", studentId: "s10", submittedAt: "2026-03-04T09:17:00Z", contentPreview: "I compared the numbers, but not the fraction size carefully." },
  { id: "sub17", assignmentId: "a4", studentId: "s3", submittedAt: "2026-03-09T14:01:00Z", contentPreview: "I noticed the outlier but did not say what it means." },
  { id: "sub18", assignmentId: "a4", studentId: "s8", submittedAt: "2026-03-09T14:04:00Z", contentPreview: "The graph has one unusual value, though I left the explanation brief." },
  { id: "sub19", assignmentId: "a4", studentId: "s9", submittedAt: "2026-03-09T14:07:00Z", contentPreview: "I called out the cluster and the extreme point." },
  { id: "sub20", assignmentId: "a5", studentId: "s1", submittedAt: "2026-03-06T10:01:00Z", contentPreview: "I found the trigger event but did not finish the consequence chain." },
  { id: "sub21", assignmentId: "a5", studentId: "s5", submittedAt: "2026-03-06T10:05:00Z", contentPreview: "My annotation stops after the first effect." },
  { id: "sub22", assignmentId: "a5", studentId: "s6", submittedAt: "2026-03-06T10:09:00Z", contentPreview: "The article sequence is there, but the later effect is missing." },
];

export function createMockClassroomProvider(): ClassroomProvider {
  return {
    async getClasses() {
      return mockClasses;
    },
    async getClassById(classId: string) {
      return mockClasses.find((item) => item.id === classId) ?? null;
    },
    async getAssignmentsForClass(classId: string) {
      return mockAssignments.filter((item) => item.classId === classId);
    },
    async getLearningObjectivesByClass(classId: string) {
      const classRoom = mockClasses.find((item) => item.id === classId);

      if (!classRoom) {
        return [];
      }

      const objectiveIds = new Set(classRoom.learningObjectiveIds);
      return mockObjectives.filter((item) => objectiveIds.has(item.id));
    },
    async getAssignmentById(assignmentId: string) {
      return mockAssignments.find((item) => item.id === assignmentId) ?? null;
    },
    async getObjectives() {
      return mockObjectives;
    },
    async getObjectivesByIds(ids: string[]) {
      const idSet = new Set(ids);
      return mockObjectives.filter((item) => idSet.has(item.id));
    },
    async getStudentsByIds(ids: string[]) {
      const idSet = new Set(ids);
      return mockStudents.filter((item) => idSet.has(item.id));
    },
    async getSubmissionsForAssignment(assignmentId: string) {
      return mockSubmissions.filter((item) => item.assignmentId === assignmentId);
    },
  };
}
