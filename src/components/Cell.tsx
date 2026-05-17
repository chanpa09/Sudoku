import React from 'react';

interface CellProps {
  value: number;
  initialValue: number;
  isSelected: boolean;
  isSameNumber: boolean;
  isRelated: boolean;
  isConflict: boolean;
  isMistake: boolean;
  isPaused: boolean;
  row: number;
  col: number;
  notes: Set<number>;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({
  value,
  initialValue,
  isSelected,
  isSameNumber,
  isRelated,
  isConflict,
  isMistake,
  isPaused,
  row,
  col,
  notes,
  onClick,
}) => {
  const isInitial = initialValue !== 0;

  const getBgColor = () => {
    if (isPaused) return 'bg-[var(--bg-cell-paused)]';
    if (isSelected) return 'bg-[var(--bg-cell-selected)]';
    if (isSameNumber && value !== 0) return 'bg-[var(--bg-cell-same)]';
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
      className={`relative w-full h-full border border-[var(--border-cell)] flex items-center justify-center cursor-pointer text-xl sm:text-2xl transition-colors ${getBgColor()} ${getTextColor()}`}
    >
      {isPaused ? (
        ''
      ) : value !== 0 ? (
        value
      ) : (
        <div className="grid grid-cols-3 grid-rows-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="text-[8px] sm:text-[10px] leading-none flex items-center justify-center text-[var(--text-cell-note)]">
              {notes.has(n) ? n : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );

};

export default Cell;
