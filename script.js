      // Game State
      const gameState = {
        coins: 1000,
        currentBet: 0,
        multiplier: 1.0,
        explosionChance: 0,
        maxExplosionChance: 100,
        gameActive: false,
        blocksDug: 0
    };

    // DOM Elements
    const startScreen = document.getElementById('start-screen');
    const bettingScreen = document.getElementById('betting-screen');
    const miningScreen = document.getElementById('mining-screen');
    const resultScreen = document.getElementById('result-screen');
    const playBtn = document.getElementById('play-btn');
    const betAmountBtns = document.querySelectorAll('.bet-btn');
    const startDiggingBtn = document.getElementById('start-digging-btn');
    const digBtn = document.getElementById('dig-btn');
    const cashOutBtn = document.getElementById('cash-out-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const backBtn = document.getElementById('back-btn');
    const mineShaft = document.getElementById('mine-shaft');
    const multiplierDisplay = document.getElementById('multiplier-display');
    const riskBar = document.getElementById('risk-bar');
    const resultMessage = document.getElementById('result-message');
    const resultEarnings = document.getElementById('result-earnings');
    const resultIcon = document.getElementById('result-icon');
    const coinBalanceElements = document.querySelectorAll('.coin-balance');

    // Initialize game
    function initGame() {
        updateCoinDisplay();
        playBtn.addEventListener('click', showBettingScreen);
        startDiggingBtn.addEventListener('click', startGame);
        digBtn.addEventListener('click', dig);
        cashOutBtn.addEventListener('click', cashOut);
        playAgainBtn.addEventListener('click', resetGame);
        backBtn.addEventListener('click', () => {
            resultScreen.classList.add('hidden');
            showBettingScreen();
        });

        // Set up bet amount buttons
        betAmountBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                betAmountBtns.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                gameState.currentBet = parseInt(btn.dataset.amount);
            });
        });
    }

    // Update coin display
    function updateCoinDisplay() {
        coinBalanceElements.forEach(el => {
            el.textContent = gameState.coins;
        });
    }

    // Show betting screen
    function showBettingScreen() {
        startScreen.classList.add('hidden');
        bettingScreen.classList.remove('hidden');
        resultScreen.classList.add('hidden');
        mineShaft.innerHTML = '';
        gameState.multiplier = 1.0;
        gameState.explosionChance = 0;
        gameState.blocksDug = 0;
        updateRiskBar();
        updateMultiplierDisplay();
    }

    // Start game
    function startGame() {
        if (gameState.currentBet <= 0) {
            alert('Please select a bet amount!');
            return;
        }

        if (gameState.currentBet > gameState.coins) {
            alert('Not enough coins!');
            return;
        }

        gameState.coins -= gameState.currentBet;
        updateCoinDisplay();
        bettingScreen.classList.add('hidden');
        miningScreen.classList.remove('hidden');
        gameState.gameActive = true;
    }

    // Dig action
    function dig() {
        if (!gameState.gameActive) return;

        // Check for explosion
        const explosionRoll = Math.random() * 100;
        if (explosionRoll < gameState.explosionChance) {
            explode();
            return;
        }

        // Add new block
        const block = document.createElement('div');
        block.className = 'mine-block coin';
        block.innerHTML = '💰';
        mineShaft.insertBefore(block, mineShaft.firstChild);

        // Create coin particles
        createCoinParticles(block);

        // Update game state
        gameState.blocksDug++;
        gameState.multiplier += 0.2 + (Math.random() * 0.3);
        gameState.explosionChance += 5 + (Math.random() * 5);

        // Ensure values don't exceed limits
        if (gameState.explosionChance > gameState.maxExplosionChance) {
            gameState.explosionChance = gameState.maxExplosionChance;
        }

        updateMultiplierDisplay();
        updateRiskBar();

        // Play sound (simulated)
        playSound('dig');
    }

    // Create coin particles animation
    function createCoinParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 5; i++) {
            const particle = document.createElement('div');
            particle.className = 'coin-particle';
            particle.innerHTML = '💰';
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 50;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            
            document.body.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // Cash out
    function cashOut() {
        if (!gameState.gameActive) return;

        const winnings = Math.floor(gameState.currentBet * gameState.multiplier);
        gameState.coins += winnings;
        updateCoinDisplay();
        gameState.gameActive = false;

        // Show result screen
        miningScreen.classList.add('hidden');
        resultScreen.classList.remove('hidden');
        resultMessage.textContent = 'VITORIA!';
        resultMessage.classList.remove('perdeu');
        resultIcon.textContent = '💰';
        resultEarnings.textContent = `Você ganhou: ${winnings} moedas (x${gameState.multiplier.toFixed(1)})`;

        // Create flying coins animation
        createFlyingCoins();

        // Play sound (simulated)
        playSound('coin');
    }

    // Create flying coins animation for victory
    function createFlyingCoins() {
        for (let i = 0; i < 10; i++) {
            const coin = document.createElement('div');
            coin.className = 'coin-particle';
            coin.innerHTML = '💰';
            coin.style.left = `${Math.random() * window.innerWidth}px`;
            coin.style.top = `${window.innerHeight}px`;
            
            // Fly to coin balance
            const balanceRect = document.querySelector('.coin-balance').getBoundingClientRect();
            const targetX = balanceRect.left + balanceRect.width / 2;
            const targetY = balanceRect.top + balanceRect.height / 2;
            
            coin.style.setProperty('--tx', `${targetX - parseFloat(coin.style.left)}px`);
            coin.style.setProperty('--ty', `${targetY - parseFloat(coin.style.top)}px`);
            coin.style.animationDuration = `${1 + Math.random()}s`;
            
            document.body.appendChild(coin);
            
            // Remove after animation
            setTimeout(() => {
                coin.remove();
            }, 2000);
        }
    }

    // Explode
    function explode() {
        gameState.gameActive = false;

        // Add explosion block
        const block = document.createElement('div');
        block.className = 'mine-block bomb';
        block.innerHTML = '💥';
        mineShaft.insertBefore(block, mineShaft.firstChild);

        // Create explosion particles
        createExplosionParticles(block);

        // Show result screen
        setTimeout(() => {
            miningScreen.classList.add('hidden');
            resultScreen.classList.remove('hidden');
            resultMessage.textContent = 'BOOM!';
            resultMessage.classList.add('perdeu');
            resultIcon.textContent = '💥';
            resultEarnings.textContent = 'Você perdeu tudo!';
        }, 500);

        // Play sound (simulated)
        playSound('explosion');
    }

    // Create explosion particles
    function createExplosionParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 10; i++) {
            const particle = document.createElement('div');
            particle.className = 'coin-particle';
            particle.innerHTML = ['💥', '🔥', '💢'][Math.floor(Math.random() * 3)];
            particle.style.left = `${centerX}px`;
            particle.style.top = `${centerY}px`;
            particle.style.fontSize = `${1 + Math.random() * 2}rem`;
            
            // Random direction and distance
            const angle = Math.random() * Math.PI * 2;
            const distance = 50 + Math.random() * 100;
            const tx = Math.cos(angle) * distance;
            const ty = Math.sin(angle) * distance;
            
            particle.style.setProperty('--tx', `${tx}px`);
            particle.style.setProperty('--ty', `${ty}px`);
            particle.style.animationDuration = `${0.5 + Math.random()}s`;
            
            document.body.appendChild(particle);
            
            // Remove after animation
            setTimeout(() => {
                particle.remove();
            }, 1000);
        }
    }

    // Reset game
    function resetGame() {
        resultScreen.classList.add('hidden');
        showBettingScreen();
    }

    // Update multiplier display
    function updateMultiplierDisplay() {
        multiplierDisplay.textContent = `x${gameState.multiplier.toFixed(1)}`;
    }

    // Update risk bar
    function updateRiskBar() {
        riskBar.style.width = `${gameState.explosionChance}%`;
    }

    // Simulate sound effects
    function playSound(type) {
        // In a real implementation, you would use the Web Audio API or preloaded audio files
        console.log(`Playing ${type} sound`);
    }

    // Start the game
    initGame();