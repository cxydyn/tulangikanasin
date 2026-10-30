import React, { useState, useRef } from 'react';
import { Header } from './components/Header';
import { AiIncidentPanel } from './components/AiIncidentPanel';
import { FishboneCanvas } from './components/FishboneCanvas';
import { ActionPlanSection } from './components/ActionPlanSection';
import { SettingsModal } from './components/SettingsModal';
import { EditItemModal } from './components/EditItemModal';
import {
  ActionPlanRow,
  FishboneCategory,
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
  categorySpacing: 900,
  headScale: 1.0,
  fontScale: 1.0,
  paperSize: 'A3',
  theme: 'ocean',
};

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

  const [settings, setSettings] = useState<FishboneSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
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
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: textToAnalyze }),
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

        {/* Fishbone Diagram Canvas */}
        <div ref={diagramRef} className="space-y-2">
          <div className="flex items-center justify-between px-1">
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
            onUpdateSettings={(newPartial) => setSettings({ ...settings, ...newPartial })}
            onOpenEditModal={setEditTarget}
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
        onSave={(newSettings) => setSettings(newSettings)}
      />

      {/* Edit Text Modal */}
      <EditItemModal
        isOpen={Boolean(editTarget)}
        onClose={() => setEditTarget(null)}
        target={editTarget}
        onSave={handleSaveModalText}
      />
    </div>
  );
}
