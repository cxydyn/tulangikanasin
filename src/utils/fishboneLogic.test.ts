import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDiagramLayout,
  wrapTextLines,
  isIncidentReport,
  parseIncidentReport,
  buildActionPlanFromAnalysis,
  generateDefaultCategories,
} from './fishboneLogic';

test('generateDefaultCategories returns standard 6M categories with alternating top/bottom', () => {
  const cats = generateDefaultCategories();
  assert.equal(cats.length, 6);
  assert.equal(cats[0].category, 'Machine');
  assert.equal(cats[0].isTop, true);
  assert.equal(cats[1].category, 'Method');
  assert.equal(cats[1].isTop, false);
  assert.equal(cats[4].category, 'Man');
  assert.equal(cats[4].isTop, true);
});

test('calculateDiagramLayout expands viewBox and spine width based on category count and spacing', () => {
  const layout = calculateDiagramLayout(6, 1200);
  assert.equal(layout.startX, 600);
  // startX (600) + 6 * 1200 + 400 = 8200
  assert.equal(layout.totalSpineWidth, 8200);
  assert.ok(layout.viewBoxWidth >= 9400);
  assert.equal(layout.spineY, 1800);
});

test('wrapTextLines wraps strings without breaking words when within limit', () => {
  const text = 'Operator tidak mengikuti SOP keselamatan kerja harian';
  const lines = wrapTextLines(text, 25);
  assert.ok(lines.length >= 2);
  assert.equal(lines.join(' '), text);
});

test('isIncidentReport detects valid incident JSON reports', () => {
  const report = {
    executiveSummary: {
      incidentTitle: 'Kebocoran Tangki T-102',
      narrative: 'Terjadi pelepasan uap...',
    },
    sequenceOfEvents: [{ time: '08:00', activity: 'Inspeksi awal' }],
  };
  assert.equal(isIncidentReport(report), true);
  assert.equal(isIncidentReport({ foo: 'bar' }), false);
  assert.equal(isIncidentReport(null), false);
});

test('parseIncidentReport extracts problem statement and combined narrative', () => {
  const report = {
    executiveSummary: {
      incidentTitle: 'Pompa Slurry Overheat',
      narrative: 'Temperatur bearing meningkat melebihi batas 90°C.',
      conclusion: 'Bearing aus akibat kekurangan pelumasan.',
    },
    sequenceOfEvents: [
      { time: '14:15', activity: 'Alarm berbunyi', remarks: 'High Temp Sensor' },
    ],
    rootCauses: {
      isMachine: true,
      isMethod: true,
      isMan: false,
    },
    actionPlan: [
      { action: 'Ganti bearing dan seal pompa', followUpBy: 'Maintenance', completionDate: '2026-11-05' },
    ],
  };

  const parsed = parseIncidentReport(report);
  assert.equal(parsed.problem, 'Pompa Slurry Overheat');
  assert.ok(parsed.chronology.includes('Narrative:'));
  assert.ok(parsed.chronology.includes('Temperatur bearing'));
  assert.ok(parsed.chronology.includes('Sequence of Events:'));
  assert.ok(parsed.chronology.includes('[14:15] Alarm berbunyi'));
  assert.ok(parsed.chronology.includes('Machine, Method'));
  assert.equal(parsed.importedActions.length, 1);
});

test('buildActionPlanFromAnalysis generates corrective and preventive plan rows from 6M analysis', () => {
  const analysis = [
    {
      category: 'Machine',
      causes: [
        {
          cause: 'Sensor vibrasi rusak',
          details: ['Kabel sensor putus akibat getaran', 'Belum dilakukan kalibrasi tahunan'],
          action_plan: 'Pasang pelindung kabel flexibel dan jadwalkan kalibrasi berkala',
        },
      ],
    },
  ];

  const { corrective, preventive } = buildActionPlanFromAnalysis(analysis);
  assert.equal(corrective.length, 1);
  assert.equal(preventive.length, 1);
  assert.equal(corrective[0].category, 'Machine');
  assert.equal(corrective[0].cause, 'Sensor vibrasi rusak');
  assert.ok(corrective[0].subCause.includes('Kabel sensor putus'));
  assert.equal(corrective[0].action, 'Pasang pelindung kabel flexibel dan jadwalkan kalibrasi berkala');
});
