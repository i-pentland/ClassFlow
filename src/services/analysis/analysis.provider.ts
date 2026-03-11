import { createMockAnalysisProvider } from "@/services/analysis/analysis.mock";
import type { AnalysisResult, RunAssignmentAnalysisInput } from "@/services/analysis/analysis.types";

export interface AssignmentAnalysisProvider {
  runAssignmentAnalysis(input: RunAssignmentAnalysisInput): Promise<AnalysisResult>;
}

export const analysisProvider: AssignmentAnalysisProvider = createMockAnalysisProvider();
