
export interface PatientIntake {
  id: string;
  timestamp: string;
  rawSymptoms: string;
  summary: AIAnalysis;
}

export interface AIAnalysis {
  briefSummary: string;
  extractedSymptoms: string[];
  possibleCauses: string[];
  redFlags: string[];
  riskScore: number; // 0-100
  urgency: 'Low' | 'Medium' | 'High' | 'Emergency';
}

export enum Page {
  INTAKE = 'intake',
  DASHBOARD = 'dashboard'
}
