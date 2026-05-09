'use client';

import { useState } from 'react';

// FDI numbering for permanent (adult) teeth
//   Upper right: 18 17 16 15 14 13 12 11 | 21 22 23 24 25 26 27 28 :Upper left
//   Lower right: 48 47 46 45 44 43 42 41 | 31 32 33 34 35 36 37 38 :Lower left
const PERMANENT = {
  upperRight: [18, 17, 16, 15, 14, 13, 12, 11],
  upperLeft:  [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft:  [31, 32, 33, 34, 35, 36, 37, 38],
};

// FDI numbering for primary (baby) teeth (5 per quadrant)
const PRIMARY = {
  upperRight: [55, 54, 53, 52, 51],
  upperLeft:  [61, 62, 63, 64, 65],
  lowerRight: [85, 84, 83, 82, 81],
  lowerLeft:  [71, 72, 73, 74, 75],
};

export type Surface = 'M' | 'D' | 'O' | 'B' | 'L';

export interface ToothMark {
  toothNumber: number;
  surfaces: Partial<Record<Surface, string>>; // surface -> color hex
}

export const DIAGNOSIS_COLORS = [
  { key: 'caries',       label: 'Caries Ерөнхий',          color: '#ef4444', text: '#ffffff' },
  { key: 'pulpitis',     label: 'Pulpitis',                 color: '#3b82f6', text: '#ffffff' },
  { key: 'periodontitis',label: 'Periodontitis',            color: '#0d9488', text: '#ffffff' },
  { key: 'gingivitis',   label: 'Gingivitis',               color: '#db2777', text: '#ffffff' },
  { key: 'parodontitis', label: 'Parodontitis',             color: '#f97316', text: '#ffffff' },
  { key: 'shtyr',        label: 'ШТЭУР',                    color: '#eab308', text: '#1c1917' },
  { key: 'shtex_h',      label: 'ШТЭХатангиршил',           color: '#78350f', text: '#ffffff' },
  { key: 'shtex_u',      label: 'ШТЭУусалт',                color: '#475569', text: '#ffffff' },
  { key: 'paradontoma',  label: 'Paradontoma',              color: '#9333ea', text: '#ffffff' },
  { key: 'lip',          label: 'Уруулын хөвч тасдах',      color: '#16a34a', text: '#ffffff' },
  { key: 'direct',       label: 'Шууд эмчилгээ',            color: '#84cc16', text: '#1c1917' },
];

interface ToothProps {
  num: number;
  marks?: Partial<Record<Surface, string>>;
  onSurfaceClick?: (num: number, surface: Surface) => void;
  flipped?: boolean; // for lower jaw (root pointing down)
}

/**
 * Single tooth: a stylized "tooth" rectangle on top, with a circle below
 * divided into 5 surfaces (M/D/B/L outer + O inner). Click a surface to mark.
 */
function Tooth({ num, marks = {}, onSurfaceClick, flipped }: ToothProps) {
  const handle = (s: Surface) => onSurfaceClick?.(num, s);

  // Tooth shape (simplified)
  const toothShape = (
    <svg viewBox="0 0 40 60" className="w-full h-14">
      {flipped ? (
        // Lower tooth: root up, crown down
        <g>
          <path d="M 20 0 L 14 25 L 14 30 L 26 30 L 26 25 Z" fill="#d4a574" stroke="#8b6f47" strokeWidth="0.5" />
          <path d="M 12 30 Q 12 50 20 58 Q 28 50 28 30 Z" fill="#fafaf9" stroke="#a8a29e" strokeWidth="0.5" />
        </g>
      ) : (
        // Upper tooth: root down, crown up
        <g>
          <path d="M 12 30 Q 12 10 20 2 Q 28 10 28 30 Z" fill="#fafaf9" stroke="#a8a29e" strokeWidth="0.5" />
          <path d="M 20 60 L 14 35 L 14 30 L 26 30 L 26 35 Z" fill="#d4a574" stroke="#8b6f47" strokeWidth="0.5" />
        </g>
      )}
    </svg>
  );

  // Surface chart (FDI tooth surface diagram)
  const surfaceColors = {
    M: marks.M || 'transparent',
    D: marks.D || 'transparent',
    B: marks.B || 'transparent',
    L: marks.L || 'transparent',
    O: marks.O || 'transparent',
  };

  const surfaceChart = (
    <svg viewBox="0 0 40 40" className="w-full h-10">
      {/* Outer circle, divided into 4 quadrants: top=B, bottom=L, left=M, right=D */}
      {/* M (left) */}
      <path d="M 20 20 L 4 4 A 22 22 0 0 0 4 36 Z" fill={surfaceColors.M} stroke="#475569" strokeWidth="0.8" onClick={() => handle('M')} className="cursor-pointer hover:opacity-70" />
      {/* D (right) */}
      <path d="M 20 20 L 36 36 A 22 22 0 0 0 36 4 Z" fill={surfaceColors.D} stroke="#475569" strokeWidth="0.8" onClick={() => handle('D')} className="cursor-pointer hover:opacity-70" />
      {/* B (top) */}
      <path d="M 20 20 L 4 4 A 22 22 0 0 1 36 4 Z" fill={surfaceColors.B} stroke="#475569" strokeWidth="0.8" onClick={() => handle('B')} className="cursor-pointer hover:opacity-70" />
      {/* L (bottom) */}
      <path d="M 20 20 L 4 36 A 22 22 0 0 0 36 36 Z" fill={surfaceColors.L} stroke="#475569" strokeWidth="0.8" onClick={() => handle('L')} className="cursor-pointer hover:opacity-70" />
      {/* O (center) */}
      <circle cx="20" cy="20" r="6" fill={surfaceColors.O} stroke="#475569" strokeWidth="0.8" onClick={() => handle('O')} className="cursor-pointer hover:opacity-70" />
    </svg>
  );

  return (
    <div className="flex flex-col items-center gap-0.5 w-10">
      {flipped ? (
        <>
          {surfaceChart}
          {toothShape}
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{num}</span>
        </>
      ) : (
        <>
          <span className="text-[10px] font-mono text-stone-500 dark:text-stone-400">{num}</span>
          {toothShape}
          {surfaceChart}
        </>
      )}
    </div>
  );
}

interface ToothChartProps {
  type: 'permanent' | 'primary';
  marks?: Record<number, Partial<Record<Surface, string>>>;
  onSurfaceClick?: (toothNumber: number, surface: Surface) => void;
}

export default function ToothChart({ type, marks = {}, onSurfaceClick }: ToothChartProps) {
  const layout = type === 'permanent' ? PERMANENT : PRIMARY;

  return (
    <div className="space-y-6">
      {/* Upper jaw */}
      <div className="flex justify-center gap-1">
        {layout.upperRight.map((n) => (
          <Tooth key={n} num={n} marks={marks[n]} onSurfaceClick={onSurfaceClick} />
        ))}
        <div className="w-px bg-stone-300 dark:bg-stone-600 mx-2" />
        {layout.upperLeft.map((n) => (
          <Tooth key={n} num={n} marks={marks[n]} onSurfaceClick={onSurfaceClick} />
        ))}
      </div>

      {/* Lower jaw */}
      <div className="flex justify-center gap-1">
        {layout.lowerRight.map((n) => (
          <Tooth key={n} num={n} marks={marks[n]} onSurfaceClick={onSurfaceClick} flipped />
        ))}
        <div className="w-px bg-stone-300 dark:bg-stone-600 mx-2" />
        {layout.lowerLeft.map((n) => (
          <Tooth key={n} num={n} marks={marks[n]} onSurfaceClick={onSurfaceClick} flipped />
        ))}
      </div>
    </div>
  );
}

export function DiagnosisLegend({
  selected,
  onSelect,
}: {
  selected?: string;
  onSelect?: (key: string, color: string) => void;
}) {
  return (
    <div>
      <div className="text-sm text-stone-600 dark:text-stone-400 mb-2">Өнгөний тайлбар</div>
      <div className="flex flex-wrap gap-2">
        {DIAGNOSIS_COLORS.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => onSelect?.(d.key, d.color)}
            className={`px-3 py-2 text-sm font-medium rounded-md transition-all ${
              selected === d.key ? 'ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100' : ''
            }`}
            style={{ backgroundColor: d.color, color: d.text }}
          >
            {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function useToothMarks() {
  const [marks, setMarks] = useState<Record<number, Partial<Record<Surface, string>>>>({});
  const [activeColor, setActiveColor] = useState<{ key: string; color: string } | null>(null);

  const handleSurfaceClick = (toothNumber: number, surface: Surface) => {
    if (!activeColor) return;
    setMarks((prev) => {
      const tooth = { ...(prev[toothNumber] || {}) };
      // Toggle: if same color already on that surface, remove it
      if (tooth[surface] === activeColor.color) {
        delete tooth[surface];
      } else {
        tooth[surface] = activeColor.color;
      }
      return { ...prev, [toothNumber]: tooth };
    });
  };

  return { marks, setMarks, activeColor, setActiveColor, handleSurfaceClick };
}
