import React, { useState, useRef, useEffect } from 'react';
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
  const moreMenuRef = useRef<HTMLDivElement>(null);
  const isEnded = gameStatus === 'won' || gameStatus === 'lost';
  const isDisabled = isEnded || gameStatus === 'paused';

  useEffect(() => {
    if (!isMoreOpen) return;

    const handleClickOutside = (event: PointerEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMoreOpen(false);
      }
    };

    document.addEventListener('pointerdown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMoreOpen]);

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
            className={`aspect-square flex items-center justify-center rounded-lg text-lg sm:text-xl font-bold active:scale-95 transition-all disabled:cursor-not-allowed disabled:bg-[var(--border-main)] disabled:text-[var(--text-dim)] ${
              stickyNumber === num ? 'bg-[var(--color-primary-active)] text-white' : 'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)]'
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
          className={`py-3 rounded-lg font-bold transition-colors disabled:cursor-not-allowed disabled:bg-[var(--border-main)] disabled:text-[var(--text-dim)] ${
            isNoteMode ? 'bg-orange-500 text-white' : 'bg-[var(--bg-panel)] border border-[var(--border-main)] text-[var(--text-main)] hover:bg-[var(--bg-root)]'
          }`}
        >
          메모
        </button>
        <button
          type="button"
          onClick={onHint}
          disabled={isDisabled}
          className="py-3 bg-yellow-400 text-yellow-900 rounded-lg font-bold hover:bg-yellow-500 disabled:cursor-not-allowed disabled:bg-[var(--border-main)] disabled:text-[var(--text-dim)]"
        >
          힌트
        </button>
        <button
          type="button"
          onClick={onUndo}
          disabled={isDisabled || !canUndo}
          className="py-3 bg-[var(--bg-panel)] border border-[var(--border-main)] text-[var(--text-main)] rounded-lg font-bold hover:bg-[var(--bg-root)] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          실행 취소
        </button>
        <div className="relative" ref={moreMenuRef}>
          <button
            type="button"
            onClick={() => setIsMoreOpen(open => !open)}
            className="w-full py-3 bg-gray-800 dark:bg-gray-700 text-white rounded-lg font-bold hover:bg-gray-900 dark:hover:bg-gray-600"
          >
            더보기
          </button>
          {isMoreOpen && (
            <div className="absolute right-0 bottom-14 z-20 w-56 rounded-lg border border-[var(--border-main)] bg-[var(--bg-panel)] shadow-xl overflow-hidden text-sm">
              <button
                type="button"
                onClick={() => {
                  onRedo();
                  setIsMoreOpen(false);
                }}
                disabled={isDisabled || !canRedo}
                className="w-full text-left px-4 py-3 font-semibold text-[var(--text-main)] hover:bg-[var(--bg-root)] disabled:opacity-40"
              >
                다시 실행
              </button>
              <button
                type="button"
                onClick={() => {
                  onClear();
                  setIsMoreOpen(false);
                }}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3 font-semibold text-[var(--text-main)] hover:bg-[var(--bg-root)] disabled:opacity-40"
              >
                칸 지우기
              </button>
              <button
                type="button"
                onClick={() => {
                  onAutoNotes();
                  setIsMoreOpen(false);
                }}
                disabled={isDisabled}
                className="w-full text-left px-4 py-3 font-semibold text-[var(--text-main)] hover:bg-[var(--bg-root)] disabled:opacity-40"
              >
                자동 메모
              </button>
              <button
                type="button"
                onClick={() => {
                  if (gameStatus === 'paused') onResume();
                  else onPause();
                  setIsMoreOpen(false);
                }}
                disabled={isEnded}
                className="w-full text-left px-4 py-3 font-semibold text-[var(--text-main)] hover:bg-[var(--bg-root)] disabled:opacity-40"
              >
                {gameStatus === 'paused' ? '계속하기' : '일시정지'}
              </button>
              <div className="border-t border-[var(--border-main)] p-2">
                <div className="px-2 pb-1 text-xs font-bold uppercase text-[var(--text-dim)]">새 게임</div>
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
                        difficulty === level ? 'bg-green-600 text-white' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/50'
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
        <div className="text-center text-xs text-[var(--color-primary)]">
          {stickyNumber} 고정 입력 중입니다. 끄려면 {stickyNumber}을 한 번 더 누르세요.
        </div>
      )}

    </div>
  );
};

export default Controls;
