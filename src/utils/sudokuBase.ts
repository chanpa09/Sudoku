export type Board = number[][];
export type Difficulty = 'easy' | 'medium' | 'hard';

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
