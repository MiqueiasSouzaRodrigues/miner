document.addEventListener('DOMContentLoaded', function() {
    // Game configuration
    const config = {
        mineManipulationLevel: 'mild', // 'none', 'mild', or 'high'
        minHitsForCashout: 2,
        betSteps: {
            small: 1,
            large: 10,
            threshold: 5
        }
    };

    // Game state
    const gameState = {
        balance: 100.00,
        betAmount: 1.00,
        minesCount: 3,
        actualMinesCount: 3,
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
    const autoBtn = document.getElementById('auto-btn');
    const betAmountDisplay = document.getElementById('bet-amount-display');
    const minesCountDisplay = document.getElementById('mines-count-display');
    const currentMultiplierDisplay = document.getElementById('current-multiplier');
    const startGameBtn = document.getElementById('start-game');
    const decreaseBetBtn = document.getElementById('decrease-bet');
    const increaseBetBtn = document.getElementById('increase-bet');
    const minesSelector = document.getElementById('mines-selector');
    const notification = document.getElementById('notification');

    // Calculate actual mines count based on manipulation level
    function calculateActualMines(selectedMines) {
        switch(config.mineManipulationLevel) {
            case 'mild': return selectedMines + 3;
            case 'high': return selectedMines * 2;
            default: return selectedMines;
        }
    }

    // Calculate multiplier based on hits and selected mines
    function calculateMultiplier(hits, selectedMines) {
        const baseRisk = 1 + (selectedMines / 25) * 6;
        return 1 + (Math.pow(baseRisk, hits / 4.5) - 1) * 0.75;
    }

    // Initialize game
    function initGame() {
        createMineOptions();
        updateUI();
        createGrid();
        setupEventListeners();
    }

    // Create mine selection options (1-20)
    function createMineOptions() {
        minesSelector.innerHTML = '';
        for (let i = 1; i <= 20; i++) {
            const option = document.createElement('div');
            option.className = 'mine-option';
            if (i === gameState.minesCount) option.classList.add('selected');
            option.dataset.mines = i;
            option.textContent = i;
            minesSelector.appendChild(option);
        }
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

    // Show notification
    function showNotification(message, isSuccess) {
        notification.textContent = message;
        notification.className = 'notification';
        notification.style.backgroundColor = isSuccess ? 'var(--positive-btn)' : 'var(--danger)';
        notification.style.color = isSuccess ? '#000' : '#fff';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
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

        // Auto play button
        autoBtn.addEventListener('click', function() {
            if (!gameState.gameActive) return;
            
            gameState.autoPlay = !gameState.autoPlay;
            updateUI();
            
            if (gameState.autoPlay) {
                startAutoPlay();
            } else {
                stopAutoPlay();
            }
        });

        // Start game button
        startGameBtn.addEventListener('click', function() {
            if (!gameState.gameActive) {
                startGame();
            } else if (gameState.hits >= config.minHitsForCashout) {
                cashOut();
            }
        });

        // Bet amount controls
        decreaseBetBtn.addEventListener('click', function() {
            if (gameState.betAmount > config.betSteps.threshold) {
                gameState.betAmount = Math.max(config.betSteps.threshold + 1, 
                    gameState.betAmount - config.betSteps.large);
            } else {
                gameState.betAmount = Math.max(config.betSteps.small, 
                    gameState.betAmount - config.betSteps.small);
            }
            updateUI();
        });

        increaseBetBtn.addEventListener('click', function() {
            if (gameState.betAmount >= config.betSteps.threshold) {
                gameState.betAmount = Math.min(100, 
                    gameState.betAmount + config.betSteps.large);
            } else {
                gameState.betAmount = Math.min(config.betSteps.threshold, 
                    gameState.betAmount + config.betSteps.small);
            }
            updateUI();
        });

        // Mine selection
        minesSelector.addEventListener('click', function(e) {
            if (e.target.classList.contains('mine-option')) {
                document.querySelectorAll('.mine-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                e.target.classList.add('selected');
                gameState.minesCount = parseInt(e.target.dataset.mines);
                gameState.actualMinesCount = calculateActualMines(gameState.minesCount);
                updateUI();
            }
        });
    }

    // Start new game
    function startGame() {
        // Check if player has enough balance
        if (gameState.balance < gameState.betAmount) {
            showNotification("Saldo insuficiente!", false);
            return;
        }

        // Reset game state
        gameState.hits = 0;
        gameState.multiplier = 1.0;
        gameState.revealedPositions = [];
        gameState.gameActive = true;
        gameState.autoPlay = false;
        stopAutoPlay();
        
        // Generate mines positions (using actual mines count)
        gameState.minesPositions = [];
        while (gameState.minesPositions.length < gameState.actualMinesCount) {
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
            gameState.multiplier = calculateMultiplier(gameState.hits, gameState.minesCount);
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

    // Reveal mine (only show the selected number of mines)
    function revealMine(cell) {
        cell.classList.add('mine', 'shake-animation');
        cell.innerHTML = '💣';
        
        // After 1.5 seconds, reveal only the selected number of mines
        setTimeout(() => {
            // First show the triggering mine
            const visibleMines = [cell.dataset.index];
            
            // Add random mines until we reach the selected count
            const remainingMines = gameState.minesPositions.filter(
                pos => !visibleMines.includes(pos.toString())
            );
            
            while (visibleMines.length < gameState.minesCount && remainingMines.length > 0) {
                const randomIndex = Math.floor(Math.random() * remainingMines.length);
                visibleMines.push(remainingMines[randomIndex].toString());
                remainingMines.splice(randomIndex, 1);
            }
            
            // Reveal the selected mines
            visibleMines.forEach(pos => {
                const mineCell = document.querySelector(`.cell[data-index="${pos}"]`);
                if (!mineCell.classList.contains('mine')) {
                    mineCell.classList.add('mine');
                    mineCell.innerHTML = '💣';
                }
            });
            
            // After another 0.5s, reveal all diamonds
            setTimeout(() => {
                for (let i = 0; i < gameState.gridSize; i++) {
                    if (!gameState.minesPositions.includes(i) && !gameState.revealedPositions.includes(i)) {
                        const cell = document.querySelector(`.cell[data-index="${i}"]`);
                        cell.classList.add('revealed');
                        cell.innerHTML = '⭐';
                    }
                }
            }, 500);
        }, 1500);
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
        autoBtn.classList.add('btn-danger');
        autoBtn.classList.remove('btn-positive');
        autoBtn.textContent = 'PARAR Auto';
        
        gameState.autoPlayInterval = setInterval(() => {
            if (gameState.gameActive && gameState.autoPlay) {
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
        
        gameState.autoPlay = false;
        autoBtn.classList.remove('btn-danger');
        autoBtn.classList.add('btn-positive');
        autoBtn.textContent = 'Auto jogo';
    }

    // Cash out
    function cashOut() {
        const winnings = gameState.betAmount * gameState.multiplier;
        gameState.balance += winnings;
        showNotification(`Você ganhou $${winnings.toFixed(2)}!`, true);
        endGame(true);
    }

    // End game
    function endGame(won) {
        gameState.gameActive = false;
        stopAutoPlay();
        
        if (!won) {
            gameState.balance -= gameState.betAmount;
            showNotification(`Você perdeu $${gameState.betAmount.toFixed(2)}.`, false);
        }
        
        updateUI();
    }

    // Update UI
    function updateUI() {
        playerBalance.textContent = gameState.balance.toFixed(2);
        minesCountDisplay.textContent = gameState.minesCount;
        betAmountDisplay.textContent = gameState.betAmount.toFixed(2);
        currentMultiplierDisplay.textContent = gameState.multiplier.toFixed(2) + 'x';
        
        if (gameState.gameActive) {
            startGameBtn.textContent = gameState.hits >= config.minHitsForCashout ? 
                `CASHOUT $${(gameState.betAmount * gameState.multiplier).toFixed(2)}` : 
                `Continue (${config.minHitsForCashout - gameState.hits} more)`;
            startGameBtn.disabled = gameState.hits < config.minHitsForCashout;
            randomBtn.disabled = false;
        } else {
            startGameBtn.textContent = 'APOSTA';
            startGameBtn.disabled = false;
            randomBtn.disabled = true;
        }
    }

    // Initialize game
    initGame();
});
