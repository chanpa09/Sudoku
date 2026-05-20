import { useState } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import Controls from './components/Controls';
import { Confetti } from './components/Confetti';
import { StatsChart } from './components/StatsChart';
import { useSudoku, type Difficulty } from './hooks/useSudoku';

const formatTime = (seconds: number | null) => {
  if (seconds === null) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const currentLocalDate = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const difficultyLabels: Record<Difficulty, string> = {
  beginner: '입문자',
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
  expert: '전문가/지옥',
};

const achievementLabels: Record<string, string> = {
  'First Win': '첫 승리',
  'No-Hint Solve': '힌트 없이 완료',
  'Clean Solve': '실수 없이 완료',
  'Hard Complete': '어려움 완료',
  '7-Day Streak': '7일 연속',
  firstWin: '첫 승리',
  noHints: '힌트 없이 완료',
  noMistakes: '실수 없이 완료',
  hardWin: '어려움 완료',
  dailyStreak: '7일 연속',
};

const formatShortDate = (dateKey: string) => {
  const [, month, day] = dateKey.split('-');
  return `${Number(month)}/${Number(day)}`;
};

const recentDateKeys = (count: number) => {
  const dates = [];
  const cursor = new Date();
  for (let index = 0; index < count; index++) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
    cursor.setDate(cursor.getDate() - 1);
  }
  return dates;
};

function App() {
  const sudoku = useSudoku();
  const [archiveDate, setArchiveDate] = useState(currentLocalDate());
  const [shareMessage, setShareMessage] = useState('');
  const {
    activeTab,
    setActiveTab,
    currentBoard,
    initialBoard,
    solutionBoard,
    notes,
    hintHighlight,
    selectedCell,
    isNoteMode,
    stickyNumber,
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
    hintMessage,
    hintStep,
    remainingDigits,
    settings,
    stats,
    dailyRecords,
    currentDailyDate,
    dailyStreak,
    selectCell,
    enterNumber,
    clearCell,
    toggleNoteMode,
    toggleStickyNumber,
    autoFillNotes,
    cleanNotes,
    updateSettings,
    getHint,
    startNewGame,
    startDailyGame,
    pauseGame,
    resumeGame,
    undo,
    redo,
    canUndo,
    canRedo,
    showMistakes,
    showDuplicates,
    skillIndex,
  } = sudoku;

  const isGameTab = activeTab === 'classic';
  const hasArchiveDate = /^\d{4}-\d{2}-\d{2}$/.test(archiveDate);
  const recentDailyDates = recentDateKeys(7);
  const completedDailyKeys = new Set(dailyRecords.filter(record => record.completed).map(record => `${record.date}:${record.difficulty}`));
  const navigateToTab = (tab: typeof activeTab) => {
    setShareMessage('');
    setActiveTab(tab);
  };
  const startClassicGame = (level: Difficulty = difficulty) => {
    setShareMessage('');
    startNewGame(level);
  };
  const startDailyAndPlay = (level: Difficulty, date = currentDailyDate) => {
    setShareMessage('');
    startDailyGame(level, date);
    setActiveTab('classic');
  };
  const shareResult = async () => {
    const modeText = gameMode === 'daily' && dailyDate ? `오늘의 문제 ${dailyDate}` : '일반 게임';
    const text = `스도쿠 완료\n${modeText} · ${difficultyLabels[difficulty]}\n기록 ${formatTime(timer)} · 실수 ${mistakes}/${maxMistakes} · 힌트 ${hintsUsed}`;

    try {
      await navigator.clipboard.writeText(text);
      setShareMessage('결과를 복사했습니다.');
    } catch {
      setShareMessage('이 브라우저에서는 복사를 사용할 수 없습니다.');
    }
  };

  return (
    <div className={`min-h-screen flex flex-col items-center pb-12 transition-colors duration-300 ${settings.darkMode ? 'dark' : ''} theme-${settings.colorTheme} bg-[var(--bg-root)] text-[var(--text-main)]`}>
      <Confetti active={gameStatus === 'won'} />
      <Header
        activeTab={activeTab}
        timer={timer}
        gameStatus={gameStatus}
        gameMode={gameMode}
        dailyDate={dailyDate}
        difficulty={difficulty}
        mistakes={mistakes}
        maxMistakes={maxMistakes}
        hintsUsed={hintsUsed}
        explanationHintsUsed={explanationHintsUsed}
        bestTime={bestTime}
        dailyStreak={dailyStreak}
        zenMode={settings.zenMode}
        onNavigate={navigateToTab}
      />

      <main className="w-full max-w-2xl px-4">
        {activeTab === 'daily' && (
          <section className="glass-panel rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-main)]">오늘의 문제</h2>
                <p className="text-sm text-[var(--text-dim)]">오늘 {currentDailyDate} · {dailyStreak}일 연속</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                {(['beginner', 'easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => startDailyAndPlay(level, currentDailyDate)}
                    className="px-3 py-2 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-lg font-semibold hover:bg-[var(--color-primary)]/20"
                  >
                    {difficultyLabels[level]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <div className="grid grid-cols-7 gap-1">
                {recentDailyDates.map(dateKey => {
                  const completedCount = (['beginner', 'easy', 'medium', 'hard', 'expert'] as Difficulty[])
                    .filter(level => completedDailyKeys.has(`${dateKey}:${level}`)).length;
                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => setArchiveDate(dateKey)}
                      className={`rounded border border-[var(--border-main)] px-1 py-2 text-center ${
                        archiveDate === dateKey ? 'bg-[var(--color-primary)] text-white' : 'bg-[var(--bg-root)] text-[var(--text-main)] hover:bg-[var(--border-main)]/80'
                      }`}
                      title={`${dateKey} 완료 ${completedCount}/5`}
                    >
                      <span className="block text-xs font-bold">{formatShortDate(dateKey)}</span>
                      <span className="block text-[10px] opacity-80">{completedCount}/5</span>
                    </button>
                  );
                })}
              </div>
              <label className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-root)] rounded px-3 py-2">
                <span className="font-semibold text-[var(--text-dim)]">지난 문제 날짜</span>
                <input
                  type="date"
                  value={archiveDate}
                  max={currentDailyDate}
                  onChange={(event) => setArchiveDate(event.target.value)}
                  className="rounded border border-[var(--border-main)] bg-[var(--bg-panel)] px-2 py-1"
                />
              </label>
              <div className="flex flex-wrap gap-2 justify-end">
                {(['beginner', 'easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(level => (
                  <button
                    key={`archive-${level}`}
                    type="button"
                    disabled={!hasArchiveDate}
                    onClick={() => startDailyAndPlay(level, archiveDate)}
                    className="px-3 py-2 bg-[var(--border-main)] text-[var(--text-main)] rounded-lg font-semibold hover:bg-[var(--border-main)]/80 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {difficultyLabels[level]}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <h3 className="mb-2 font-bold text-[var(--text-main)]">최근 완료 기록</h3>
                <div className="grid gap-2">
                  {dailyRecords.slice(0, 3).map(record => (
                    <div key={`${record.date}:${record.difficulty}`} className="bg-[var(--bg-root)] rounded px-3 py-2 text-[var(--text-main)]">
                      {record.date} · {difficultyLabels[record.difficulty]} · {record.completed ? formatTime(record.time) : '진행 중'}
                    </div>
                  ))}
                  {dailyRecords.length === 0 && <p className="text-[var(--text-dim)]">아직 완료한 오늘의 문제가 없습니다.</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {hintMessage && isGameTab && (
          <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 text-yellow-800 dark:text-yellow-200 rounded shadow-sm">
            <p className="font-medium">힌트 {hintStep === null ? '' : hintStep + 1}/3: {hintMessage}</p>
          </div>
        )}

        {isGameTab && (
          <>
            <Board
              currentBoard={currentBoard}
              initialBoard={initialBoard}
              solutionBoard={solutionBoard}
              notes={notes}
              hintHighlight={hintHighlight}
              selectedCell={selectedCell}
              isPaused={gameStatus === 'paused'}
              showMistakes={showMistakes}
              showDuplicates={showDuplicates}
              onSelectCell={selectCell}
            />

            <Controls
              difficulty={difficulty}
              gameStatus={gameStatus}
              isNoteMode={isNoteMode}
              stickyNumber={stickyNumber}
              canUndo={canUndo}
              canRedo={canRedo}
              remainingDigits={remainingDigits}
              onNumberClick={enterNumber}
              onClear={clearCell}
              onToggleNoteMode={toggleNoteMode}
              onToggleStickyNumber={toggleStickyNumber}
              onAutoNotes={autoFillNotes}
              onCleanNotes={cleanNotes}
              onHint={getHint}
              onNewGame={gameMode === 'daily' ? startDailyAndPlay : startClassicGame}
              onPause={pauseGame}
              onResume={resumeGame}
              onUndo={undo}
              onRedo={redo}
            />
          </>
        )}

        {activeTab === 'stats' && (
          <section className="glass-panel rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[var(--text-main)]">통계</h2>
              <div className="text-right">
                <span className="text-sm text-[var(--text-dim)]">나의 실력 지수</span>
                <div className="text-2xl font-black text-[var(--color-primary)]">{skillIndex}</div>
              </div>
            </div>
            <div className="grid gap-3">
              {(['beginner', 'easy', 'medium', 'hard', 'expert'] as Difficulty[]).map(level => {
                const item = stats.byDifficulty[level] || { played: 0, won: 0, lost: 0, bestTime: null, totalTime: 0, totalMistakes: 0, totalHints: 0, noHintWins: 0, noMistakeWins: 0 };
                const averageTime = item.won ? Math.round(item.totalTime / item.won) : null;
                const winRate = item.played ? Math.round((item.won / item.played) * 100) : 0;
                return (
                  <div key={level} className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[var(--bg-root)] rounded-lg p-3 text-sm text-[var(--text-main)]">
                    <strong>{difficultyLabels[level]}</strong>
                    <span>승리 {item.won}/{item.played}</span>
                    <span>승률 {winRate}%</span>
                    <span>최고 {formatTime(item.bestTime)}</span>
                    <span>평균 {formatTime(averageTime)}</span>
                    <span>힌트 {item.totalHints}</span>
                    <span>무힌트 {item.noHintWins}</span>
                    <span>무실수 {item.noMistakeWins}</span>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-6">
              <h3 className="font-bold text-[var(--text-main)] mb-2">사용한 해결 기술 (힌트 기반)</h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  difficulties.reduce((acc, diff) => {
                    const ts = stats.byDifficulty[diff].techniqueStats || {};
                    Object.entries(ts).forEach(([tech, count]) => {
                      acc[tech] = (acc[tech] || 0) + count;
                    });
                    return acc;
                  }, {} as Record<string, number>)
                ).sort((a, b) => b[1] - a[1]).map(([tech, count]) => (
                  <div key={tech} className="px-3 py-1 bg-[var(--bg-root)] border border-[var(--border-main)] rounded text-xs text-[var(--text-main)]">
                    {tech}: <span className="font-bold">{count}</span>
                  </div>
                ))}
                {Object.keys(stats.byDifficulty).every(d => Object.keys(stats.byDifficulty[d as Difficulty].techniqueStats || {}).length === 0) && (
                  <span className="text-[var(--text-dim)] text-xs">아직 기록된 기술이 없습니다.</span>
                )}
              </div>
            </div>

            <StatsChart stats={stats} />
            <h3 className="mt-5 mb-2 font-bold text-[var(--text-main)]">최근 오늘의 문제</h3>
            <div className="grid gap-2 text-sm">
              {dailyRecords.slice(0, 7).map(record => (
                <div key={`stats-${record.date}:${record.difficulty}`} className="flex flex-wrap items-center justify-between gap-2 bg-[var(--bg-root)] rounded px-3 py-2 text-[var(--text-main)]">
                  <span>{record.date} · {difficultyLabels[record.difficulty]}</span>
                  <span>{record.completed ? formatTime(record.time) : '진행 중'} · 실수 {record.mistakes} · 힌트 {record.hints}</span>
                </div>
              ))}
              {dailyRecords.length === 0 && <p className="text-[var(--text-dim)]">아직 오늘의 문제 기록이 없습니다.</p>}
            </div>
            <h3 className="mt-5 mb-2 font-bold text-[var(--text-main)]">업적</h3>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.length === 0 ? (
                <span className="text-[var(--text-dim)]">아직 달성한 업적이 없습니다.</span>
              ) : stats.achievements.map(item => (
                <span key={item} className="px-3 py-1 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-full text-sm font-semibold">{achievementLabels[item] ?? item}</span>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="glass-panel rounded-lg p-5">
            <h2 className="text-xl font-bold text-[var(--text-main)] mb-4">설정</h2>
            <div className="grid gap-3">
              {[
                ['autoCheck', '실수 자동 확인'],
                ['mistakeLimit', '실수 제한'],
                ['duplicateHighlight', '중복 숫자 강조'],
                ['darkMode', '다크 모드'],
                ['zenMode', 'Zen 모드 (타이머/실수 숨기기)'],
                ['soundsEnabled', '효과음'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between bg-[var(--bg-root)] rounded-lg px-4 py-3 cursor-pointer">
                  <span className="font-semibold text-[var(--text-main)]">{label}</span>
                  <input
                    type="checkbox"
                    className="w-5 h-5 accent-[var(--color-primary)]"
                    checked={Boolean(settings[key as keyof typeof settings])}
                    onChange={(event) => updateSettings({ [key]: event.target.checked })}
                  />
                </label>
              ))}
              <label className="flex items-center justify-between bg-[var(--bg-root)] rounded-lg px-4 py-3">
                <span className="font-semibold text-[var(--text-main)]">테마</span>
                <select
                  value={settings.colorTheme}
                  onChange={(event) => updateSettings({ colorTheme: event.target.value as typeof settings.colorTheme })}
                  className="rounded border border-[var(--border-main)] bg-[var(--bg-panel)] text-[var(--text-main)] px-2 py-1 outline-none focus:border-[var(--color-primary)]"
                >
                  {[
                    ['blue', '파랑'],
                    ['emerald', '초록'],
                    ['violet', '보라'],
                    ['amber', '골드 (Amber)'],
                    ['slate', '미니멀 (Slate)'],
                    ['rose', '석양 (Rose)'],
                    ['midnight', '심야 (Midnight)'],
                    ['forest', '숲 (Forest)'],
                    ['sand', '모래 (Sand)'],
                  ].map(([val, label]) => {
                    const isUnlocked = stats.unlockedThemes.includes(val);
                    return (
                      <option key={val} value={val} disabled={!isUnlocked}>
                        {label} {!isUnlocked && '(잠김)'}
                      </option>
                    );
                  })}
                </select>
              </label>
            </div>
          </section>
        )}

        {gameStatus === 'won' && isGameTab && (
          <div className="mt-8 p-6 bg-green-100 dark:bg-green-900/30 border-2 border-green-500 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">완료했습니다</h2>
            <p className="text-green-700 dark:text-green-300">{Math.floor(timer / 60)}분 {timer % 60}초 만에 풀었습니다. 입력 힌트는 {hintsUsed}번 사용했습니다.</p>
            <button
              type="button"
              onClick={() => gameMode === 'daily' ? startDailyAndPlay(difficulty, dailyDate ?? currentDailyDate) : startClassicGame(difficulty)}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
            >
              다시 풀기
            </button>
            <button
              type="button"
              onClick={shareResult}
              className="mt-4 ml-2 px-6 py-2 bg-[var(--color-primary)] text-white rounded-lg font-bold hover:bg-[var(--color-primary-hover)] transition-colors"
            >
              결과 공유
            </button>
            {shareMessage && <p className="mt-3 text-sm text-green-700 dark:text-green-300">{shareMessage}</p>}
          </div>
        )}

        {gameStatus === 'lost' && isGameTab && (
          <div className="mt-8 p-6 bg-red-100 dark:bg-red-900/30 border-2 border-red-500 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-red-700 dark:text-red-400">게임 종료</h2>
            <p className="text-red-700 dark:text-red-300">실수 {maxMistakes}회에 도달했습니다.</p>
            <button
              type="button"
              onClick={() => gameMode === 'daily' ? startDailyAndPlay(difficulty, dailyDate ?? currentDailyDate) : startClassicGame(difficulty)}
              className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}
      </main>
    </div>
  );

}

export default App;
