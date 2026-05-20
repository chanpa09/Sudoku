import { type Board, isValid, cloneBoard as clone } from './sudokuBase';
import type { Difficulty } from './sudokuBase';

export type HintTechnique = '단일 후보' | '숨은 단일 후보' | '고정 후보' | '드러난 쌍' | '숨은 쌍' | '드러난 3쌍' | '숨은 3쌍' | '소드피쉬' | 'X-Wing' | '정답';

export type Hint = {
  row: number;
  col: number;
  value: number;
  technique: HintTechnique;
  canFillValue: boolean;
  messages: [string, string, string];
  removableNotes?: Array<{ row: number; col: number; value: number }>;
  highlightedNotes?: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }>;
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [
              ...cells.map(cell => ({ row: cell.row, col: cell.col, value: num, type: 'condition' as const })),
              ...removableNotes.map(rn => ({ ...rn, type: 'removal' as const })),
            ];

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
              highlightedNotes,
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [
              ...cells.map(cell => ({ row: cell.row, col: cell.col, value: num, type: 'condition' as const })),
              ...removableNotes.map(rn => ({ ...rn, type: 'removal' as const })),
            ];

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
              highlightedNotes,
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
            
            // Condition notes
            for (const v of values) {
              highlightedNotes.push({ row: pairs[first].row, col: pairs[first].col, value: v, type: 'condition' as const });
              highlightedNotes.push({ row: pairs[second].row, col: pairs[second].col, value: v, type: 'condition' as const });
            }
            
            // Removal notes
            for (const rn of removableNotes) {
              highlightedNotes.push({ ...rn, type: 'removal' as const });
            }

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
              highlightedNotes,
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
            
            // Condition notes
            for (const cell of cells1) {
              highlightedNotes.push({ row: cell.row, col: cell.col, value: n1, type: 'condition' as const });
              highlightedNotes.push({ row: cell.row, col: cell.col, value: n2, type: 'condition' as const });
            }
            
            // Removal notes
            for (const rn of removableNotes) {
              highlightedNotes.push({ ...rn, type: 'removal' as const });
            }

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
              highlightedNotes,
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [
              { row: r1.row, col: r1.cols[0], value: num, type: 'condition' as const },
              { row: r1.row, col: r1.cols[1], value: num, type: 'condition' as const },
              { row: r2.row, col: r2.cols[0], value: num, type: 'condition' as const },
              { row: r2.row, col: r2.cols[1], value: num, type: 'condition' as const },
              ...removableNotes.map(rn => ({ ...rn, type: 'removal' as const })),
            ];

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
              highlightedNotes,
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
            const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [
              { row: c1.rows[0], col: c1.col, value: num, type: 'condition' as const },
              { row: c1.rows[1], col: c1.col, value: num, type: 'condition' as const },
              { row: c2.rows[0], col: c2.col, value: num, type: 'condition' as const },
              { row: c2.rows[1], col: c2.col, value: num, type: 'condition' as const },
              ...removableNotes.map(rn => ({ ...rn, type: 'removal' as const })),
            ];

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
              highlightedNotes,
            };
          }
        }
      }
    }
  }

  return null;
};

export const findNakedTripleHint = (board: Board, notes: Set<number>[][]): Hint | null => {
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
    const tripleCandidates = emptyCells.map(cell => ({
      ...cell,
      values: [...notes[cell.row][cell.col]],
    })).filter(cell => cell.values.length === 2 || cell.values.length === 3);

    if (tripleCandidates.length < 3) continue;

    for (let i = 0; i < tripleCandidates.length; i++) {
      for (let j = i + 1; j < tripleCandidates.length; j++) {
        for (let k = j + 1; k < tripleCandidates.length; k++) {
          const union = new Set([
            ...tripleCandidates[i].values,
            ...tripleCandidates[j].values,
            ...tripleCandidates[k].values,
          ]);

          if (union.size === 3) {
            const unionValues = [...union];
            const removableNotes: Array<{ row: number; col: number; value: number }> = [];
            const tripleCells = [tripleCandidates[i], tripleCandidates[j], tripleCandidates[k]];

            for (const cell of emptyCells) {
              const isTripleCell = tripleCells.some(tc => tc.row === cell.row && tc.col === cell.col);
              if (isTripleCell) continue;

              for (const v of unionValues) {
                if (notes[cell.row][cell.col].has(v)) {
                  removableNotes.push({ row: cell.row, col: cell.col, value: v });
                }
              }
            }

            if (removableNotes.length > 0) {
              const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
              for (const tc of tripleCells) {
                for (const v of tc.values) {
                  highlightedNotes.push({ row: tc.row, col: tc.col, value: v, type: 'condition' as const });
                }
              }
              for (const rn of removableNotes) {
                highlightedNotes.push({ ...rn, type: 'removal' as const });
              }

              const valuesStr = unionValues.sort().join('/');
              return {
                row: tripleCells[0].row,
                col: tripleCells[0].col,
                value: unionValues[0],
                technique: '드러난 3쌍',
                canFillValue: false,
                messages: [
                  `${unit.name}에서 후보가 3개 이하로 제한되고 공통으로 ${valuesStr} 범위를 이루는 3개의 칸을 찾아보세요.`,
                  `${formatCell(tripleCells[0].row, tripleCells[0].col)}, ${formatCell(tripleCells[1].row, tripleCells[1].col)}, ${formatCell(tripleCells[2].row, tripleCells[2].col)}가 ${valuesStr} 드러난 3쌍(Naked Triple)을 이룹니다.`,
                  `이 3개의 숫자들은 이 3개의 칸에만 나뉘어 들어가야 하므로, 동일한 영역의 다른 칸에서는 해당 후보들을 지울 수 있습니다.`,
                ],
                removableNotes,
                highlightedNotes,
              };
            }
          }
        }
      }
    }
  }

  return null;
};

export const findHiddenTripleHint = (board: Board, notes: Set<number>[][]): Hint | null => {
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

    const potentialNums = Object.keys(numToCells).map(Number).filter(num => numToCells[num].length >= 2 && numToCells[num].length <= 3);
    if (potentialNums.length < 3) continue;

    for (let i = 0; i < potentialNums.length; i++) {
      for (let j = i + 1; j < potentialNums.length; j++) {
        for (let k = j + 1; k < potentialNums.length; k++) {
          const n1 = potentialNums[i];
          const n2 = potentialNums[j];
          const n3 = potentialNums[k];

          const cellUnion = new Map<string, { row: number; col: number }>();
          const addCells = (cells: Array<{ row: number; col: number }>) => {
            for (const cell of cells) {
              cellUnion.set(`${cell.row},${cell.col}`, cell);
            }
          };
          addCells(numToCells[n1]);
          addCells(numToCells[n2]);
          addCells(numToCells[n3]);

          if (cellUnion.size === 3) {
            const targetCells = [...cellUnion.values()];
            const removableNotes: Array<{ row: number; col: number; value: number }> = [];

            for (const cell of targetCells) {
              for (const v of notes[cell.row][cell.col]) {
                if (v !== n1 && v !== n2 && v !== n3) {
                  removableNotes.push({ row: cell.row, col: cell.col, value: v });
                }
              }
            }

            if (removableNotes.length > 0) {
              const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
              const targetNums = [n1, n2, n3];
              for (const cell of targetCells) {
                for (const num of targetNums) {
                  if (notes[cell.row][cell.col].has(num)) {
                    highlightedNotes.push({ row: cell.row, col: cell.col, value: num, type: 'condition' as const });
                  }
                }
              }
              for (const rn of removableNotes) {
                highlightedNotes.push({ ...rn, type: 'removal' as const });
              }

              const valuesStr = targetNums.sort().join('/');
              return {
                row: targetCells[0].row,
                col: targetCells[0].col,
                value: targetNums[0],
                technique: '숨은 3쌍',
                canFillValue: false,
                messages: [
                  `${unit.name}에서 특정 세 숫자(${valuesStr})가 나타나는 세 개의 칸을 관찰해 보세요.`,
                  `${valuesStr} 후보가 오직 ${formatCell(targetCells[0].row, targetCells[0].col)}, ${formatCell(targetCells[1].row, targetCells[1].col)}, ${formatCell(targetCells[2].row, targetCells[2].col)}에만 숨어서 존재합니다.`,
                  `따라서 이 세 칸에는 ${valuesStr} 이외의 다른 숫자는 들어갈 수 없으므로 다른 후보들을 안전하게 제거할 수 있습니다.`,
                ],
                removableNotes,
                highlightedNotes,
              };
            }
          }
        }
      }
    }
  }

  return null;
};

export const findSwordfishHint = (board: Board, notes: Set<number>[][]): Hint | null => {
  for (let num = 1; num <= 9; num++) {
    // 1. Row-based Swordfish
    const rowsWithCandidates: Array<{ row: number; cols: number[] }> = [];
    for (let r = 0; r < 9; r++) {
      const cols = [];
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && notes[r][c].has(num)) cols.push(c);
      }
      if (cols.length >= 2 && cols.length <= 3) {
        rowsWithCandidates.push({ row: r, cols });
      }
    }

    if (rowsWithCandidates.length >= 3) {
      for (let i = 0; i < rowsWithCandidates.length; i++) {
        for (let j = i + 1; j < rowsWithCandidates.length; j++) {
          for (let k = j + 1; k < rowsWithCandidates.length; k++) {
            const r1 = rowsWithCandidates[i];
            const r2 = rowsWithCandidates[j];
            const r3 = rowsWithCandidates[k];

            const colUnion = new Set([...r1.cols, ...r2.cols, ...r3.cols]);
            if (colUnion.size === 3) {
              const targetCols = [...colUnion];
              const removableNotes: Array<{ row: number; col: number; value: number }> = [];

              for (let r = 0; r < 9; r++) {
                if (r !== r1.row && r !== r2.row && r !== r3.row) {
                  for (const c of targetCols) {
                    if (board[r][c] === 0 && notes[r][c].has(num)) {
                      removableNotes.push({ row: r, col: c, value: num });
                    }
                  }
                }
              }

              if (removableNotes.length > 0) {
                const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
                const baseRows = [r1, r2, r3];
                for (const br of baseRows) {
                  for (const c of br.cols) {
                    highlightedNotes.push({ row: br.row, col: c, value: num, type: 'condition' as const });
                  }
                }
                for (const rn of removableNotes) {
                  highlightedNotes.push({ ...rn, type: 'removal' as const });
                }

                const rowsStr = `${r1.row + 1}, ${r2.row + 1}, ${r3.row + 1}행`;
                const colsStr = targetCols.map(c => c + 1).sort().join(', ') + '열';
                return {
                  row: r1.row,
                  col: r1.cols[0],
                  value: num,
                  technique: '소드피쉬',
                  canFillValue: false,
                  messages: [
                    `후보 숫자 ${num}이 3개의 행(${rowsStr})에서 오직 동일한 3개의 열(${colsStr})에만 포진되어 있는지 확인해보세요.`,
                    `3x3 매트릭스 형태의 Swordfish 패턴이 성립하여, 해당 ${colsStr}의 다른 행들에서는 후보 ${num}을 지울 수 있습니다.`,
                    `소드피쉬(Swordfish) 기법을 활용하여 다른 칸의 ${num} 후보를 제거할 수 있습니다.`,
                  ],
                  removableNotes,
                  highlightedNotes,
                };
              }
            }
          }
        }
      }
    }

    // 2. Column-based Swordfish
    const colsWithCandidates: Array<{ col: number; rows: number[] }> = [];
    for (let c = 0; c < 9; c++) {
      const rows = [];
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0 && notes[r][c].has(num)) rows.push(r);
      }
      if (rows.length >= 2 && rows.length <= 3) {
        colsWithCandidates.push({ col: c, rows });
      }
    }

    if (colsWithCandidates.length >= 3) {
      for (let i = 0; i < colsWithCandidates.length; i++) {
        for (let j = i + 1; j < colsWithCandidates.length; j++) {
          for (let k = j + 1; k < colsWithCandidates.length; k++) {
            const c1 = colsWithCandidates[i];
            const c2 = colsWithCandidates[j];
            const c3 = colsWithCandidates[k];

            const rowUnion = new Set([...c1.rows, ...c2.rows, ...c3.rows]);
            if (rowUnion.size === 3) {
              const targetRows = [...rowUnion];
              const removableNotes: Array<{ row: number; col: number; value: number }> = [];

              for (let c = 0; c < 9; c++) {
                if (c !== c1.col && c !== c2.col && c !== c3.col) {
                  for (const r of targetRows) {
                    if (board[r][c] === 0 && notes[r][c].has(num)) {
                      removableNotes.push({ row: r, col: c, value: num });
                    }
                  }
                }
              }

              if (removableNotes.length > 0) {
                const highlightedNotes: Array<{ row: number; col: number; value: number; type: 'condition' | 'removal' }> = [];
                const baseCols = [c1, c2, c3];
                for (const bc of baseCols) {
                  for (const r of bc.rows) {
                    highlightedNotes.push({ row: r, col: bc.col, value: num, type: 'condition' as const });
                  }
                }
                for (const rn of removableNotes) {
                  highlightedNotes.push({ ...rn, type: 'removal' as const });
                }

                const colsStr = `${c1.col + 1}, ${c2.col + 1}, ${c3.col + 1}열`;
                const rowsStr = targetRows.map(r => r + 1).sort().join(', ') + '행';
                return {
                  row: targetRows[0],
                  col: c1.col,
                  value: num,
                  technique: '소드피쉬',
                  canFillValue: false,
                  messages: [
                    `후보 숫자 ${num}이 3개의 열(${colsStr})에서 오직 동일한 3개의 행(${rowsStr})에만 포진되어 있는지 확인해보세요.`,
                    `3x3 매트릭스 형태의 Swordfish 패턴이 성립하여, 해당 ${rowsStr}의 다른 열들에서는 후보 ${num}을 지울 수 있습니다.`,
                    `소드피쉬(Swordfish) 기법을 활용하여 다른 칸의 ${num} 후보를 제거할 수 있습니다.`,
                  ],
                  removableNotes,
                  highlightedNotes,
                };
              }
            }
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

  // 6. 드러난 3쌍 (Naked Triple)
  const nakedTripleHint = findNakedTripleHint(board, notes);
  if (nakedTripleHint) return nakedTripleHint;

  // 7. 숨은 3쌍 (Hidden Triple)
  const hiddenTripleHint = findHiddenTripleHint(board, notes);
  if (hiddenTripleHint) return hiddenTripleHint;

  // 8. X-Wing
  const xWingHint = findXWingHint(board, notes);
  if (xWingHint) return xWingHint;

  // 9. 소드피쉬 (Swordfish)
  const swordfishHint = findSwordfishHint(board, notes);
  if (swordfishHint) return swordfishHint;

  return null;
};

export const evaluateBoardDifficulty = (initialBoard: Board): Difficulty => {
  let emptyCount = 0;
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (initialBoard[r][c] === 0) emptyCount++;
    }
  }

  // 32개 이하면 입문자(beginner), 40개 이하면 쉬움(easy)으로 초기 제약 조건 검증
  if (emptyCount <= 32) return 'beginner';
  if (emptyCount <= 40) return 'easy';

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
      '드러난 3쌍': 3,
      '숨은 3쌍': 4,
      'X-Wing': 4,
      '소드피쉬': 5,
      '정답': 5
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
  
  if (!isSolved) return 'expert'; 
  
  if (maxTechnique === '소드피쉬' || maxTechnique === '숨은 3쌍' || maxTechnique === '정답') return 'expert';
  if (maxTechnique === 'X-Wing' || maxTechnique === '드러난 3쌍' || maxTechnique === '숨은 쌍') return 'hard';
  if (maxTechnique === '고정 후보' || maxTechnique === '드러난 쌍') return 'medium';
  return 'easy';
};
