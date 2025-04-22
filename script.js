document.addEventListener('DOMContentLoaded', function() {
    // Game state
    const gameState = {
        balance: 100.00,
        betAmount: 5,
        minesCount: 3,
        gridSize: 25,
        hits: 0,
        multiplier: 1.0,
        minesPositions: [],
        revealedPositions: [],
        gameActive: false,
        autoPlay: false,
        autoPlayInterval: null
    };

    // DOM elements
    const gameGrid = document.getElementById('game-grid');
    const playerBalance = document.getElementById('player-balance');
    const randomBtn = document.getElementById('random-btn');
    const cashoutBtn = document.getElementById('cashout-btn');
    const cashoutValue = document.getElementById('cashout-value');
    const betAmountInput = document.getElementById('bet-amount');
    const minesCountSelect = document.getElementById('mines-count');
    const betDisplay = document.getElementById('bet-display');
    const hitsCountDisplay = document.getElementById('hits-count');
    const minesCountDisplay = document.getElementById('mines-count-display');
    const autoToggle = document.getElementById('auto-toggle');
    const tooltip = document.querySelector('.tooltiptext');

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

        // Bet amount input
        betAmountInput.addEventListener('input', function() {
            const value = parseInt(this.value);
            if (value < 1) this.value = 1;
            if (value > 50) this.value = 50;
            gameState.betAmount = parseInt(this.value);
            betDisplay.textContent = `R$ ${gameState.betAmount}`;
        });

        // Mines count select
        minesCountSelect.addEventListener('change', function() {
            gameState.minesCount = parseInt(this.value);
            minesCountDisplay.textContent = gameState.minesCount;
        });

        // Auto play toggle
        autoToggle.addEventListener('change', function() {
            gameState.autoPlay = this.checked;
            if (gameState.autoPlay && gameState.gameActive) {
                startAutoPlay();
            } else {
                stopAutoPlay();
            }
        });
    }

    // Start new game
    function startGame() {
        // Reset game state
        gameState.hits = 0;
        gameState.multiplier = 1.0;
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
        
        // Start auto play if enabled
        if (gameState.autoPlay) {
            startAutoPlay();
        }
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
            
            // Continue auto play if enabled
            if (gameState.autoPlay && gameState.gameActive) {
                setTimeout(clickRandomCell, 800);
            }
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

    // Start auto play
    function startAutoPlay() {
        stopAutoPlay();
        gameState.autoPlayInterval = setInterval(() => {
            if (gameState.gameActive) {
                clickRandomCell();
            } else {
                stopAutoPlay();
            }
        }, 1000);
    }

    // Stop auto play
    function stopAutoPlay() {
        if (gameState.autoPlayInterval) {
            clearInterval(gameState.autoPlayInterval);
            gameState.autoPlayInterval = null;
        }
    }

    // Update multiplier
    function updateMultiplier() {
        const riskFactor = gameState.minesCount / (gameState.gridSize - gameState.revealedPositions.length);
        gameState.multiplier += (0.2 + riskFactor * 0.3) * (1 + gameState.hits * 0.1);
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
        stopAutoPlay();
        
        if (won) {
            const winnings = gameState.betAmount * gameState.multiplier;
            showResult(`You won R$ ${winnings.toFixed(2)}!`, true);
        } else {
            gameState.balance -= gameState.betAmount;
            showResult(`You lost R$ ${gameState.betAmount}.`, false);
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
        hitsCountDisplay.textContent = gameState.hits;
        minesCountDisplay.textContent = gameState.minesCount;
        
        if (gameState.gameActive && gameState.hits > 0) {
            const cashoutAmount = gameState.betAmount * gameState.multiplier;
            cashoutValue.textContent = `R$ ${cashoutAmount.toFixed(2)}`;
            tooltip.textContent = `Current multiplier: ${gameState.multiplier.toFixed(2)}x`;
            cashoutBtn.disabled = false;
        } else {
            cashoutValue.textContent = 'R$ 0';
            cashoutBtn.disabled = true;
        }
    }

    // Initialize game
    initGame();

    // Start first game
    startGame();
    // End game
function endGame(won) {
    gameState.gameActive = false;
    stopAutoPlay();

    if (won) {
        const winnings = gameState.betAmount * gameState.multiplier;
        showResult(`You won R$ ${winnings.toFixed(2)}!`, true);
    } else {
        gameState.balance -= gameState.betAmount;
        showResult(`You lost R$ ${gameState.betAmount}.`, false);
    }

    updateUI();

    // Auto-restart after short delay
    setTimeout(() => {
        startGame();
    }, 1500);
}

});