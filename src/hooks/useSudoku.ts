import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Board, Difficulty } from '../utils/sudokuBase';
import { cloneBoard } from '../utils/sudokuBase';
import { generatePuzzle, generateSolvedBoard } from '../utils/sudoku';
import { findAdvancedHint, getPossibleValues, type Hint } from '../utils/hintLogic';
import { soundManager } from '../utils/soundManager';

export type { Board, Difficulty };
export type CellSelection = { row: number; col: number } | null;
export type GameStatus = 'playing' | 'paused' | 'won' | 'lost';
export type GameMode = 'classic' | 'daily';
export type AppTab = 'classic' | 'daily' | 'stats' | 'settings';
export type Notes = Set<number>[][];
export type HintHighlight = {
  primary: { row: number; col: number };
  related: Array<{ row: number; col: number }>;
  value: number;
  highlightedNotes?: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }>;
} | null;

export type GameSettings = {
  autoCheck: boolean;
  mistakeLimit: boolean;
  duplicateHighlight: boolean;
  darkMode: boolean;
  zenMode: boolean;
  soundsEnabled: boolean;
  colorTheme: 'blue' | 'emerald' | 'violet' | 'amber' | 'slate' | 'rose' | 'midnight' | 'forest' | 'sand';
};

export type DifficultyStats = {
  played: number;
  won: number;
  lost: number;
  bestTime: number | null;
  totalTime: number;
  totalMistakes: number;
  totalHints: number;
  noHintWins: number;
  noMistakeWins: number;
  techniqueStats: Record<string, number>;
};

export type GameStats = {
  byDifficulty: Record<Difficulty, DifficultyStats>;
  achievements: string[];
  unlockedThemes: string[];
};

export type DailyRecord = {
  date: string;
  difficulty: Difficulty;
  completed: boolean;
  time: number | null;
  mistakes: number;
  hints: number;
};

type HistoryItem = {
  currentBoard: Board;
  notes: number[][][];
  mistakes: number;
  gameStatus: GameStatus;
};

type SavedGameState = {
  version: 2;
  mode: GameMode;
  dailyDate: string | null;
  solutionBoard: Board;
  initialBoard: Board;
  currentBoard: Board;
  notes: number[][][];
  selectedCell: CellSelection;
  isNoteMode: boolean;
  stickyNumber: number | null;
  difficulty: Difficulty;
  timer: number;
  mistakes: number;
  hintsUsed: number;
  explanationHintsUsed: number;
  gameStatus: GameStatus;
  past: HistoryItem[];
  future: HistoryItem[];
  resultRecorded: boolean;
};

type HintState = {
  hint: Hint;
  step: number;
} | null;

const STORAGE_KEY = 'sudoku-game-state-v2';
const LEGACY_STORAGE_KEY = 'sudoku-game-state';
const SETTINGS_KEY = 'sudoku-settings-v1';
const STATS_KEY = 'sudoku-stats-v1';
const LEGACY_STATS_KEY = 'sudoku-stats';
const DAILY_RECORDS_KEY = 'sudoku-daily-records-v1';
const RECORDED_RESULTS_KEY = 'sudoku-recorded-results-v1';
const MAX_MISTAKES = 3;

const difficulties: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
const statuses: GameStatus[] = ['playing', 'paused', 'won', 'lost'];

const defaultSettings: GameSettings = {
  autoCheck: true,
  mistakeLimit: true,
  duplicateHighlight: true,
  darkMode: false,
  zenMode: false,
  soundsEnabled: true,
  colorTheme: 'blue',
};

const emptyDifficultyStats = (): DifficultyStats => ({
  played: 0,
  won: 0,
  lost: 0,
  bestTime: null,
  totalTime: 0,
  totalMistakes: 0,
  totalHints: 0,
  noHintWins: 0,
  noMistakeWins: 0,
  techniqueStats: {},
});

const defaultStats = (): GameStats => ({
  byDifficulty: {
    beginner: emptyDifficultyStats(),
    easy: emptyDifficultyStats(),
    medium: emptyDifficultyStats(),
    hard: emptyDifficultyStats(),
    expert: emptyDifficultyStats(),
  },
  achievements: [],
  unlockedThemes: ['blue', 'emerald', 'violet', 'amber', 'slate', 'rose'],
});

const formatLocalDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = (): string => formatLocalDate(new Date());

const dailySeed = (date: string, difficulty: Difficulty): string => `daily:${date}:${difficulty}`;

const emptyNotes = (): Notes =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));

const serializeNotes = (notes: Notes): number[][][] =>
  notes.map(row => row.map(cellNotes => [...cellNotes].sort((a, b) => a - b)));

const deserializeNotes = (notes: number[][][]): Notes =>
  notes.map(row => row.map(cellNotes => new Set(cellNotes)));

const isBoard = (value: unknown): value is Board =>
  Array.isArray(value)
  && value.length === 9
  && value.every(row =>
    Array.isArray(row)
    && row.length === 9
    && row.every(cell => Number.isInteger(cell) && cell >= 0 && cell <= 9)
  );

const isSavedNotes = (value: unknown): value is number[][][] =>
  Array.isArray(value)
  && value.length === 9
  && value.every(row =>
    Array.isArray(row)
    && row.length === 9
    && row.every(cellNotes =>
      Array.isArray(cellNotes)
      && cellNotes.every(note => Number.isInteger(note) && note >= 1 && note <= 9)
    )
  );

const isSelection = (value: unknown): value is CellSelection => {
  if (value === null) return true;
  if (typeof value !== 'object') return false;
  const selection = value as { row?: unknown; col?: unknown };
  return typeof selection.row === 'number'
    && typeof selection.col === 'number'
    && Number.isInteger(selection.row)
    && Number.isInteger(selection.col)
    && selection.row >= 0
    && selection.row <= 8
    && selection.col >= 0
    && selection.col <= 8;
};

const createGameState = (
  difficulty: Difficulty = 'medium',
  mode: GameMode = 'classic',
  date: string | null = null,
): SavedGameState => {
  const seed = mode === 'daily' && date ? dailySeed(date, difficulty) : undefined;
  const solved = generateSolvedBoard(seed);
  const puzzle = generatePuzzle(solved, difficulty, seed);

  return {
    version: 2,
    mode,
    dailyDate: date,
    solutionBoard: solved,
    initialBoard: cloneBoard(puzzle),
    currentBoard: cloneBoard(puzzle),
    notes: serializeNotes(emptyNotes()),
    selectedCell: null,
    isNoteMode: false,
    stickyNumber: null,
    difficulty,
    timer: 0,
    mistakes: 0,
    hintsUsed: 0,
    explanationHintsUsed: 0,
    gameStatus: 'playing',
    past: [],
    future: [],
    resultRecorded: false,
  };
};

const pushHistory = (current: SavedGameState): SavedGameState => {
  const historyItem: HistoryItem = {
    currentBoard: cloneBoard(current.currentBoard),
    notes: current.notes,
    mistakes: current.mistakes,
    gameStatus: current.gameStatus,
  };

  return {
    ...current,
    past: [...current.past, historyItem].slice(-50),
    future: [],
  };
};

const normalizeHistory = (value: unknown): HistoryItem[] => {
  if (!Array.isArray(value)) return [];
  return value.filter(item => {
    const candidate = item as Partial<HistoryItem>;
    return isBoard(candidate.currentBoard)
      && isSavedNotes(candidate.notes)
      && typeof candidate.mistakes === 'number'
      && statuses.includes(candidate.gameStatus as GameStatus);
  }) as HistoryItem[];
};

const normalizeSavedGame = (value: unknown): SavedGameState | null => {
  if (typeof value !== 'object' || value === null) return null;
  const parsed = value as Partial<SavedGameState>;

  if (!isBoard(parsed.solutionBoard) || !isBoard(parsed.initialBoard) || !isBoard(parsed.currentBoard)) return null;
  if (!isSavedNotes(parsed.notes)) return null;
  if (!isSelection(parsed.selectedCell)) return null;
  if (!difficulties.includes(parsed.difficulty as Difficulty)) return null;
  if (!statuses.includes(parsed.gameStatus as GameStatus)) return null;

  return {
    version: 2,
    mode: parsed.mode === 'daily' ? 'daily' : 'classic',
    dailyDate: typeof parsed.dailyDate === 'string' ? parsed.dailyDate : null,
    solutionBoard: parsed.solutionBoard,
    initialBoard: parsed.initialBoard,
    currentBoard: parsed.currentBoard,
    notes: parsed.notes,
    selectedCell: parsed.selectedCell,
    isNoteMode: parsed.isNoteMode === true,
    stickyNumber: typeof parsed.stickyNumber === 'number' ? parsed.stickyNumber : null,
    difficulty: parsed.difficulty as Difficulty,
    timer: typeof parsed.timer === 'number' && parsed.timer >= 0 ? parsed.timer : 0,
    mistakes: typeof parsed.mistakes === 'number' && parsed.mistakes >= 0 ? parsed.mistakes : 0,
    hintsUsed: typeof parsed.hintsUsed === 'number' && parsed.hintsUsed >= 0 ? parsed.hintsUsed : 0,
    explanationHintsUsed: typeof parsed.explanationHintsUsed === 'number' && parsed.explanationHintsUsed >= 0 ? parsed.explanationHintsUsed : 0,
    gameStatus: parsed.gameStatus === 'paused' ? 'playing' : parsed.gameStatus as GameStatus,
    past: normalizeHistory(parsed.past),
    future: normalizeHistory(parsed.future),
    resultRecorded: parsed.resultRecorded === true,
  };
};

const migrateLegacyGame = (value: unknown): SavedGameState | null => {
  if (typeof value !== 'object' || value === null) return null;
  const parsed = value as Partial<SavedGameState>;

  if (!isBoard(parsed.solutionBoard) || !isBoard(parsed.initialBoard) || !isBoard(parsed.currentBoard)) return null;
  if (!isSavedNotes(parsed.notes)) return null;

  return {
    version: 2,
    mode: 'classic',
    dailyDate: null,
    solutionBoard: parsed.solutionBoard,
    initialBoard: parsed.initialBoard,
    currentBoard: parsed.currentBoard,
    notes: parsed.notes,
    selectedCell: isSelection(parsed.selectedCell) ? parsed.selectedCell : null,
    isNoteMode: parsed.isNoteMode === true,
    stickyNumber: null,
    difficulty: difficulties.includes(parsed.difficulty as Difficulty) ? parsed.difficulty as Difficulty : 'medium',
    timer: typeof parsed.timer === 'number' && parsed.timer >= 0 ? parsed.timer : 0,
    mistakes: typeof parsed.mistakes === 'number' && parsed.mistakes >= 0 ? parsed.mistakes : 0,
    hintsUsed: typeof parsed.hintsUsed === 'number' && parsed.hintsUsed >= 0 ? parsed.hintsUsed : 0,
    explanationHintsUsed: 0,
    gameStatus: statuses.includes(parsed.gameStatus as GameStatus) && parsed.gameStatus !== 'paused'
      ? parsed.gameStatus as GameStatus
      : 'playing',
    past: normalizeHistory(parsed.past),
    future: normalizeHistory(parsed.future),
    resultRecorded: false,
  };
};

const loadSavedGame = (): SavedGameState => {
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return createGameState();

  try {
    const parsed = JSON.parse(raw);
    return normalizeSavedGame(parsed) ?? migrateLegacyGame(parsed) ?? createGameState();
  } catch {
    return createGameState();
  }
};

const loadSettings = (): GameSettings => {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;
    return { ...defaultSettings, ...JSON.parse(raw) };
  } catch {
    return defaultSettings;
  }
};

const normalizeStats = (value: unknown): GameStats => {
  if (typeof value !== 'object' || value === null) return defaultStats();
  const parsed = value as Partial<GameStats> & Partial<Record<Difficulty, number | null>>;
  const base = defaultStats();

  for (const difficulty of difficulties) {
    const current = parsed.byDifficulty?.[difficulty];
    if (current) {
      base.byDifficulty[difficulty] = { ...base.byDifficulty[difficulty], ...current };
    } else if (difficulty in parsed) {
      base.byDifficulty[difficulty].bestTime = parsed[difficulty] ?? null;
    }
  }

  base.achievements = Array.isArray(parsed.achievements) ? parsed.achievements.filter(item => typeof item === 'string') : [];
  base.unlockedThemes = Array.isArray(parsed.unlockedThemes)
    ? parsed.unlockedThemes.filter(item => typeof item === 'string')
    : ['blue', 'emerald', 'violet', 'amber', 'slate', 'rose'];
  return base;
};

const loadStats = (): GameStats => {
  try {
    const raw = window.localStorage.getItem(STATS_KEY) ?? window.localStorage.getItem(LEGACY_STATS_KEY);
    if (!raw) return defaultStats();
    return normalizeStats(JSON.parse(raw));
  } catch {
    return defaultStats();
  }
};

const loadDailyRecords = (): DailyRecord[] => {
  try {
    const raw = window.localStorage.getItem(DAILY_RECORDS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(record =>
      typeof record.date === 'string'
      && difficulties.includes(record.difficulty)
      && typeof record.completed === 'boolean'
    );
  } catch {
    return [];
  }
};

const getRemainingDigits = (board: Board): Record<number, number> => {
  const counts: Record<number, number> = { 1: 9, 2: 9, 3: 9, 4: 9, 5: 9, 6: 9, 7: 9, 8: 9, 9: 9 };
  for (const row of board) {
    for (const cell of row) {
      if (cell !== 0) counts[cell]--;
    }
  }
  return counts;
};

const isCompletedUserCell = (game: SavedGameState, row: number, col: number): boolean =>
  game.initialBoard[row][col] === 0
  && game.currentBoard[row][col] !== 0
  && game.currentBoard[row][col] === game.solutionBoard[row][col];

const achievementLabels = {
  firstWin: '첫 승리',
  noHints: '힌트 없이 완료',
  noMistakes: '실수 없이 완료',
  hardWin: '어려움 완료',
  dailyStreak: '7일 연속',
};

const addAchievements = (stats: GameStats, additions: string[]): GameStats => ({
  ...stats,
  achievements: [...new Set([...stats.achievements, ...additions])],
});

const resultIdForGame = (game: SavedGameState): string =>
  `${game.gameStatus}:${game.mode}:${game.dailyDate ?? 'classic'}:${game.difficulty}:${JSON.stringify(game.initialBoard)}`;

const loadRecordedResults = (): string[] => {
  try {
    const raw = window.localStorage.getItem(RECORDED_RESULTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(item => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const hasRecordedResult = (id: string): boolean => loadRecordedResults().includes(id);

const markRecordedResult = (id: string): void => {
  const next = [...new Set([...loadRecordedResults(), id])].slice(-200);
  window.localStorage.setItem(RECORDED_RESULTS_KEY, JSON.stringify(next));
};

const calculateStreak = (records: DailyRecord[]): number => {
  const completedDates = new Set(records.filter(record => record.completed).map(record => record.date));
  let streak = 0;
  const cursor = new Date();

  // 오늘 완료하지 않았다면 어제부터 체크하여 연속 기록 유지
  if (!completedDates.has(formatLocalDate(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (completedDates.has(formatLocalDate(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
};

const getHintRelatedCells = (hint: Hint): Array<{ row: number; col: number }> => {
  const cells: Array<{ row: number; col: number }> = [];
  const addCell = (row: number, col: number) => {
    if (row === hint.row && col === hint.col) return;
    if (cells.some(cell => cell.row === row && cell.col === col)) return;
    cells.push({ row, col });
  };

  for (let index = 0; index < 9; index++) {
    addCell(hint.row, index);
    addCell(index, hint.col);
  }

  const boxRow = Math.floor(hint.row / 3) * 3;
  const boxCol = Math.floor(hint.col / 3) * 3;
  for (let row = boxRow; row < boxRow + 3; row++) {
    for (let col = boxCol; col < boxCol + 3; col++) {
      addCell(row, col);
    }
  }

  return cells;
};

export const useSudoku = () => {
  const [game, setGame] = useState<SavedGameState>(() => loadSavedGame());
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [stats, setStats] = useState<GameStats>(() => loadStats());
  const [dailyRecords, setDailyRecords] = useState<DailyRecord[]>(() => loadDailyRecords());
  const [hintState, setHintState] = useState<HintState>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('classic');

  const notes = useMemo(() => deserializeNotes(game.notes), [game.notes]);
  const remainingDigits = useMemo(() => getRemainingDigits(game.currentBoard), [game.currentBoard]);
  const hintHighlight = useMemo<HintHighlight>(() => {
    if (!hintState) return null;
    return {
      primary: { row: hintState.hint.row, col: hintState.hint.col },
      related: getHintRelatedCells(hintState.hint),
      value: hintState.hint.value,
      highlightedNotes: hintState.hint.highlightedNotes,
    };
  }, [hintState]);
  const dailyDate = todayKey();

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(game));
  }, [game]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    window.localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  }, [stats]);

  useEffect(() => {
    window.localStorage.setItem(DAILY_RECORDS_KEY, JSON.stringify(dailyRecords));
  }, [dailyRecords]);

  useEffect(() => {
    if (game.gameStatus !== 'playing') return;

    const interval = window.setInterval(() => {
      setGame(current => ({ ...current, timer: current.timer + 1 }));
    }, 1000);

    return () => clearInterval(interval);
  }, [game.gameStatus]);

  const checkWin = useCallback((board: Board, solutionBoard: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] !== solutionBoard[row][col]) return false;
      }
    }
    return true;
  }, []);

  const updateSettings = (nextSettings: Partial<GameSettings>) => {
    setSettings(current => ({ ...current, ...nextSettings }));
  };

  const clearHint = () => setHintState(null);

  const recordCompletion = useCallback((completedGame: SavedGameState) => {
    const dailyRecordKey = completedGame.mode === 'daily' && completedGame.dailyDate
      ? `${completedGame.dailyDate}:${completedGame.difficulty}`
      : null;
    if (dailyRecordKey && dailyRecords.some(record => `${record.date}:${record.difficulty}` === dailyRecordKey && record.completed)) {
      return;
    }

    setStats(current => {
      const difficultyStats = current.byDifficulty[completedGame.difficulty];
      const wonStats = {
        ...difficultyStats,
        played: difficultyStats.played + 1,
        won: difficultyStats.won + 1,
        bestTime: difficultyStats.bestTime === null
          ? completedGame.timer
          : Math.min(difficultyStats.bestTime, completedGame.timer),
        totalTime: difficultyStats.totalTime + completedGame.timer,
        totalMistakes: difficultyStats.totalMistakes + completedGame.mistakes,
        totalHints: difficultyStats.totalHints + completedGame.hintsUsed,
        noHintWins: difficultyStats.noHintWins + (completedGame.hintsUsed === 0 && completedGame.explanationHintsUsed === 0 ? 1 : 0),
        noMistakeWins: difficultyStats.noMistakeWins + (completedGame.mistakes === 0 ? 1 : 0),
        techniqueStats: { ...difficultyStats.techniqueStats },
      };
      const achievements = [];
      if (Object.values(current.byDifficulty).every(item => item.won === 0)) achievements.push(achievementLabels.firstWin);
      if (completedGame.hintsUsed === 0 && completedGame.explanationHintsUsed === 0) achievements.push(achievementLabels.noHints);
      if (completedGame.mistakes === 0) achievements.push(achievementLabels.noMistakes);
      if (completedGame.difficulty === 'hard') achievements.push(achievementLabels.hardWin);

      const unlockedThemes = [...current.unlockedThemes];
      if (wonStats.won >= 1 && !unlockedThemes.includes('midnight')) unlockedThemes.push('midnight');
      if (Object.values(current.byDifficulty).reduce((a, b) => a + b.won, 0) >= 10 && !unlockedThemes.includes('forest')) unlockedThemes.push('forest');
      if (completedGame.difficulty === 'expert' && !unlockedThemes.includes('sand')) unlockedThemes.push('sand');

      if (settings.soundsEnabled) soundManager.playComplete();

      return addAchievements({
        ...current,
        unlockedThemes,
        byDifficulty: {
          ...current.byDifficulty,
          [completedGame.difficulty]: wonStats,
        },
      }, achievements);
    });

    if (completedGame.mode === 'daily' && completedGame.dailyDate) {
      const completedDate = completedGame.dailyDate;
      setDailyRecords(current => {
        const key = `${completedDate}:${completedGame.difficulty}`;
        const existing = current.find(record => `${record.date}:${record.difficulty}` === key);
        if (existing?.completed) return current;

        const nextRecord: DailyRecord = {
          date: completedDate,
          difficulty: completedGame.difficulty,
          completed: true,
          time: completedGame.timer,
          mistakes: completedGame.mistakes,
          hints: completedGame.hintsUsed,
        };
        const withoutCurrent = current.filter(record => `${record.date}:${record.difficulty}` !== key);
        const next = [...withoutCurrent, nextRecord].sort((a, b) => b.date.localeCompare(a.date));

        if (calculateStreak(next) >= 7) {
          setStats(statsValue => addAchievements(statsValue, [achievementLabels.dailyStreak]));
        }

        return next;
      });
    }
  }, [dailyRecords]);

  const finishLostGame = useCallback((lostGame: SavedGameState) => {
    setStats(current => {
      const difficultyStats = current.byDifficulty[lostGame.difficulty];
      return {
        ...current,
        byDifficulty: {
          ...current.byDifficulty,
          [lostGame.difficulty]: {
            ...difficultyStats,
            played: difficultyStats.played + 1,
            lost: difficultyStats.lost + 1,
            totalTime: difficultyStats.totalTime + lostGame.timer,
            totalMistakes: difficultyStats.totalMistakes + lostGame.mistakes,
            totalHints: difficultyStats.totalHints + lostGame.hintsUsed,
          },
        },
      };
    });
  }, []);

  useEffect(() => {
    if ((game.gameStatus !== 'won' && game.gameStatus !== 'lost') || game.resultRecorded) return;
    const resultId = resultIdForGame(game);
    if (hasRecordedResult(resultId)) return;
    markRecordedResult(resultId);

    window.setTimeout(() => {
      if (game.gameStatus === 'won') {
        recordCompletion(game);
      } else {
        finishLostGame(game);
      }
    }, 0);
  }, [finishLostGame, game, recordCompletion]);

  const startNewGame = useCallback((difficulty: Difficulty = 'medium') => {
    setGame(createGameState(difficulty));
    setActiveTab('classic');
    clearHint();
  }, []);

  const startDailyGame = (difficulty: Difficulty = game.difficulty, date: string = dailyDate) => {
    setGame(createGameState(difficulty, 'daily', date));
    setActiveTab('daily');
    clearHint();
  };

  const selectCell = (row: number, col: number) => {
    clearHint();
    setGame(current => {
      if (current.gameStatus !== 'playing') return current;
      const next = { ...current, selectedCell: { row, col } };
      if (
        current.stickyNumber
        && current.initialBoard[row][col] === 0
        && getRemainingDigits(current.currentBoard)[current.stickyNumber] > 0
      ) {
        return applyNumber(next, current.stickyNumber);
      }
      return next;
    });
  };

  const removeRelatedNotes = (currentNotes: Notes, row: number, col: number, num: number): Notes => {
    const nextNotes = currentNotes.map(noteRow => noteRow.map(cellNotes => new Set(cellNotes)));
    nextNotes[row][col].clear();

    for (let index = 0; index < 9; index++) {
      nextNotes[row][index].delete(num);
      nextNotes[index][col].delete(num);
    }

    const boxRow = Math.floor(row / 3) * 3;
    const boxCol = Math.floor(col / 3) * 3;
    for (let rowIndex = boxRow; rowIndex < boxRow + 3; rowIndex++) {
      for (let colIndex = boxCol; colIndex < boxCol + 3; colIndex++) {
        nextNotes[rowIndex][colIndex].delete(num);
      }
    }

    return nextNotes;
  };

  const applyNumber = useCallback((current: SavedGameState, num: number): SavedGameState => {
    if (!current.selectedCell || current.gameStatus !== 'playing') return current;

    const { row, col } = current.selectedCell;
    if (current.initialBoard[row][col] !== 0) return current;
    if (isCompletedUserCell(current, row, col)) return current;
    if (!current.isNoteMode && current.currentBoard[row][col] !== num && getRemainingDigits(current.currentBoard)[num] <= 0) return current;

    const currentNotes = deserializeNotes(current.notes);

    if (current.isNoteMode) {
      const nextNotes = currentNotes.map(noteRow => noteRow.map(cellNotes => new Set(cellNotes)));
      const cellNotes = nextNotes[row][col];
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
      } else {
        cellNotes.add(num);
      }
      return { ...pushHistory(current), notes: serializeNotes(nextNotes) };
    }

    const nextBoard = cloneBoard(current.currentBoard);
    const nextValue = nextBoard[row][col] === num ? 0 : num;
    nextBoard[row][col] = nextValue;

    const isWrong = settings.autoCheck && nextValue !== 0 && nextValue !== current.solutionBoard[row][col];
    const mistakes = isWrong && current.currentBoard[row][col] !== num
      ? current.mistakes + 1
      : current.mistakes;
    const gameStatus: GameStatus = settings.mistakeLimit && mistakes >= MAX_MISTAKES
      ? 'lost'
      : checkWin(nextBoard, current.solutionBoard)
        ? 'won'
        : 'playing';

    const nextGame: SavedGameState = {
      ...pushHistory(current),
      currentBoard: nextBoard,
      notes: serializeNotes(removeRelatedNotes(currentNotes, row, col, num)),
      mistakes,
      gameStatus,
      stickyNumber: current.stickyNumber === num && getRemainingDigits(nextBoard)[num] <= 0 ? null : current.stickyNumber,
    };

    if (settings.soundsEnabled) {
      if (gameStatus === 'won') soundManager.playComplete();
      else if (isWrong) soundManager.playError();
      else soundManager.playInput();
    }

    return nextGame;
  }, [settings, checkWin]);

  const enterNumber = useCallback((num: number, forceNoteMode?: boolean) => {
    clearHint();
    setGame(current => {
      const originalNoteMode = current.isNoteMode;
      let gameWithTempMode = current;
      if (forceNoteMode !== undefined) {
        gameWithTempMode = { ...current, isNoteMode: forceNoteMode };
      }
      const result = applyNumber(gameWithTempMode, num);
      if (forceNoteMode !== undefined) {
        result.isNoteMode = originalNoteMode;
      }
      return result;
    });
  }, [applyNumber]);

  const clearCell = useCallback(() => {
    clearHint();
    setGame(current => {
      if (!current.selectedCell || current.gameStatus !== 'playing') return current;
      const { row, col } = current.selectedCell;
      if (current.initialBoard[row][col] !== 0) return current;
      if (isCompletedUserCell(current, row, col)) return current;

      const nextBoard = cloneBoard(current.currentBoard);
      nextBoard[row][col] = 0;
      return { ...pushHistory(current), currentBoard: nextBoard };
    });
  }, []);

  const toggleNoteMode = useCallback(() => {
    clearHint();
    setGame(current => ({ ...current, isNoteMode: !current.isNoteMode, stickyNumber: null }));
  }, []);

  const toggleStickyNumber = useCallback((num: number) => {
    clearHint();
    setGame(current => {
      const isCompleted = getRemainingDigits(current.currentBoard)[num] <= 0;
      return {
        ...current,
        stickyNumber: current.stickyNumber === num || isCompleted ? null : num,
        isNoteMode: false,
      };
    });
  }, []);

  const autoFillNotes = useCallback(() => {
    clearHint();
    setGame(current => {
      if (current.gameStatus !== 'playing') return current;
      const nextNotes = emptyNotes();
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (current.currentBoard[row][col] === 0) {
            nextNotes[row][col] = new Set(getPossibleValues(current.currentBoard, row, col));
          }
        }
      }
      return { ...pushHistory(current), notes: serializeNotes(nextNotes) };
    });
  }, []);

  const cleanNotes = useCallback(() => {
    clearHint();
    setGame(current => {
      if (current.gameStatus !== 'playing') return current;
      const currentNotes = deserializeNotes(current.notes);
      const nextNotes = currentNotes.map((noteRow, row) =>
        noteRow.map((cellNotes, col) => {
          if (current.currentBoard[row][col] !== 0) return new Set<number>();
          const possible = new Set(getPossibleValues(current.currentBoard, row, col));
          return new Set([...cellNotes].filter(note => possible.has(note)));
        })
      );
      const serialized = serializeNotes(nextNotes);
      if (JSON.stringify(serialized) === JSON.stringify(current.notes)) return current;
      return { ...pushHistory(current), notes: serialized };
    });
  }, []);

  const getHint = () => {
    if (game.gameStatus !== 'playing') return;
    const currentNotes = deserializeNotes(game.notes);
    const hint = hintState?.hint ?? findAdvancedHint(game.currentBoard, game.selectedCell, currentNotes);
    if (!hint) return;

    if (hintState && hintState.step >= 2) {
      setHintState(null);
      
      if (hint.canFillValue) {
        setGame(current => {
          const nextBoard = cloneBoard(current.currentBoard);
          if (nextBoard[hint.row][hint.col] === current.solutionBoard[hint.row][hint.col]) return current;
          nextBoard[hint.row][hint.col] = current.solutionBoard[hint.row][hint.col];
          const nextNotes = removeRelatedNotes(deserializeNotes(current.notes), hint.row, hint.col, nextBoard[hint.row][hint.col]);
          const gameStatus: GameStatus = checkWin(nextBoard, current.solutionBoard) ? 'won' : 'playing';
          const nextGame: SavedGameState = {
            ...pushHistory(current),
            selectedCell: { row: hint.row, col: hint.col },
            currentBoard: nextBoard,
            notes: serializeNotes(nextNotes),
            hintsUsed: current.hintsUsed + 1,
            gameStatus,
            stickyNumber: current.stickyNumber === nextBoard[hint.row][hint.col] && getRemainingDigits(nextBoard)[nextBoard[hint.row][hint.col]] <= 0
              ? null
              : current.stickyNumber,
          };
          return nextGame;
        });

        // Track technique used
        setStats(current => {
          const difficultyStats = current.byDifficulty[game.difficulty];
          const technique = hint.technique;
          return {
            ...current,
            byDifficulty: {
              ...current.byDifficulty,
              [game.difficulty]: {
                ...difficultyStats,
                techniqueStats: {
                  ...difficultyStats.techniqueStats,
                  [technique]: (difficultyStats.techniqueStats[technique] || 0) + 1,
                },
              },
            },
          };
        });
      } else if (hint.removableNotes && hint.removableNotes.length > 0) {
        setGame(current => {
          const nextNotes = deserializeNotes(current.notes);
          let changed = false;
          for (const { row, col, value } of hint.removableNotes!) {
            if (nextNotes[row][col].has(value)) {
              nextNotes[row][col].delete(value);
              changed = true;
            }
          }
          if (!changed) return current;
          return {
            ...pushHistory(current),
            notes: serializeNotes(nextNotes),
            hintsUsed: current.hintsUsed + 1,
          };
        });
      }
      return;
    }

    setHintState(current => {
      if (!current) return { hint, step: 0 };
      const isSameHint = current.hint.row === hint.row
        && current.hint.col === hint.col
        && current.hint.value === hint.value;
      const nextStep = isSameHint ? Math.min(current.step + 1, 2) : 0;
      return { hint, step: nextStep };
    });

    setGame(current => ({ ...current, explanationHintsUsed: current.explanationHintsUsed + 1 }));
  };

  const pauseGame = useCallback(() => {
    clearHint();
    setGame(current => current.gameStatus === 'playing' ? { ...current, gameStatus: 'paused' } : current);
  }, []);

  const resumeGame = useCallback(() => {
    setGame(current => current.gameStatus === 'paused' ? { ...current, gameStatus: 'playing' } : current);
  }, []);

  const undo = useCallback(() => {
    clearHint();
    setGame(current => {
      if (current.past.length === 0 || current.gameStatus !== 'playing') return current;
      const previous = current.past[current.past.length - 1];
      const currentItem: HistoryItem = {
        currentBoard: cloneBoard(current.currentBoard),
        notes: current.notes,
        mistakes: current.mistakes,
        gameStatus: current.gameStatus,
      };

      return {
        ...current,
        currentBoard: previous.currentBoard,
        notes: previous.notes,
        // mistakes는 그대로 유지 (어뷰징 방지)
        gameStatus: previous.gameStatus,
        past: current.past.slice(0, current.past.length - 1),
        future: [currentItem, ...current.future].slice(0, 50),
      };
    });
  }, []);

  const redo = useCallback(() => {
    clearHint();
    setGame(current => {
      if (current.future.length === 0 || current.gameStatus !== 'playing') return current;
      const next = current.future[0];
      const currentItem: HistoryItem = {
        currentBoard: cloneBoard(current.currentBoard),
        notes: current.notes,
        mistakes: current.mistakes,
        gameStatus: current.gameStatus,
      };

      return {
        ...current,
        currentBoard: next.currentBoard,
        notes: next.notes,
        // mistakes는 그대로 유지
        gameStatus: next.gameStatus,
        past: [...current.past, currentItem].slice(-50),
        future: current.future.slice(1),
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target
        && (
          ['INPUT', 'SELECT', 'TEXTAREA', 'BUTTON'].includes(target.tagName)
          || target.isContentEditable
        )
      ) {
        return;
      }

      if (event.ctrlKey || event.metaKey) {
        if (event.key.toLowerCase() === 'z') {
          event.preventDefault();
          if (event.shiftKey) redo();
          else undo();
          return;
        }
        if (event.key.toLowerCase() === 'y') {
          event.preventDefault();
          redo();
          return;
        }
      }

      const digitMatch = event.code.match(/^(?:Digit|Numpad)([1-9])$/);
      if (digitMatch) {
        event.preventDefault();
        const num = Number(digitMatch[1]);
        enterNumber(num, event.shiftKey ? true : undefined);
        return;
      }

      if (event.key === 'Backspace' || event.key === 'Delete' || event.key === '0' || event.code === 'Numpad0') {
        event.preventDefault();
        clearCell();
        return;
      }

      if (event.key.toLowerCase() === 'n' || event.key === ' ') {
        event.preventDefault();
        toggleNoteMode();
        return;
      }

      const key = event.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd'].includes(key)) {
        event.preventDefault();
        clearHint();
        setGame(current => {
          if (current.gameStatus !== 'playing') return current;
          const { row, col } = current.selectedCell || { row: 0, col: 0 };
          let nextRow = row;
          let nextCol = col;

          if (key === 'arrowup' || key === 'w') nextRow = (row - 1 + 9) % 9;
          if (key === 'arrowdown' || key === 's') nextRow = (row + 1) % 9;
          if (key === 'arrowleft' || key === 'a') nextCol = (col - 1 + 9) % 9;
          if (key === 'arrowright' || key === 'd') nextCol = (col + 1) % 9;

          return { ...current, selectedCell: { row: nextRow, col: nextCol } };
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enterNumber, clearCell, toggleNoteMode, undo, redo]);

  return {
    activeTab,
    setActiveTab,
    currentBoard: game.currentBoard,
    initialBoard: game.initialBoard,
    solutionBoard: game.solutionBoard,
    notes,
    hintHighlight,
    selectedCell: game.selectedCell,
    isNoteMode: game.isNoteMode,
    stickyNumber: game.stickyNumber,
    timer: game.timer,
    gameStatus: game.gameStatus,
    gameMode: game.mode,
    dailyDate: game.dailyDate,
    difficulty: game.difficulty,
    mistakes: game.mistakes,
    maxMistakes: MAX_MISTAKES,
    hintsUsed: game.hintsUsed,
    explanationHintsUsed: game.explanationHintsUsed,
    bestTime: stats.byDifficulty[game.difficulty].bestTime,
    hintMessage: hintState ? `${hintState.hint.technique}: ${hintState.hint.messages[hintState.step]}` : null,
    hintStep: hintState?.step ?? null,
    remainingDigits,
    settings,
    stats,
    dailyRecords,
    currentDailyDate: dailyDate,
    dailyStreak: calculateStreak(dailyRecords),
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
    skillIndex: useMemo(() => {
      let totalScore = 0;
      let playedCount = 0;
      const weights: Record<Difficulty, number> = { beginner: 1, easy: 2, medium: 3, hard: 5, expert: 8 };
      
      for (const [diff, s] of Object.entries(stats.byDifficulty)) {
        if (s.played > 0) {
          const winRate = s.won / s.played;
          // Score = Difficulty weight * Win rate * (1 + bonus for no hints/mistakes)
          const bonus = (s.noHintWins + s.noMistakeWins) / (s.won || 1);
          totalScore += weights[diff as Difficulty] * winRate * (1 + bonus);
          playedCount++;
        }
      }
      return playedCount > 0 ? Math.round(totalScore * 10) : 0;
    }, [stats]),
    canUndo: game.past.length > 0,
    canRedo: game.future.length > 0,
    showMistakes: settings.autoCheck,
    showDuplicates: settings.duplicateHighlight,
  };
};
