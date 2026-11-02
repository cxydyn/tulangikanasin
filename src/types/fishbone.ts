export interface FishboneCause {
  id: string;
  cause: string;
  details: string[];
  actionPlan?: string;
  customX?: number;
  customY?: number;
  customWidth?: number;
  customHeight?: number;
}

export interface FishboneCategory {
  id: string;
  category: string;
  causes: FishboneCause[];
  isTop: boolean;
  customX?: number;
  customY?: number;
  customAngle?: number;
  customLength?: number;
}

export interface ActionPlanRow {
  id: string;
  category: string;
  cause: string;
  subCause: string;
  action: string;
  pic: string;
  dueDate: string;
}

export interface FishboneSettings {
  categorySpacing: number;
  boneAngle: number;
  boneLength: number;
  boneDirection: 'toward-tail' | 'toward-head';
  lineWidth: number;
  fontFamily: 'sans' | 'serif' | 'mono';
  headScale: number;
  fontScale: number;
  cardWidth: number;
  paperSize: 'A3' | 'A4';
  theme: 'ocean' | 'slate' | 'emerald';
  customApiKey?: string;
}

export interface FishboneProject {
  timestamp: string;
  chronology: string;
  problem: string;
  conclusion?: string;
  analysis: {
    category: string;
    causes: {
      cause: string;
      details: string[];
      action_plan?: string;
    }[];
  }[];
  correctivePlan: ActionPlanRow[];
  preventivePlan: ActionPlanRow[];
  settings: FishboneSettings;
}

export interface RawAiAnalysisResponse {
  problem?: string;
  conclusion?: string;
  analysis: {
    category: string;
    causes: {
      cause: string;
      details?: string[];
      action_plan?: string;
    }[];
  }[];
}

export interface IncidentReportFormat {
  executiveSummary?: {
    incidentTitle?: string;
    narrative?: string;
    conclusion?: string;
  };
  incidentDetails?: Record<string, unknown>;
  sequenceOfEvents?: {
    time?: string;
    activity?: string;
    remarks?: string;
  }[];
  rootCauses?: Record<string, boolean>;
  actionPlan?: {
    action: string;
    followUpBy?: string;
    completionDate?: string;
  }[];
}
