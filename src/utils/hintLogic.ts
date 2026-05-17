import type { Board } from './sudoku';
import { isValid } from './sudoku';

export type HintTechnique = '단일 후보' | '숨은 단일 후보' | '고정 후보' | '드러난 쌍' | '정답';

export type Hint = {
  row: number;
  col: number;
  value: number;
  technique: HintTechnique;
  canFillValue: boolean;
  messages: [string, string, string];
};

export const getPossibleValues = (board: Board, row: number, col: number): number[] => {
  const possible = [];
  for (let num = 1; num <= 9; num++) {
    if (isValid(board, row, col, num)) {
      possible.push(num);
    }
  }
  return possible;
};

const formatCell = (row: number, col: number): string => `${row + 1}행 ${col + 1}열`;

const hiddenSingleInUnit = (
  board: Board,
  row: number,
  col: number,
  num: number,
  unitName: string,
  cells: Array<{ row: number; col: number }>,
): Hint | null => {
  const candidates = cells.filter(cell => board[cell.row][cell.col] === 0 && isValid(board, cell.row, cell.col, num));
  if (candidates.length !== 1 || candidates[0].row !== row || candidates[0].col !== col) return null;

  return {
    row,
    col,
    value: num,
    technique: '숨은 단일 후보',
    canFillValue: true,
    messages: [
      `${unitName}에서 ${num}이 들어갈 수 있는 칸을 찾아보세요.`,
      `${num} 후보가 ${formatCell(row, col)}에만 남아 있습니다.`,
      `${formatCell(row, col)}에는 ${num}을 넣을 수 있습니다.`,
    ],
  };
};

export const getHintForCell = (board: Board, row: number, col: number): Hint | null => {
  if (board[row][col] !== 0) return null;

  const possible = getPossibleValues(board, row, col);
  if (possible.length === 1) {
    return {
      row,
      col,
      value: possible[0],
      technique: '단일 후보',
      canFillValue: true,
      messages: [
        `${formatCell(row, col)}의 행, 열, 박스를 확인해 보세요.`,
        `다른 숫자는 모두 충돌하므로 후보가 ${possible[0]} 하나만 남습니다.`,
        `${formatCell(row, col)}에는 ${possible[0]}을 넣을 수 있습니다.`,
      ],
    };
  }

  const rowCells = Array.from({ length: 9 }, (_, index) => ({ row, col: index }));
  const colCells = Array.from({ length: 9 }, (_, index) => ({ row: index, col }));
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  const boxCells = Array.from({ length: 9 }, (_, index) => ({
    row: startRow + Math.floor(index / 3),
    col: startCol + (index % 3),
  }));

  for (const num of possible) {
    const rowHint = hiddenSingleInUnit(board, row, col, num, `${row + 1}행`, rowCells);
    if (rowHint) return rowHint;

    const colHint = hiddenSingleInUnit(board, row, col, num, `${col + 1}열`, colCells);
    if (colHint) return colHint;

    const boxHint = hiddenSingleInUnit(board, row, col, num, `${Math.floor(row / 3) + 1}-${Math.floor(col / 3) + 1}번 박스`, boxCells);
    if (boxHint) return boxHint;
  }

  return null;
};

const findLockedCandidateHint = (board: Board): Hint | null => {
  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      const startRow = boxRow * 3;
      const startCol = boxCol * 3;

      for (let num = 1; num <= 9; num++) {
        const cells: Array<{ row: number; col: number }> = [];
        for (let row = startRow; row < startRow + 3; row++) {
          for (let col = startCol; col < startCol + 3; col++) {
            if (board[row][col] === 0 && isValid(board, row, col, num)) {
              cells.push({ row, col });
            }
          }
        }

        if (cells.length < 2) continue;
        const sameRow = cells.every(cell => cell.row === cells[0].row);
        const sameCol = cells.every(cell => cell.col === cells[0].col);
        if (!sameRow && !sameCol) continue;

        return {
          row: cells[0].row,
          col: cells[0].col,
          value: num,
          technique: '고정 후보',
          canFillValue: false,
          messages: [
            `${boxRow + 1}-${boxCol + 1}번 박스에서 ${num} 후보의 위치를 비교해 보세요.`,
            sameRow
              ? `${num} 후보가 같은 행에만 있으므로 그 행의 다른 칸에서 ${num}을 제외할 수 있습니다.`
              : `${num} 후보가 같은 열에만 있으므로 그 열의 다른 칸에서 ${num}을 제외할 수 있습니다.`,
            `이 기법은 바로 숫자를 확정하기보다 후보를 줄이는 데 유용합니다.`,
          ],
        };
      }
    }
  }

  return null;
};

const findNakedPairHint = (board: Board): Hint | null => {
  const units: Array<{ name: string; cells: Array<{ row: number; col: number }> }> = [];

  for (let index = 0; index < 9; index++) {
    units.push({ name: `${index + 1}행`, cells: Array.from({ length: 9 }, (_, col) => ({ row: index, col })) });
    units.push({ name: `${index + 1}열`, cells: Array.from({ length: 9 }, (_, row) => ({ row, col: index })) });
  }

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      units.push({
        name: `${boxRow + 1}-${boxCol + 1}번 박스`,
        cells: Array.from({ length: 9 }, (_, index) => ({
          row: boxRow * 3 + Math.floor(index / 3),
          col: boxCol * 3 + (index % 3),
        })),
      });
    }
  }

  for (const unit of units) {
    const pairs = unit.cells
      .filter(cell => board[cell.row][cell.col] === 0)
      .map(cell => ({ ...cell, values: getPossibleValues(board, cell.row, cell.col) }))
      .filter(cell => cell.values.length === 2);

    for (let first = 0; first < pairs.length; first++) {
      for (let second = first + 1; second < pairs.length; second++) {
        if (pairs[first].values.join(',') === pairs[second].values.join(',')) {
          const values = pairs[first].values.join('/');
          return {
            row: pairs[first].row,
            col: pairs[first].col,
            value: pairs[first].values[0],
            technique: '드러난 쌍',
            canFillValue: false,
            messages: [
              `${unit.name}에서 후보가 같은 두 칸을 찾아보세요.`,
              `${formatCell(pairs[first].row, pairs[first].col)}와 ${formatCell(pairs[second].row, pairs[second].col)}가 ${values} 쌍입니다.`,
              `이 두 숫자는 해당 두 칸에만 들어가므로 같은 영역의 다른 후보에서 ${values}를 제외할 수 있습니다.`,
            ],
          };
        }
      }
    }
  }

  return null;
};

export const findAdvancedHint = (board: Board, selectedCell?: { row: number; col: number } | null): Hint | null => {
  if (selectedCell) {
    const selectedHint = getHintForCell(board, selectedCell.row, selectedCell.col);
    if (selectedHint) return selectedHint;
  }

  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const hint = getHintForCell(board, row, col);
      if (hint) return hint;
    }
  }

  return findLockedCandidateHint(board) ?? findNakedPairHint(board);
};
