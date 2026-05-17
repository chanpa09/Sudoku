export type Board = number[][];

/**
 * Checks if placing a number at a given position is valid according to Sudoku rules.
 */
export const isValid = (board: Board, row: number, col: number, num: number): boolean => {
  // Check row
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num) return false;
  }

  // Check column
  for (let i = 0; i < 9; i++) {
    if (board[i][col] === num) return false;
  }

  // Check 3x3 box
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[startRow + i][startCol + j] === num) return false;
    }
  }

  return true;
};

/**
 * Solves the Sudoku board using backtracking.
 */
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

/**
 * Generates a fully solved Sudoku board.
 */
export const generateSolvedBoard = (): Board => {
  const board: Board = Array.from({ length: 9 }, () => Array(9).fill(0));
  
  const fillBoard = (b: Board): boolean => {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(b, row, col, num)) {
              b[row][col] = num;
              if (fillBoard(b)) return true;
              b[row][col] = 0;
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

/**
 * Generates a Sudoku puzzle board from a solved board by removing a specified number of cells.
 */
export const generatePuzzle = (solvedBoard: Board, holes: number = 40): Board => {
  const puzzleBoard: Board = solvedBoard.map(row => [...row]);
  let removed = 0;

  while (removed < holes) {
    const row = Math.floor(Math.random() * 9);
    const col = Math.floor(Math.random() * 9);

    if (puzzleBoard[row][col] !== 0) {
      puzzleBoard[row][col] = 0;
      removed++;
    }
  }

  return puzzleBoard;
};
