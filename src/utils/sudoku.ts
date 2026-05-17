export type Board = number[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

type RandomSource = () => number;

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

export const cloneBoard = (board: Board): Board => board.map(row => [...row]);

export const isValid = (board: Board, row: number, col: number, num: number): boolean => {
  for (let index = 0; index < 9; index++) {
    if (board[row][index] === num) return false;
    if (board[index][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let boxRow = startRow; boxRow < startRow + 3; boxRow++) {
    for (let boxCol = startCol; boxCol < startCol + 3; boxCol++) {
      if (board[boxRow][boxCol] === num) return false;
    }
  }

  return true;
};

export const solveSudoku = (board: Board): boolean => {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (board[row][col] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValid(board, row, col, num)) {
            board[row][col] = num;
            if (solveSudoku(board)) return true;
            board[row][col] = 0;
          }
        }
        return false;
      }
    }
  }
  return true;
};

const countSolutions = (board: Board, limit: number = 2): number => {
  let count = 0;

  const solve = (): void => {
    if (count >= limit) return;

    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0) {
          for (let num = 1; num <= 9; num++) {
            if (isValid(board, row, col, num)) {
              board[row][col] = num;
              solve();
              board[row][col] = 0;
            }
          }
          return;
        }
      }
    }

    count++;
  };

  solve();
  return count;
};

export const generateSolvedBoard = (seed?: string | number): Board => {
  const random = createRandom(seed);
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));

  const fillBoard = (target: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (target[row][col] === 0) {
          const nums = shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9], random);
          for (const num of nums) {
            if (isValid(target, row, col, num)) {
              target[row][col] = num;
              if (fillBoard(target)) return true;
              target[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  fillBoard(board);
  return board;
};

const removeCells = (
  solvedBoard: Board,
  difficulty: Difficulty,
  seed?: string | number,
): { puzzle: Board; removed: number } => {
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

  return { puzzle: puzzleBoard, removed };
};

export const generatePuzzle = (
  solvedBoard: Board,
  difficulty: Difficulty = 'medium',
  seed?: string | number,
): Board => {
  const fallbackOrder: Difficulty[] = difficulty === 'hard'
    ? ['hard', 'medium', 'easy']
    : difficulty === 'medium'
      ? ['medium', 'easy']
      : ['easy'];

  for (const level of fallbackOrder) {
    for (let attempt = 0; attempt < 5; attempt++) {
      const result = removeCells(solvedBoard, level, seed === undefined ? undefined : `${seed}:${level}:${attempt}`);
      if (result.removed >= DIFFICULTY_HOLES[level]) {
        return result.puzzle;
      }
    }
  }

  return removeCells(solvedBoard, 'easy', seed).puzzle;
};
