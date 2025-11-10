
export interface Resume {
  id: number;
  content: string;
  file?: File;
}

export interface CandidateScreeningResult {
  name: string;
  match_score: number;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  red_flags: string[];
}

// Types for Comparison Feature
export interface ComparisonTableRow {
  criteria: string;
  assessments: {
    name: string;
    assessment: string;
  }[];
}

export interface ComparisonAnalysis {
  overall_recommendation: string;
  comparison_table: ComparisonTableRow[];
}
