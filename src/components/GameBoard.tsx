import React, { useState } from 'react';

// Para evitar el error de process.env
const IS_DEBUG = false; // Cambiar a true para habilitar logs de depuración

// Define the structure for board cell data
interface BoardCell {
  coordinate: string; // e.g., "A1", "B2"
  x: string; // Letter A-P
  y: number; // Number 1-30
  r: number;
  g: number;
  b: number;
}

// Define props for the component
interface GameBoardProps {
  boardData: BoardCell[];
  onCellClick: (coordinate: string) => void;
  isLoading: boolean;
  feedbackCoords?: string[];
}

const GameBoard: React.FC<GameBoardProps> = ({ boardData, onCellClick, isLoading, feedbackCoords = [] }) => {
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);

  // Create a grid structure for rendering (16 rows x 30 columns)
  const createGrid = () => {
    const rows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'];
    const cols = Array.from({ length: 30 }, (_, i) => i + 1);

    const grid: (BoardCell | null)[][] = [];

    for (const row of rows) {
      const gridRow: (BoardCell | null)[] = [];
      for (const col of cols) {
        const coordinate = `${row}${col}`;
        const cell = boardData.find(cell => cell.coordinate === coordinate);
        gridRow.push(cell || null);
      }
      grid.push(gridRow);
    }

    return { grid, rows, cols };
  };

  const handleCellClick = (cell: BoardCell) => {
    if (IS_DEBUG) console.log(`Cell clicked: ${cell.coordinate}`);
    onCellClick(cell.coordinate);
  };

  const handleCellHover = (coordinate: string | null) => {
    setHoveredCell(coordinate);
  };

  if (isLoading) {
    return (
      <div className="gameboard-container bg-black rounded-md border border-gray-200 shadow-sm h-full flex flex-col">
        <div className="gameboard-content flex-grow p-4 flex flex-col items-center justify-center">
          <div className="text-white text-lg">Loading board...</div>
        </div>
      </div>
    );
  }

  if (boardData.length === 0) {
    return (
      <div className="gameboard-container bg-black rounded-md border border-gray-200 shadow-sm h-full flex flex-col">
        <div className="gameboard-content flex-grow p-4 flex flex-col items-center justify-center">
          <div className="text-white text-lg">Board data not available</div>
        </div>
      </div>
    );
  }

  const { grid, rows, cols } = createGrid();

  return (
    <div className="gameboard-container w-full h-full bg-black rounded-md border border-gray-200 shadow-sm flex flex-col">
      <div className="gameboard-content flex-grow p-1 sm:p-2 flex flex-col items-center justify-center overflow-hidden w-full h-full">
        <div className="relative w-full h-full flex flex-col items-center justify-center">
          {/* Header with column numbers */}
          <div className="board-grid mb-1 flex-shrink-0">
            <div className="board-cell"></div> {/* Empty corner */}
            {cols.map(col => (
              <div
                key={col}
                className="board-cell text-white font-bold text-center flex items-center justify-center"
                style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1rem)' }}
              >
                {col}
              </div>
            ))}
          </div>

          {/* Main board grid */}
          <div className="board-grid flex-shrink-0 w-full h-full">
            {grid.map((row, rowIndex) => (
              <React.Fragment key={rows[rowIndex]}>
                {/* Row label */}
                <div className="board-cell text-white font-bold text-center flex items-center justify-center"
                  style={{ fontSize: 'clamp(0.6rem, 1.2vw, 1rem)' }}>
                  {rows[rowIndex]}
                </div>

                {/* Row cells */}
                {row.map((cell, colIndex) => {
                  const coordinate = `${rows[rowIndex]}${cols[colIndex]}`;
                  const isHovered = hoveredCell === coordinate;

                  return (
                    <div key={coordinate} className="relative">
                      <div
                        className={`
                          board-cell
                          ${isHovered ? 'scale-110 z-10 relative' : ''}
                        `}
                        style={{
                          backgroundColor: cell ? `rgb(${cell.r}, ${cell.g}, ${cell.b})` : '#000000',
                          width: '100%',
                          height: '100%',
                          minWidth: 0,
                          minHeight: 0,
                          aspectRatio: '1/1',
                          maxWidth: '100%',
                          maxHeight: '100%'
                        }}
                        onClick={() => cell && handleCellClick(cell)}
                        onMouseEnter={() => handleCellHover(coordinate)}
                        onMouseLeave={() => handleCellHover(null)}
                      />
                      {/* Círculo negro de feedback */}
                      {feedbackCoords.includes(coordinate) && (
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: '60%',
                          height: '60%',
                          borderRadius: '50%',
                          background: 'black',
                          opacity: 0.85,
                          pointerEvents: 'none',
                          zIndex: 20,
                        }} />
                      )}
                      {/* Coordinate tooltip on hover */}
                      {isHovered && (
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-20 pointer-events-none">
                          <div className="bg-white text-black font-bold px-2 py-1 rounded shadow-lg border whitespace-nowrap"
                            style={{ fontSize: 'clamp(0.7rem, 1.2vw, 0.9rem)' }}>
                            {coordinate}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameBoard; 