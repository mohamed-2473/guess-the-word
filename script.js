// Game Configuration
const GAME_CONFIG = {
    maxTries: 6,
    wordLength: 6,
    maxHints: 2
};

// Word List
const WORDS = [
    "ABROAD", "COFFEE", "DELETE", "DEGREE", "ANIMAL", "HEALTH", "COLUMN", "RACING",
    "JACKET", "HACKED", "FAMOUS", "HAMMER", "MAINLY", "HANGER", "NUMBER", "BEFORE",
    "FRIEND", "BEAUTY", "STRONG", "BRIGHT", "ACTION", "REWARD", "GENIUS", "CREATE",
    "UPDATE", "MASTER", "BRANCH", "CODING", "SCHOOL", "REDUCE", "PEOPLE", "SPREAD",
    "BACKED", "GAMERS", "INDOOR", "SPRING", "RETURN", "REMOVE", "TRAVEL", "FROZEN",
    "BRIDGE", "GARDEN", "PLANET", "SILVER", "GOLDEN", "PURPLE", "ORANGE", "MARKET"
];

// Game State
let gameState = {
    currentTry: 1,
    hintsUsed: 0,
    wordToGuess: '',
    gameStartTime: null,
    gameTimer: null,
    lettersFound: 0,
    usedLetters: new Set(),
    gameOver: false
};

// DOM Elements
const elements = {
    gameBoard: document.getElementById('gameBoard'),
    checkBtn: document.getElementById('checkBtn'),
    hintBtn: document.getElementById('hintBtn'),
    newGameBtn: document.getElementById('newGameBtn'),
    currentTryDisplay: document.getElementById('currentTryDisplay'),
    hintsLeft: document.getElementById('hintsLeft'),
    lettersGuessed: document.getElementById('lettersGuessed'),
    gameTimer: document.getElementById('gameTimer'),
    gameProgress: document.getElementById('gameProgress'),
    keyButtons: document.querySelectorAll('.key-btn')
};

// Initialize Game
function initGame() {
    // Initialize AOS
    AOS.init({
        duration: 800,
        easing: 'ease-in-out',
        once: true
    });

    // Create floating particles
    createParticles();

    // Reset game state
    resetGameState();

    // Generate game board
    generateGameBoard();

    // Set up event listeners
    setupEventListeners();

    // Start timer
    startGameTimer();

    console.log('Game initialized. Word to guess:', gameState.wordToGuess);
}

function resetGameState() {
    gameState = {
        currentTry: 1,
        hintsUsed: 0,
        wordToGuess: WORDS[Math.floor(Math.random() * WORDS.length)],
        gameStartTime: new Date(),
        gameTimer: null,
        lettersFound: 0,
        usedLetters: new Set(),
        gameOver: false
    };

    updateUI();
}

function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 15 + 's';
        particle.style.animationDuration = (Math.random() * 10 + 10) + 's';
        particlesContainer.appendChild(particle);
    }
}

function generateGameBoard() {
    elements.gameBoard.innerHTML = '';

    for (let i = 1; i <= GAME_CONFIG.maxTries; i++) {
        const row = document.createElement('div');
        row.classList.add('try-row');
        row.dataset.tryNumber = i;

        if (i === 1) {
            row.classList.add('active');
        } else {
            row.classList.add('disabled');
        }

        const label = document.createElement('div');
        label.classList.add('try-label');
        label.textContent = `Try ${i}`;
        row.appendChild(label);

        for (let j = 0; j < GAME_CONFIG.wordLength; j++) {
            const input = document.createElement('input');
            input.type = 'text';
            input.classList.add('letter-input');
            input.maxLength = 1;
            input.dataset.row = i;
            input.dataset.col = j;

            if (i !== 1) {
                input.disabled = true;
            }

            row.appendChild(input);
        }

        elements.gameBoard.appendChild(row);
    }

    // Focus first input
    const firstInput = document.querySelector('.letter-input:not([disabled])');
    if (firstInput) {
        firstInput.focus();
    }
}

function setupEventListeners() {
    // Check button
    elements.checkBtn.addEventListener('click', handleGuess);

    // Hint button
    elements.hintBtn.addEventListener('click', giveHint);

    // New game button
    elements.newGameBtn.addEventListener('click', () => {
        Swal.fire({
            title: 'Start New Game?',
            text: 'This will reset your current progress.',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#971ef7',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, start new game!',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white'
        }).then((result) => {
            if (result.isConfirmed) {
                location.reload();
            }
        });
    });

    // Letter inputs
    document.addEventListener('input', handleLetterInput);
    document.addEventListener('keydown', handleKeyDown);

    // Virtual keyboard
    elements.keyButtons.forEach(btn => {
        btn.addEventListener('click', handleVirtualKey);
    });
}

function handleLetterInput(e) {
    if (!e.target.classList.contains('letter-input') || gameState.gameOver) return;

    const input = e.target;
    input.value = input.value.toUpperCase();

    // Move to next input
    const currentRow = parseInt(input.dataset.row);
    const currentCol = parseInt(input.dataset.col);

    if (input.value && currentCol < GAME_CONFIG.wordLength - 1) {
        const nextInput = document.querySelector(`input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
        if (nextInput && !nextInput.disabled) {
            nextInput.focus();
        }
    }

    // Add animation
    input.style.transform = 'scale(1.1)';
    setTimeout(() => {
        input.style.transform = 'scale(1)';
    }, 150);
}

function handleKeyDown(e) {
    if (!e.target.classList.contains('letter-input') || gameState.gameOver) return;

    const input = e.target;
    const currentRow = parseInt(input.dataset.row);
    const currentCol = parseInt(input.dataset.col);

    if (e.key === 'Backspace') {
        if (!input.value && currentCol > 0) {
            const prevInput = document.querySelector(`input[data-row="${currentRow}"][data-col="${currentCol - 1}"]`);
            if (prevInput && !prevInput.disabled) {
                prevInput.focus();
                prevInput.value = '';
            }
        }
    } else if (e.key === 'Enter') {
        e.preventDefault();
        handleGuess();
    } else if (e.key === 'ArrowLeft' && currentCol > 0) {
        const prevInput = document.querySelector(`input[data-row="${currentRow}"][data-col="${currentCol - 1}"]`);
        if (prevInput && !prevInput.disabled) {
            prevInput.focus();
        }
    } else if (e.key === 'ArrowRight' && currentCol < GAME_CONFIG.wordLength - 1) {
        const nextInput = document.querySelector(`input[data-row="${currentRow}"][data-col="${currentCol + 1}"]`);
        if (nextInput && !nextInput.disabled) {
            nextInput.focus();
        }
    }
}

function handleVirtualKey(e) {
    if (gameState.gameOver) return;

    const key = e.target.dataset.key || e.target.closest('.key-btn').dataset.key;
    const activeInput = document.querySelector(`input[data-row="${gameState.currentTry}"]:not([disabled]):not([value]):first-of-type`) ||
        document.querySelector(`input[data-row="${gameState.currentTry}"]:focus`);

    if (!activeInput) return;

    if (key === 'BACKSPACE') {
        if (activeInput.value) {
            activeInput.value = '';
        } else {
            const currentCol = parseInt(activeInput.dataset.col);
            if (currentCol > 0) {
                const prevInput = document.querySelector(`input[data-row="${gameState.currentTry}"][data-col="${currentCol - 1}"]`);
                if (prevInput) {
                    prevInput.focus();
                    prevInput.value = '';
                }
            }
        }
    } else if (key.match(/^[A-Z]$/)) {
        // Find first empty input in current row
        const emptyInput = document.querySelector(`input[data-row="${gameState.currentTry}"]:not([disabled])[value=""], input[data-row="${gameState.currentTry}"]:not([disabled]):not([value])`);
        if (emptyInput) {
            emptyInput.value = key;
            emptyInput.dispatchEvent(new Event('input'));
        }
    }

    // Add click animation to virtual key
    e.target.style.transform = 'scale(0.95)';
    setTimeout(() => {
        e.target.style.transform = 'scale(1)';
    }, 100);
}

function handleGuess() {
    if (gameState.gameOver) return;

    const currentRowInputs = document.querySelectorAll(`input[data-row="${gameState.currentTry}"]`);
    let guess = '';

    // Collect the guess
    currentRowInputs.forEach(input => {
        guess += input.value.toUpperCase();
    });

    // Validate guess
    if (guess.length !== GAME_CONFIG.wordLength) {
        Swal.fire({
            title: 'Incomplete Word!',
            text: `Please enter all ${GAME_CONFIG.wordLength} letters.`,
            icon: 'warning',
            timer: 2000,
            showConfirmButton: false,
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white'
        });
        return;
    }

    // Disable check button temporarily
    elements.checkBtn.disabled = true;
    elements.checkBtn.innerHTML = '<span class="loading-spinner"></span> Checking...';

    // Animate guess checking
    setTimeout(() => {
        checkGuess(guess, currentRowInputs);
        elements.checkBtn.disabled = false;
        elements.checkBtn.innerHTML = '<i class="fas fa-check me-2"></i>Check Word';
    }, 1000);
}

function checkGuess(guess, inputs) {
    const word = gameState.wordToGuess;
    let correctLetters = 0;
    let letterStates = [];

    // Check each letter
    inputs.forEach((input, index) => {
        const letter = guess[index];
        const correctLetter = word[index];

        gameState.usedLetters.add(letter);

        if (letter === correctLetter) {
            input.classList.add('correct');
            letterStates.push('correct');
            correctLetters++;
            updateVirtualKeyboard(letter, 'correct');
        } else if (word.includes(letter)) {
            input.classList.add('wrong-position');
            letterStates.push('wrong-position');
            updateVirtualKeyboard(letter, 'wrong-position');
        } else {
            input.classList.add('not-in-word');
            letterStates.push('not-in-word');
            updateVirtualKeyboard(letter, 'not-in-word');
        }

        // Add staggered animation
        setTimeout(() => {
            input.style.transform = 'rotateY(180deg)';
            setTimeout(() => {
                input.style.transform = 'rotateY(0deg)';
            }, 300);
        }, index * 100);
    });

    // Update game state
    gameState.lettersFound = correctLetters;
    updateUI();

    // Check win condition
    if (correctLetters === GAME_CONFIG.wordLength) {
        setTimeout(() => {
            handleGameWin();
        }, 600);
        return;
    }

    // Check lose condition
    if (gameState.currentTry >= GAME_CONFIG.maxTries) {
        setTimeout(() => {
            handleGameLose();
        }, 600);
        return;
    }

    // Move to next try
    setTimeout(() => {
        moveToNextTry();
    }, 800);
}

function updateVirtualKeyboard(letter, state) {
    const keyBtn = document.querySelector(`[data-key="${letter}"]`);
    if (keyBtn) {
        keyBtn.classList.remove('used-correct', 'used-wrong-position', 'used-not-in-word');
        keyBtn.classList.add(`used-${state.replace('-', '-')}`);
    }
}

function moveToNextTry() {
    // Disable current row
    const currentRow = document.querySelector(`[data-try-number="${gameState.currentTry}"]`);
    currentRow.classList.remove('active');
    currentRow.classList.add('disabled');

    const currentInputs = currentRow.querySelectorAll('input');
    currentInputs.forEach(input => input.disabled = true);

    // Move to next row
    gameState.currentTry++;

    const nextRow = document.querySelector(`[data-try-number="${gameState.currentTry}"]`);
    if (nextRow) {
        nextRow.classList.remove('disabled');
        nextRow.classList.add('active');

        const nextInputs = nextRow.querySelectorAll('input');
        nextInputs.forEach(input => input.disabled = false);

        // Focus first input of new row
        nextInputs[0].focus();

        // Animate row transition
        nextRow.style.transform = 'translateX(-100%)';
        setTimeout(() => {
            nextRow.style.transform = 'translateX(0)';
        }, 100);
    }

    updateUI();
}

function giveHint() {
    if (gameState.hintsUsed >= GAME_CONFIG.maxHints || gameState.gameOver) return;

    const currentInputs = document.querySelectorAll(`input[data-row="${gameState.currentTry}"]:not([disabled])`);
    const emptyInputs = Array.from(currentInputs).filter(input => !input.value);

    if (emptyInputs.length === 0) {
        Swal.fire({
            title: 'No Empty Letters!',
            text: 'All letters in this row are filled. Complete your guess or start a new row.',
            icon: 'info',
            background: 'rgba(0, 0, 0, 0.9)',
            color: 'white'
        });
        return;
    }

    // Select random empty input
    const randomInput = emptyInputs[Math.floor(Math.random() * emptyInputs.length)];
    const columnIndex = parseInt(randomInput.dataset.col);
    const hintLetter = gameState.wordToGuess[columnIndex];

    // Add hint animation
    randomInput.style.background = 'linear-gradient(45deg, #971ef7, #33dfff)';
    randomInput.style.color = 'white';
    randomInput.style.transform = 'scale(1.2)';
    randomInput.value = hintLetter;

    setTimeout(() => {
        randomInput.style.background = '';
        randomInput.style.color = '#333';
        randomInput.style.transform = 'scale(1)';
    }, 1000);

    gameState.hintsUsed++;
    updateUI();

    // Show hint notification
    Swal.fire({
        title: 'Hint Used!',
        text: `Letter "${hintLetter}" revealed in position ${columnIndex + 1}`,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false,
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
    });
}

function handleGameWin() {
    gameState.gameOver = true;
    clearInterval(gameState.gameTimer);

    // Add celebration animation
    document.querySelector('.game-title').classList.add('celebration');

    // Disable all inputs and buttons
    document.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.checkBtn.disabled = true;
    elements.hintBtn.disabled = true;

    const timeElapsed = formatTime(Math.floor((new Date() - gameState.gameStartTime) / 1000));

    Swal.fire({
        title: '🎉 Congratulations!',
        html: `
                    <div class="text-center">
                        <h4>You guessed the word!</h4>
                        <p class="fs-2 fw-bold text-primary">${gameState.wordToGuess}</p>
                        <div class="row mt-3">
                            <div class="col-6">
                                <strong>Tries Used:</strong><br>
                                ${gameState.currentTry} / ${GAME_CONFIG.maxTries}
                            </div>
                            <div class="col-6">
                                <strong>Time:</strong><br>
                                ${timeElapsed}
                            </div>
                        </div>
                        <div class="row mt-2">
                            <div class="col-6">
                                <strong>Hints Used:</strong><br>
                                ${gameState.hintsUsed} / ${GAME_CONFIG.maxHints}
                            </div>
                            <div class="col-6">
                                <strong>Score:</strong><br>
                                ${calculateScore()}
                            </div>
                        </div>
                    </div>
                `,
        icon: 'success',
        confirmButtonText: 'Play Again',
        confirmButtonColor: '#971ef7',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload();
        }
    });
}

function handleGameLose() {
    gameState.gameOver = true;
    clearInterval(gameState.gameTimer);

    // Disable all inputs and buttons
    document.querySelectorAll('input').forEach(input => input.disabled = true);
    elements.checkBtn.disabled = true;
    elements.hintBtn.disabled = true;

    // Reveal the word with animation
    const wordReveal = gameState.wordToGuess.split('').map((letter, index) =>
        `<span style="animation: bounce-in ${0.1 * (index + 1)}s ease-out forwards; opacity: 0;">${letter}</span>`
    ).join('');

    Swal.fire({
        title: '😔 Game Over',
        html: `
                    <div class="text-center">
                        <p>Better luck next time!</p>
                        <h4>The word was:</h4>
                        <p class="fs-1 fw-bold text-warning">${wordReveal}</p>
                        <p class="mt-3">You used ${gameState.currentTry} out of ${GAME_CONFIG.maxTries} tries.</p>
                    </div>
                    <style>
                        @keyframes bounce-in {
                            0% { opacity: 0; transform: scale(0); }
                            50% { transform: scale(1.2); }
                            100% { opacity: 1; transform: scale(1); }
                        }
                    </style>
                `,
        icon: 'error',
        confirmButtonText: 'Try Again',
        confirmButtonColor: '#971ef7',
        background: 'rgba(0, 0, 0, 0.9)',
        color: 'white'
    }).then((result) => {
        if (result.isConfirmed) {
            location.reload();
        }
    });
}

function calculateScore() {
    const baseScore = 1000;
    const tryPenalty = (gameState.currentTry - 1) * 100;
    const hintPenalty = gameState.hintsUsed * 150;
    const timeBonus = Math.max(0, 300 - Math.floor((new Date() - gameState.gameStartTime) / 1000));

    return Math.max(100, baseScore - tryPenalty - hintPenalty + timeBonus);
}

function startGameTimer() {
    gameState.gameTimer = setInterval(() => {
        if (!gameState.gameOver) {
            const elapsed = Math.floor((new Date() - gameState.gameStartTime) / 1000);
            elements.gameTimer.textContent = formatTime(elapsed);
        }
    }, 1000);
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateUI() {
    elements.currentTryDisplay.textContent = gameState.currentTry;
    elements.hintsLeft.textContent = GAME_CONFIG.maxHints - gameState.hintsUsed;
    elements.lettersGuessed.textContent = gameState.lettersFound;

    // Update progress bar
    const progress = (gameState.currentTry / GAME_CONFIG.maxTries) * 100;
    elements.gameProgress.style.width = `${Math.min(progress, 100)}%`;

    // Update hint button
    if (gameState.hintsUsed >= GAME_CONFIG.maxHints) {
        elements.hintBtn.disabled = true;
        elements.hintBtn.innerHTML = '<i class="fas fa-lightbulb me-2"></i>No Hints Left';
    }
}

// Initialize the game when DOM is loaded
document.addEventListener('DOMContentLoaded', initGame);

// Add some extra visual effects
document.addEventListener('mousemove', (e) => {
    const cursor = document.createElement('div');
    cursor.style.position = 'fixed';
    cursor.style.width = '10px';
    cursor.style.height = '10px';
    cursor.style.borderRadius = '50%';
    cursor.style.background = 'rgba(51, 223, 255, 0.3)';
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
    cursor.style.pointerEvents = 'none';
    cursor.style.zIndex = '9999';
    cursor.style.transition = 'all 0.3s ease';

    document.body.appendChild(cursor);

    setTimeout(() => {
        cursor.style.opacity = '0';
        cursor.style.transform = 'scale(2)';
        setTimeout(() => {
            document.body.removeChild(cursor);
        }, 300);
    }, 100);
});

// Add keyboard sound effects simulation
document.addEventListener('keydown', (e) => {
    if (e.target.classList.contains('letter-input') && e.key.match(/^[a-zA-Z]$/)) {
        // Create a visual feedback for typing
        const ripple = document.createElement('div');
        ripple.style.position = 'absolute';
        ripple.style.width = '20px';
        ripple.style.height = '20px';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(151, 30, 247, 0.3)';
        ripple.style.left = '50%';
        ripple.style.top = '50%';
        ripple.style.transform = 'translate(-50%, -50%) scale(0)';
        ripple.style.pointerEvents = 'none';
        ripple.style.transition = 'all 0.3s ease';

        e.target.style.position = 'relative';
        e.target.appendChild(ripple);

        setTimeout(() => {
            ripple.style.transform = 'translate(-50%, -50%) scale(3)';
            ripple.style.opacity = '0';
            setTimeout(() => {
                if (ripple.parentNode) {
                    ripple.parentNode.removeChild(ripple);
                }
            }, 300);
        }, 10);
    }
});