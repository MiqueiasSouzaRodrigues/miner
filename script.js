        // Game State
        const gameState = {
            coins: 1000,
            currentBet: 0,
            multiplier: 1.0,
            explosionChance: 0,
            maxExplosionChance: 100,
            gameActive: false,
            blocksDug: 0,
            streak: 0,
            lastPlayedDate: null
        };

        // DOM Elements
        const startScreen = document.getElementById('start-screen');
        const bettingScreen = document.getElementById('betting-screen');
        const miningScreen = document.getElementById('mining-screen');
        const resultScreen = document.getElementById('result-screen');
        const playBtn = document.getElementById('play-btn');
        const betAmountBtns = document.querySelectorAll('.bet-amount-btn');
        const startDiggingBtn = document.getElementById('start-digging-btn');
        const digBtn = document.getElementById('dig-btn');
        const cashOutBtn = document.getElementById('cash-out-btn');
        const playAgainBtn = document.getElementById('play-again-btn');
        const backBtn = document.getElementById('back-btn');
        const mineShaft = document.getElementById('mine-shaft');
        const multiplierDisplay = document.getElementById('multiplier-display');
        const nextMultiplierDisplay = document.getElementById('next-multiplier');
        const riskBar = document.getElementById('risk-bar');
        const riskBarContainer = document.getElementById('risk-bar-container');
        const resultMessage = document.getElementById('result-message');
        const resultEarnings = document.getElementById('result-earnings');
        const resultBonus = document.getElementById('result-bonus');
        const streakCounter = document.getElementById('streak-counter');
        const coinBalanceElements = document.querySelectorAll('.coin-balance');
        const dailyPopup = document.getElementById('daily-popup');
        const closePopupBtn = document.querySelector('.close-popup');

        // Initialize game
        function initGame() {
            // Load saved game state
            const savedState = localStorage.getItem('deepGoldSave');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                gameState.coins = parsed.coins || 1000;
                gameState.lastPlayedDate = parsed.lastPlayedDate;
            }

            updateCoinDisplay();
            setupEventListeners();
            createDustParticles();
            checkDailyReward();
        }

        function setupEventListeners() {
            playBtn.addEventListener('click', showBettingScreen);
            startDiggingBtn.addEventListener('click', startGame);
            digBtn.addEventListener('click', dig);
            cashOutBtn.addEventListener('click', cashOut);
            playAgainBtn.addEventListener('click', resetGame);
            backBtn.addEventListener('click', () => {
                resultScreen.style.display = 'none';
                showBettingScreen();
            });
            closePopupBtn.addEventListener('click', claimDailyReward);

            // Set up bet amount buttons
            betAmountBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    betAmountBtns.forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    gameState.currentBet = parseInt(btn.dataset.amount);
                });
            });
        }

        // Create ambient dust particles
        function createDustParticles() {
            const container = document.getElementById('game-container');
            for (let i = 0; i < 30; i++) {
                const particle = document.createElement('div');
                particle.className = 'dust-particle';
                
                // Random size
                const size = Math.random() * 3 + 1;
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                
                // Random position
                particle.style.left = `${Math.random() * 100}%`;
                particle.style.top = `${Math.random() * 100}%`;
                
                // Random animation
                const duration = Math.random() * 20 + 10;
                const delay = Math.random() * 5;
                particle.style.animation = `float ${duration}s ${delay}s infinite linear`;
                
                container.appendChild(particle);
            }
        }

        // Check for daily reward
        function checkDailyReward() {
            const today = new Date().toDateString();
            if (gameState.lastPlayedDate !== today) {
                setTimeout(() => {
                    dailyPopup.style.display = 'flex';
                }, 1000);
            }
        }

        // Claim daily reward
        function claimDailyReward() {
            const today = new Date().toDateString();
            gameState.lastPlayedDate = today;
            gameState.coins += 200; // Give day 3 reward for demo
            updateCoinDisplay();
            saveGameState();
            dailyPopup.style.display = 'none';
            
            // Show reward animation
            spawnCoins(20);
        }

        // Update coin display
        function updateCoinDisplay() {
            coinBalanceElements.forEach(el => {
                el.textContent = gameState.coins;
            });
        }

        // Show betting screen
        function showBettingScreen() {
            startScreen.style.display = 'none';
            bettingScreen.style.display = 'flex';
            resultScreen.style.display = 'none';
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
            bettingScreen.style.display = 'none';
            miningScreen.style.display = 'flex';
            gameState.gameActive = true;
            
            // Reset streak if it's a new game
            if (gameState.blocksDug === 0) {
                gameState.streak = 0;
                streakCounter.style.display = 'none';
            }
            
            saveGameState();
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
            block.className = 'block coin';
            block.innerHTML = '💰';
            mineShaft.insertBefore(block, mineShaft.firstChild);

            // Apply block animation
            setTimeout(() => {
                block.classList.add('coin-burst');
                spawnCoins(3); // Small coin particles
            }, 100);

            // Update game state
            gameState.blocksDug++;
            gameState.streak++;
            
            // Update streak counter
            if (gameState.streak > 1) {
                streakCounter.textContent = `Streak: ${gameState.streak}`;
                streakCounter.style.display = 'block';
            }
            
            // Calculate multiplier increase with slight randomness
            const multiplierIncrease = 0.2 + (Math.random() * 0.3);
            gameState.multiplier += multiplierIncrease;
            
            // Increase risk more aggressively as multiplier grows
            const riskIncrease = 5 + (Math.random() * 5) + (gameState.multiplier * 0.5);
            gameState.explosionChance += riskIncrease;

            // Ensure values don't exceed limits
            if (gameState.explosionChance > gameState.maxExplosionChance) {
                gameState.explosionChance = gameState.maxExplosionChance;
            }

            // Add heartbeat effect to risk bar when danger is high
            if (gameState.explosionChance > 70) {
                riskBarContainer.classList.add('high-risk');
            } else {
                riskBarContainer.classList.remove('high-risk');
            }

            updateMultiplierDisplay();
            updateRiskBar();

            // Simulate sound
            playSound('dig');
        }

        // Cash out
        function cashOut() {
            if (!gameState.gameActive) return;

            // Calculate base winnings
            let winnings = Math.floor(gameState.currentBet * gameState.multiplier);
            
            // Apply streak bonus (10% per streak after 3)
            let streakBonus = 0;
            if (gameState.streak >= 3) {
                streakBonus = Math.floor(winnings * (gameState.streak - 2) * 0.1);
                winnings += streakBonus;
            }
            
            gameState.coins += winnings;
            updateCoinDisplay();
            gameState.gameActive = false;

            // Show result screen
            miningScreen.style.display = 'none';
            resultScreen.style.display = 'flex';
            resultScreen.className = 'screen result-win';
            resultMessage.textContent = 'Success!';
            resultEarnings.textContent = `+${winnings} coins (x${gameState.multiplier.toFixed(1)})`;
            
            // Show streak bonus if applicable
            if (streakBonus > 0) {
                resultBonus.textContent = `+${streakBonus} streak bonus!`;
                setTimeout(() => {
                    resultBonus.style.opacity = '1';
                    resultBonus.style.transform = 'translateY(0)';
                }, 300);
            }
            
            // Big coin burst animation
            spawnCoins(15);
            
            // Simulate sound
            playSound('coin');
            
            saveGameState();
        }

        // Explode
        function explode() {
            gameState.gameActive = false;
            gameState.streak = 0;

            // Add explosion block
            const block = document.createElement('div');
            block.className = 'block bomb explosion';
            block.innerHTML = '💥';
            mineShaft.insertBefore(block, mineShaft.firstChild);

            // Shake screen
            shakeScreen();
            
            // Show result screen
            setTimeout(() => {
                miningScreen.style.display = 'none';
                resultScreen.style.display = 'flex';
                resultScreen.className = 'screen result-lose';
                resultMessage.textContent = 'BOOM!';
                resultEarnings.textContent = 'You lost everything!';
            }, 500);
            
            // Simulate sound
            playSound('explosion');
            
            saveGameState();
        }

        // Reset game
        function resetGame() {
            resultScreen.style.display = 'none';
            resultBonus.style.opacity = '0';
            resultBonus.style.transform = 'translateY(20px)';
            showBettingScreen();
        }

        // Update multiplier display
        function updateMultiplierDisplay() {
            multiplierDisplay.textContent = `x${gameState.multiplier.toFixed(1)}`;
            
            // Show next potential multiplier
            const nextMultiplier = gameState.multiplier + 0.2 + (Math.random() * 0.3);
            nextMultiplierDisplay.textContent = `Next: x${nextMultiplier.toFixed(1)}`;
        }

        // Update risk bar smoothly
        function updateRiskBar() {
            const targetWidth = gameState.explosionChance;
            const currentWidth = parseFloat(riskBar.style.width) || 0;
            
            // Smooth animation
            const animate = () => {
                const diff = targetWidth - currentWidth;
                if (Math.abs(diff) > 0.5) {
                    riskBar.style.width = `${currentWidth + diff * 0.1}%`;
                    requestAnimationFrame(animate);
                } else {
                    riskBar.style.width = `${targetWidth}%`;
                }
            };
            
            animate();
        }

        // Create coin particles
        function spawnCoins(count) {
            const container = document.getElementById('game-container');
            
            for (let i = 0; i < count; i++) {
                const coin = document.createElement('div');
                coin.className = 'coin-particle';
                
                // Random starting position (near center)
                const startX = 50 + (Math.random() * 20 - 10);
                const startY = 50 + (Math.random() * 20 - 10);
                
                // Random movement
                const angle = Math.random() * Math.PI * 2;
                const distance = 20 + Math.random() * 30;
                const duration = 0.5 + Math.random() * 1;
                
                coin.style.left = `${startX}%`;
                coin.style.top = `${startY}%`;
                coin.style.opacity = '1';
                
                container.appendChild(coin);
                
                // Animate coin
                setTimeout(() => {
                    coin.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
                    coin.style.opacity = '0';
                    
                    // Remove after animation
                    setTimeout(() => {
                        coin.remove();
                    }, duration * 1000);
                }, 10);
            }
        }

        // Screen shake effect
        function shakeScreen() {
            const container = document.getElementById('game-container');
            container.style.transform = 'translate(0, 0)';
            
            // GSAP-like shake animation
            const keyframes = [
                { transform: 'translate(0, 0)', offset: 0 },
                { transform: 'translate(-5px, -5px)', offset: 0.1 },
                { transform: 'translate(5px, 5px)', offset: 0.2 },
                { transform: 'translate(-8px, 0)', offset: 0.3 },
                { transform: 'translate(8px, 0)', offset: 0.4 },
                { transform: 'translate(-5px, 5px)', offset: 0.5 },
                { transform: 'translate(5px, -5px)', offset: 0.6 },
                { transform: 'translate(-3px, -3px)', offset: 0.7 },
                { transform: 'translate(3px, 3px)', offset: 0.8 },
                { transform: 'translate(0, 0)', offset: 1 }
            ];
            
            container.animate(keyframes, {
                duration: 500,
                easing: 'ease-out'
            });
        }

        // Simulate sound effects
        function playSound(type) {
            // In a real implementation, use Howler.js or Web Audio API
            console.log(`Playing ${type} sound`);
            
            // For demo purposes, we'll use the SpeechSynthesis API as a fallback
            if (type === 'explosion' && window.speechSynthesis) {
                const utterance = new SpeechSynthesisUtterance('Boom!');
                utterance.volume = 0.3;
                speechSynthesis.speak(utterance);
            }
        }

        // Save game state
        function saveGameState() {
            const saveData = {
                coins: gameState.coins,
                lastPlayedDate: gameState.lastPlayedDate
            };
            localStorage.setItem('deepGoldSave', JSON.stringify(saveData));
        }

        // Start the game
        initGame();

        // Add floating animation for dust particles
        const style = document.createElement('style');
        style.textContent = `
            @keyframes float {
                0% { transform: translate(0, 0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translate(${Math.random() * 100 - 50}px, ${Math.random() * 100 - 50}px); opacity: 0; }
            }
        `;
        document.head.appendChild(style);