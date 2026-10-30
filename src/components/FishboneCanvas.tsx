import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Move,
  Edit2,
  PlusCircle,
  Trash2,
  Plus,
  Minus,
  Check,
} from 'lucide-react';
import { FishboneCategory, FishboneCause, FishboneSettings } from '../types/fishbone';
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

export const FishboneCanvas: React.FC<FishboneCanvasProps> = ({
  categories,
  problem,
  onUpdateProblem,
  onUpdateCategories,
  settings,
  onUpdateSettings,
  onOpenEditModal,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Pan and zoom states (default 1.0 matches the SVG viewBox naturally)
  const [scale, setScale] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Dragging elements
  const [draggingTarget, setDraggingTarget] = useState<{
    type: 'head' | 'category' | 'cause';
    catIndex?: number;
    causeIndex?: number;
  } | null>(null);
  const dragStartMouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragInitialPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom Head position offset if dragged
  const [headCustomX, setHeadCustomX] = useState<number | null>(null);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    visible: false,
    x: 0,
    y: 0,
    type: 'problem',
  });

  const layout = calculateDiagramLayout(categories.length, settings.categorySpacing);
  const headX = headCustomX !== null ? headCustomX : layout.totalSpineWidth;
  const spineEndY = layout.spineY;

  // Fit view automatically
  const handleAutoFit = useCallback(() => {
    setScale(1.0);
    setPan({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    const timer = setTimeout(handleAutoFit, 150);
    return () => clearTimeout(timer);
  }, [categories.length, handleAutoFit]);

  // Handle Zoom In / Out
  const zoom = (factor: number) => {
    setScale((prev) => Math.min(2.5, Math.max(0.08, prev * factor)));
  };

  // Wheel zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setScale((prev) => Math.min(2.5, Math.max(0.08, prev * factor)));
  };

  // Pan Mouse Down
  const handleMouseDownBackground = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only primary button
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
    dragInitialPosRef.current = { x: headX, y: spineEndY };
  };

  // Dragging Category Mouse Down
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

  // Mouse Move listener (Window-level for smooth dragging outside SVG)
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
          setHeadCustomX(Math.max(2000, dragInitialPosRef.current.x + dx));
        } else if (draggingTarget.type === 'category' && draggingTarget.catIndex !== undefined) {
          const idx = draggingTarget.catIndex;
          const updated = [...categories];
          updated[idx] = {
            ...updated[idx],
            customX: dragInitialPosRef.current.x + dx,
            customY: dragInitialPosRef.current.y + dy,
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

  // Theme palettes
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
  const problemLines = wrapTextLines(problem || 'Masalah Utama', 18);

  return (
    <div className="relative w-full bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden print-page-diagram">
      {/* Canvas Floating Toolbar */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md border border-slate-200 shadow-md rounded-lg p-1.5 no-print">
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
        <div className="h-4 w-px bg-slate-200 mx-0.5" />
        <span className="text-[11px] font-semibold text-slate-500 px-1 font-mono">
          {Math.round(scale * 100)}%
        </span>
      </div>

      {/* Guide Help Hint */}
      <div className="absolute bottom-3 left-4 z-20 text-[11px] text-slate-400 bg-white/80 backdrop-blur-xs px-2.5 py-1 rounded-md border border-slate-200/60 pointer-events-none no-print">
        <span>Geser kanvas untuk panning · Drag kepala/tulang untuk reposisi · Klik kanan/Double-click untuk edit</span>
      </div>

      {/* Main SVG Viewport */}
      <div
        ref={containerRef}
        onWheel={handleWheel}
        onMouseDown={handleMouseDownBackground}
        className={`w-full h-[620px] lg:h-[700px] overflow-hidden select-none bg-slate-50/40 ${
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
            <filter id="shadow" x="-5%" y="-5%" width="120%" height="120%">
              <feDropShadow dx="8" dy="8" stdDeviation="6" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Scalable & Pannable Viewport Group */}
          <g transform={`translate(${pan.x}, ${pan.y}) scale(${scale})`}>
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
              rx="20"
            />

            {/* Main Spine Line */}
            <line
              x1="100"
              y1={layout.spineY}
              x2={headX}
              y2={layout.spineY}
              stroke={themeStyles.spine}
              strokeWidth="14"
              strokeLinecap="round"
            />

            {/* Fish Tail (Left end of spine) */}
            <g transform={`translate(100, ${layout.spineY})`}>
              <path
                d="M0,0 L-140,-120 L-100,0 L-140,120 Z"
                fill={themeStyles.spine}
                opacity="0.9"
              />
            </g>

            {/* Fish Head Group (Right end) */}
            <g
              transform={`translate(${headX}, ${layout.spineY}) scale(${settings.headScale || 1.0})`}
              className="cursor-move group"
              onMouseDown={handleMouseDownHead}
              onContextMenu={(e) => openContextMenu(e, 'problem')}
              onDoubleClick={() =>
                onOpenEditModal({ type: 'problem', currentText: problem })
              }
            >
              {/* Fish Head Polygon Shape with Eye */}
              <path
                d="M0,-240 L760,0 L0,240 L60,0 Z"
                fill={themeStyles.head}
                filter="url(#shadow)"
                className="transition-colors group-hover:brightness-110"
              />
              {/* Fish Eye Detail */}
              <circle cx="580" cy="-60" r="16" fill="white" />
              <circle cx="584" cy="-60" r="8" fill="#0f172a" />

              {/* Problem Text in Head */}
              <text
                x="330"
                y="0"
                textAnchor="middle"
                dominantBaseline="central"
                fill="#ffffff"
                fontWeight="800"
                fontSize={`${52 * fontScale}px`}
                className="problem-text"
              >
                {problemLines.map((line, idx) => (
                  <tspan
                    key={idx}
                    x="330"
                    dy={idx === 0 ? `-${(problemLines.length - 1) * 32}px` : '64px'}
                  >
                    {line}
                  </tspan>
                ))}
              </text>
            </g>

            {/* Bones Layer: 6M Categories and Branches */}
            <g id="bones-layer">
              {categories.map((cat, catIndex) => {
                const isTop = cat.isTop;
                const baseX =
                  layout.startX +
                  catIndex * settings.categorySpacing +
                  (cat.customX || 0);
                const baseY = layout.spineY + (cat.customY || 0);

                const boneLength = 1350;
                const angleRad = ((isTop ? -60 : 60) * Math.PI) / 180;
                const xEnd = baseX + boneLength * Math.cos(angleRad);
                const yEnd = baseY + boneLength * Math.sin(angleRad);

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
                      stroke={themeStyles.bone}
                      strokeWidth="11"
                      strokeLinecap="round"
                    />

                    {/* Wider transparent hit-area for easier dragging */}
                    <line
                      x1={baseX}
                      y1={baseY}
                      x2={xEnd}
                      y2={yEnd}
                      stroke="transparent"
                      strokeWidth="90"
                      className="cursor-move"
                      onMouseDown={(e) => handleMouseDownCategory(e, catIndex)}
                    />

                    {/* Category Name Label at the Tip */}
                    <text
                      x={xEnd + (isTop ? -40 : -40)}
                      y={yEnd + (isTop ? -60 : 110)}
                      fill={themeStyles.categoryText}
                      fontSize={`${72 * fontScale}px`}
                      fontWeight="900"
                      letterSpacing="2px"
                      className="cursor-pointer uppercase select-none hover:fill-sky-600 transition-colors"
                      onDoubleClick={() =>
                        onOpenEditModal({
                          type: 'category',
                          catIndex,
                          currentText: cat.category,
                        })
                      }
                    >
                      {cat.category}
                    </text>

                    {/* Cause Branches (Horizontal Sub-bones) */}
                    {cat.causes.map((cause, causeIndex) => {
                      const totalCauses = Math.max(cat.causes.length, 1);
                      const stepRatio = 0.22 + (causeIndex / totalCauses) * 0.72;
                      const cx = baseX + (xEnd - baseX) * stepRatio;
                      const cy = baseY + (yEnd - baseY) * stepRatio;
                      const subBoneLen = 520;

                      const causeWrapped = wrapTextLines(cause.cause, 32);

                      return (
                        <g
                          key={cause.id || causeIndex}
                          className="cause-sub-group"
                          onContextMenu={(e) =>
                            openContextMenu(e, 'cause', catIndex, causeIndex)
                          }
                        >
                          {/* Horizontal Cause Line */}
                          <line
                            x1={cx}
                            y1={cy}
                            x2={cx + subBoneLen}
                            y2={cy}
                            stroke={themeStyles.subBone}
                            strokeWidth="6"
                            strokeLinecap="round"
                          />

                          {/* Cause Text */}
                          <text
                            x={cx + 15}
                            y={cy - 24}
                            fill="#0f172a"
                            fontSize={`${44 * fontScale}px`}
                            fontWeight="700"
                            className="cursor-pointer select-none hover:fill-sky-700 transition-colors"
                            onDoubleClick={() =>
                              onOpenEditModal({
                                type: 'cause',
                                catIndex,
                                causeIndex,
                                currentText: cause.cause,
                              })
                            }
                          >
                            {causeWrapped.map((cLine, cIdx) => (
                              <tspan
                                key={cIdx}
                                x={cx + 15}
                                dy={cIdx === 0 ? 0 : '48px'}
                              >
                                {cLine}
                              </tspan>
                            ))}
                          </text>

                          {/* Details (Dashed Sub-Sub Bones) */}
                          {cause.details?.map((detail, detIndex) => {
                            const detailOffset =
                              60 + causeWrapped.length * 48 + detIndex * 110;
                            const dx = cx + 60;
                            const dy = cy + (isTop ? detailOffset : -detailOffset);

                            const detailWrapped = wrapTextLines(detail, 36);

                            return (
                              <g
                                key={detIndex}
                                className="detail-leaf-group"
                                onContextMenu={(e) =>
                                  openContextMenu(
                                    e,
                                    'detail',
                                    catIndex,
                                    causeIndex,
                                    detIndex
                                  )
                                }
                              >
                                {/* Dashed Detail Line */}
                                <line
                                  x1={dx}
                                  y1={cy}
                                  x2={dx + 25}
                                  y2={dy - 10}
                                  stroke="#64748b"
                                  strokeWidth="3.5"
                                  strokeDasharray="10,6"
                                />

                                {/* Detail Text */}
                                <text
                                  x={dx + 35}
                                  y={dy}
                                  fill="#334155"
                                  fontSize={`${34 * fontScale}px`}
                                  fontStyle="italic"
                                  fontWeight="500"
                                  className="cursor-pointer select-none hover:fill-sky-700 transition-colors"
                                  onDoubleClick={() =>
                                    onOpenEditModal({
                                      type: 'detail',
                                      catIndex,
                                      causeIndex,
                                      detailIndex: detIndex,
                                      currentText: detail,
                                    })
                                  }
                                >
                                  {detailWrapped.map((dLine, dIdx) => (
                                    <tspan
                                      key={dIdx}
                                      x={dx + 35}
                                      dy={dIdx === 0 ? 0 : '38px'}
                                    >
                                      {dLine}
                                    </tspan>
                                  ))}
                                </text>
                              </g>
                            );
                          })}
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
              <button
                type="button"
                onClick={() => {
                  let text = '';
                  if (contextMenu.type === 'category' && contextMenu.catIndex !== undefined) {
                    text = categories[contextMenu.catIndex].category;
                  } else if (
                    contextMenu.type === 'cause' &&
                    contextMenu.catIndex !== undefined &&
                    contextMenu.causeIndex !== undefined
                  ) {
                    text =
                      categories[contextMenu.catIndex].causes[contextMenu.causeIndex].cause;
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
