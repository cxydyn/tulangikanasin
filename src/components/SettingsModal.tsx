import React, { useState } from 'react';
import { X, Sliders, Check } from 'lucide-react';
import { FishboneSettings } from '../types/fishbone';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: FishboneSettings;
  onSave: (newSettings: FishboneSettings) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
}) => {
  const [formData, setFormData] = useState<FishboneSettings>(settings);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-800" />
            <h3 className="font-bold text-sm text-slate-900">
              Pengaturan Diagram & Cetak
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Format Kertas (Print PDF)
            </label>
            <select
              value={formData.paperSize}
              onChange={(e) =>
                setFormData({ ...formData, paperSize: e.target.value as 'A3' | 'A4' })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20"
            >
              <option value="A3">A3 Landscape (420 x 297 mm) - Rekomendasi RCA</option>
              <option value="A4">A4 Landscape (297 x 210 mm) - Dokumen Standar</option>
            </select>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="font-semibold text-slate-800">
                Jarak Antar Tulang (Category Spacing)
              </label>
              <span className="font-mono text-sky-800 font-bold">
                {formData.categorySpacing}px
              </span>
            </div>
            <input
              type="range"
              min={600}
              max={1400}
              step={50}
              value={formData.categorySpacing}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  categorySpacing: parseInt(e.target.value, 10),
                })
              }
              className="w-full accent-sky-800 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
              <span>Rapat (600px)</span>
              <span>Default (900px)</span>
              <span>Lebar (1400px)</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Skala Ukuran Huruf (Font Scale)
            </label>
            <select
              value={formData.fontScale}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  fontScale: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20"
            >
              <option value={0.8}>Kecil (80%)</option>
              <option value={1.0}>Normal (100%) - Rekomendasi</option>
              <option value={1.2}>Besar (120%)</option>
              <option value={1.4}>Ekstra Besar (140%)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold mb-1 text-slate-800">
              Tema Warna Diagram
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'ocean', label: 'Ocean Blue', color: 'bg-sky-800' },
                { id: 'slate', label: 'Dark Slate', color: 'bg-slate-800' },
                { id: 'emerald', label: 'Industrial Green', color: 'bg-emerald-800' },
              ].map((themeItem) => (
                <button
                  key={themeItem.id}
                  type="button"
                  onClick={() =>
                    setFormData({
                      ...formData,
                      theme: themeItem.id as FishboneSettings['theme'],
                    })
                  }
                  className={`p-2 rounded-lg border text-left flex items-center gap-2 cursor-pointer transition-all ${
                    formData.theme === themeItem.id
                      ? 'border-sky-800 bg-sky-50 text-sky-950 font-semibold'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span className={`w-3.5 h-3.5 rounded-full ${themeItem.color} shrink-0`} />
                  <span className="truncate">{themeItem.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan & Terapkan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
