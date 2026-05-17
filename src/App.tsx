import Header from './components/Header';
import Board from './components/Board';
import Controls from './components/Controls';
import { useSudoku } from './hooks/useSudoku';

function App() {
  const {
    currentBoard,
    initialBoard,
    notes,
    selectedCell,
    isNoteMode,
    timer,
    gameStatus,
    selectCell,
    enterNumber,
    toggleNoteMode,
    getHint,
    startNewGame,
  } = useSudoku();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center pb-12">
      <Header timer={timer} gameStatus={gameStatus} />
      
      <main className="w-full max-w-2xl px-4">
        <Board
          currentBoard={currentBoard}
          initialBoard={initialBoard}
          notes={notes}
          selectedCell={selectedCell}
          onSelectCell={selectCell}
        />
        
        <Controls
          isNoteMode={isNoteMode}
          onNumberClick={enterNumber}
          onToggleNoteMode={toggleNoteMode}
          onHint={getHint}
          onNewGame={() => startNewGame(40)} // Default difficulty
        />
        
        {gameStatus === 'won' && (
          <div className="mt-8 p-6 bg-green-100 border-2 border-green-500 rounded-2xl text-center">
            <h2 className="text-2xl font-bold text-green-700">Congratulations!</h2>
            <p className="text-green-600">You solved the puzzle in {Math.floor(timer / 60)}m {timer % 60}s!</p>
            <button
              onClick={() => startNewGame(40)}
              className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
            >
              Play Again
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
