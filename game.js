let score = 0;
let cps = 1;
let isSpacePressed = false;
let isJPressed = false;

function updateScoreDisplay() {
    document.getElementById('score').innerText = score;
}

function updateCpsDisplay() {
    document.getElementById('cps').innerText = cps;
}

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
    updateCpsDisplay();
}

function increaseScore(increment = 1) {
    score += increment;
    updateScoreDisplay();
    checkScoreAndUpdateCPS();
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space' && !isSpacePressed) {
        increaseScore();
        isSpacePressed = true;
    } else if (event.code === 'KeyJ' && !isJPressed) {
        isJPressed = true;
    }
});

document.addEventListener('keyup', function(event) {
    if (event.code === 'Space') {
        isSpacePressed = false;
    } else if (event.code === 'KeyJ') {
        isJPressed = false;
    }
});
