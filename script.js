class Minesweeper {
    constructor() {
        this.difficulties = {
            easy: { rows: 6, cols: 6, mines: 4 },
            medium: { rows: 16, cols: 16, mines: 40 },
            hard: { rows: 16, cols: 30, mines: 99 }
        };
        
        this.currentDifficulty = 'easy';
        this.gameBoard = [];
        this.gameState = 'waiting'; // waiting, playing, won, lost
        this.startTime = null;
        this.timerInterval = null;
        this.firstClick = true;
        
        this.initializeElements();
        this.setupEventListeners();
        this.createBoard();
    }
    
    initializeElements() {
        this.boardElement = document.getElementById('game-board');
        this.mineCountElement = document.getElementById('mine-count');
        this.timerElement = document.getElementById('timer');
        this.gameStatusElement = document.getElementById('game-status');
        this.newGameButton = document.getElementById('new-game');
        this.difficultyButtons = document.querySelectorAll('.difficulty-btn');
    }
    
    setupEventListeners() {
        this.newGameButton.addEventListener('click', () => this.newGame());
        
        this.difficultyButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.difficultyButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentDifficulty = e.target.id;
                this.newGame();
            });
        });
    }
    
    createBoard() {
        const config = this.difficulties[this.currentDifficulty];
        this.rows = config.rows;
        this.cols = config.cols;
        this.mineCount = config.mines;
        this.flaggedCount = 0;
        
        // Clear the board
        this.boardElement.innerHTML = '';
        this.boardElement.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        
        // Initialize game board
        this.gameBoard = Array(this.rows).fill().map(() => Array(this.cols).fill(0));
        
        // Create cells
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.row = row;
                cell.dataset.col = col;
                
                cell.addEventListener('click', (e) => this.handleCellClick(e));
                cell.addEventListener('contextmenu', (e) => this.handleRightClick(e));
                
                this.boardElement.appendChild(cell);
            }
        }
        
        this.updateMineCount();
        this.updateGameStatus('Click a cell to start the game!', 'playing');
    }
    
    handleCellClick(event) {
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        
        const row = parseInt(event.target.dataset.row);
        const col = parseInt(event.target.dataset.col);
        
        if (event.target.classList.contains('flagged')) return;
        
        if (this.firstClick) {
            this.placeMines(row, col);
            this.firstClick = false;
            this.startTimer();
        }
        
        this.revealCell(row, col);
    }
    
    handleRightClick(event) {
        event.preventDefault();
        if (this.gameState === 'won' || this.gameState === 'lost') return;
        
        const cell = event.target;
        if (cell.classList.contains('revealed')) return;
        
        if (cell.classList.contains('flagged')) {
            cell.classList.remove('flagged');
            cell.textContent = '';
            this.flaggedCount--;
        } else {
            cell.classList.add('flagged');
            cell.textContent = '🚩';
            this.flaggedCount++;
        }
        
        this.updateMineCount();
    }
    
    placeMines(excludeRow, excludeCol) {
        const config = this.difficulties[this.currentDifficulty];
        let minesPlaced = 0;
        
        while (minesPlaced < config.mines) {
            const row = Math.floor(Math.random() * this.rows);
            const col = Math.floor(Math.random() * this.cols);
            
            // Don't place mine on first click or if already a mine
            if ((row === excludeRow && col === excludeCol) || this.gameBoard[row][col] === -1) {
                continue;
            }
            
            this.gameBoard[row][col] = -1; // -1 represents a mine
            minesPlaced++;
        }
        
        // Calculate numbers for each cell
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.gameBoard[row][col] !== -1) {
                    this.gameBoard[row][col] = this.countAdjacentMines(row, col);
                }
            }
        }
    }
    
    countAdjacentMines(row, col) {
        let count = 0;
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols && 
                    this.gameBoard[newRow][newCol] === -1) {
                    count++;
                }
            }
        }
        return count;
    }
    
    revealCell(row, col) {
        const cell = this.getCellElement(row, col);
        if (cell.classList.contains('revealed')) return;
        
        cell.classList.add('revealed');
        
        if (this.gameBoard[row][col] === -1) {
            // Hit a mine
            cell.classList.add('mine', 'exploded');
            cell.textContent = '💣';
            this.gameOver();
            return;
        }
        
        const mineCount = this.gameBoard[row][col];
        if (mineCount > 0) {
            cell.textContent = mineCount;
            cell.dataset.count = mineCount;
        } else {
            // Empty cell - reveal adjacent cells
            this.revealAdjacentCells(row, col);
        }
        
        this.checkWin();
    }
    
    revealAdjacentCells(row, col) {
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const newRow = row + i;
                const newCol = col + j;
                if (newRow >= 0 && newRow < this.rows && 
                    newCol >= 0 && newCol < this.cols) {
                    const cell = this.getCellElement(newRow, newCol);
                    if (!cell.classList.contains('revealed')) {
                        this.revealCell(newRow, newCol);
                    }
                }
            }
        }
    }
    
    getCellElement(row, col) {
        return document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
    }
    
    checkWin() {
        let revealedCount = 0;
        const totalCells = this.rows * this.cols;
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const cell = this.getCellElement(row, col);
                if (cell.classList.contains('revealed')) {
                    revealedCount++;
                }
            }
        }
        
        if (revealedCount === totalCells - this.mineCount) {
            this.gameWon();
        }
    }
    
    gameWon() {
        this.gameState = 'won';
        this.stopTimer();
        this.updateGameStatus('🎉 Congratulations! You won! 🎉', 'win');
        this.revealAllMines();
    }
    
    gameOver() {
        this.gameState = 'lost';
        this.stopTimer();
        this.updateGameStatus('💥 Game Over! Try again! 💥', 'lose');
        this.revealAllMines();
    }
    
    revealAllMines() {
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.gameBoard[row][col] === -1) {
                    const cell = this.getCellElement(row, col);
                    if (!cell.classList.contains('flagged')) {
                        cell.classList.add('mine', 'revealed');
                        cell.textContent = '💣';
                    }
                }
            }
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.timerElement.textContent = elapsed.toString().padStart(3, '0');
        }, 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateMineCount() {
        const remainingMines = this.mineCount - this.flaggedCount;
        this.mineCountElement.textContent = remainingMines;
    }
    
    updateGameStatus(message, className) {
        this.gameStatusElement.textContent = message;
        this.gameStatusElement.className = `game-status ${className}`;
    }
    
    newGame() {
        this.gameState = 'waiting';
        this.firstClick = true;
        this.flaggedCount = 0;
        this.stopTimer();
        this.timerElement.textContent = '000';
        this.createBoard();
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new Minesweeper();
});
