import { useState, useEffect, useCallback } from 'react';
import type { Board } from '../utils/sudoku';
import { generateSolvedBoard, generatePuzzle } from '../utils/sudoku';

export type { Board };
export type CellSelection = { row: number; col: number } | null;
export type Notes = Set<number>[][];

export const useSudoku = () => {
  const [solutionBoard, setSolutionBoard] = useState<Board>([]);
  const [initialBoard, setInitialBoard] = useState<Board>([]);
  const [currentBoard, setCurrentBoard] = useState<Board>([]);
  const [notes, setNotes] = useState<Notes>([]);
  const [selectedCell, setSelectedCell] = useState<CellSelection>(null);
  const [isNoteMode, setIsNoteMode] = useState(false);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');

  const startNewGame = useCallback((difficulty: number = 40) => {
    const solved = generateSolvedBoard();
    const puzzle = generatePuzzle(solved, difficulty);
    
    setSolutionBoard(solved);
    setInitialBoard(puzzle.map(row => [...row]));
    setCurrentBoard(puzzle.map(row => [...row]));
    setNotes(Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>())));
    setSelectedCell(null);
    setTimer(0);
    setIsPaused(false);
    setGameStatus('playing');
  }, []);

  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  useEffect(() => {
    let interval: number | undefined;
    if (gameStatus === 'playing' && !isPaused) {
      interval = window.setInterval(() => {
        setTimer(t => t + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameStatus, isPaused]);

  const selectCell = (row: number, col: number) => {
    setSelectedCell({ row, col });
  };

  const enterNumber = (num: number) => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const { row, col } = selectedCell;

    // Don't allow changing initial numbers
    if (initialBoard[row][col] !== 0) return;

    if (isNoteMode) {
      const newNotes = [...notes];
      const cellNotes = new Set(newNotes[row][col]);
      if (cellNotes.has(num)) {
        cellNotes.delete(num);
      } else {
        cellNotes.add(num);
      }
      newNotes[row][col] = cellNotes;
      setNotes(newNotes);
    } else {
      const newBoard = currentBoard.map(r => [...r]);
      newBoard[row][col] = num === newBoard[row][col] ? 0 : num; // Toggle number
      setCurrentBoard(newBoard);

      // Check for win
      if (checkWin(newBoard)) {
        setGameStatus('won');
      }
    }
  };

  const checkWin = (board: Board): boolean => {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] !== solutionBoard[r][c]) return false;
      }
    }
    return true;
  };

  const toggleNoteMode = () => setIsNoteMode(!isNoteMode);

  const getHint = () => {
    if (!selectedCell || gameStatus !== 'playing') return;
    const { row, col } = selectedCell;
    
    if (initialBoard[row][col] !== 0) return;

    const newBoard = currentBoard.map(r => [...r]);
    newBoard[row][col] = solutionBoard[row][col];
    setCurrentBoard(newBoard);
    
    if (checkWin(newBoard)) {
      setGameStatus('won');
    }
  };

  return {
    currentBoard,
    initialBoard,
    solutionBoard,
    notes,
    selectedCell,
    isNoteMode,
    timer,
    gameStatus,
    isPaused,
    selectCell,
    enterNumber,
    toggleNoteMode,
    getHint,
    startNewGame,
  };
};
