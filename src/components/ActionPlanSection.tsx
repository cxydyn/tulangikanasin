import React from 'react';
import { Plus, Trash2, Download, PlusCircle } from 'lucide-react';
import { ActionPlanRow } from '../types/fishbone';
import { exportToCsv } from '../utils/fishboneLogic';

interface ActionPlanSectionProps {
  correctivePlan: ActionPlanRow[];
  preventivePlan: ActionPlanRow[];
  onChangeCorrective: (rows: ActionPlanRow[]) => void;
  onChangePreventive: (rows: ActionPlanRow[]) => void;
}

export const ActionPlanSection: React.FC<ActionPlanSectionProps> = ({
  correctivePlan,
  preventivePlan,
  onChangeCorrective,
  onChangePreventive,
}) => {
  const createEmptyRow = (): ActionPlanRow => ({
    id: `row-${Math.random().toString(36).substring(2, 9)}`,
    category: '',
    cause: '',
    subCause: '',
    action: '',
    pic: '',
    dueDate: '',
  });

  const handleUpdateRow = (
    tableType: 'corrective' | 'preventive',
    index: number,
    field: keyof ActionPlanRow,
    value: string
  ) => {
    if (tableType === 'corrective') {
      const updated = [...correctivePlan];
      updated[index] = { ...updated[index], [field]: value };
      onChangeCorrective(updated);
    } else {
      const updated = [...preventivePlan];
      updated[index] = { ...updated[index], [field]: value };
      onChangePreventive(updated);
    }
  };

  const handleInsertRow = (
    tableType: 'corrective' | 'preventive',
    index: number
  ) => {
    const newRow = createEmptyRow();
    if (tableType === 'corrective') {
      const updated = [...correctivePlan];
      updated.splice(index + 1, 0, newRow);
      onChangeCorrective(updated);
    } else {
      const updated = [...preventivePlan];
      updated.splice(index + 1, 0, newRow);
      onChangePreventive(updated);
    }
  };

  const handleDeleteRow = (
    tableType: 'corrective' | 'preventive',
    index: number
  ) => {
    if (tableType === 'corrective') {
      const updated = correctivePlan.filter((_, idx) => idx !== index);
      onChangeCorrective(updated.length > 0 ? updated : [createEmptyRow()]);
    } else {
      const updated = preventivePlan.filter((_, idx) => idx !== index);
      onChangePreventive(updated.length > 0 ? updated : [createEmptyRow()]);
    }
  };

  const handleAddBottomRow = (tableType: 'corrective' | 'preventive') => {
    if (tableType === 'corrective') {
      onChangeCorrective([...correctivePlan, createEmptyRow()]);
    } else {
      onChangePreventive([...preventivePlan, createEmptyRow()]);
    }
  };

  const renderTable = (
    title: string,
    subtitle: string,
    tableType: 'corrective' | 'preventive',
    rows: ActionPlanRow[]
  ) => {
    return (
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs p-5 md:p-6 mb-8 print-page-table transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-sky-950 uppercase tracking-tight">
              {title}
            </h2>
            <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
          </div>

          <div className="flex items-center gap-2 no-print">
            <button
              type="button"
              onClick={() => exportToCsv(rows, title)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Unduh Tabel sebagai format CSV Spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-sky-900 text-white font-semibold">
                <th className="py-2.5 px-3 w-[12%] border-r border-sky-800">Category</th>
                <th className="py-2.5 px-3 w-[18%] border-r border-sky-800">Cause</th>
                <th className="py-2.5 px-3 w-[22%] border-r border-sky-800">Sub Cause (Detail)</th>
                <th className="py-2.5 px-3 border-r border-sky-800">Action Plan (Tindakan)</th>
                <th className="py-2.5 px-3 w-[12%] border-r border-sky-800">PIC</th>
                <th className="py-2.5 px-3 w-[12%] border-r border-sky-800">Due Date</th>
                <th className="py-2.5 px-2 w-[70px] text-center no-print">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {rows.map((row, idx) => (
                <tr
                  key={row.id || idx}
                  className="hover:bg-sky-50/40 transition-colors odd:bg-white even:bg-slate-50/50"
                >
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible font-semibold text-sky-950">
                      {row.category || '-'}
                    </div>
                    <input
                      type="text"
                      value={row.category}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'category', e.target.value)
                      }
                      placeholder="e.g. Machine"
                      className="print-input-hidden w-full px-2 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 font-semibold text-sky-950"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible font-semibold text-slate-900 leading-snug">
                      {row.cause || '-'}
                    </div>
                    <textarea
                      rows={2}
                      value={row.cause}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'cause', e.target.value)
                      }
                      placeholder="Penyebab utama"
                      className="print-input-hidden w-full px-2 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 resize-none font-medium text-slate-900 leading-snug"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible text-slate-800 leading-snug">
                      {row.subCause || '-'}
                    </div>
                    <textarea
                      rows={2}
                      value={row.subCause}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'subCause', e.target.value)
                      }
                      placeholder="Detail atau sub-penyebab..."
                      className="print-input-hidden w-full px-2 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 resize-none text-slate-700 leading-snug"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible text-slate-900 leading-snug font-medium">
                      {row.action || '-'}
                    </div>
                    <textarea
                      rows={2}
                      value={row.action}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'action', e.target.value)
                      }
                      placeholder="Rekomendasi tindakan terukur..."
                      className="print-input-hidden w-full px-2 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 resize-none text-slate-900 leading-snug font-medium"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible text-slate-800">
                      {row.pic || '-'}
                    </div>
                    <input
                      type="text"
                      value={row.pic}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'pic', e.target.value)
                      }
                      placeholder="Person In Charge"
                      className="print-input-hidden w-full px-2 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 text-slate-700"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 align-top">
                    <div className="hidden print-text-visible text-slate-800 font-mono">
                      {row.dueDate || '-'}
                    </div>
                    <input
                      type="date"
                      value={row.dueDate}
                      onChange={(e) =>
                        handleUpdateRow(tableType, idx, 'dueDate', e.target.value)
                      }
                      className="print-input-hidden w-full px-1.5 py-1 text-xs bg-transparent border-0 rounded-sm focus:ring-1 focus:ring-sky-600 text-slate-700 font-mono"
                    />
                  </td>
                  <td className="p-2 align-middle text-center no-print">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleInsertRow(tableType, idx)}
                        title="Sisipkan baris di bawah"
                        className="p-1 text-sky-700 hover:text-sky-900 hover:bg-sky-100 rounded-sm transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRow(tableType, idx)}
                        title="Hapus baris"
                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-100 rounded-sm transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3.5 flex justify-end no-print">
          <button
            type="button"
            onClick={() => handleAddBottomRow(tableType)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-2xs transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Tambah Baris Manual</span>
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="mt-8 no-print:mb-12">
      {renderTable(
        'CORRECTIVE ACTION PLAN',
        'Tindakan korektif langsung untuk memperbaiki kegagalan dan mengembalikan kondisi aman operasi.',
        'corrective',
        correctivePlan
      )}

      {renderTable(
        'PREVENTIVE ACTION PLAN',
        'Tindakan pencegahan jangka panjang untuk memastikan insiden serupa tidak terulang kembali.',
        'preventive',
        preventivePlan
      )}
    </div>
  );
};
