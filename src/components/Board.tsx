import React from 'react';
import Cell from './Cell';
import type { Board as BoardType, Notes, CellSelection } from '../hooks/useSudoku';

interface BoardProps {
  currentBoard: BoardType;
  initialBoard: BoardType;
  notes: Notes;
  selectedCell: CellSelection;
  onSelectCell: (row: number, col: number) => void;
}

const Board: React.FC<BoardProps> = ({
  currentBoard,
  initialBoard,
  notes,
  selectedCell,
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

  return (
    <div className="grid grid-cols-9 w-full max-w-[500px] aspect-square border-2 border-gray-800 shadow-2xl mx-auto">
      {currentBoard.map((row: number[], rowIndex: number) =>
        row.map((cell: number, colIndex: number) => {
          const isSelected = selectedCell?.row === rowIndex && selectedCell?.col === colIndex;
          const isSameNumber = selectedCell && currentBoard[selectedCell.row][selectedCell.col] === cell;
          
          const borderClasses = `
            ${colIndex % 3 === 2 && colIndex !== 8 ? 'border-r-2 border-r-gray-800' : ''}
            ${rowIndex % 3 === 2 && rowIndex !== 8 ? 'border-b-2 border-b-gray-800' : ''}
          `;

          return (
            <div key={`${rowIndex}-${colIndex}`} className={borderClasses}>
              <Cell
                value={cell}
                initialValue={initialBoard[rowIndex][colIndex]}
                isSelected={!!isSelected}
                isSameNumber={!!isSameNumber}
                isConflict={isConflict(rowIndex, colIndex, cell)}
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
