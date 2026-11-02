import React, { useState } from 'react';
import { X, Sliders, Check, Key, Eye, EyeOff, Sparkles, MoveRight } from 'lucide-react';
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
  const [showKey, setShowKey] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'lines' | 'appearance' | 'api'>('lines');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Pengaturan Diagram, Garis & API
              </h3>
              <p className="text-[11px] text-slate-500">
                Kustomisasi geometri garis tulang, tipografi, dan kunci Gemini API
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-100/60 px-5 pt-2 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('lines')}
            className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'lines'
                ? 'border-sky-800 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Garis & Geometri
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer ${
              activeTab === 'appearance'
                ? 'border-sky-800 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Tipografi & Tampilan
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('api')}
            className={`pb-2.5 px-1 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'api'
                ? 'border-sky-800 text-sky-900'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-3 h-3" />
            <span>Kredensial API Gemini</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-700">
          {activeTab === 'lines' && (
            <div className="space-y-4">
              {/* Sudut Kemiringan Tulang */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-800">
                    Sudut Kemiringan Tulang (Bone Angle)
                  </label>
                  <span className="font-mono text-sky-800 font-bold">
                    {formData.boneAngle || 55}°
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { angle: 45, label: '45° (Landai)' },
                    { angle: 55, label: '55° (Standar)' },
                    { angle: 65, label: '65° (Tegak)' },
                  ].map((preset) => (
                    <button
                      key={preset.angle}
                      type="button"
                      onClick={() => setFormData({ ...formData, boneAngle: preset.angle })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                        (formData.boneAngle || 55) === preset.angle
                          ? 'border-sky-700 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
                <input
                  type="range"
                  min={35}
                  max={75}
                  step={1}
                  value={formData.boneAngle || 55}
                  onChange={(e) =>
                    setFormData({ ...formData, boneAngle: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-800 cursor-pointer"
                />
              </div>

              {/* Jarak Antar Tulang */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-800">
                    Jarak Antar Tulang Kategori (Category Spacing)
                  </label>
                  <span className="font-mono text-sky-800 font-bold">
                    {formData.categorySpacing}px
                  </span>
                </div>
                <input
                  type="range"
                  min={800}
                  max={1600}
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
                  <span>800px (Kompak)</span>
                  <span>1200px (Standar)</span>
                  <span>1600px (Ekstra Luas)</span>
                </div>
              </div>

              {/* Panjang Garis Tulang */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-800">
                    Panjang Garis Tulang (Bone Length)
                  </label>
                  <span className="font-mono text-sky-800 font-bold">
                    {formData.boneLength || 1500}px
                  </span>
                </div>
                <input
                  type="range"
                  min={1100}
                  max={1900}
                  step={50}
                  value={formData.boneLength || 1500}
                  onChange={(e) =>
                    setFormData({ ...formData, boneLength: parseInt(e.target.value, 10) })
                  }
                  className="w-full accent-sky-800 cursor-pointer"
                />
              </div>

              {/* Ketebalan Garis */}
              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Ketebalan Garis Tulang (Stroke Width)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { width: 8, label: 'Halus (8px)' },
                    { width: 12, label: 'Standar (12px)' },
                    { width: 16, label: 'Tebal (16px)' },
                  ].map((preset) => (
                    <button
                      key={preset.width}
                      type="button"
                      onClick={() => setFormData({ ...formData, lineWidth: preset.width })}
                      className={`py-1.5 px-2 rounded-lg border text-center font-medium cursor-pointer transition-colors ${
                        (formData.lineWidth || 12) === preset.width
                          ? 'border-sky-700 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <span className="font-bold">Tips Interaktif:</span> Anda juga dapat menggeser langsung titik kontrol (handle lingkaran) di ujung setiap tulang pada kanvas diagram untuk menyesuaikan sudut atau panjang garis secara individual.
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-4">
              {/* Jenis Font */}
              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Jenis Font (Font Family)
                </label>
                <select
                  value={formData.fontFamily || 'sans'}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      fontFamily: e.target.value as 'sans' | 'serif' | 'mono',
                    })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-800 font-medium focus:outline-hidden focus:ring-2 focus:ring-sky-700/20"
                >
                  <option value="sans">Plus Jakarta Sans (Modern Clean & Direkomendasikan)</option>
                  <option value="serif">Georgia / Modern Serif (Formal Laporan Eksekutif)</option>
                  <option value="mono">JetBrains Mono (Teknis / Engineering)</option>
                </select>
              </div>

              {/* Skala Font */}
              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Skala Ukuran Teks (Font Scale)
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
                  <option value={0.85}>85% (Kompak)</option>
                  <option value={1.0}>100% (Normal - Rekomendasi)</option>
                  <option value={1.15}>115% (Besar / High Legibility)</option>
                  <option value={1.3}>130% (Ekstra Besar)</option>
                </select>
              </div>

              {/* Format Kertas */}
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

              {/* Tema Warna */}
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
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3">
              <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 text-sky-900 text-xs leading-relaxed">
                <div className="font-bold mb-1 flex items-center gap-1.5 text-sky-950">
                  <Sparkles className="w-3.5 h-3.5 text-sky-700" />
                  <span>Di mana Gemini API Key Disimpan?</span>
                </div>
                <p className="mb-1 text-[11px]">
                  <strong>1. Default Server / AI Studio:</strong> API key disimpan aman di environment server (<code className="bg-sky-100 px-1 py-0.5 rounded font-mono">process.env.GEMINI_API_KEY</code>). Kunci ini tidak pernah terekspos di client/GitHub.
                </p>
                <p className="text-[11px]">
                  <strong>2. Kustom / Mandiri (GitHub Deployment):</strong> Jika Anda mendesain aplikasi ini untuk dideploy langsung dari GitHub (misal ke Vercel atau GitHub Pages), Anda dapat memasukkan API Key pribadi Anda di bawah ini. Key disimpan aman di <code className="bg-sky-100 px-1 py-0.5 rounded font-mono">localStorage</code> peramban Anda.
                </p>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-800">
                  Custom Gemini API Key (Opsional)
                </label>
                <div className="relative">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={formData.customApiKey || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, customApiKey: e.target.value.trim() })
                    }
                    placeholder="Kosongkan untuk menggunakan default server (AIzaSy...)"
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Model yang digunakan: <span className="font-mono font-semibold text-slate-700">gemini-2.5-flash</span> (cepat, response structured JSON 6M).
                </p>
              </div>
            </div>
          )}

          {/* Footer buttons */}
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
