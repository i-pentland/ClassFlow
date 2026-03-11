import type { AssignmentAnalysisProvider } from "@/services/analysis/analysis.provider";
import type { DerivedPattern } from "@/services/analysis/analysis.types";

const mockPatternTemplatesByAssignmentId: Record<string, DerivedPattern[]> = {
  a1: [
    {
      title: "Evidence is present but not fully connected",
      description:
        "Several responses include a quote or detail, but the explanation stops short of showing how that evidence supports the claim.",
      objectiveId: "obj1",
      affectedStudentRefs: ["s1", "s2", "s4", "s5", "s6", "s8", "s9"],
      confidence: 0.88,
    },
    {
      title: "Cause and effect are blended into sequence",
      description:
        "Some students retell events in order without naming which event caused the character's decision.",
      objectiveId: "obj3",
      affectedStudentRefs: ["s2", "s3", "s4", "s5", "s6"],
      confidence: 0.83,
    },
  ],
  a2: [
    {
      title: "Vocabulary stays general instead of analytical",
      description:
        "A cluster of responses uses broad words like 'good' or 'important' where theme language would make the thinking clearer.",
      objectiveId: "obj5",
      affectedStudentRefs: ["s1", "s3", "s4", "s5", "s6", "s7"],
      confidence: 0.79,
    },
  ],
  a3: [
    {
      title: "Common denominator strategy is skipped midway",
      description:
        "A recurring pattern shows students beginning with equivalent fractions, then comparing numerators before finishing the conversion.",
      objectiveId: "obj2",
      affectedStudentRefs: ["s3", "s4", "s5", "s7", "s8", "s9", "s10", "s1"],
      confidence: 0.9,
    },
    {
      title: "Reasoning is implied, not written out",
      description:
        "Multiple submissions reach the correct comparison but do not record the steps or model that led there.",
      objectiveId: "obj4",
      affectedStudentRefs: ["s2", "s3", "s4", "s7", "s8", "s9", "s10", "s5", "s6"],
      confidence: 0.85,
    },
  ],
  a4: [
    {
      title: "Outliers are noticed but not interpreted",
      description:
        "Students often point out unusual data points without explaining what those points might mean for the larger data story.",
      objectiveId: "obj6",
      affectedStudentRefs: ["s3", "s8", "s9", "s10"],
      confidence: 0.8,
    },
  ],
  a5: [
    {
      title: "Chains of events stop after the first step",
      description:
        "Several students identify the initial trigger correctly, then leave out the later consequence that the article emphasizes.",
      objectiveId: "obj3",
      affectedStudentRefs: ["s1", "s5", "s6", "s8", "s9"],
      confidence: 0.82,
    },
  ],
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function createMockAnalysisProvider(): AssignmentAnalysisProvider {
  return {
    async runAssignmentAnalysis({ assignment, submissions }) {
      await delay(1400);

      const templates = mockPatternTemplatesByAssignmentId[assignment.id] ?? [];
      const submissionStudentRefs = new Set(submissions.map((submission) => submission.studentRef));

      return {
        assignmentId: assignment.id,
        sourceAssignmentRef: assignment.sourceAssignmentRef,
        sourceCourseRef: assignment.sourceCourseRef,
        patterns: templates.map((pattern) => {
          const affectedStudentRefs = pattern.affectedStudentRefs.filter((studentRef) =>
            submissionStudentRefs.has(studentRef),
          );

          return {
            ...pattern,
            affectedStudentRefs,
          };
        }),
      };
    },
  };
}
