import React, { useState, useEffect } from 'react';
import { X, Check, Edit3 } from 'lucide-react';

interface EditItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  target: {
    type: 'problem' | 'category' | 'cause' | 'detail';
    catIndex?: number;
    causeIndex?: number;
    detailIndex?: number;
    currentText: string;
  } | null;
  onSave: (text: string) => void;
}

export const EditItemModal: React.FC<EditItemModalProps> = ({
  isOpen,
  onClose,
  target,
  onSave,
}) => {
  const [text, setText] = useState<string>('');

  useEffect(() => {
    if (target) {
      setText(target.currentText || '');
    }
  }, [target]);

  if (!isOpen || !target) return null;

  const getTitle = () => {
    switch (target.type) {
      case 'problem':
        return 'Edit Masalah Utama (Kepala Ikan)';
      case 'category':
        return 'Edit Nama Kategori (Bone)';
      case 'cause':
        return 'Edit Penyebab (Cause)';
      case 'detail':
        return 'Edit Detail Sub-Penyebab';
      default:
        return 'Edit Teks';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSave(text.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 no-print animate-in fade-in duration-150">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-sky-800" />
            <h3 className="font-bold text-sm text-slate-900">{getTitle()}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Teks Baru:
            </label>
            <textarea
              autoFocus
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-sky-700/20 focus:border-sky-700"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!text.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-900 disabled:bg-slate-300 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
