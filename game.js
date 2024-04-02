// Initialize score variable and flags for key press states
let score = 0;
let isSpacePressed = false;
let isJPressed = false;

// Function to increment score
function increaseScore() {
    score++;
    updateScoreDisplay();
}

// Function to increase score by 100 (for 'J' key)
function increaseScoreBy100() {
    score += 100;
    updateScoreDisplay();
}

// Function to update the score display
function updateScoreDisplay() {
    document.getElementById('score').innerText = score;
}

// Add event listener for keydown event
document.addEventListener('keydown', function(event) {
    // Check if the spacebar was pressed and not already processed
    if (event.code === 'Space' && !isSpacePressed) {
        increaseScore();
        isSpacePressed = true; // Mark as processed
    }
    // Check if the 'J' key was pressed and not already processed
    else if (event.code === 'KeyJ' && !isJPressed) {
        increaseScoreBy100();
        isJPressed = true; // Mark as processed
    }
});

// Add event listener for keyup event to reset the flags
document.addEventListener('keyup', function(event) {
    // Check if the spacebar was released
    if (event.code === 'Space') {
        isSpacePressed = false; // Reset flag
    }
    // Check if the 'J' key was released
    else if (event.code === 'KeyJ') {
        isJPressed = false; // Reset flag
    }
});

// Initial update to set score display on load
updateScoreDisplay();