import { type Board, isValid, cloneBoard as clone } from './sudokuBase';
import type { Difficulty } from './sudokuBase';

export type HintTechnique = '단일 후보' | '숨은 단일 후보' | '고정 후보' | '드러난 쌍' | '숨은 쌍' | 'X-Wing' | '정답';

export type Hint = {
  row: number;
  col: number;
  value: number;
  technique: HintTechnique;
  canFillValue: boolean;
  messages: [string, string, string];
  removableNotes?: Array<{ row: number; col: number; value: number }>;
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

const findLockedCandidateHint = (board: Board, notes: Set<number>[][]): Hint | null => {
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

        if (cells.length < 2 || cells.length > 3) continue;

        const sameRow = cells.every(cell => cell.row === cells[0].row);
        const sameCol = cells.every(cell => cell.col === cells[0].col);

        if (sameRow) {
          const row = cells[0].row;
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];
          for (let col = 0; col < 9; col++) {
            const inBox = Math.floor(col / 3) === boxCol;
            if (!inBox && board[row][col] === 0 && notes[row][col].has(num)) {
              removableNotes.push({ row, col, value: num });
            }
          }

          if (removableNotes.length > 0) {
            return {
              row: cells[0].row,
              col: cells[0].col,
              value: num,
              technique: '고정 후보',
              canFillValue: false,
              messages: [
                `${boxRow + 1}-${boxCol + 1}번 박스에서 ${num} 후보의 위치를 비교해 보세요.`,
                `${num} 후보가 ${row + 1}행의 박스 내부에만 위치합니다. 따라서 이 행의 다른 칸들에서는 ${num}을 지울 수 있습니다.`,
                `고정 후보(Pointing) 기법을 사용하여 후보 숫자를 정리할 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }

        if (sameCol) {
          const col = cells[0].col;
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];
          for (let row = 0; row < 9; row++) {
            const inBox = Math.floor(row / 3) === boxRow;
            if (!inBox && board[row][col] === 0 && notes[row][col].has(num)) {
              removableNotes.push({ row, col, value: num });
            }
          }

          if (removableNotes.length > 0) {
            return {
              row: cells[0].row,
              col: cells[0].col,
              value: num,
              technique: '고정 후보',
              canFillValue: false,
              messages: [
                `${boxRow + 1}-${boxCol + 1}번 박스에서 ${num} 후보의 위치를 비교해 보세요.`,
                `${num} 후보가 ${col + 1}열의 박스 내부에만 위치합니다. 따라서 이 열의 다른 칸들에서는 ${num}을 지울 수 있습니다.`,
                `고정 후보(Pointing) 기법을 사용하여 후보 숫자를 정리할 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }
      }
    }
  }

  return null;
};

const findNakedPairHint = (board: Board, notes: Set<number>[][]): Hint | null => {
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
    const emptyCells = unit.cells.filter(cell => board[cell.row][cell.col] === 0);
    const pairs = emptyCells
      .map(cell => ({ ...cell, values: [...notes[cell.row][cell.col]].sort((a, b) => a - b) }))
      .filter(cell => cell.values.length === 2);

    for (let first = 0; first < pairs.length; first++) {
      for (let second = first + 1; second < pairs.length; second++) {
        if (pairs[first].values.every((v, i) => v === pairs[second].values[i])) {
          const values = pairs[first].values;
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];

          for (const cell of emptyCells) {
            const isPairCell = (cell.row === pairs[first].row && cell.col === pairs[first].col) ||
                               (cell.row === pairs[second].row && cell.col === pairs[second].col);
            if (isPairCell) continue;

            for (const v of values) {
              if (notes[cell.row][cell.col].has(v)) {
                removableNotes.push({ row: cell.row, col: cell.col, value: v });
              }
            }
          }

          if (removableNotes.length > 0) {
            const valuesStr = values.join('/');
            return {
              row: pairs[first].row,
              col: pairs[first].col,
              value: values[0],
              technique: '드러난 쌍',
              canFillValue: false,
              messages: [
                `${unit.name}에서 후보가 정확히 같은 두 칸을 찾아보세요.`,
                `${formatCell(pairs[first].row, pairs[first].col)}와 ${formatCell(pairs[second].row, pairs[second].col)}가 ${valuesStr} 쌍을 이룹니다.`,
                `이 두 숫자는 해당 두 칸에만 들어가야 하므로, 같은 영역의 다른 칸에서는 ${valuesStr}를 지울 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }
      }
    }
  }

  return null;
};

const findHiddenPairHint = (board: Board, notes: Set<number>[][]): Hint | null => {
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
    const emptyCells = unit.cells.filter(cell => board[cell.row][cell.col] === 0);
    const numToCells: Record<number, Array<{ row: number; col: number }>> = {};
    for (let num = 1; num <= 9; num++) {
      numToCells[num] = emptyCells.filter(cell => notes[cell.row][cell.col].has(num));
    }

    const potentialNums = Object.keys(numToCells).map(Number).filter(num => numToCells[num].length === 2);

    for (let i = 0; i < potentialNums.length; i++) {
      for (let j = i + 1; j < potentialNums.length; j++) {
        const n1 = potentialNums[i];
        const n2 = potentialNums[j];
        const cells1 = numToCells[n1];
        const cells2 = numToCells[n2];

        if (cells1[0].row === cells2[0].row && cells1[0].col === cells2[0].col &&
            cells1[1].row === cells2[1].row && cells1[1].col === cells2[1].col) {
          
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];
          for (const cell of cells1) {
            for (const v of notes[cell.row][cell.col]) {
              if (v !== n1 && v !== n2) {
                removableNotes.push({ row: cell.row, col: cell.col, value: v });
              }
            }
          }

          if (removableNotes.length > 0) {
            const valuesStr = `${n1}/${n2}`;
            return {
              row: cells1[0].row,
              col: cells1[0].col,
              value: n1,
              technique: '숨은 쌍',
              canFillValue: false,
              messages: [
                `${unit.name}에서 특정 두 숫자가 나타나는 칸들을 유심히 살펴보세요.`,
                `${n1}과 ${n2}가 ${unit.name}에서 ${formatCell(cells1[0].row, cells1[0].col)}와 ${formatCell(cells1[1].row, cells1[1].col)}에만 나타납니다.`,
                `따라서 이 두 칸에는 ${valuesStr} 외의 다른 숫자는 들어갈 수 없으므로 다른 후보들을 지울 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }
      }
    }
  }
  return null;
};

const findXWingHint = (board: Board, notes: Set<number>[][]): Hint | null => {
  for (let num = 1; num <= 9; num++) {
    // Row-based X-Wing
    const rowsWithTwo = [];
    for (let row = 0; row < 9; row++) {
      const cols = [];
      for (let col = 0; col < 9; col++) {
        if (board[row][col] === 0 && notes[row][col].has(num)) cols.push(col);
      }
      if (cols.length === 2) rowsWithTwo.push({ row, cols });
    }

    for (let i = 0; i < rowsWithTwo.length; i++) {
      for (let j = i + 1; j < rowsWithTwo.length; j++) {
        const r1 = rowsWithTwo[i];
        const r2 = rowsWithTwo[j];
        if (r1.cols[0] === r2.cols[0] && r1.cols[1] === r2.cols[1]) {
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];
          for (let row = 0; row < 9; row++) {
            if (row !== r1.row && row !== r2.row) {
              if (board[row][r1.cols[0]] === 0 && notes[row][r1.cols[0]].has(num)) {
                removableNotes.push({ row, col: r1.cols[0], value: num });
              }
              if (board[row][r1.cols[1]] === 0 && notes[row][r1.cols[1]].has(num)) {
                removableNotes.push({ row, col: r1.cols[1], value: num });
              }
            }
          }

          if (removableNotes.length > 0) {
            return {
              row: r1.row,
              col: r1.cols[0],
              value: num,
              technique: 'X-Wing',
              canFillValue: false,
              messages: [
                `숫자 ${num}의 배치를 사각형 형태로 확인해 보세요.`,
                `${r1.row + 1}행과 ${r2.row + 1}행에서 ${num} 후보가 같은 두 열(${r1.cols[0] + 1}, ${r1.cols[1] + 1}열)에만 위치합니다.`,
                `이 사각형 구조로 인해, 해당 두 열의 다른 행들에서는 ${num} 후보를 지울 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }
      }
    }

    // Column-based X-Wing
    const colsWithTwo = [];
    for (let col = 0; col < 9; col++) {
      const rows = [];
      for (let row = 0; row < 9; row++) {
        if (board[row][col] === 0 && notes[row][col].has(num)) rows.push(row);
      }
      if (rows.length === 2) colsWithTwo.push({ col, rows });
    }

    for (let i = 0; i < colsWithTwo.length; i++) {
      for (let j = i + 1; j < colsWithTwo.length; j++) {
        const c1 = colsWithTwo[i];
        const c2 = colsWithTwo[j];
        if (c1.rows[0] === c2.rows[0] && c1.rows[1] === c2.rows[1]) {
          const removableNotes: Array<{ row: number; col: number; value: number }> = [];
          for (let col = 0; col < 9; col++) {
            if (col !== c1.col && col !== c2.col) {
              if (board[c1.rows[0]][col] === 0 && notes[c1.rows[0]][col].has(num)) {
                removableNotes.push({ row: c1.rows[0], col, value: num });
              }
              if (board[c1.rows[1]][col] === 0 && notes[c1.rows[1]][col].has(num)) {
                removableNotes.push({ row: c1.rows[1], col, value: num });
              }
            }
          }

          if (removableNotes.length > 0) {
            return {
              row: c1.rows[0],
              col: c1.col,
              value: num,
              technique: 'X-Wing',
              canFillValue: false,
              messages: [
                `숫자 ${num}의 배치를 사각형 형태로 확인해 보세요.`,
                `${c1.col + 1}열과 ${c2.col + 1}열에서 ${num} 후보가 같은 두 행(${c1.rows[0] + 1}, ${c1.rows[1] + 1}행)에만 위치합니다.`,
                `이 사각형 구조로 인해, 해당 두 행의 다른 열들에서는 ${num} 후보를 지울 수 있습니다.`,
              ],
              removableNotes,
            };
          }
        }
      }
    }
  }
  return null;
};

export const findAdvancedHint = (
  board: Board,
  selectedCell: { row: number; col: number } | null | undefined,
  notes: Set<number>[][],
): Hint | null => {
  // 1. 단일 후보 (Naked Single) - 선택된 셀 우선
  if (selectedCell) {
    const hint = getHintForCell(board, selectedCell.row, selectedCell.col);
    if (hint && hint.technique === '단일 후보') return hint;
  }
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const hint = getHintForCell(board, row, col);
      if (hint && hint.technique === '단일 후보') return hint;
    }
  }

  // 2. 숨은 단일 후보 (Hidden Single) - 선택된 셀 우선
  if (selectedCell) {
    const hint = getHintForCell(board, selectedCell.row, selectedCell.col);
    if (hint && hint.technique === '숨은 단일 후보') return hint;
  }
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      const hint = getHintForCell(board, row, col);
      if (hint && hint.technique === '숨은 단일 후보') return hint;
    }
  }

  // 3. 고정 후보 (Pointing/Claiming)
  const lockedHint = findLockedCandidateHint(board, notes);
  if (lockedHint) return lockedHint;

  // 4. 드러난 쌍 (Naked Pair)
  const nakedPairHint = findNakedPairHint(board, notes);
  if (nakedPairHint) return nakedPairHint;

  // 5. 숨은 쌍 (Hidden Pair)
  const hiddenPairHint = findHiddenPairHint(board, notes);
  if (hiddenPairHint) return hiddenPairHint;

  // 6. X-Wing
  const xWingHint = findXWingHint(board, notes);
  if (xWingHint) return xWingHint;

  return null;
};

export const evaluateBoardDifficulty = (initialBoard: Board): Difficulty => {
  const board = clone(initialBoard);
  const notes: Set<number>[][] = Array.from({ length: 9 }, (_, r) => 
    Array.from({ length: 9 }, (_, c) => {
      if (board[r][c] !== 0) return new Set<number>();
      return new Set(getPossibleValues(board, r, c));
    })
  );

  let maxTechnique: HintTechnique = '단일 후보';

  while (true) {
    const hint = findAdvancedHint(board, null, notes);
    if (!hint) break;

    // 기법 등급 기록
    const techniqueRank: Record<HintTechnique, number> = {
      '단일 후보': 1,
      '숨은 단일 후보': 1,
      '고정 후보': 2,
      '드러난 쌍': 2,
      '숨은 쌍': 3,
      'X-Wing': 3,
      '정답': 4
    };

    if (techniqueRank[hint.technique] > techniqueRank[maxTechnique]) {
      maxTechnique = hint.technique;
    }

    // 실제로 적용하여 보드 갱신 (무한 루프 방지)
    if (hint.canFillValue) {
      board[hint.row][hint.col] = hint.value;
      // 메모 갱신
      for (let i = 0; i < 9; i++) {
        notes[hint.row][i].delete(hint.value);
        notes[i][hint.col].delete(hint.value);
      }
      const br = Math.floor(hint.row / 3) * 3;
      const bc = Math.floor(hint.col / 3) * 3;
      for (let r = br; r < br + 3; r++) {
        for (let c = bc; c < bc + 3; c++) notes[r][c].delete(hint.value);
      }
      notes[hint.row][hint.col].clear();
    } else if (hint.removableNotes) {
      for (const { row, col, value } of hint.removableNotes) {
        notes[row][col].delete(value);
      }
    } else {
      break; // 더 이상 진행 불가
    }
  }

  // 모든 셀이 채워졌는지 확인 (논리적으로 풀리는지)
  const isSolved = board.every(row => row.every(cell => cell !== 0));
  
  if (!isSolved) return 'hard'; 
  
  if (maxTechnique === '숨은 쌍' || maxTechnique === 'X-Wing') return 'hard';
  if (maxTechnique === '고정 후보' || maxTechnique === '드러난 쌍') return 'medium';
  return 'easy';
};
