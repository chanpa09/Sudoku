import React, { useState } from 'react';
import type { Difficulty, GameStatus } from '../hooks/useSudoku';

interface ControlsProps {
  difficulty: Difficulty;
  gameStatus: GameStatus;
  isNoteMode: boolean;
  stickyNumber: number | null;
  canUndo: boolean;
  canRedo: boolean;
  remainingDigits: Record<number, number>;
  onNumberClick: (num: number) => void;
  onClear: () => void;
  onToggleNoteMode: () => void;
  onToggleStickyNumber: (num: number) => void;
  onAutoNotes: () => void;
  onHint: () => void;
  onNewGame: (difficulty: Difficulty) => void;
  onPause: () => void;
  onResume: () => void;
  onUndo: () => void;
  onRedo: () => void;
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

const Controls: React.FC<ControlsProps> = ({
  difficulty,
  gameStatus,
  isNoteMode,
  stickyNumber,
  canUndo,
  canRedo,
  remainingDigits,
  onNumberClick,
  onClear,
  onToggleNoteMode,
  onToggleStickyNumber,
  onAutoNotes,
  onHint,
  onNewGame,
  onPause,
  onResume,
  onUndo,
  onRedo,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const isEnded = gameStatus === 'won' || gameStatus === 'lost';
  const isDisabled = isEnded || gameStatus === 'paused';

  const handleNumberClick = (num: number) => {
    if (stickyNumber === num) {
      onToggleStickyNumber(num);
      setLastNumber(null);
      return;
    }

    if (lastNumber === num && stickyNumber !== num) {
      onToggleStickyNumber(num);
      setLastNumber(null);
      return;
    }

    onNumberClick(num);
    setLastNumber(num);
  };

  return (
    <div className="w-full max-w-[500px] mt-5 mx-auto flex flex-col gap-4 px-1">
      <div className="grid grid-cols-9 gap-1.5 sm:gap-2">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            disabled={isDisabled || (remainingDigits[num] <= 0 && stickyNumber !== num)}
            onClick={() => handleNumberClick(num)}
            className={`aspect-square flex items-center justify-center rounded-lg text-lg sm:text-xl font-bold active:scale-95 transition-all disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
              stickyNumber === num ? 'bg-blue-700 text-white' : 'bg-blue-500 text-white hover:bg-blue-600'
            }`}
            title={`${remainingDigits[num]}개 남음`}
          >
            {num}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-4 gap-2">
        <button
          type="button"
          onClick={onToggleNoteMode}
          disabled={isDisabled}
          className={`py-3 rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 ${
            isNoteMode ? 'bg-orange-500 text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          메모
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={isDisabled}
          className="py-3 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
        >
          힌트
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={isDisabled || !canUndo}
          className="py-3 bg-white border border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          실행 취소
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMoreOpen(open => !open)}
            className="w-full py-3 bg-gray-800 text-white rounded-lg font-bold hover:bg-gray-900"
          >
            더보기
          </button>
          {isMoreOpen && (
            <div className="absolute right-0 bottom-14 z-20 w-56 rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden text-sm">
              <button
                type="button"
                onClick={onRedo}
                disabled={isDisabled || !canRedo}
                className="w-full text-left px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                다시 실행
              </button>
              <button
                type="button"
                onClick={onClear}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                칸 지우기
              </button>
              <button
                type="button"
                onClick={onAutoNotes}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                자동 메모
              </button>
              <button
                type="button"
                onClick={gameStatus === 'paused' ? onResume : onPause}
                disabled={isEnded}
                className="w-full text-left px-4 py-3 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-40"
              >
                {gameStatus === 'paused' ? '계속하기' : '일시정지'}
              </button>
              <div className="border-t border-gray-200 p-2">
                <div className="px-2 pb-1 text-xs font-bold uppercase text-gray-400">새 게임</div>
                <div className="grid grid-cols-3 gap-1">
                  {(Object.keys(difficultyLabels) as Difficulty[]).map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => {
                        onNewGame(level);
                        setIsMoreOpen(false);
                      }}
                      className={`px-2 py-2 rounded text-xs font-bold ${
                        difficulty === level ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {difficultyLabels[level]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {stickyNumber && (
        <div className="text-center text-xs text-blue-700">
          {stickyNumber} 고정 입력 중입니다. 끄려면 {stickyNumber}을 한 번 더 누르세요.
        </div>
      )}
    </div>
  );
};

export default Controls;
