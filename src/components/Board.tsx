import React from 'react';
import Cell from './Cell';
import type { Board as BoardType, Notes, CellSelection } from '../hooks/useSudoku';

interface BoardProps {
  currentBoard: BoardType;
  initialBoard: BoardType;
  solutionBoard: BoardType;
  notes: Notes;
  selectedCell: CellSelection;
  isPaused: boolean;
  showMistakes: boolean;
  showDuplicates: boolean;
  onSelectCell: (row: number, col: number) => void;
}

const Board: React.FC<BoardProps> = ({
  currentBoard,
  initialBoard,
  solutionBoard,
  notes,
  selectedCell,
  isPaused,
  showMistakes,
  showDuplicates,
  onSelectCell,
}) => {
  const isConflict = (row: number, col: number, val: number): boolean => {
    if (val === 0) return false;
    
    // Check row
    for (let i = 0; i < 9; i++) {
      if (i !== col && currentBoard[row][i] === val) return true;
    }
    // Check col
    for (let i = 0; i < 9; i++) {
      if (i !== row && currentBoard[i][col] === val) return true;
    }
    // Check box
    const startRow = Math.floor(row / 3) * 3;
    const startCol = Math.floor(col / 3) * 3;
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) {
        const r = startRow + i;
        const c = startCol + j;
        if ((r !== row || c !== col) && currentBoard[r][c] === val) return true;
      }
    }
    return false;
  };

  const isRelated = (row: number, col: number): boolean => {
    if (!selectedCell) return false;
    return selectedCell.row === row
      || selectedCell.col === col
      || (
        Math.floor(selectedCell.row / 3) === Math.floor(row / 3)
        && Math.floor(selectedCell.col / 3) === Math.floor(col / 3)
      );
  };

  return (
    <div className="grid grid-cols-9 grid-rows-[repeat(9,minmax(0,1fr))] w-full max-w-[500px] aspect-square border-2 border-[var(--border-board)] shadow-2xl mx-auto" role="grid" aria-label="스도쿠 보드">
      {currentBoard.map((row: number[], rowIndex: number) =>
        row.map((cell: number, colIndex: number) => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const selectedValue = selectedCell ? currentBoard[selectedCell.row][selectedCell.col] : 0;
          const isSameNumber = showDuplicates && selectedValue !== 0 && selectedValue === cell;
          
          const borderClasses = `
            ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-r-[var(--border-board)]' : ''}
            ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-b-[var(--border-board)]' : ''}
          `;

          return (
            <div key={`${rowIndex}-${colIndex}`} className={`min-w-0 min-h-0 ${borderClasses}`}>
              <Cell
                value={cell}
                initialValue={initialBoard[rowIndex][colIndex]}
                isSelected={!!isSelected}
                isSameNumber={!!isSameNumber}
                isRelated={isRelated(rowIndex, colIndex)}
                isConflict={showDuplicates && isConflict(rowIndex, colIndex, cell)}
                isMistake={showMistakes && cell !== 0 && cell !== solutionBoard[rowIndex][colIndex]}
                isPaused={isPaused}
                row={rowIndex}
                col={colIndex}
                notes={notes[rowIndex][colIndex]}
                onClick={() => onSelectCell(rowIndex, colIndex)}
              />
            </div>
          );
        })
      )}
    </div>
  );
};

export default Board;
