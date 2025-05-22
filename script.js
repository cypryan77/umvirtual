// 1. Canvas Setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const canvasWidth = 400;
const canvasHeight = 400;
canvas.width = canvasWidth;
canvas.height = canvasHeight;

// 2. Game Variables
const gridSize = 20; // Size of each grid cell (and snake segment/food)
const tileCount = canvas.width / gridSize; // Number of tiles in width/height

let snake = [ { x: 10, y: 10 } ]; // Snake's initial position
let food = { x: 15, y: 15 };     // Food's initial position
let velocityX = 0;
let velocityY = 0;
let score = 0;
let gameRunning = false; // Game starts in a "paused" or "ready" state

// 3. Game Initialization Function
function initializeGame() {
    snake = [ { x: 10, y: 10 } ];
    velocityX = 1; // Start moving right
    velocityY = 0;
    placeFood();
    score = 0;
    gameRunning = true;
    console.log("Game Initialized");
}

// 4. placeFood Function
function placeFood() {
    food.x = Math.floor(Math.random() * tileCount);
    food.y = Math.floor(Math.random() * tileCount);

    // Ensure food doesn't spawn on the snake
    for (let segment of snake) {
        if (segment.x === food.x && segment.y === food.y) {
            placeFood(); // Recursively call if collision
            return;
        }
    }
    console.log("Food placed at:", food.x, food.y);
}

// 5. Event Listener for Keyboard Input
document.addEventListener('keydown', (event) => {
    if (!gameRunning && (event.key === 'Enter' || event.key === ' ')) {
        initializeGame();
        gameLoop(); // Start the loop after initialization
        return;
    }

    if (!gameRunning) return;

    switch (event.key) {
        case 'ArrowUp':
            if (velocityY === 0) { // Prevent immediate reversal
                velocityX = 0;
                velocityY = -1;
            }
            break;
        case 'ArrowDown':
            if (velocityY === 0) {
                velocityX = 0;
                velocityY = 1;
            }
            break;
        case 'ArrowLeft':
            if (velocityX === 0) {
                velocityX = -1;
                velocityY = 0;
            }
            break;
        case 'ArrowRight':
            if (velocityX === 0) {
                velocityX = 1;
                velocityY = 0;
            }
            break;
    }
});

// 6. Main Game Loop Function
function gameLoop() {
    if (!gameRunning) {
        ctx.fillStyle = 'white';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Game Over!', canvas.width / 2, canvas.height / 2 - 20);
        ctx.font = '20px Arial';
        ctx.fillText(`Final Score: ${score}`, canvas.width / 2, canvas.height / 2 + 20);
        ctx.fillText('Press Enter or Space to Restart', canvas.width / 2, canvas.height / 2 + 60);
        return;
    }

    // Update Snake Position
    const head = { x: snake[0].x + velocityX, y: snake[0].y + velocityY };
    snake.unshift(head); // Add new head

    // Check for Food Collision
    if (head.x === food.x && head.y === food.y) {
        score++;
        placeFood();
    } else {
        snake.pop(); // Remove tail if no food eaten
    }

    // Check for Wall Collision
    if (head.x < 0 || head.x >= tileCount || head.y < 0 || head.y >= tileCount) {
        gameRunning = false;
    }

    // Check for Self-Collision
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            gameRunning = false;
            break;
        }
    }

    // Draw Everything
    clearCanvas();
    drawFood();
    drawSnake();
    drawScore();

    // Repeat loop
    setTimeout(gameLoop, 1000 / 10); // Adjust for game speed (10 FPS here)
}

// 7. Drawing Functions
function clearCanvas() {
    ctx.fillStyle = '#333'; // Dark background for the game area
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSnake() {
    ctx.fillStyle = 'lime';
    snake.forEach(segment => {
        ctx.fillRect(segment.x * gridSize, segment.y * gridSize, gridSize - 2, gridSize - 2); // -2 for small gap
    });
}

function drawFood() {
    ctx.fillStyle = 'red';
    ctx.fillRect(food.x * gridSize, food.y * gridSize, gridSize, gridSize);
}

function drawScore() {
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 25);
}

// 8. Starting the Game
// Display initial message to start the game
function showStartMessage() {
    clearCanvas();
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Press Enter or Space to Start', canvas.width / 2, canvas.height / 2);
}

showStartMessage(); // Show message initially, gameLoop starts on key press
console.log("script.js loaded. Press Enter or Space to start.");
