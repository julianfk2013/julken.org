// Initialize score variable
let score = 0;

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
    console.log("Key pressed:", event.code); // Log the code of the pressed key

    // Check if the spacebar was pressed
    if (event.code === 'Space') {
        increaseScore();
    }
    // Check if the 'J' key was pressed
    else if (event.code === 'KeyJ') {
        increaseScoreBy100();
    }
});

// Initial update to set score display on load
updateScoreDisplay();
