import React from 'react';

interface CellProps {
  value: number;
  initialValue: number;
  isSelected: boolean;
  isSameNumber: boolean;
  isRelated: boolean;
  isConflict: boolean;
  isMistake: boolean;
  isHintPrimary: boolean;
  isHintRelated: boolean;
  isPaused: boolean;
  row: number;
  col: number;
  notes: Set<number>;
  onClick: () => void;
  hintNotes?: Record<number, 'condition' | 'removal'>;
}

const Cell: React.FC<CellProps> = ({
  value,
  initialValue,
  isSelected,
  isSameNumber,
  isRelated,
  isConflict,
  isMistake,
  isHintPrimary,
  isHintRelated,
  isPaused,
  row,
  col,
  notes,
  onClick,
  hintNotes,
}) => {
  const isInitial = initialValue !== 0;

  const getBgColor = () => {
    if (isPaused) return 'bg-[var(--bg-cell-paused)]';
    if (isHintPrimary) return 'bg-yellow-200 dark:bg-yellow-900/30';
    if (isSelected) return 'bg-[var(--bg-cell-selected)]';
    if (isSameNumber && value !== 0) return 'bg-[var(--bg-cell-same)]';
    if (isHintRelated) return 'bg-yellow-50 dark:bg-yellow-900/20';
    if (isRelated) return 'bg-[var(--bg-cell-related)]';
    return 'bg-[var(--bg-cell)]';
  };

  const getTextColor = () => {
    if (isPaused) return 'text-transparent';
    if (isConflict || isMistake) return 'text-[var(--text-cell-error)]';
    if (isInitial) return 'text-[var(--text-cell-initial)] font-bold';
    return 'text-[var(--text-cell-entered)]';
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={isPaused ? `${row + 1}행 ${col + 1}열, 일시정지 중 숨김` : `${row + 1}행 ${col + 1}열${value ? `, ${value}` : ', 빈 칸'}`}
      aria-pressed={isSelected}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onClick();
        }
      }}
      className={`relative w-full h-full border border-[var(--border-cell)] flex items-center justify-center cursor-pointer text-xl sm:text-2xl transition-colors ${getBgColor()} ${getTextColor()} ${isHintPrimary ? 'ring-2 ring-yellow-400 ring-inset' : ''}`}
    >
      {isPaused ? (
        ''
      ) : value !== 0 ? (
        value
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const hType = hintNotes?.[n];
            let noteColorClass = 'text-[var(--text-cell-note)]';
            if (hType === 'condition') {
              noteColorClass = 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-100 dark:bg-emerald-950/50 rounded';
            } else if (hType === 'removal') {
              noteColorClass = 'text-rose-600 dark:text-rose-400 line-through font-extrabold bg-rose-100 dark:bg-rose-950/50 rounded';
            }
            return (
              <div key={n} className={`text-[8px] sm:text-[10px] leading-none flex items-center justify-center ${noteColorClass}`}>
                {notes.has(n) ? n : ''}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Cell;
