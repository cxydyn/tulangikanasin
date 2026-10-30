import React, { useRef } from 'react';
import {
  Sparkles,
  AlertCircle,
  FileText,
  Upload,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { SAMPLE_INCIDENTS, SampleIncident } from '../data/sampleIncidents';

interface AiIncidentPanelProps {
  chronology: string;
  onChangeChronology: (text: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
  errorMessage: string | null;
  onDismissError: () => void;
  onSelectPreset: (preset: SampleIncident) => void;
  onFileUpload: (file: File) => void;
  conclusion?: string;
  problem?: string;
}

export const AiIncidentPanel: React.FC<AiIncidentPanelProps> = ({
  chronology,
  onChangeChronology,
  onGenerate,
  isLoading,
  errorMessage,
  onDismissError,
  onSelectPreset,
  onFileUpload,
  conclusion,
  problem,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileUpload(file);
      e.target.value = '';
    }
  };

  return (
    <section className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 no-print transition-all">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-sky-800 uppercase tracking-wider">
              AI Incident Facilitator
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs text-slate-500">Gemini 3.8 Flash Engine</span>
          </div>
          <h2 className="text-base font-bold text-slate-900 mt-0.5">
            Kronologi & Narasi Insiden
          </h2>
        </div>

        {/* Quick Presets & File Import */}
        <div className="flex flex-wrap items-center gap-2" id="presets-section">
          <span className="text-xs font-medium text-slate-500 mr-1">Contoh Insiden:</span>
          {SAMPLE_INCIDENTS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectPreset(item)}
              title={item.title}
              className="px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-sky-50 hover:text-sky-800 text-slate-700 transition-colors border border-slate-200/80 cursor-pointer"
            >
              {item.title.split(' ')[0]} {item.title.split(' ')[1]}...
            </button>
          ))}

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-200 cursor-pointer"
            title="Import File Laporan Insiden JSON"
          >
            <Upload className="w-3 h-3 text-sky-700" />
            <span>Upload JSON</span>
          </button>
        </div>
      </div>

      {/* Input Area and Generate Button */}
      <div className="flex flex-col md:flex-row items-stretch gap-4">
        <div className="flex-1 relative">
          <textarea
            value={chronology}
            onChange={(e) => onChangeChronology(e.target.value)}
            placeholder="Ketik atau tempel kronologi insiden di sini... Contoh: waktu kejadian, gejala abnormalitas mesin, tindakan operator, temuan komponen aus, faktor lingkungan, atau beban operasional. AI akan mengekstrak penyebab ke dalam 6M dan menyusun rekomendasi Action Plan secara otomatis."
            className="w-full h-32 md:h-28 p-3.5 text-sm bg-slate-50/60 border border-slate-300 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700 transition-all resize-y leading-relaxed"
          />
          <div className="flex items-center justify-between mt-1.5 px-1 text-xs text-slate-400">
            <span>Mendukung teks kronologi bahasa Indonesia / Inggris atau format insiden formal</span>
            <span>{chronology.length} karakter</span>
          </div>
        </div>

        <div className="flex flex-col justify-start md:w-56 shrink-0 gap-2">
          <button
            type="button"
            onClick={onGenerate}
            disabled={isLoading || !chronology.trim()}
            className="w-full h-12 md:h-14 px-5 bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2.5 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>Menganalisis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-sky-200" />
                <span>Generate Diagram</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-500 leading-tight text-center px-1">
            Menganalisis kategori Man, Machine, Method, Material, Measurement & Environment
          </p>
        </div>
      </div>

      {/* Error Alert with Dismiss & Advice */}
      {errorMessage && (
        <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start justify-between gap-3 text-rose-800 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">{errorMessage}</p>
              <p className="text-rose-700 mt-0.5 text-[11px]">
                Jika server sibuk, silakan klik ulang tombol &quot;Generate Diagram&quot; atau periksa koneksi internet Anda.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-rose-500 hover:text-rose-800 font-bold px-1.5 py-0.5 text-xs rounded-sm cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Success Summary Banner if analysis already present */}
      {conclusion && (
        <div className="mt-4 p-3.5 bg-sky-50/70 border border-sky-200/80 rounded-lg flex items-start gap-3 text-slate-800 text-xs">
          <CheckCircle2 className="w-4 h-4 text-sky-700 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-sky-950">Masalah Terdeteksi: </span>
            <span className="font-semibold text-slate-900">{problem || 'Masalah'}</span>
            <span className="mx-2 text-slate-400">|</span>
            <span className="font-bold text-sky-950">Kesimpulan Akar Masalah: </span>
            <span className="text-slate-700">{conclusion}</span>
          </div>
        </div>
      )}
    </section>
  );
};
