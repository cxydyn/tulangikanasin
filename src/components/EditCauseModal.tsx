import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Plus, Sparkles, AlertCircle } from 'lucide-react';
import { FishboneCause } from '../types/fishbone';

interface EditCauseModalProps {
  isOpen: boolean;
  onClose: () => void;
  catIndex: number;
  causeIndex: number;
  categoryName: string;
  causeData: FishboneCause | null;
  onSave: (catIndex: number, causeIndex: number, updatedCause: FishboneCause) => void;
  onDelete: (catIndex: number, causeIndex: number) => void;
}

export const EditCauseModal: React.FC<EditCauseModalProps> = ({
  isOpen,
  onClose,
  catIndex,
  causeIndex,
  categoryName,
  causeData,
  onSave,
  onDelete,
}) => {
  const [causeText, setCauseText] = useState<string>('');
  const [details, setDetails] = useState<string[]>([]);
  const [actionPlan, setActionPlan] = useState<string>('');

  useEffect(() => {
    if (causeData) {
      setCauseText(causeData.cause || '');
      setDetails(Array.isArray(causeData.details) ? [...causeData.details] : []);
      setActionPlan(causeData.actionPlan || '');
    }
  }, [causeData]);

  if (!isOpen || !causeData) return null;

  const handleDetailChange = (index: number, val: string) => {
    const updated = [...details];
    updated[index] = val;
    setDetails(updated);
  };

  const handleAddDetail = () => {
    setDetails([...details, '']);
  };

  const handleRemoveDetail = (index: number) => {
    setDetails(details.filter((_, idx) => idx !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!causeText.trim()) return;

    onSave(catIndex, causeIndex, {
      id: causeData.id,
      cause: causeText.trim(),
      details: details.filter((d) => d.trim().length > 0),
      actionPlan: actionPlan.trim(),
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Hapus penyebab ini dari diagram dan tabel rencana aksi?')) {
      onDelete(catIndex, causeIndex);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-sky-100 text-sky-800 uppercase tracking-wider">
                {categoryName}
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 font-medium">Edit Cause & Sub-causes</span>
            </div>
            <h3 className="font-bold text-sm text-slate-900 mt-0.5">
              Edit Penyebab & Rincian Detail
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Main Cause */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Penyebab Utama (Cause):
            </label>
            <textarea
              autoFocus
              rows={2}
              value={causeText}
              onChange={(e) => setCauseText(e.target.value)}
              placeholder="Contoh: Mechanical seal aus melebihi jam operasional rekomendasi"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700 font-medium leading-relaxed"
            />
          </div>

          {/* Sub-causes / Details List */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-800">
                Sub-Penyebab / Rincian Teknis (Sub-causes):
              </label>
              <button
                type="button"
                onClick={handleAddDetail}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-700 hover:text-sky-900 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Detail</span>
              </button>
            </div>

            <div className="space-y-2">
              {details.length === 0 ? (
                <div className="p-3 text-center bg-slate-50 border border-dashed border-slate-200 rounded-lg text-slate-400">
                  Belum ada sub-penyebab. Klik &quot;Tambah Detail&quot; untuk menambahkan rincian.
                </div>
              ) : (
                details.map((det, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <span className="w-5 h-7 flex items-center justify-center font-bold text-slate-400">
                      •
                    </span>
                    <textarea
                      rows={2}
                      value={det}
                      onChange={(e) => handleDetailChange(idx, e.target.value)}
                      placeholder={`Rincian teknis sub-penyebab #${idx + 1}`}
                      className="flex-1 p-2 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20 leading-snug resize-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveDetail(idx)}
                      title="Hapus detail ini"
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer mt-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Action Plan Recommendation */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Rekomendasi Tindakan (Action Plan):
            </label>
            <textarea
              rows={2}
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              placeholder="Contoh: Implementasikan sistem penggantian berkala dan integrasikan jadwal maintenance dengan sistem ERP pengadaan"
              className="w-full p-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700 leading-relaxed"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Penyebab</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!causeText.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
