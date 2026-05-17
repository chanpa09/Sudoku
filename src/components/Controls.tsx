import React from 'react';

interface ControlsProps {
  isNoteMode: boolean;
  onNumberClick: (num: number) => void;
  onToggleNoteMode: () => void;
  onHint: () => void;
  onNewGame: () => void;
}

const Controls: React.FC<ControlsProps> = ({
  isNoteMode,
  onNumberClick,
  onToggleNoteMode,
  onHint,
  onNewGame,
}) => {
  return (
    <div className="w-full max-w-[500px] mt-8 mx-auto flex flex-col gap-6 px-4">
      {/* Number Pad */}
      <div className="grid grid-cols-9 gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            onClick={() => onNumberClick(num)}
            className="aspect-square flex items-center justify-center bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-md"
          >
            {num}
          </button>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={onToggleNoteMode}
          className={`py-3 rounded-xl font-bold transition-all shadow-md ${
            isNoteMode ? 'bg-orange-500 text-white shadow-inner scale-95' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {isNoteMode ? 'Notes: ON' : 'Notes: OFF'}
        </button>
        <button
          onClick={onHint}
          className="py-3 bg-yellow-400 text-yellow-900 rounded-xl font-bold hover:bg-yellow-500 active:scale-95 transition-all shadow-md"
        >
          Hint
        </button>
        <button
          onClick={onNewGame}
          className="py-3 bg-green-500 text-white rounded-xl font-bold hover:bg-green-600 active:scale-95 transition-all shadow-md"
        >
          New Game
        </button>
      </div>
    </div>
  );
};

export default Controls;
