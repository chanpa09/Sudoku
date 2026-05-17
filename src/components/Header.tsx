import React, { useState } from 'react';
import type { AppTab, Difficulty, GameMode, GameStatus } from '../hooks/useSudoku';

interface HeaderProps {
  activeTab: AppTab;
  timer: number;
  gameStatus: GameStatus;
  gameMode: GameMode;
  dailyDate: string | null;
  difficulty: Difficulty;
  mistakes: number;
  maxMistakes: number;
  hintsUsed: number;
  explanationHintsUsed: number;
  bestTime: number | null;
  dailyStreak: number;
  onNavigate: (tab: AppTab) => void;
}

const formatTime = (seconds: number | null) => {
  if (seconds === null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const menuItems: Array<{ tab: AppTab; label: string }> = [
  { tab: 'classic', label: '게임' },
  { tab: 'daily', label: '오늘의 문제' },
  { tab: 'stats', label: '통계' },
  { tab: 'settings', label: '설정' },
];

const difficultyLabels: Record<Difficulty, string> = {
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
};

const Header: React.FC<HeaderProps> = ({
  activeTab,
  timer,
  gameStatus,
  gameMode,
  dailyDate,
  difficulty,
  mistakes,
  maxMistakes,
  hintsUsed,
  explanationHintsUsed,
  bestTime,
  dailyStreak,
  onNavigate,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const modeLabel = gameMode === 'daily' ? `오늘의 문제 ${dailyDate ?? ''}` : '일반 게임';

  return (
    <header className="w-full bg-white border-b border-gray-200 mb-4">
      <div className="max-w-2xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 leading-tight">스도쿠</h1>
            <button
              type="button"
              onClick={() => setShowDetails(open => !open)}
              className="text-xs text-gray-500 hover:text-gray-800"
            >
              {modeLabel} · {difficultyLabels[difficulty]} · {formatTime(timer)}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {gameStatus !== 'playing' && (
              <span className={`px-2 py-1 rounded text-xs font-bold ${
                gameStatus === 'won' ? 'bg-green-100 text-green-700'
                  : gameStatus === 'lost' ? 'bg-red-100 text-red-700'
                    : 'bg-indigo-100 text-indigo-700'
              }`}
              >
                {gameStatus === 'won' ? '완료' : gameStatus === 'lost' ? '실패' : '일시정지'}
              </span>
            )}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(open => !open)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                메뉴
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 top-11 z-20 w-40 rounded-lg border border-gray-200 bg-white shadow-lg overflow-hidden">
                  {menuItems.map(item => (
                    <button
                      key={item.tab}
                      type="button"
                      onClick={() => {
                        onNavigate(item.tab);
                        setIsMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-sm font-semibold ${
                        activeTab === item.tab ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {showDetails && (
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-700">
            <div className="bg-gray-100 rounded px-3 py-2">실수 {mistakes}/{maxMistakes}</div>
            <div className="bg-gray-100 rounded px-3 py-2">힌트 {hintsUsed}/{explanationHintsUsed}</div>
            <div className="bg-gray-100 rounded px-3 py-2">최고 {formatTime(bestTime)}</div>
            <div className="bg-gray-100 rounded px-3 py-2">연속 {dailyStreak}일</div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
