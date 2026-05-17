import React from 'react';

interface CellProps {
  value: number;
  initialValue: number;
  isSelected: boolean;
  isSameNumber: boolean;
  isConflict: boolean;
  notes: Set<number>;
  onClick: () => void;
}

const Cell: React.FC<CellProps> = ({
  value,
  initialValue,
  isSelected,
  isSameNumber,
  isConflict,
  notes,
  onClick,
}) => {
  const isInitial = initialValue !== 0;

  const getBgColor = () => {
    if (isSelected) return 'bg-blue-300';
    if (isSameNumber && value !== 0) return 'bg-blue-100';
    return 'bg-white';
  };

  const getTextColor = () => {
    if (isConflict) return 'text-red-500';
    if (isInitial) return 'text-gray-900 font-bold';
    return 'text-blue-600';
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full h-full border border-gray-300 flex items-center justify-center cursor-pointer text-xl sm:text-2xl transition-colors ${getBgColor()} ${getTextColor()}`}
    >
      {value !== 0 ? (
        value
      ) : (
        <div className="grid grid-cols-3 gap-0 w-full h-full p-0.5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <div key={n} className="text-[8px] sm:text-[10px] leading-none flex items-center justify-center text-gray-400">
              {notes.has(n) ? n : ''}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Cell;
