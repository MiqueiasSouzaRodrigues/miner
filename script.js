document.addEventListener('DOMContentLoaded', function() {
    const gameState = {
        balance: 100.00,
        betAmount: 1.00,
        minesCount: 3,
        gridSize: 25,
        hits: 0,
        multiplier: 1.0,
        minesPositions: [],
        allMinesPositions: [],
        revealedPositions: [],
        gameActive: false,
        autoPlay: false,
        autoPlayInterval: null,
        betStep: 1.00
    };

    function getMultiplier(hits, minesCount) {
        const baseRisk = 1 + (minesCount / 25) * 5;
        return 1 + (Math.pow(baseRisk, hits / 5) - 1) * 0.8;
    }

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

    function initGame() {
        createMineOptions();
        updateUI();
        createGrid();
        setupEventListeners();
    }

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

    function createGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < gameState.gridSize; i++) {
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.dataset.index = i;
            gameGrid.appendChild(cell);
        }
    }

    function showNotification(message, isSuccess) {
        notification.textContent = message;
        notification.className = 'notification';
        notification.style.backgroundColor = isSuccess ? 'var(--positive-btn)' : 'var(--danger)';
        notification.style.color = isSuccess ? '#000' : '#fff';
        notification.classList.add('show');
        setTimeout(() => notification.classList.remove('show'), 3000);
    }

    function setupEventListeners() {
        gameGrid.addEventListener('click', function(e) {
            if (e.target.classList.contains('cell') && !e.target.classList.contains('revealed') && 
                !e.target.classList.contains('mine') && gameState.gameActive) {
                handleCellClick(e.target);
            }
        });

        randomBtn.addEventListener('click', () => {
            if (gameState.gameActive) clickRandomCell();
        });

        autoBtn.addEventListener('click', () => {
            if (!gameState.gameActive) return;
            gameState.autoPlay = !gameState.autoPlay;
            updateUI();
            gameState.autoPlay ? startAutoPlay() : stopAutoPlay();
        });

        startGameBtn.addEventListener('click', () => {
            if (!gameState.gameActive) startGame();
            else if (gameState.hits > 0) cashOut();
        });

        decreaseBetBtn.addEventListener('click', () => {
            gameState.betAmount = gameState.betAmount > 5 ? Math.max(10, gameState.betAmount - 10) : Math.max(1, gameState.betAmount - 1);
            updateUI();
        });

        increaseBetBtn.addEventListener('click', () => {
            gameState.betAmount = gameState.betAmount >= 5 ? Math.min(100, gameState.betAmount + 10) : Math.min(5, gameState.betAmount + 1);
            updateUI();
        });

        minesSelector.addEventListener('click', function(e) {
            if (e.target.classList.contains('mine-option')) {
                document.querySelectorAll('.mine-option').forEach(opt => opt.classList.remove('selected'));
                e.target.classList.add('selected');
                gameState.minesCount = parseInt(e.target.dataset.mines);
                updateUI();
            }
        });
    }

    function startGame() {
        if (gameState.balance < gameState.betAmount) {
            showNotification("Saldo insuficiente!", false);
            return;
        }

        gameState.hits = 0;
        gameState.multiplier = 1.0;
        gameState.revealedPositions = [];
        gameState.gameActive = true;
        gameState.autoPlay = false;
        stopAutoPlay();

        const realMinesCount = Math.min(gameState.gridSize - 1, gameState.minesCount * 2);
        gameState.allMinesPositions = [];
        while (gameState.allMinesPositions.length < realMinesCount) {
            const randomPos = Math.floor(Math.random() * gameState.gridSize);
            if (!gameState.allMinesPositions.includes(randomPos)) {
                gameState.allMinesPositions.push(randomPos);
            }
        }

        gameState.minesPositions = [...gameState.allMinesPositions.slice(0, gameState.minesCount)];

        updateUI();
        createGrid();
    }

    function handleCellClick(cell) {
        const index = parseInt(cell.dataset.index);
        gameState.revealedPositions.push(index);

        if (gameState.allMinesPositions.includes(index)) {
            revealMine(cell);
            endGame(false);
        } else {
            revealDiamond(cell);
            gameState.hits++;
            gameState.multiplier = getMultiplier(gameState.hits, gameState.minesCount);
            updateUI();
            if (gameState.autoPlay && gameState.gameActive) setTimeout(clickRandomCell, 800);
        }
    }

    function revealDiamond(cell) {
        cell.classList.add('revealed', 'reveal-animation');
        cell.innerHTML = '⭐';
        const counter = document.createElement('div');
        counter.className = 'hit-counter';
        counter.textContent = gameState.hits + 1;
        cell.appendChild(counter);
    }

    function revealMine(cell) {
        cell.classList.add('mine', 'shake-animation');
        cell.innerHTML = '💣';

        setTimeout(() => {
            gameState.minesPositions.forEach(pos => {
                const mineCell = document.querySelector(`.cell[data-index="${pos}"]`);
                if (!gameState.revealedPositions.includes(pos)) {
                    mineCell.classList.add('mine');
                    mineCell.innerHTML = '💣';
                }
            });

            setTimeout(() => {
                for (let i = 0; i < gameState.gridSize; i++) {
                    if (!gameState.allMinesPositions.includes(i) && !gameState.revealedPositions.includes(i)) {
                        const cell = document.querySelector(`.cell[data-index="${i}"]`);
                        cell.classList.add('revealed');
                        cell.innerHTML = '⭐';
                    }
                }
            }, 500);
        }, 1500);
    }

    function clickRandomCell() {
        if (!gameState.gameActive) return;
        const unrevealedCells = Array.from(document.querySelectorAll('.cell')).filter(cell =>
            !cell.classList.contains('revealed') &&
            !cell.classList.contains('mine') &&
            !gameState.revealedPositions.includes(parseInt(cell.dataset.index))
        );
        if (unrevealedCells.length > 0) {
            const randomIndex = Math.floor(Math.random() * unrevealedCells.length);
            handleCellClick(unrevealedCells[randomIndex]);
        }
    }

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

    function stopAutoPlay() {
        if (gameState.autoPlayInterval) clearInterval(gameState.autoPlayInterval);
        gameState.autoPlay = false;
        autoBtn.classList.remove('btn-danger');
        autoBtn.classList.add('btn-positive');
        autoBtn.textContent = 'Auto jogo';
    }

    function cashOut() {
        const winnings = gameState.betAmount * gameState.multiplier;
        gameState.balance += winnings;
        showNotification(`Você ganhou $${winnings.toFixed(2)}!`, true);
        endGame(true);
    }

    function endGame(won) {
        gameState.gameActive = false;
        stopAutoPlay();
        if (!won) {
            gameState.balance -= gameState.betAmount;
            showNotification(`Você perdeu $${gameState.betAmount.toFixed(2)}.`, false);
        }
        updateUI();
    }

    function updateUI() {
        playerBalance.textContent = gameState.balance.toFixed(2);
        minesCountDisplay.textContent = gameState.minesCount;
        betAmountDisplay.textContent = gameState.betAmount.toFixed(2);
        currentMultiplierDisplay.textContent = gameState.multiplier.toFixed(2) + 'x';

        if (gameState.gameActive) {
            startGameBtn.textContent = `CASHOUT $${(gameState.betAmount * gameState.multiplier).toFixed(2)}`;
            startGameBtn.disabled = gameState.hits === 0;
            randomBtn.disabled = false;
        } else {
            startGameBtn.textContent = 'APOSTA';
            startGameBtn.disabled = false;
            randomBtn.disabled = true;
        }
    }

    initGame();
});
