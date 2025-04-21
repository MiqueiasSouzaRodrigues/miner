document.addEventListener('DOMContentLoaded', function() {
    // Game state
    const gameState = {
        betAmount: 5.00,
        minesCount: 3,
        gridSize: 25,
        revealedCount: 0,
        gameActive: false,
        multiplier: 1.0,
        minesPositions: [],
        revealedPositions: []
    };

    // DOM elements
    const gameGrid = document.getElementById('game-grid');
    const currentValueDisplay = document.getElementById('current-value');
    const randomBtn = document.getElementById('random-btn');
    const cashoutBtn = document.getElementById('cashout-btn');
    const betAmountInput = document.getElementById('bet-amount');
    const minesCountInput = document.getElementById('mines-count');
    const diamondsRemainingDisplay = document.getElementById('diamonds-remaining');
    const minesRemainingDisplay = document.getElementById('mines-remaining');
    const resultModal = document.getElementById('result-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalBtn = document.getElementById('modal-btn');

    // Initialize game grid
    function initializeGrid() {
        gameGrid.innerHTML = '';
        for (let i = 0; i < gameState.gridSize; i++) {
            const block = document.createElement('div');
            block.className = 'block';
            block.dataset.index = i;
            block.addEventListener('click', handleBlockClick);
            gameGrid.appendChild(block);
        }
    }

    // Start new game
    function startNewGame() {
        gameState.betAmount = parseFloat(betAmountInput.value);
        gameState.minesCount = parseInt(minesCountInput.value);
        gameState.revealedCount = 0;
        gameState.gameActive = true;
        gameState.multiplier = 1.0;
        gameState.revealedPositions = [];
        
        // Generate mines positions
        gameState.minesPositions = [];
        while (gameState.minesPositions.length < gameState.minesCount) {
            const randomPos = Math.floor(Math.random() * gameState.gridSize);
            if (!gameState.minesPositions.includes(randomPos)) {
                gameState.minesPositions.push(randomPos);
            }
        }
        
        updateUI();
        initializeGrid();
        
        // Enable/disable buttons
        randomBtn.disabled = false;
        cashoutBtn.disabled = false;
    }

    // Handle block click
    function handleBlockClick(e) {
        if (!gameState.gameActive) return;
        
        const block = e.target;
        const index = parseInt(block.dataset.index);
        
        // Don't allow clicking already revealed blocks
        if (gameState.revealedPositions.includes(index)) return;
        
        gameState.revealedPositions.push(index);
        
        if (gameState.minesPositions.includes(index)) {
            // Clicked on a bomb
            revealBomb(block);
            endGame(false);
        } else {
            // Clicked on a diamond
            revealDiamond(block);
            updateMultiplier();
            updateUI();
        }
    }

    // Reveal diamond
    function revealDiamond(block) {
        block.classList.add('revealed', 'reveal-animation');
        block.innerHTML = '💎';
        gameState.revealedCount++;
        
        // Create star effect
        createStarEffect(block);
    }

    // Reveal bomb
    function revealBomb(block) {
        block.classList.add('bomb', 'explode-animation');
        block.innerHTML = '💣';
        
        // Reveal all bombs at the end
        setTimeout(() => {
            gameState.minesPositions.forEach(pos => {
                const bombBlock = document.querySelector(`.block[data-index="${pos}"]`);
                if (!gameState.revealedPositions.includes(pos)) {
                    bombBlock.classList.add('bomb');
                    bombBlock.innerHTML = '💣';
                }
            });
        }, 500);
    }

    // Create star effect
    function createStarEffect(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            const star = document.createElement('div');
            star.className = 'star';
            
            // Random position around the center
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 20;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            star.style.left = `${x}px`;
            star.style.top = `${y}px`;
            
            document.body.appendChild(star);
            
            // Remove star after animation
            setTimeout(() => {
                star.remove();
            }, 1000);
        }
    }

    // Update multiplier
    function updateMultiplier() {
        const remainingDiamonds = gameState.gridSize - gameState.minesCount - gameState.revealedCount;
        const riskFactor = gameState.minesCount / (gameState.gridSize - gameState.revealedCount);
        gameState.multiplier += 0.25 * riskFactor;
    }

    // Update UI
    function updateUI() {
        currentValueDisplay.textContent = `R$ ${(gameState.betAmount * gameState.multiplier).toFixed(2)}`;
        diamondsRemainingDisplay.textContent = gameState.gridSize - gameState.minesCount - gameState.revealedCount;
        minesRemainingDisplay.textContent = gameState.minesCount;
    }

    // End game
    function endGame(won) {
        gameState.gameActive = false;
        
        // Disable buttons
        randomBtn.disabled = true;
        cashoutBtn.disabled = true;
        
        // Show result modal
        if (won) {
            modalTitle.textContent = 'You Won!';
            modalMessage.textContent = `You cashed out and won R$ ${(gameState.betAmount * gameState.multiplier).toFixed(2)}!`;
        } else {
            modalTitle.textContent = 'Game Over!';
            modalMessage.textContent = 'You hit a bomb and lost your bet.';
        }
        
        resultModal.style.display = 'flex';
    }

    // Random block click
    function clickRandomBlock() {
        if (!gameState.gameActive) return;
        
        const unrevealedBlocks = Array.from(document.querySelectorAll('.block'))
            .filter(block => 
                !block.classList.contains('revealed') && 
                !block.classList.contains('bomb') &&
                !gameState.revealedPositions.includes(parseInt(block.dataset.index))
            );
        
        if (unrevealedBlocks.length > 0) {
            const randomIndex = Math.floor(Math.random() * unrevealedBlocks.length);
            const event = { target: unrevealedBlocks[randomIndex] };
            handleBlockClick(event);
        }
    }

    // Cash out
    function cashOut() {
        if (!gameState.gameActive) return;
        endGame(true);
    }

    // Event listeners
    randomBtn.addEventListener('click', clickRandomBlock);
    cashoutBtn.addEventListener('click', cashOut);
    modalBtn.addEventListener('click', function() {
        resultModal.style.display = 'none';
        startNewGame();
    });

    // Initialize
    startNewGame();
});