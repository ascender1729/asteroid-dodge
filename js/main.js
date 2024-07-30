let sceneManager;

function init() {
    sceneManager = new SceneManager(document.getElementById('game-container'));
    setupEventListeners();
    animate();
}

function setupEventListeners() {
    document.getElementById('start-button').addEventListener('click', startGame);
    document.getElementById('instructions-button').addEventListener('click', showInstructions);
    document.getElementById('highscores-button').addEventListener('click', showHighScores);
    document.getElementById('back-button').addEventListener('click', showMainMenu);
    document.getElementById('back-button-scores').addEventListener('click', showMainMenu);
    document.getElementById('restart-button').addEventListener('click', restartGame);
    document.getElementById('menu-button').addEventListener('click', showMainMenu);
    document.getElementById('submit-score').addEventListener('click', submitScore);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', onWindowResize, false);
}

function startGame() {
    document.getElementById('menu').classList.add('hidden');
    sceneManager.startGame();
}

function showInstructions() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('instructions').classList.remove('hidden');
}

function showHighScores() {
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('highscores').classList.remove('hidden');
    displayHighScores();
}

function showMainMenu() {
    document.getElementById('instructions').classList.add('hidden');
    document.getElementById('highscores').classList.add('hidden');
    document.getElementById('game-over').classList.add('hidden');
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
    sceneManager.resetGame();
}

function restartGame() {
    document.getElementById('game-over').classList.add('hidden');
    sceneManager.resetGame();
    sceneManager.startGame();
}

function submitScore() {
    const playerName = document.getElementById('player-name').value;
    const score = sceneManager.getScore();
    const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    highScores.push({ name: playerName, score: score });
    highScores.sort((a, b) => b.score - a.score);
    highScores.splice(10); // Keep only top 10 scores
    localStorage.setItem('highScores', JSON.stringify(highScores));
    showHighScores();
}

function displayHighScores() {
    const highScores = JSON.parse(localStorage.getItem('highScores') || '[]');
    const list = document.getElementById('highscores-list');
    list.innerHTML = '';
    highScores.forEach((score, index) => {
        const li = document.createElement('li');
        li.textContent = `${index + 1}. ${score.name}: ${score.score}`;
        list.appendChild(li);
    });
}

function handleKeyDown(event) {
    if (event.code === 'Space') {
        sceneManager.shoot();
    }
}

function animate() {
    requestAnimationFrame(animate);
    sceneManager.update();
}

function onWindowResize() {
    sceneManager.onWindowResize();
}

window.addEventListener('load', init);