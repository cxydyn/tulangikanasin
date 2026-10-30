export interface FishboneCause {
  id: string;
  cause: string;
  details: string[];
  actionPlan?: string;
}

export interface FishboneCategory {
  id: string;
  category: string;
  causes: FishboneCause[];
  isTop: boolean;
  customX?: number;
  customY?: number;
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
  headScale: number;
  fontScale: number;
  paperSize: 'A3' | 'A4';
  theme: 'ocean' | 'slate' | 'emerald';
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
