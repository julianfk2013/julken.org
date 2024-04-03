// Initialize score variable and flags for key press states
let score = 0;
let cps = 1; // Initial clicks per second
let isSpacePressed = false;
let isJPressed = false;

// Function to update the score display
function updateScoreDisplay() {
    document.getElementById('score').innerText = score;
}

// Function to update CPS display in your game's UI
function updateCpsDisplay() {
    document.getElementById('cps').innerText = cps;
}

// Function to check and update CPS based on the score
function checkScoreAndUpdateCPS() {
    if (score >= 100 && score < 500) {
        cps = 5;
    } else if (score >= 500 && score < 1000) {
        cps = 10;
    } else if (score >= 1000 && score < 1500) {
        cps = 20;
    } else if (score >= 1500) {
        cps = 30;
    }
    updateCpsDisplay(); // Update CPS display with the new value
}

// Function to increment score by 1 or 100 and update the display
function increaseScore(increment = 1) {
    score += increment;
    updateScoreDisplay();
    checkScoreAndUpdateCPS(); // Check and update CPS whenever the score increases
}

// Add event listener for keydown event
document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isSpacePressed) {
        increaseScore(); // Increment score by 1
        isSpacePressed = true;
    } else if (event.code === 'KeyJ' && !isJPressed) {
        increaseScore(100); // Increment score by 100 for 'J' key
        isJPressed = true;
    }
});

// Add event listener for keyup event to reset the flags
document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        isSpacePressed = false;
    } else if (event.code === 'KeyJ') {
        isJPressed = false;
    }
});
