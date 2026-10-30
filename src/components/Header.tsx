import React from 'react';
import {
  Save,
  FolderOpen,
  Printer,
  Sliders,
  RotateCcw,
  Sparkles,
  FileSpreadsheet,
} from 'lucide-react';

interface HeaderProps {
  onSave: () => void;
  onLoadClick: () => void;
  onPrint: () => void;
  onOpenSettings: () => void;
  onReset: () => void;
  onScrollToDiagram: () => void;
  onScrollToActionPlan: () => void;
  onScrollToPresets: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onSave,
  onLoadClick,
  onPrint,
  onOpenSettings,
  onReset,
  onScrollToDiagram,
  onScrollToActionPlan,
  onScrollToPresets,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs px-4 lg:px-8 py-3 transition-colors no-print">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-9 h-9 rounded-lg bg-sky-800 text-white flex items-center justify-center font-bold shadow-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-5 h-5">
              <path d="M2 12h20M7 5l5 7-5 7M15 7l3 5-3 5M20 12l2-3v6l-2-3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-extrabold tracking-tight text-slate-900 leading-tight whitespace-nowrap">
              Fishbone AI Pro
            </h1>
            <p className="text-xs text-slate-500 font-medium whitespace-nowrap">
              Root Cause & Action Plan Facilitator
            </p>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={onScrollToDiagram}
            className="hover:text-sky-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Diagram Tulang Ikan
          </button>
          <button
            type="button"
            onClick={onScrollToActionPlan}
            className="hover:text-sky-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Tabel Action Plan
          </button>
          <button
            type="button"
            onClick={onScrollToPresets}
            className="hover:text-sky-800 transition-colors whitespace-nowrap cursor-pointer"
          >
            Preset Insiden
          </button>
        </nav>

        {/* Zone 3: Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            title="Reset Diagram ke Default"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            aria-label="Reset Diagram"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onOpenSettings}
            title="Pengaturan Jarak & Font Diagram"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>Layout</span>
          </button>

          <button
            type="button"
            onClick={onLoadClick}
            title="Buka File JSON Proyek atau Laporan Insiden"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <FolderOpen className="w-3.5 h-3.5 text-sky-700" />
            <span className="hidden sm:inline">Buka</span>
          </button>

          <button
            type="button"
            onClick={onSave}
            title="Simpan Proyek ke File JSON"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5 text-emerald-700" />
            <span className="hidden sm:inline">Simpan</span>
          </button>

          <button
            type="button"
            onClick={onPrint}
            title="Cetak PDF atau Format Landscape A3/A4"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 shadow-xs rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak PDF</span>
          </button>
        </div>
      </div>
    </header>
  );
};
