import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Edit2,
  PlusCircle,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  ChevronRight,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import { FishboneCategory, FishboneSettings } from '../types/fishbone';
import { calculateDiagramLayout, wrapTextLines } from '../utils/fishboneLogic';

interface FishboneCanvasProps {
  categories: FishboneCategory[];
  problem: string;
  onUpdateProblem: (newProblem: string) => void;
  onUpdateCategories: (categories: FishboneCategory[]) => void;
  settings: FishboneSettings;
  onUpdateSettings: (newSettings: Partial<FishboneSettings>) => void;
  onOpenEditModal: (target: {
    type: 'problem' | 'category' | 'cause' | 'detail';
    catIndex?: number;
    causeIndex?: number;
    detailIndex?: number;
    currentText: string;
  }) => void;
  onOpenEditCause: (catIndex: number, causeIndex: number) => void;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  type: 'problem' | 'category' | 'cause' | 'detail';
  catIndex?: number;
  causeIndex?: number;
  detailIndex?: number;
}

const CATEGORY_COLORS: Record<
  string,
  {
    bg: string;
    border: string;
    header: string;
    text: string;
    accent: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  machine: {
    bg: '#f8fafc',
    border: '#0284c7',
    header: '#0369a1',
    text: '#0f172a',
    accent: '#38bdf8',
    badgeBg: '#e0f2fe',
    badgeText: '#0369a1',
  },
  method: {
    bg: '#f8fafc',
    border: '#6366f1',
    header: '#4338ca',
    text: '#0f172a',
    accent: '#818cf8',
    badgeBg: '#e0e7ff',
    badgeText: '#3730a3',
  },
  material: {
    bg: '#f8fafc',
    border: '#d97706',
    header: '#b45309',
    text: '#0f172a',
    accent: '#fbbf24',
    badgeBg: '#fef3c7',
    badgeText: '#92400e',
  },
  measurement: {
    bg: '#f8fafc',
    border: '#7c3aed',
    header: '#6d28d9',
    text: '#0f172a',
    accent: '#a78bfa',
    badgeBg: '#ede9fe',
    badgeText: '#5b21b6',
  },
  man: {
    bg: '#f8fafc',
    border: '#059669',
    header: '#047857',
    text: '#0f172a',
    accent: '#34d399',
    badgeBg: '#d1fae5',
    badgeText: '#065f46',
  },
  environment: {
    bg: '#f8fafc',
    border: '#0d9488',
    header: '#0f766e',
    text: '#0f172a',
    accent: '#2dd4bf',
    badgeBg: '#ccfbf1',
    badgeText: '#115e59',
  },
};

function getCategoryColor(name: string) {
  const key = (name || '').toLowerCase().trim();
  return (
    CATEGORY_COLORS[key] || {
      bg: '#f8fafc',
      border: '#0284c7',
      header: '#0369a1',
      text: '#0f172a',
      accent: '#38bdf8',
      badgeBg: '#e0f2fe',
      badgeText: '#0369a1',
    }
  );
}

export const FishboneCanvas: React.FC<FishboneCanvasProps> = ({
  categories,
  problem,
  onUpdateProblem,
  onUpdateCategories,
  settings,
  onUpdateSettings,
  onOpenEditModal,
  onOpenEditCause,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and zoom states
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragInitialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Ensure diagram resets to clean center before printing
  useEffect(() => {
    const handleBeforePrint = () => {
      setScale(1.0);
      setPan({ x: 0, y: 0 });
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => window.removeEventListener('beforeprint', handleBeforePrint);
  }, []);

  // Dragging elements
  const [draggingTarget, setDraggingTarget] = useState<{
    type: 'head' | 'category' | 'bone-tip' | 'cause';
    catIndex?: number;
    causeIndex?: number;
  } | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom Head position offset if dragged
  const [headCustomX, setHeadCustomX] = useState<number | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'problem',
  });

  const categorySpacing = settings.categorySpacing || 1200;
  const layout = calculateDiagramLayout(categories.length, categorySpacing);
  const headX = headCustomX !== null ? headCustomX : layout.totalSpineWidth;
  const spineY = layout.spineY;

  // Fit view automatically
  const handleAutoFit = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  // Reset pan and scale automatically when printing to PDF
  useEffect(() => {
    const handleBeforePrint = () => {
      setPan({ x: 0, y: 0 });
      setScale(1.0);
    };
    window.addEventListener('beforeprint', handleBeforePrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleAutoFit, 150);
    return () => clearTimeout(timer);
  }, [categories.length, handleAutoFit]);

  // Handle Zoom In / Out
  const zoom = (factor: number) => {
    setScale((prev) => Math.min(2.5, Math.max(0.4, prev * factor)));
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(2.5, Math.max(0.4, prev * factor)));
  };

  // Pan Mouse Down
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    startPanRef.current = { x: e.clientX, y: e.clientY };
    dragInitialPosRef.current = { x: pan.x, y: pan.y };
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Dragging Head Mouse Down
  const handleMouseDownHead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDraggingTarget({ type: 'head' });
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragInitialPosRef.current = { x: headX, y: spineY };
  };

  // Dragging Category Bone Mouse Down (Move bone along spine)
  const handleMouseDownCategory = (e: React.MouseEvent, catIndex: number) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDraggingTarget({ type: 'category', catIndex });
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragInitialPosRef.current = {
      x: categories[catIndex].customX || 0,
      y: categories[catIndex].customY || 0,
    };
  };

  // Dragging Bone Tip Mouse Down (Adjust angle & length)
  const handleMouseDownBoneTip = (
    e: React.MouseEvent,
    catIndex: number,
    currentEndX: number,
    currentEndY: number
  ) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    setDraggingTarget({ type: 'bone-tip', catIndex });
    dragStartMouseRef.current = { x: e.clientX, y: e.clientY };
    dragInitialPosRef.current = { x: currentEndX, y: currentEndY };
  };

  // Mouse Move listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const containerW = containerRef.current?.clientWidth || 1200;
      const svgRatio = layout.viewBoxWidth / containerW;

      if (isPanning) {
        const dx = (e.clientX - startPanRef.current.x) * svgRatio;
        const dy = (e.clientY - startPanRef.current.y) * svgRatio;
        setPan({
          x: dragInitialPosRef.current.x + dx,
          y: dragInitialPosRef.current.y + dy,
        });
      } else if (draggingTarget) {
        const dx = ((e.clientX - dragStartMouseRef.current.x) * svgRatio) / scale;
        const dy = ((e.clientY - dragStartMouseRef.current.y) * svgRatio) / scale;

        if (draggingTarget.type === 'head') {
          setHeadCustomX(Math.max(2500, dragInitialPosRef.current.x + dx));
        } else if (draggingTarget.type === 'category' && draggingTarget.catIndex !== undefined) {
          const idx = draggingTarget.catIndex;
          const updated = [...categories];
          updated[idx] = {
            ...updated[idx],
            customX: dragInitialPosRef.current.x + dx,
            customY: dragInitialPosRef.current.y + dy,
          };
          onUpdateCategories(updated);
        } else if (draggingTarget.type === 'bone-tip' && draggingTarget.catIndex !== undefined) {
          const idx = draggingTarget.catIndex;
          const cat = categories[idx];
          const baseX = layout.startX + idx * categorySpacing + (cat.customX || 0);
          const baseY = spineY + (cat.customY || 0);

          const currentMouseX = dragInitialPosRef.current.x + dx;
          const currentMouseY = dragInitialPosRef.current.y + dy;

          const deltaX = currentMouseX - baseX;
          const deltaY = currentMouseY - baseY;
          const newLength = Math.max(900, Math.min(2200, Math.hypot(deltaX, deltaY)));
          let deg = (Math.atan2(Math.abs(deltaY), deltaX) * 180) / Math.PI;
          deg = Math.max(30, Math.min(80, deg));

          const updated = [...categories];
          updated[idx] = {
            ...updated[idx],
            customLength: Math.round(newLength),
            customAngle: Math.round(deg),
          };
          onUpdateCategories(updated);
        }
      }
    };

    const handleMouseUp = () => {
      setIsPanning(false);
      setDraggingTarget(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isPanning, draggingTarget, scale, categories, onUpdateCategories, layout.viewBoxWidth]);

  // Context Menu triggers
  const openContextMenu = (
    e: React.MouseEvent,
    type: 'problem' | 'category' | 'cause' | 'detail',
    catIndex?: number,
    causeIndex?: number,
    detailIndex?: number
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      type,
      catIndex,
      causeIndex,
      detailIndex,
    });
  };

  // Context Menu Actions
  const handleAddCause = (catIndex: number) => {
    const newCauseText = prompt('Masukkan nama penyebab (cause) baru:', 'Penyebab Baru');
    if (!newCauseText || !newCauseText.trim()) return;

    const updated = [...categories];
    updated[catIndex].causes.push({
      id: `cause-${Date.now()}`,
      cause: newCauseText.trim(),
      details: [],
      actionPlan: '',
    });
    onUpdateCategories(updated);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleAddDetail = (catIndex: number, causeIndex: number) => {
    const newDetailText = prompt('Masukkan detail / sub-penyebab baru:', 'Sub penyebab teknis');
    if (!newDetailText || !newDetailText.trim()) return;

    const updated = [...categories];
    if (!updated[catIndex].causes[causeIndex].details) {
      updated[catIndex].causes[causeIndex].details = [];
    }
    updated[catIndex].causes[causeIndex].details.push(newDetailText.trim());
    onUpdateCategories(updated);
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  const handleDeleteItem = () => {
    const { type, catIndex, causeIndex, detailIndex } = contextMenu;
    if (type === 'cause' && catIndex !== undefined && causeIndex !== undefined) {
      if (confirm('Hapus penyebab ini dari diagram?')) {
        const updated = [...categories];
        updated[catIndex].causes.splice(causeIndex, 1);
        onUpdateCategories(updated);
      }
    } else if (
      type === 'detail' &&
      catIndex !== undefined &&
      causeIndex !== undefined &&
      detailIndex !== undefined
    ) {
      if (confirm('Hapus detail sub-penyebab ini?')) {
        const updated = [...categories];
        updated[catIndex].causes[causeIndex].details.splice(detailIndex, 1);
        onUpdateCategories(updated);
      }
    } else if (type === 'category' && catIndex !== undefined) {
      if (confirm(`Hapus kategori "${categories[catIndex].category}" beserta semua penyebabnya?`)) {
        const updated = [...categories];
        updated.splice(catIndex, 1);
        onUpdateCategories(updated);
      }
    }
    setContextMenu((prev) => ({ ...prev, visible: false }));
  };

  // Theme styles
  const themeStyles = {
    ocean: {
      spine: '#005a8d',
      bone: '#00446b',
      subBone: '#0284c7',
      head: '#005a8d',
      categoryText: '#00446b',
    },
    slate: {
      spine: '#1e293b',
      bone: '#334155',
      subBone: '#475569',
      head: '#0f172a',
      categoryText: '#0f172a',
    },
    emerald: {
      spine: '#065f46',
      bone: '#047857',
      subBone: '#059669',
      head: '#064e3b',
      categoryText: '#065f46',
    },
  }[settings.theme || 'ocean'];

  const fontScale = settings.fontScale || 1.0;
  const problemLines = wrapTextLines(problem || 'Masalah Utama', 16);

  // Quick adjust spacing
  const handleAdjustSpacing = (delta: number) => {
    const current = settings.categorySpacing || 1200;
    const next = Math.max(700, Math.min(1800, current + delta));
    onUpdateSettings({ categorySpacing: next });
  };

  // Quick adjust font scale
  const handleAdjustFont = (delta: number) => {
    const current = settings.fontScale || 1.0;
    const next = Math.max(0.7, Math.min(1.5, Math.round((current + delta) * 10) / 10));
    onUpdateSettings({ fontScale: next });
  };

  // Quick adjust bone angle
  const handleAdjustAngle = (delta: number) => {
    const current = settings.boneAngle || 55;
    const next = Math.max(35, Math.min(75, current + delta));
    onUpdateSettings({ boneAngle: next });
  };

  // Reset all custom bone positions and angles
  const handleResetLines = () => {
    const resetCats = categories.map((c) => ({
      ...c,
      customX: undefined,
      customY: undefined,
      customAngle: undefined,
      customLength: undefined,
    }));
    onUpdateCategories(resetCats);
    setHeadCustomX(null);
    handleAutoFit();
  };

  const fontFamilyCss = {
    sans: "'Plus Jakarta Sans', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
    serif: "'Georgia', 'Cambria', serif",
    mono: "'JetBrains Mono', monospace",
  }[settings.fontFamily || 'sans'];

  return (
    <div className="relative w-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-page-diagram">
      {/* Canvas Floating Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex flex-wrap items-center gap-1.5 bg-white/95 backdrop-blur-md border border-slate-200 shadow-md rounded-lg p-1.5 no-print text-xs">
        {/* Zoom */}
        <div className="flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => zoom(1.15)}
            title="Perbesar Tampilan (Zoom In)"
            className="p-1.5 text-slate-700 hover:text-sky-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => zoom(0.85)}
            title="Perkecil Tampilan (Zoom Out)"
            className="p-1.5 text-slate-700 hover:text-sky-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleAutoFit}
            title="Pusatkan Tampilan (Auto Fit)"
            className="p-1.5 text-slate-700 hover:text-sky-900 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Spacing Adjustment */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] font-medium text-slate-500">Jarak:</span>
          <button
            type="button"
            onClick={() => handleAdjustSpacing(-100)}
            title="Persempit Jarak Tulang (-100px)"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm font-bold text-xs cursor-pointer"
          >
            -
          </button>
          <span className="font-mono text-[11px] font-bold text-sky-900 w-12 text-center">
            {categorySpacing}px
          </span>
          <button
            type="button"
            onClick={() => handleAdjustSpacing(100)}
            title="Perlebar Jarak Tulang (+100px)"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm font-bold text-xs cursor-pointer"
          >
            +
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Bone Angle Adjustment */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] font-medium text-slate-500">Sudut:</span>
          <button
            type="button"
            onClick={() => handleAdjustAngle(-5)}
            title="Kurangi Kemiringan (-5°)"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm font-bold text-xs cursor-pointer"
          >
            -
          </button>
          <span className="font-mono text-[11px] font-bold text-sky-900 w-9 text-center">
            {settings.boneAngle || 55}°
          </span>
          <button
            type="button"
            onClick={() => handleAdjustAngle(5)}
            title="Tambah Kemiringan (+5°)"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm font-bold text-xs cursor-pointer"
          >
            +
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Font Adjustment */}
        <div className="flex items-center gap-1 px-1">
          <span className="text-[11px] font-medium text-slate-500">Font:</span>
          <button
            type="button"
            onClick={() => handleAdjustFont(-0.1)}
            title="Perkecil Font"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm text-xs cursor-pointer font-bold"
          >
            A-
          </button>
          <span className="font-mono text-[11px] font-bold text-sky-900 w-9 text-center">
            {Math.round(fontScale * 100)}%
          </span>
          <button
            type="button"
            onClick={() => handleAdjustFont(0.1)}
            title="Perbesar Font"
            className="px-1.5 py-0.5 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-sm text-xs cursor-pointer font-bold"
          >
            A+
          </button>
        </div>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Reset Lines button */}
        <button
          type="button"
          onClick={handleResetLines}
          title="Reset Semua Posisi & Sudut Garis ke Default"
          className="inline-flex items-center gap-1 px-2 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] font-medium cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset Garis</span>
        </button>
      </div>

      {/* Guide Help Hint */}
      <div className="absolute bottom-3 left-4 z-20 text-[11px] text-slate-500 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-md border border-slate-200 shadow-2xs pointer-events-none no-print flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-sky-600 inline-block" />
        <span>Tips Interaktif: Drag lingkaran di ujung tulang untuk mengubah sudut & panjang garis secara presisi. Klik kartu penyebab untuk edit langsung.</span>
      </div>

      {/* Main SVG Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownBackground}
        className={`w-full h-[680px] lg:h-[760px] overflow-hidden select-none bg-slate-50/50 ${
          isPanning ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${layout.viewBoxWidth} ${layout.viewBoxHeight}`}
          className="w-full h-full fishbone-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <style>{`
              @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@500;700&display=swap');
              .fishbone-svg text, .fishbone-svg tspan {
                font-family: ${fontFamilyCss} !important;
              }
            `}</style>
            <filter id="shadow" x="-5%" y="-5%" width="120%" height="120%">
              <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#0f172a" floodOpacity="0.08" />
            </filter>
            <filter id="head-shadow" x="-10%" y="-10%" width="130%" height="130%">
              <feDropShadow dx="8" dy="8" stdDeviation="10" floodColor="#000000" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Scalable & Pannable Viewport Group */}
          <g className="fishbone-viewport-group" transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
            {/* Background canvas guide rectangle */}
            <rect
              x="50"
              y="50"
              width={layout.viewBoxWidth - 100}
              height={layout.viewBoxHeight - 100}
              fill="#ffffff"
              stroke="#e2e8f0"
              strokeWidth="4"
              strokeDasharray="40,20"
              rx="24"
            />

            {/* Main Central Spine Line */}
            <line
              x1="120"
              y1={spineY}
              x2={headX}
              y2={spineY}
              stroke={themeStyles.spine}
              strokeWidth="16"
              strokeLinecap="round"
            />

            {/* Fish Tail (Left end of spine) */}
            <g transform={`translate(120, ${spineY})`}>
              <path
                d="M0,0 L-160,-140 L-110,0 L-160,140 Z"
                fill={themeStyles.spine}
                opacity="0.95"
              />
            </g>

            {/* Fish Head Group (Right end) */}
            <g
              transform={`translate(${headX}, ${spineY}) scale(${settings.headScale || 1.0})`}
              className="cursor-move group"
              onMouseDown={handleMouseDownHead}
              onContextMenu={(e) => openContextMenu(e, 'problem')}
              onDoubleClick={() =>
                onOpenEditModal({ type: 'problem', currentText: problem })
              }
            >
              {/* Fish Head Polygon Shape with Eye */}
              <path
                d="M0,-280 L840,0 L0,280 L70,0 Z"
                fill={themeStyles.head}
                filter="url(#head-shadow)"
                className="transition-colors group-hover:brightness-110"
              />
              {/* Fish Eye Detail */}
              <circle cx="640" cy="-70" r="18" fill="white" />
              <circle cx="644" cy="-70" r="9" fill="#0f172a" />

              {/* Problem Text in Head */}
              <text
                x="380"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontWeight="800"
                fontSize={`${56 * fontScale}px`}
                className="problem-text"
              >
                {problemLines.map((line, idx) => (
                  <tspan
                    key={idx}
                    x="380"
                    dy={idx === 0 ? `-${(problemLines.length - 1) * 36}px` : '72px'}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>

            {/* Bones Layer: 6M Categories and Anti-Collision Cause Cards */}
            <g id="bones-layer">
              {categories.map((cat, catIndex) => {
                const isTop = cat.isTop;
                const baseX =
                  layout.startX +
                  catIndex * categorySpacing +
                  (cat.customX || 0);
                const baseY = spineY + (cat.customY || 0);

                // Slanted bone with configurable angle & length
                const defaultAngle = settings.boneAngle || 55;
                const angle = cat.customAngle !== undefined ? cat.customAngle : defaultAngle;
                const defaultLength = settings.boneLength || 1500;
                const boneLength = cat.customLength !== undefined ? cat.customLength : defaultLength;
                const strokeWidth = settings.lineWidth || 12;

                const angleRad = ((isTop ? -angle : angle) * Math.PI) / 180;
                const xEnd = baseX + boneLength * Math.cos(angleRad);
                const yEnd = baseY + boneLength * Math.sin(angleRad);

                const colTheme = getCategoryColor(cat.category);
                const causesCount = cat.causes.length;

                return (
                  <g
                    key={cat.id || catIndex}
                    className="category-group"
                    onContextMenu={(e) => openContextMenu(e, 'category', catIndex)}
                  >
                    {/* Main Category Bone Line */}
                    <line
                      x1={baseX}
                      y1={baseY}
                      x2={xEnd}
                      y2={yEnd}
                      stroke={colTheme.border}
                      strokeWidth={strokeWidth}
                      strokeLinecap="round"
                    />

                    {/* Wide transparent hit area for dragging bone */}
                    <line
                      x1={baseX}
                      y1={baseY}
                      x2={xEnd}
                      y2={yEnd}
                      stroke="transparent"
                      strokeWidth="110"
                      className="cursor-move"
                      onMouseDown={(e) => handleMouseDownCategory(e, catIndex)}
                    />

                    {/* Interactive Bone Tip Pin Handle (Drag to reshape line) */}
                    <g
                      transform={`translate(${xEnd}, ${yEnd})`}
                      className="cursor-crosshair no-print group/handle"
                      onMouseDown={(e) => handleMouseDownBoneTip(e, catIndex, xEnd, yEnd)}
                    >
                      <circle
                        cx="0"
                        cy="0"
                        r="22"
                        fill="#ffffff"
                        stroke={colTheme.border}
                        strokeWidth="4"
                        filter="url(#shadow)"
                        className="transition-transform group-hover/handle:scale-125"
                      />
                      <circle
                        cx="0"
                        cy="0"
                        r="8"
                        fill={colTheme.border}
                      />
                    </g>

                    {/* Category Header Badge at the tip */}
                    <g
                      transform={`translate(${xEnd}, ${yEnd + (isTop ? -80 : 80)})`}
                      className="cursor-pointer"
                      onDoubleClick={() =>
                        onOpenEditModal({
                          type: 'category',
                          catIndex,
                          currentText: cat.category,
                        })
                      }
                    >
                      <rect
                        x="-160"
                        y="-45"
                        width="320"
                        height="90"
                        rx="16"
                        fill={colTheme.header}
                        filter="url(#shadow)"
                      />
                      <text
                        x="0"
                        y="0"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fill="#ffffff"
                        fontSize={`${44 * fontScale}px`}
                        fontWeight="900"
                        letterSpacing="2px"
                        className="uppercase select-none problem-text"
                      >
                        {cat.category}
                      </text>
                    </g>

                    {/* Anti-Collision Structured Cause Cards */}
                    {cat.causes.map((cause, causeIndex) => {
                      // Guaranteed non-overlapping step positions
                      let step = 0.50;
                      if (causesCount === 2) {
                        step = causeIndex === 0 ? 0.36 : 0.72;
                      } else if (causesCount === 3) {
                        step = [0.28, 0.52, 0.78][causeIndex];
                      } else if (causesCount >= 4) {
                        step = 0.22 + (causeIndex / (causesCount - 1)) * 0.68;
                      }

                      // Coordinates on the bone
                      const cx = baseX + (xEnd - baseX) * step;
                      const cy = baseY + (yEnd - baseY) * step;

                      // Card dimensions
                      const cardWidth = 470;
                      const titleLines = wrapTextLines(cause.cause, 28);
                      const details = cause.details || [];

                      // Calculate card height dynamically
                      let cardHeight = 55 + titleLines.length * 30;
                      if (details.length > 0) {
                        cardHeight += 15; // gap
                        details.forEach((det) => {
                          const detLines = wrapTextLines(det, 32);
                          cardHeight += detLines.length * 24 + 10;
                        });
                      }
                      if (cause.actionPlan) {
                        const planLines = wrapTextLines(`Rekomendasi: ${cause.actionPlan}`, 32);
                        cardHeight += planLines.length * 22 + 20;
                      }
                      cardHeight = Math.max(120, cardHeight + 15);

                      // Card X & Y positioning with strict spine clearance
                      const connectorLen = 70;
                      const cardX = cx + connectorLen;
                      let cardY = cy - cardHeight / 2;

                      // Ensure clearance from central spine (y=1800)
                      if (isTop) {
                        if (cardY + cardHeight > spineY - 80) {
                          cardY = spineY - 80 - cardHeight;
                        }
                        if (cardY < 120) cardY = 120;
                      } else {
                        if (cardY < spineY + 80) {
                          cardY = spineY + 80;
                        }
                        if (cardY + cardHeight > layout.viewBoxHeight - 120) {
                          cardY = layout.viewBoxHeight - 120 - cardHeight;
                        }
                      }

                      return (
                        <g
                          key={cause.id || causeIndex}
                          className="cause-card-group group"
                          onContextMenu={(e) =>
                            openContextMenu(e, 'cause', catIndex, causeIndex)
                          }
                        >
                          {/* Horizontal connector line from bone to card */}
                          <line
                            x1={cx}
                            y1={cy}
                            x2={cardX}
                            y2={cardY + cardHeight / 2}
                            stroke={colTheme.border}
                            strokeWidth="5"
                            strokeLinecap="round"
                          />
                          <circle
                            cx={cx}
                            cy={cy}
                            r="7"
                            fill={colTheme.border}
                          />

                          {/* White Card Container */}
                          <g
                            transform={`translate(${cardX}, ${cardY})`}
                            className="cursor-pointer"
                            onClick={() => onOpenEditCause(catIndex, causeIndex)}
                            onDoubleClick={() => onOpenEditCause(catIndex, causeIndex)}
                          >
                            {/* Card Background */}
                            <rect
                              x="0"
                              y="0"
                              width={cardWidth}
                              height={cardHeight}
                              rx="14"
                              fill="#ffffff"
                              stroke={colTheme.border}
                              strokeWidth="3.5"
                              filter="url(#shadow)"
                              className="transition-all group-hover:stroke-sky-600"
                            />

                            {/* Top Accent Strip */}
                            <path
                              d={`M 0 14 Q 0 0 14 0 L ${cardWidth - 14} 0 Q ${cardWidth} 0 ${cardWidth} 14 L ${cardWidth} 28 L 0 28 Z`}
                              fill={colTheme.border}
                            />

                            {/* Category Micro-tag */}
                            <text
                              x="16"
                              y="18"
                              fill="#ffffff"
                              fontSize="13px"
                              fontWeight="800"
                              letterSpacing="1px"
                              className="problem-text uppercase"
                            >
                              {cat.category} · Penyebab #{causeIndex + 1}
                            </text>

                            {/* Direct Edit Button on Card */}
                            <g
                              transform={`translate(${cardWidth - 95}, 4)`}
                              className="cursor-pointer hover:opacity-85 no-print"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditCause(catIndex, causeIndex);
                              }}
                            >
                              <rect width="80" height="20" rx="4" fill="rgba(255,255,255,0.3)" />
                              <text
                                x="40"
                                y="14"
                                fill="#ffffff"
                                fontSize="11px"
                                fontWeight="bold"
                                textAnchor="middle"
                                className="problem-text select-none"
                              >
                                ✎ Edit Cause
                              </text>
                            </g>

                            {/* Cause Title */}
                            <g transform="translate(16, 52)">
                              <text
                                x="0"
                                y="0"
                                fill="#0f172a"
                                fontSize={`${23 * fontScale}px`}
                                fontWeight="800"
                                className="problem-text"
                              >
                                {titleLines.map((line, lIdx) => (
                                  <tspan key={lIdx} x="0" dy={lIdx === 0 ? 0 : '28px'}>
                                    {line}
                                  </tspan>
                                ))}
                              </text>
                            </g>

                            {/* Divider Line if details exist */}
                            {details.length > 0 && (
                              <line
                                x1="16"
                                y1={52 + titleLines.length * 28 + 6}
                                x2={cardWidth - 16}
                                y2={52 + titleLines.length * 28 + 6}
                                stroke="#e2e8f0"
                                strokeWidth="2"
                              />
                            )}

                            {/* Bulleted Sub-cause Details */}
                            <g transform={`translate(16, ${52 + titleLines.length * 28 + 24})`}>
                              {details.map((det, dIdx) => {
                                const detLines = wrapTextLines(det, 34);
                                const prevOffsets = details
                                  .slice(0, dIdx)
                                  .reduce((acc, curr) => acc + wrapTextLines(curr, 34).length * 24 + 10, 0);

                                return (
                                  <g
                                    key={dIdx}
                                    transform={`translate(0, ${prevOffsets})`}
                                    onContextMenu={(e) =>
                                      openContextMenu(e, 'detail', catIndex, causeIndex, dIdx)
                                    }
                                    onDoubleClick={(e) => {
                                      e.stopPropagation();
                                      onOpenEditModal({
                                        type: 'detail',
                                        catIndex,
                                        causeIndex,
                                        detailIndex: dIdx,
                                        currentText: det,
                                      });
                                    }}
                                  >
                                    <circle cx="4" cy="7" r="3.5" fill={colTheme.header} />
                                    <text
                                      x="14"
                                      y="12"
                                      fill="#334155"
                                      fontSize={`${17 * fontScale}px`}
                                      fontWeight="500"
                                      className="problem-text"
                                    >
                                      {detLines.map((dLine, dlIdx) => (
                                        <tspan key={dlIdx} x="14" dy={dlIdx === 0 ? 0 : '22px'}>
                                          {dLine}
                                        </tspan>
                                      ))}
                                    </text>
                                  </g>
                                );
                              })}
                            </g>

                            {/* Action Plan Recommendation Banner */}
                            {cause.actionPlan && (
                              <g transform={`translate(12, ${cardHeight - 42})`}>
                                <rect
                                  x="0"
                                  y="0"
                                  width={cardWidth - 24}
                                  height="32"
                                  rx="8"
                                  fill="#ecfdf5"
                                  stroke="#a7f3d0"
                                  strokeWidth="1.5"
                                />
                                <text
                                  x="10"
                                  y="20"
                                  fill="#065f46"
                                  fontSize={`${14 * fontScale}px`}
                                  fontWeight="700"
                                  className="problem-text"
                                >
                                  {cause.actionPlan.length > 44
                                    ? `Action: ${cause.actionPlan.substring(0, 42)}...`
                                    : `Action: ${cause.actionPlan}`}
                                </text>
                              </g>
                            )}
                          </g>
                        </g>
                      );
                    })}
                  </g>
                );
              })}
            </g>
          </g>
        </svg>
      </div>

      {/* Context Menu Modal Portal */}
      {contextMenu.visible && (
        <div
          style={{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }}
          className="fixed z-50 w-56 bg-white border border-slate-200 rounded-lg shadow-xl py-1 text-xs text-slate-700 animate-in fade-in duration-100 context-menu-portal"
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.type === 'problem' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onOpenEditModal({ type: 'problem', currentText: problem });
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-medium"
              >
                <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Edit Masalah Utama</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({ headScale: (settings.headScale || 1.0) + 0.1 });
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>Perbesar Kepala Ikan</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onUpdateSettings({
                    headScale: Math.max(0.4, (settings.headScale || 1.0) - 0.1),
                  });
                  setContextMenu((prev) => ({ ...prev, visible: false }));
                }}
                className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 text-slate-500" />
                <span>Perkecil Kepala Ikan</span>
              </button>
            </>
          ) : (
            <>
              {contextMenu.type === 'cause' &&
              contextMenu.catIndex !== undefined &&
              contextMenu.causeIndex !== undefined ? (
                <button
                  type="button"
                  onClick={() => {
                    onOpenEditCause(contextMenu.catIndex!, contextMenu.causeIndex!);
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Edit Penyebab & Sub-causes</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    let text = '';
                    if (contextMenu.type === 'category' && contextMenu.catIndex !== undefined) {
                      text = categories[contextMenu.catIndex].category;
                    } else if (
                      contextMenu.type === 'detail' &&
                      contextMenu.catIndex !== undefined &&
                      contextMenu.causeIndex !== undefined &&
                      contextMenu.detailIndex !== undefined
                    ) {
                      text =
                        categories[contextMenu.catIndex].causes[contextMenu.causeIndex]
                          .details[contextMenu.detailIndex];
                    }
                    onOpenEditModal({
                      type: contextMenu.type,
                      catIndex: contextMenu.catIndex,
                      causeIndex: contextMenu.causeIndex,
                      detailIndex: contextMenu.detailIndex,
                      currentText: text,
                    });
                    setContextMenu((prev) => ({ ...prev, visible: false }));
                  }}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Edit2 className="w-3.5 h-3.5 text-sky-700" />
                  <span>Edit Teks</span>
                </button>
              )}

              {contextMenu.type === 'category' && contextMenu.catIndex !== undefined && (
                <button
                  type="button"
                  onClick={() => handleAddCause(contextMenu.catIndex!)}
                  className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tambah Penyebab (Cause)</span>
                </button>
              )}

              {contextMenu.type === 'cause' &&
                contextMenu.catIndex !== undefined &&
                contextMenu.causeIndex !== undefined && (
                  <button
                    type="button"
                    onClick={() =>
                      handleAddDetail(contextMenu.catIndex!, contextMenu.causeIndex!)
                    }
                    className="w-full px-3.5 py-2 text-left hover:bg-slate-100 flex items-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tambah Detail (Sub-cause)</span>
                  </button>
                )}

              <div className="h-px bg-slate-100 my-1" />

              <button
                type="button"
                onClick={handleDeleteItem}
                className="w-full px-3.5 py-2 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                <span>Hapus Item</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
