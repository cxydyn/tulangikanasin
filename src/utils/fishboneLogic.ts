import {
  ActionPlanRow,
  FishboneCategory,
  FishboneProject,
  IncidentReportFormat,
  RawAiAnalysisResponse,
} from '../types/fishbone';

export const DEFAULT_6M_CATEGORIES = [
  'Machine',
  'Method',
  'Material',
  'Measurement',
  'Man',
  'Environment',
];

export function createId(): string {
  return Math.random().toString(36).substring(2, 9) + Date.now().toString(36).substring(4);
}

export function generateDefaultCategories(): FishboneCategory[] {
  return DEFAULT_6M_CATEGORIES.map((cat, idx) => ({
    id: `cat-${idx}-${cat.toLowerCase()}`,
    category: cat,
    causes: [],
    isTop: idx % 2 === 0,
  }));
}

export function wrapTextLines(text: string, maxCharsPerLine: number = 32): string[] {
  if (!text || text.trim() === '') return [''];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (!currentLine) {
      currentLine = word;
    } else if ((currentLine + ' ' + word).length <= maxCharsPerLine) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export function calculateDiagramLayout(
  categoryCount: number,
  categorySpacing: number = 1200
) {
  const startX = 600;
  const count = Math.max(1, categoryCount);
  const totalSpineWidth = startX + count * categorySpacing + 400;
  const viewBoxWidth = Math.max(7600, totalSpineWidth + 1200);
  const viewBoxHeight = 3600;
  const spineY = 1800;

  return {
    startX,
    totalSpineWidth,
    viewBoxWidth,
    viewBoxHeight,
    spineY,
  };
}

export function isIncidentReport(data: unknown): data is IncidentReportFormat {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return Boolean(
    (obj.executiveSummary && typeof obj.executiveSummary === 'object') ||
      (obj.sequenceOfEvents && Array.isArray(obj.sequenceOfEvents))
  );
}

export function parseIncidentReport(report: IncidentReportFormat): {
  problem: string;
  chronology: string;
  importedActions: { action: string; followUpBy?: string; completionDate?: string }[];
} {
  let problem = 'Masalah';
  if (report.executiveSummary?.incidentTitle) {
    problem = report.executiveSummary.incidentTitle.trim();
  }

  const sections: string[] = [];

  if (report.executiveSummary?.narrative) {
    sections.push(`Narrative:\n${report.executiveSummary.narrative.trim()}`);
  }
  if (report.executiveSummary?.conclusion) {
    sections.push(`Conclusion:\n${report.executiveSummary.conclusion.trim()}`);
  }

  if (Array.isArray(report.sequenceOfEvents) && report.sequenceOfEvents.length > 0) {
    const events = report.sequenceOfEvents
      .map((evt) => {
        const time = evt.time ? `[${evt.time}] ` : '';
        const remarks = evt.remarks ? ` (${evt.remarks})` : '';
        return `- ${time}${evt.activity || 'Incident step'}${remarks}`;
      })
      .join('\n');
    sections.push(`Sequence of Events:\n${events}`);
  }

  if (report.rootCauses && typeof report.rootCauses === 'object') {
    const causes = Object.keys(report.rootCauses)
      .filter((k) => report.rootCauses && report.rootCauses[k] === true)
      .map((k) => k.replace(/^is/, ''));
    if (causes.length > 0) {
      sections.push(`Root Cause Categories Indicated: ${causes.join(', ')}`);
    }
  }

  return {
    problem,
    chronology: sections.join('\n\n'),
    importedActions: report.actionPlan || [],
  };
}

export function buildActionPlanFromAnalysis(
  analysis: RawAiAnalysisResponse['analysis']
): { corrective: ActionPlanRow[]; preventive: ActionPlanRow[] } {
  const corrective: ActionPlanRow[] = [];
  const preventive: ActionPlanRow[] = [];

  if (!Array.isArray(analysis)) {
    return { corrective, preventive };
  }

  for (const catItem of analysis) {
    const catName = catItem.category || 'General';
    if (!Array.isArray(catItem.causes)) continue;

    for (const causeItem of catItem.causes) {
      const causeText = typeof causeItem === 'string' ? causeItem : causeItem.cause || '';
      let subCauseText = '';

      if (Array.isArray(causeItem.details) && causeItem.details.length > 0) {
        subCauseText = causeItem.details.map((d) => `• ${d}`).join('\n');
      }

      const actionText = causeItem.action_plan || '';

      const rowBase = {
        category: catName,
        cause: causeText,
        subCause: subCauseText,
        action: actionText,
        pic: '',
        dueDate: '',
      };

      corrective.push({ ...rowBase, id: createId() });
      preventive.push({ ...rowBase, id: createId() });
    }
  }

  return { corrective, preventive };
}

export function exportToCsv(rows: ActionPlanRow[], title: string): void {
  const headers = ['Category', 'Cause', 'Sub Cause', 'Action Plan', 'PIC', 'Due Date'];
  const csvContent = [
    headers.map((h) => `"${h}"`).join(','),
    ...rows.map((row) =>
      [
        row.category,
        row.cause,
        row.subCause,
        row.action,
        row.pic,
        row.dueDate,
      ]
        .map((val) => `"${(val || '').replace(/"/g, '""')}"`)
        .join(',')
    ),
  ].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${title.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
