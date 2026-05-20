import React from 'react';
import type { GameStats, Difficulty } from '../hooks/useSudoku';

interface StatsChartProps {
  stats: GameStats;
}

const difficultyLabels: Record<Difficulty, string> = {
  beginner: '입문자',
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
  expert: '전문가/지옥',
};

export const StatsChart: React.FC<StatsChartProps> = ({ stats }) => {
  const difficulties: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  
  // Extract data
  const data = difficulties.map(level => {
    const item = stats.byDifficulty[level] || { played: 0, won: 0, bestTime: null };
    const winRate = item.played ? Math.round((item.won / item.played) * 100) : 0;
    return {
      level,
      label: difficultyLabels[level],
      played: item.played,
      won: item.won,
      winRate,
      bestTime: item.bestTime,
    };
  });

  const maxPlayed = Math.max(...data.map(d => d.played), 1);

  return (
    <div className="w-full mt-6 bg-[var(--bg-panel)]/50 backdrop-blur-md border border-[var(--border-main)] rounded-xl p-5 shadow-lg">
      <h3 className="text-lg font-bold text-[var(--text-main)] mb-5 flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[var(--color-primary)] animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        난이도별 승률 및 활동량 통계 (SVG 차트)
      </h3>

      <div className="space-y-6">
        {data.map(d => {
          const playedWidth = `${(d.played / maxPlayed) * 80 + 10}%`; // at least 10% for visibility
          const winRateColor = d.winRate >= 80 ? 'url(#grad-high)' : d.winRate >= 50 ? 'url(#grad-mid)' : 'url(#grad-low)';

          return (
            <div key={d.level} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Difficulty label */}
              <div className="md:col-span-2 text-sm font-bold text-[var(--text-main)]">
                {d.label}
              </div>

              {/* SVG Visual Bar */}
              <div className="md:col-span-8 h-12 w-full bg-[var(--bg-root)] rounded-lg overflow-hidden relative shadow-inner">
                <svg className="w-full h-full" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="grad-high" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(16, 185, 129, 0.4)" />
                      <stop offset="100%" stopColor="rgba(16, 185, 129, 0.95)" />
                    </linearGradient>
                    <linearGradient id="grad-mid" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(245, 158, 11, 0.4)" />
                      <stop offset="100%" stopColor="rgba(245, 158, 11, 0.95)" />
                    </linearGradient>
                    <linearGradient id="grad-low" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="rgba(239, 68, 68, 0.4)" />
                      <stop offset="100%" stopColor="rgba(239, 68, 68, 0.95)" />
                    </linearGradient>
                    <linearGradient id="bg-bar" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="var(--border-main)" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="var(--border-main)" stopOpacity="0.4" />
                    </linearGradient>
                  </defs>

                  {/* Played Bar (Background) */}
                  <rect
                    x="0"
                    y="6"
                    width={playedWidth}
                    height="36"
                    rx="6"
                    fill="url(#bg-bar)"
                    className="transition-all duration-500 ease-out"
                  />

                  {/* Won Bar (Foreground) */}
                  {d.won > 0 && (
                    <rect
                      x="0"
                      y="10"
                      width={`calc(${(d.won / maxPlayed) * 80 + 10}% - 4px)`}
                      height="28"
                      rx="4"
                      fill={winRateColor}
                      className="transition-all duration-700 ease-out hover:opacity-85 cursor-pointer"
                    />
                  )}

                  {/* Interactive Details Text inside SVG */}
                  <text
                    x="15"
                    y="28"
                    fill="var(--text-main)"
                    fontSize="11"
                    fontWeight="bold"
                    className="select-none pointer-events-none opacity-90"
                  >
                    진행: {d.played} / 승리: {d.won}
                  </text>
                </svg>
              </div>

              {/* Win rate & stats summary */}
              <div className="md:col-span-2 flex flex-col justify-center text-right md:text-right text-xs">
                <span className="text-sm font-extrabold text-[var(--color-primary)]">
                  승률 {d.winRate}%
                </span>
                <span className="text-[var(--text-dim)]">
                  최고: {d.bestTime ? `${Math.floor(d.bestTime / 60)}분 ${d.bestTime % 60}초` : '--'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
