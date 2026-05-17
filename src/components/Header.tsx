import React from 'react';

interface HeaderProps {
  timer: number;
  gameStatus: 'playing' | 'won' | 'lost';
}

const Header: React.FC<HeaderProps> = ({ timer, gameStatus }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <header className="w-full flex justify-between items-center py-4 px-6 bg-white shadow-sm mb-6">
      <h1 className="text-2xl font-bold text-gray-800">Sudoku Master</h1>
      <div className="flex items-center gap-4">
        <div className="text-lg font-mono bg-gray-100 px-3 py-1 rounded">
          {formatTime(timer)}
        </div>
        {gameStatus === 'won' && (
          <span className="text-green-600 font-bold animate-bounce">Victory!</span>
        )}
      </div>
    </header>
  );
};

export default Header;
