import { type Board, type Difficulty, cloneBoard, isValid } from './sudokuBase';
import { evaluateBoardDifficulty } from './hintLogic';

type RandomSource = () => number;

export type { Board, Difficulty };

export const DIFFICULTY_HOLES: Record<Difficulty, number> = {
  easy: 36,
  medium: 45,
  hard: 54,
};

export const hashSeed = (seed: string | number): number => {
  const source = String(seed);
  let hash = 2166136261;

  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
};

const createRandom = (seed?: string | number): RandomSource => {
  if (seed === undefined) return Math.random;

  let state = hashSeed(seed);
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
};

const shuffled = <T,>(items: T[], random: RandomSource): T[] => {
  const next = [...items];
  for (let index = next.length - 1; index > 0; index--) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }
  return next;
};

export const getCandidates = (board: Board, row: number, col: number): number[] => {
  const candidates = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      candidates.push(num);
    }
  }
  return candidates;
};

const findBestCell = (board: Board): { row: number; col: number; candidates: number[] } | null => {
  let bestCell = null;
  let minCandidates = 10;

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        const candidates = getCandidates(board, row, col);
        if (candidates.length === 0) return { row, col, candidates: [] }; // Unsolvable
        if (candidates.length < minCandidates) {
          minCandidates = candidates.length;
          bestCell = { row, col, candidates };
          if (minCandidates === 1) return bestCell; // Optimization: Found a cell with only one candidate
        }
      }
    }
  }

  return bestCell;
};

export const solveSudoku = (board: Board): boolean => {
  const best = findBestCell(board);
  if (!best) return true; // Filled
  if (best.candidates.length === 0) return false;

  for (const num of best.candidates) {
    board[best.row][best.col] = num;
    if (solveSudoku(board)) return true;
    board[best.row][best.col] = 0;
  }
  return false;
};

const countSolutions = (board: Board, limit: number = 2): number => {
  let count = 0;

  const solve = (): void => {
    if (count >= limit) return;

    const best = findBestCell(board);
    if (!best) {
      count++;
      return;
    }
    if (best.candidates.length === 0) return;

    for (const num of best.candidates) {
      board[best.row][best.col] = num;
      solve();
      board[best.row][best.col] = 0;
      if (count >= limit) return;
    }
  };

  solve();
  return count;
};

export const generateSolvedBoard = (seed?: string | number): Board => {
  const random = createRandom(seed);
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

  const fillBoard = (target: Board): boolean => {
    const best = findBestCell(target);
    if (!best) return true;

    const nums = shuffled(best.candidates, random);
    for (const num of nums) {
      target[best.row][best.col] = num;
      if (fillBoard(target)) return true;
      target[best.row][best.col] = 0;
    }
    return false;
  };

  fillBoard(board);
  return board;
};

const removeCells = (
  solvedBoard: Board,
  difficulty: Difficulty,
  seed?: string | number,
): { puzzle: Board; removed: number; actualDifficulty: Difficulty } => {
  const random = createRandom(seed);
  const puzzleBoard = cloneBoard(solvedBoard);
  const holes = DIFFICULTY_HOLES[difficulty];
  let removed = 0;
  const cells = shuffled(
    Array.from({ length: 81 }, (_, index) => ({
      row: Math.floor(index / 9),
      col: index % 9,
    })),
    random,
  );

  for (const { row, col } of cells) {
    if (removed >= holes) break;

    const value = puzzleBoard[row][col];
    puzzleBoard[row][col] = 0;

    if (countSolutions(cloneBoard(puzzleBoard)) === 1) {
      removed++;
    } else {
      puzzleBoard[row][col] = value;
    }
  }

  return { 
    puzzle: puzzleBoard, 
    removed, 
    actualDifficulty: evaluateBoardDifficulty(puzzleBoard) 
  };
};

export const generatePuzzle = (
  solvedBoard: Board,
  difficulty: Difficulty = 'medium',
  seed?: string | number,
): Board => {
  // 목표 난이도에 도달할 때까지 최대 10번 시도
  for (let attempt = 0; attempt < 10; attempt++) {
    const s = seed === undefined ? undefined : `${seed}:${attempt}`;
    const result = removeCells(solvedBoard, difficulty, s);
    
    // 목표 난이도와 일치하거나, 빈칸 개수가 충분할 때 반환
    if (result.actualDifficulty === difficulty || result.removed >= DIFFICULTY_HOLES[difficulty]) {
      return result.puzzle;
    }
  }

  // 실패 시 가장 근접한 결과 반환
  return removeCells(solvedBoard, difficulty, seed).puzzle;
};
