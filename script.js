document.addEventListener('DOMContentLoaded', function() {
    // Game state
    const gameState = {
        balance: 3001.55,
        betAmount: 0.80,
        minesCount: 1,
        gridSize: 25,
        hits: 0,
        multiplier: 1.0,
        nextMultiplier: 1.01,
        minesPositions: [],
        revealedPositions: [],
        gameActive: false,
        autoPlay: false
    };

    // Multipliers based on mines count (from the Python code)
    const multipliersConfig = {
        1: [1.05, 1.15, 1.35],
        5: [1.10, 1.30, 1.55],
        10: [1.40, 1.90, 2.60],
        20: [2.00, 4.00, 6.00]
    };

    // DOM elements
    const gameGrid = document.getElementById('game-grid');
    const playerBalance = document.getElementById('player-balance');
    const randomBtn = document.getElementById('random-btn');
    const cashoutBtn = document.getElementById('cashout-btn');
    const betAmountDisplay = document.getElementById('bet-amount-display');
    const minesCountDisplay = document.getElementById('mines-count-display');
    const nextMultiplierDisplay = document.getElementById('next-multiplier');
    const startGameBtn = document.getElementById('start-game');
    const decreaseBetBtn = document.getElementById('decrease-bet');
    const increaseBetBtn = document.getElementById('increase-bet');

    // Initialize game
    function initGame() {
        updateUI();
        createGrid();
        setupEventListeners();
    }

    // Create game grid
    function createGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < gameState.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            gameGrid.appendChild(cell);
        }
    }

    // Setup event listeners
    function setupEventListeners() {
        // Cell click
        gameGrid.addEventListener('click', function(e) {
            if (e.target.classList.contains('cell') && !e.target.classList.contains('revealed') && 
                !e.target.classList.contains('mine') && gameState.gameActive) {
                handleCellClick(e.target);
            }
        });

        // Random button
        randomBtn.addEventListener('click', function() {
            if (gameState.gameActive) {
                clickRandomCell();
            }
        });

        // Cashout button
        cashoutBtn.addEventListener('click', function() {
            if (gameState.gameActive && gameState.hits > 0) {
                cashOut();
            }
        });

        // Start game button
        startGameBtn.addEventListener('click', function() {
            if (!gameState.gameActive) {
                startGame();
            }
        });

        // Bet amount controls
        decreaseBetBtn.addEventListener('click', function() {
            gameState.betAmount = Math.max(0.10, gameState.betAmount - 0.10);
            updateUI();
        });

        increaseBetBtn.addEventListener('click', function() {
            gameState.betAmount += 0.10;
            updateUI();
        });
    }

    // Start new game
    function startGame() {
        // Check if player has enough balance
        if (gameState.balance < gameState.betAmount) {
            alert("Saldo insuficiente!");
            return;
        }

        // Reset game state
        gameState.hits = 0;
        gameState.multiplier = 1.0;
        gameState.nextMultiplier = 1.01;
        gameState.revealedPositions = [];
        gameState.gameActive = true;
        
        // Generate mines positions
        gameState.minesPositions = [];
        while (gameState.minesPositions.length < gameState.minesCount) {
            const randomPos = Math.floor(Math.random() * gameState.gridSize);
            if (!gameState.minesPositions.includes(randomPos)) {
                gameState.minesPositions.push(randomPos);
            }
        }
        
        // Update UI
        updateUI();
        createGrid();
    }

    // Handle cell click
    function handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        gameState.revealedPositions.push(index);
        
        if (gameState.minesPositions.includes(index)) {
            // Mine hit
            revealMine(cell);
            endGame(false);
        } else {
            // Successful hit
            revealDiamond(cell);
            gameState.hits++;
            updateMultiplier();
            updateUI();
        }
    }

    // Reveal diamond
    function revealDiamond(cell) {
        cell.classList.add('revealed', 'reveal-animation');
        cell.innerHTML = '⭐';
        
        // Add hit counter
        const counter = document.createElement('div');
        counter.className = 'hit-counter';
        counter.textContent = gameState.hits + 1;
        cell.appendChild(counter);
    }

    // Reveal mine
    function revealMine(cell) {
        cell.classList.add('mine', 'shake-animation');
        cell.innerHTML = '💣';
        
        // Reveal all mines at the end
        setTimeout(() => {
            gameState.minesPositions.forEach(pos => {
                const mineCell = document.querySelector(`.cell[data-index="${pos}"]`);
                if (!gameState.revealedPositions.includes(pos)) {
                    mineCell.classList.add('mine');
                    mineCell.innerHTML = '💣';
                }
            });
        }, 500);
    }

    // Click random cell
    function clickRandomCell() {
        if (!gameState.gameActive) return;
        
        const unrevealedCells = Array.from(document.querySelectorAll('.cell'))
            .filter(cell => 
                !cell.classList.contains('revealed') && 
                !cell.classList.contains('mine') &&
                !gameState.revealedPositions.includes(parseInt(cell.dataset.index))
            );
        
        if (unrevealedCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
            handleCellClick(unrevealedCells[randomIndex]);
        }
    }

    // Update multiplier
    function updateMultiplier() {
        // Get the multipliers for the current mines count
        const multipliers = multipliersConfig[gameState.minesCount] || [1.01, 1.02, 1.03];
        
        // Determine which multiplier to use based on hits
        const multiplierIndex = Math.min(gameState.hits, multipliers.length - 1);
        gameState.nextMultiplier = multipliers[multiplierIndex];
    }

    // Cash out
    function cashOut() {
        const winnings = gameState.betAmount * gameState.multiplier;
        gameState.balance += winnings;
        endGame(true);
    }

    // End game
    function endGame(won) {
        gameState.gameActive = false;
        
        if (won) {
            const winnings = gameState.betAmount * gameState.multiplier;
            showResult(`You won $${winnings.toFixed(2)}!`, true);
        } else {
            gameState.balance -= gameState.betAmount;
            showResult(`You lost $${gameState.betAmount.toFixed(2)}.`, false);
        }
        
        updateUI();
    }

    // Show result
    function showResult(message, isWin) {
        // In a real app, you might show a modal or notification here
        console.log(message);
        // For now, we'll just update the UI
    }

    // Update UI
    function updateUI() {
        playerBalance.textContent = gameState.balance.toFixed(2);
        minesCountDisplay.textContent = gameState.minesCount;
        betAmountDisplay.textContent = gameState.betAmount.toFixed(2);
        nextMultiplierDisplay.textContent = gameState.nextMultiplier.toFixed(2) + 'x';
        
        if (gameState.gameActive) {
            startGameBtn.textContent = 'CASHOUT';
            startGameBtn.onclick = function() {
                if (gameState.hits > 0) {
                    cashOut();
                }
            };
        } else {
            startGameBtn.textContent = 'APOSTA';
            startGameBtn.onclick = function() {
                startGame();
            };
        }
    }

    // Initialize game
    initGame();
});