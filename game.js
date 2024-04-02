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
// Shop items
const shopItems = [
    { name: 'Item 1', cost: 10, cps: 100 },
    { name: 'Item 2', cost: 50, cps: 500 },
    // Add more shop items here
];

// Function to handle purchasing a shop item
function purchaseItem(itemIndex) {
    const item = shopItems[itemIndex];
    if (score >= item.cost) {
        score -= item.cost;
        updateScoreDisplay();
        increaseCps(item.cps);
    }
}

// Function to increase clicks per second (cps)
function increaseCps(cps) {
    // TODO: Implement the logic to increase cps
}

// Function to update the cps display
function updateCpsDisplay(cps) {
    document.getElementById('cps').innerText = cps;
}

// Add event listener for shop item click event
document.getElementById('shop').addEventListener('click', function(event) {
    const itemIndex = parseInt(event.target.dataset.index);
    if (!isNaN(itemIndex)) {
        purchaseItem(itemIndex);
    }
});

// Initial update to set cps display on load
updateCpsDisplay(0);