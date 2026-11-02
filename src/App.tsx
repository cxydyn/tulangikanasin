import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { AiIncidentPanel } from './components/AiIncidentPanel';
import { FishboneCanvas } from './components/FishboneCanvas';
import { ActionPlanSection } from './components/ActionPlanSection';
import { SettingsModal } from './components/SettingsModal';
import { EditItemModal } from './components/EditItemModal';
import { EditCauseModal } from './components/EditCauseModal';
import {
  ActionPlanRow,
  FishboneCategory,
  FishboneCause,
  FishboneProject,
  FishboneSettings,
  RawAiAnalysisResponse,
} from './types/fishbone';
import {
  buildActionPlanFromAnalysis,
  createId,
  generateDefaultCategories,
  isIncidentReport,
  parseIncidentReport,
} from './utils/fishboneLogic';
import { SampleIncident, SAMPLE_INCIDENTS } from './data/sampleIncidents';

const DEFAULT_SETTINGS: FishboneSettings = {
  categorySpacing: 1200,
  boneAngle: 55,
  boneLength: 1500,
  boneDirection: 'toward-tail',
  lineWidth: 12,
  fontFamily: 'sans',
  headScale: 1.0,
  fontScale: 1.0,
  cardWidth: 480,
  paperSize: 'A3',
  theme: 'ocean',
  customApiKey: '',
};

function getInitialSettings(): FishboneSettings {
  try {
    const saved = localStorage.getItem('fishbone_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Failed to read settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export default function App() {
  const [problem, setProblem] = useState<string>('Masalah');
  const [conclusion, setConclusion] = useState<string>('');
  const [chronology, setChronology] = useState<string>('');
  const [categories, setCategories] = useState<FishboneCategory[]>(generateDefaultCategories());

  const [correctivePlan, setCorrectivePlan] = useState<ActionPlanRow[]>([
    {
      id: 'row-init-1',
      category: 'Machine',
      cause: '',
      subCause: '',
      action: '',
      pic: '',
      dueDate: '',
    },
  ]);

  const [preventivePlan, setPreventivePlan] = useState<ActionPlanRow[]>([
    {
      id: 'row-init-2',
      category: 'Method',
      cause: '',
      subCause: '',
      action: '',
      pic: '',
      dueDate: '',
    },
  ]);

  const [settings, setSettings] = useState<FishboneSettings>(getInitialSettings);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpdateSettings = (newPartial: Partial<FishboneSettings>) => {
    setSettings((prev) => {
      const merged = { ...prev, ...newPartial };
      try {
        localStorage.setItem('fishbone_settings', JSON.stringify(merged));
      } catch (e) {
        console.error('Failed to save settings to localStorage', e);
      }
      return merged;
    });
  };

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [editCauseTarget, setEditCauseTarget] = useState<{
    catIndex: number;
    causeIndex: number;
  } | null>(null);
  const [editTarget, setEditTarget] = useState<{
    type: 'problem' | 'category' | 'cause' | 'detail';
    catIndex?: number;
    causeIndex?: number;
    detailIndex?: number;
    currentText: string;
  } | null>(null);

  const fileInputGlobalRef = useRef<HTMLInputElement>(null);

  // References for scrolling
  const diagramRef = useRef<HTMLDivElement>(null);
  const actionPlanRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Execute AI Analysis via Server
  const handleRunAnalysis = async (customText?: string) => {
    const textToAnalyze = customText || chronology;
    if (!textToAnalyze || !textToAnalyze.trim()) {
      setErrorMessage('Harap masukkan atau pilih narasi kronologi insiden terlebih dahulu.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (settings.customApiKey?.trim()) {
        headers['x-gemini-api-key'] = settings.customApiKey.trim();
      }

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          description: textToAnalyze,
          customApiKey: settings.customApiKey?.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || data.error) {
        throw new Error(data.error || `HTTP error ${response.status}`);
      }

      const aiResponse = data as RawAiAnalysisResponse;

      // 1. Set Problem & Conclusion
      if (aiResponse.problem) {
        setProblem(aiResponse.problem);
      }
      if (aiResponse.conclusion) {
        setConclusion(aiResponse.conclusion);
      }

      // 2. Build Categories & Causes
      if (Array.isArray(aiResponse.analysis)) {
        const newCategories: FishboneCategory[] = aiResponse.analysis.map((catItem, idx) => ({
          id: `cat-${idx}-${catItem.category.toLowerCase()}`,
          category: catItem.category,
          isTop: idx % 2 === 0,
          causes: Array.isArray(catItem.causes)
            ? catItem.causes.map((c, cIdx) => ({
                id: `cause-${idx}-${cIdx}-${Date.now()}`,
                cause: typeof c === 'string' ? c : c.cause || '',
                details: Array.isArray(c.details) ? c.details : [],
                actionPlan: c.action_plan || '',
              }))
            : [],
        }));
        setCategories(newCategories);

        // 3. Populate Action Plan Tables
        const { corrective, preventive } = buildActionPlanFromAnalysis(aiResponse.analysis);
        if (corrective.length > 0) setCorrectivePlan(corrective);
        if (preventive.length > 0) setPreventivePlan(preventive);
      }

      // Smooth scroll down to the diagram
      setTimeout(() => {
        diagramRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 250);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Failed to run AI analysis:', err);
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Presets selector
  const handleSelectPreset = (preset: SampleIncident) => {
    setChronology(preset.narrative);
    setErrorMessage(null);
  };

  // Load Project JSON or Incident Report JSON
  const handleLoadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);

        if (isIncidentReport(parsed)) {
          // Incident report format detected!
          const { problem: incProblem, chronology: incChronology, importedActions } =
            parseIncidentReport(parsed);

          setProblem(incProblem);
          setChronology(incChronology);

          // Append pre-existing report actions to corrective plan if any
          if (importedActions.length > 0) {
            const mappedRows: ActionPlanRow[] = importedActions.map((act) => ({
              id: createId(),
              category: '',
              cause: '',
              subCause: '',
              action: act.action,
              pic: act.followUpBy || '',
              dueDate: act.completionDate || '',
            }));
            setCorrectivePlan((prev) => [...prev, ...mappedRows]);
          }

          // Automatically trigger AI analysis
          handleRunAnalysis(incChronology);
        } else {
          // Standard Fishbone Project format
          const project = parsed as FishboneProject;
          if (project.problem) setProblem(project.problem);
          if (project.conclusion) setConclusion(project.conclusion);
          if (project.chronology) setChronology(project.chronology);
          if (project.settings) setSettings({ ...DEFAULT_SETTINGS, ...project.settings });

          if (Array.isArray(project.analysis)) {
            const loadedCats: FishboneCategory[] = project.analysis.map((catItem, idx) => ({
              id: `cat-${idx}-${catItem.category.toLowerCase()}`,
              category: catItem.category,
              isTop: idx % 2 === 0,
              causes: (catItem.causes || []).map((c, cIdx) => ({
                id: `cause-${idx}-${cIdx}`,
                cause: c.cause,
                details: c.details || [],
                actionPlan: c.action_plan || '',
              })),
            }));
            setCategories(loadedCats);
          }

          if (Array.isArray(project.correctivePlan) && project.correctivePlan.length > 0) {
            setCorrectivePlan(project.correctivePlan);
          }
          if (Array.isArray(project.preventivePlan) && project.preventivePlan.length > 0) {
            setPreventivePlan(project.preventivePlan);
          }
        }
      } catch (err) {
        alert('Gagal memuat file. Format JSON tidak sesuai.');
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  // Save Project as JSON
  const handleSaveProject = () => {
    const projectData: FishboneProject = {
      timestamp: new Date().toISOString(),
      chronology,
      problem,
      conclusion,
      analysis: categories.map((cat) => ({
        category: cat.category,
        causes: cat.causes.map((c) => ({
          cause: c.cause,
          details: c.details,
          action_plan: c.actionPlan,
        })),
      })),
      correctivePlan,
      preventivePlan,
      settings,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(projectData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `Fishbone_RCA_${problem.replace(/[^a-zA-Z0-9]/g, '_')}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Reset Project to Default 6M
  const handleResetProject = () => {
    if (confirm('Reset diagram dan tabel ke template awal? Data saat ini akan dibersihkan.')) {
      setProblem('Masalah');
      setConclusion('');
      setChronology('');
      setCategories(generateDefaultCategories());
      setCorrectivePlan([
        {
          id: createId(),
          category: 'Machine',
          cause: '',
          subCause: '',
          action: '',
          pic: '',
          dueDate: '',
        },
      ]);
      setPreventivePlan([
        {
          id: createId(),
          category: 'Method',
          cause: '',
          subCause: '',
          action: '',
          pic: '',
          dueDate: '',
        },
      ]);
      setSettings(DEFAULT_SETTINGS);
    }
  };

  // Edit Text Modal Save Handler
  const handleSaveModalText = (newText: string) => {
    if (!editTarget) return;

    if (editTarget.type === 'problem') {
      setProblem(newText);
    } else if (editTarget.type === 'category' && editTarget.catIndex !== undefined) {
      const updated = [...categories];
      updated[editTarget.catIndex].category = newText;
      setCategories(updated);
    } else if (
      editTarget.type === 'cause' &&
      editTarget.catIndex !== undefined &&
      editTarget.causeIndex !== undefined
    ) {
      const updated = [...categories];
      updated[editTarget.catIndex].causes[editTarget.causeIndex].cause = newText;
      setCategories(updated);
    } else if (
      editTarget.type === 'detail' &&
      editTarget.catIndex !== undefined &&
      editTarget.causeIndex !== undefined &&
      editTarget.detailIndex !== undefined
    ) {
      const updated = [...categories];
      updated[editTarget.catIndex].causes[editTarget.causeIndex].details[editTarget.detailIndex] =
        newText;
      setCategories(updated);
    }
  };

  // Full Cause & Sub-cause Modal Save Handler
  const handleSaveCause = (
    catIndex: number,
    causeIndex: number,
    updatedCause: FishboneCause
  ) => {
    const oldCause = categories[catIndex]?.causes[causeIndex]?.cause || '';
    const catName = categories[catIndex]?.category || '';

    // 1. Update categories state
    const updatedCats = [...categories];
    updatedCats[catIndex].causes[causeIndex] = updatedCause;
    setCategories(updatedCats);

    // 2. Synchronize correctivePlan & preventivePlan
    const syncPlan = (rows: ActionPlanRow[]) =>
      rows.map((row) => {
        if (row.category === catName && row.cause === oldCause) {
          return {
            ...row,
            cause: updatedCause.cause,
            subCause: updatedCause.details.join('; '),
            action: updatedCause.actionPlan || row.action,
          };
        }
        return row;
      });

    setCorrectivePlan((prev) => syncPlan(prev));
    setPreventivePlan((prev) => syncPlan(prev));
  };

  // Delete Cause Handler
  const handleDeleteCause = (catIndex: number, causeIndex: number) => {
    const oldCause = categories[catIndex]?.causes[causeIndex]?.cause || '';
    const catName = categories[catIndex]?.category || '';

    const updatedCats = [...categories];
    updatedCats[catIndex].causes.splice(causeIndex, 1);
    setCategories(updatedCats);

    // Clean up corresponding rows in action plan tables
    setCorrectivePlan((prev) =>
      prev.filter((r) => !(r.category === catName && r.cause === oldCause))
    );
    setPreventivePlan((prev) =>
      prev.filter((r) => !(r.category === catName && r.cause === oldCause))
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Hidden Global File Input */}
      <input
        ref={fileInputGlobalRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleLoadFile(file);
            e.target.value = '';
          }
        }}
      />

      {/* Top Header */}
      <Header
        onSave={handleSaveProject}
        onLoadClick={() => fileInputGlobalRef.current?.click()}
        onPrint={() => window.print()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onReset={handleResetProject}
        onScrollToDiagram={() => diagramRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onScrollToActionPlan={() => actionPlanRef.current?.scrollIntoView({ behavior: 'smooth' })}
        onScrollToPresets={() => {
          const el = document.getElementById('presets-section');
          el?.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Incident Narrative / AI Facilitator Panel */}
        <div ref={panelRef}>
          <AiIncidentPanel
            chronology={chronology}
            onChangeChronology={setChronology}
            onGenerate={() => handleRunAnalysis()}
            isLoading={isLoading}
            errorMessage={errorMessage}
            onDismissError={() => setErrorMessage(null)}
            onSelectPreset={handleSelectPreset}
            onFileUpload={handleLoadFile}
            conclusion={conclusion}
            problem={problem}
          />
        </div>

        {/* Executive Print Report Header (Visible only on Print / PDF export) */}
        <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-extrabold uppercase tracking-tight text-slate-900">
                Laporan Analisis Akar Masalah (Root Cause Analysis - Ishikawa 6M)
              </h1>
              <p className="text-xs text-slate-600 font-semibold mt-0.5">
                Metode Fishbone 6M & Rencana Aksi Korektif/Preventif Terintegrasi
              </p>
            </div>
            <div className="text-right text-[11px] text-slate-600">
              <div>Tanggal: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</div>
              <div className="font-semibold text-slate-800">Status: Terverifikasi</div>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-3 gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-300 text-xs">
            <div>
              <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
                Pernyataan Masalah (Problem Statement)
              </span>
              <span className="font-extrabold text-sky-950 text-sm">{problem || '-'}</span>
            </div>
            <div className="col-span-2">
              <span className="font-bold text-slate-800 block text-[10px] uppercase tracking-wider">
                Ringkasan Kesimpulan Akar Masalah (Conclusion)
              </span>
              <span className="text-slate-800 italic">{conclusion || 'Belum diisi atau dianalisis'}</span>
            </div>
          </div>
        </div>

        {/* Fishbone Diagram Canvas */}
        <div ref={diagramRef} className="space-y-2">
          <div className="flex items-center justify-between px-1 no-print">
            <h2 className="text-base font-bold text-slate-900">
              Visualisasi Diagram Ishikawa (6M)
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Format: {settings.paperSize} Landscape · Spacing: {settings.categorySpacing}px
            </span>
          </div>

          <FishboneCanvas
            categories={categories}
            problem={problem}
            onUpdateProblem={setProblem}
            onUpdateCategories={setCategories}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onOpenEditModal={setEditTarget}
            onOpenEditCause={(catIndex, causeIndex) =>
              setEditCauseTarget({ catIndex, causeIndex })
            }
          />
        </div>

        {/* Action Plan Section: Corrective & Preventive */}
        <div ref={actionPlanRef}>
          <ActionPlanSection
            correctivePlan={correctivePlan}
            preventivePlan={preventivePlan}
            onChangeCorrective={setCorrectivePlan}
            onChangePreventive={setPreventivePlan}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 px-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 Fishbone Diagram AI Pro · Root Cause Analysis Facilitator.</p>
          <div className="flex items-center gap-4 text-slate-600 font-medium">
            <span>Standar 6M (Man, Machine, Method, Material, Measurement, Environment)</span>
          </div>
        </div>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleUpdateSettings}
      />

      {/* Edit Text Modal */}
      <EditItemModal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        target={editTarget}
        onSave={handleSaveModalText}
      />

      {/* Edit Cause & Sub-cause Modal */}
      {editCauseTarget && (
        <EditCauseModal
          isOpen={Boolean(editCauseTarget)}
          onClose={() => setEditCauseTarget(null)}
          catIndex={editCauseTarget.catIndex}
          causeIndex={editCauseTarget.causeIndex}
          categoryName={categories[editCauseTarget.catIndex]?.category || ''}
          causeData={
            categories[editCauseTarget.catIndex]?.causes[editCauseTarget.causeIndex] || null
          }
          onSave={handleSaveCause}
          onDelete={handleDeleteCause}
        />
      )}
    </div>
  );
}
