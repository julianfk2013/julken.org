// Initialize score variable
let score = 0;

// Function to increment score
function increaseScore() {
    score++;
    updateScoreDisplay();
}

// Function to increase score by 100 (secret feature)
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
    // Check if the spacebar was pressed
    if (event.code === 'Space') {
        increaseScore();
    }
    // Check if the 'J' key was pressed (secret feature)
    if (event.code === 'KeyJ') {
        increaseScoreBy100();
    }
});

// Initial update to set score display on load
updateScoreDisplay();
