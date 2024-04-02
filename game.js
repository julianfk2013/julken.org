// Initialize score variable
let score = 0;

// Function to increment score
function increaseScore() {
    score++;
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
});

// Initial update to set score display on load
updateScoreDisplay();
