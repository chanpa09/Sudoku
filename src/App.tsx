import { useState } from 'react';
import Header from './components/Header';
import Board from './components/Board';
import Controls from './components/Controls';
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
  easy: '쉬움',
  medium: '보통',
  hard: '어려움',
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

function App() {
  const sudoku = useSudoku();
  const [archiveDate, setArchiveDate] = useState(currentLocalDate());
  const {
    activeTab,
    setActiveTab,
    currentBoard,
    initialBoard,
    solutionBoard,
    notes,
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
  } = sudoku;

  const isGameTab = activeTab === 'classic';
  const hasArchiveDate = /^\d{4}-\d{2}-\d{2}$/.test(archiveDate);
  const startDailyAndPlay = (level: Difficulty, date = dailyDate ?? currentDailyDate) => {
    startDailyGame(level, date);
    setActiveTab('classic');
  };

  return (
    <div className={`min-h-screen flex flex-col items-center pb-12 ${settings.darkMode ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
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
        onNavigate={setActiveTab}
      />

      <main className="w-full max-w-2xl px-4">
        {activeTab === 'daily' && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-gray-800">오늘의 문제</h2>
                <p className="text-sm text-gray-600">오늘 {currentDailyDate} · {dailyStreak}일 연속</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => startDailyAndPlay(level)}
                    className="px-3 py-2 bg-emerald-100 text-emerald-800 rounded-lg font-semibold hover:bg-emerald-200"
                  >
                    {difficultyLabels[level]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-5 grid gap-3 text-sm">
              <label className="flex flex-wrap items-center justify-between gap-2 bg-gray-100 rounded px-3 py-2">
                <span className="font-semibold text-gray-700">지난 문제 날짜</span>
                <input
                  type="date"
                  value={archiveDate}
                  max={currentDailyDate}
                  onChange={(event) => setArchiveDate(event.target.value)}
                  className="rounded border border-gray-300 px-2 py-1"
                />
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => (
                  <button
                    key={`archive-${level}`}
                    type="button"
                    disabled={!hasArchiveDate}
                    onClick={() => startDailyAndPlay(level, archiveDate)}
                    className="px-3 py-2 bg-slate-100 text-slate-800 rounded-lg font-semibold hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {difficultyLabels[level]}
                  </button>
                ))}
              </div>
              <div className="pt-2">
                <h3 className="mb-2 font-bold text-gray-800">최근 완료 기록</h3>
                <div className="grid gap-2">
                  {dailyRecords.slice(0, 3).map(record => (
                    <div key={`${record.date}:${record.difficulty}`} className="bg-gray-100 rounded px-3 py-2">
                      {record.date} · {difficultyLabels[record.difficulty]} · {record.completed ? formatTime(record.time) : '진행 중'}
                    </div>
                  ))}
                  {dailyRecords.length === 0 && <p className="text-gray-500">아직 완료한 오늘의 문제가 없습니다.</p>}
                </div>
              </div>
            </div>
          </section>
        )}

        {hintMessage && isGameTab && (
          <div className="mb-4 p-4 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 rounded shadow-sm">
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
              onHint={getHint}
              onNewGame={gameMode === 'daily' ? startDailyAndPlay : startNewGame}
              onPause={pauseGame}
              onResume={resumeGame}
              onUndo={undo}
              onRedo={redo}
            />
          </>
        )}

        {activeTab === 'stats' && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">통계</h2>
            <div className="grid gap-3">
              {(['easy', 'medium', 'hard'] as Difficulty[]).map(level => {
                const item = stats.byDifficulty[level];
                const averageTime = item.won ? Math.round(item.totalTime / item.won) : null;
                return (
                  <div key={level} className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-gray-100 rounded-lg p-3 text-sm">
                    <strong>{difficultyLabels[level]}</strong>
                    <span>승리 {item.won}/{item.played}</span>
                    <span>최고 {formatTime(item.bestTime)}</span>
                    <span>평균 {formatTime(averageTime)}</span>
                    <span>힌트 {item.totalHints}</span>
                  </div>
                );
              })}
            </div>
            <h3 className="mt-5 mb-2 font-bold text-gray-800">업적</h3>
            <div className="flex flex-wrap gap-2">
              {stats.achievements.length === 0 ? (
                <span className="text-gray-500">아직 달성한 업적이 없습니다.</span>
              ) : stats.achievements.map(item => (
                <span key={item} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">{achievementLabels[item] ?? item}</span>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <section className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-xl font-bold text-gray-800 mb-4">설정</h2>
            <div className="grid gap-3">
              {[
                ['autoCheck', '실수 자동 확인'],
                ['mistakeLimit', '실수 제한'],
                ['duplicateHighlight', '중복 숫자 강조'],
                ['darkMode', '다크 모드'],
              ].map(([key, label]) => (
                <label key={key} className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                  <span className="font-semibold text-gray-700">{label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(settings[key as keyof typeof settings])}
                    onChange={(event) => updateSettings({ [key]: event.target.checked })}
                  />
                </label>
              ))}
              <label className="flex items-center justify-between bg-gray-100 rounded-lg px-4 py-3">
                <span className="font-semibold text-gray-700">테마</span>
                <select
                  value={settings.colorTheme}
                  onChange={(event) => updateSettings({ colorTheme: event.target.value as typeof settings.colorTheme })}
                  className="rounded border border-gray-300 px-2 py-1"
                >
                  <option value="blue">파랑</option>
                  <option value="emerald">초록</option>
                  <option value="violet">보라</option>
                </select>
              </label>
            </div>
          </section>
        )}

        {gameStatus === 'won' && isGameTab && (
          <div className="mt-8 p-6 bg-green-100 border-2 border-green-500 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-green-700">완료했습니다</h2>
            <p className="text-green-700">{Math.floor(timer / 60)}분 {timer % 60}초 만에 풀었습니다. 입력 힌트는 {hintsUsed}번 사용했습니다.</p>
            <button
              type="button"
              onClick={() => gameMode === 'daily' ? startDailyAndPlay(difficulty, dailyDate ?? currentDailyDate) : startNewGame(difficulty)}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
            >
              다시 풀기
            </button>
          </div>
        )}

        {gameStatus === 'lost' && isGameTab && (
          <div className="mt-8 p-6 bg-red-100 border-2 border-red-500 rounded-lg text-center">
            <h2 className="text-2xl font-bold text-red-700">게임 종료</h2>
            <p className="text-red-700">실수 {maxMistakes}회에 도달했습니다.</p>
            <button
              type="button"
              onClick={() => gameMode === 'daily' ? startDailyAndPlay(difficulty, dailyDate ?? currentDailyDate) : startNewGame(difficulty)}
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
