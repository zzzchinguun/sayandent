'use client';

import { toothLabel } from '@/lib/dental/codes';
import {
  PERMANENT_SVG,
  DECIDUOUS_SVG,
  PERMANENT_POSITIONS,
  DECIDUOUS_POSITIONS,
  PERMANENT_VIEWBOX,
  DECIDUOUS_VIEWBOX,
} from './tooth-chart-svgs';

// Anatomical odontogram for whole-tooth selection (used by the Эмчилгээ step).
// The artwork is a static SVG; selection works through invisible hotspot
// buttons absolutely positioned over each tooth. For per-surface diagnosis
// marking see ToothChart.tsx instead.
export default function Odontogram({
  dentition,
  selected,
  onToggle,
}: {
  dentition: 'permanent' | 'deciduous';
  selected: Set<string>;
  onToggle: (code: string) => void;
}) {
  const permanent = dentition === 'permanent';
  const svg = permanent ? PERMANENT_SVG : DECIDUOUS_SVG;
  const positions = permanent ? PERMANENT_POSITIONS : DECIDUOUS_POSITIONS;
  const [vw, vh] = permanent ? PERMANENT_VIEWBOX : DECIDUOUS_VIEWBOX;

  return (
    <div className="mx-auto w-full max-w-[340px]">
      <p className="text-center text-[11px] uppercase tracking-wide text-stone-400 dark:text-stone-500 mb-1.5">Дээд</p>
      <div className="rounded-[50%] bg-rose-100/70 dark:bg-rose-950/30 px-5 py-6">
        <div className="relative">
          <div
            className="[&>svg]:w-full [&>svg]:h-auto"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {Object.entries(positions).map(([code, [x, y]]) => {
            const isSelected = selected.has(code);
            return (
              <button
                key={code}
                type="button"
                onClick={() => onToggle(code)}
                title={`${code} — ${toothLabel(code)}`}
                style={{
                  left: `${((x / vw) * 100).toFixed(2)}%`,
                  top: `${((y / vh) * 100).toFixed(2)}%`,
                }}
                className={`absolute -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                  isSelected
                    ? 'bg-primary-600/60 text-white ring-2 ring-primary-600 shadow'
                    : 'text-transparent hover:bg-primary-300/40 hover:text-primary-900 dark:hover:text-primary-100'
                }`}
              >
                {code}
              </button>
            );
          })}
        </div>
      </div>
      <p className="text-center text-[11px] uppercase tracking-wide text-stone-400 dark:text-stone-500 mt-1.5">Доод</p>
    </div>
  );
}
