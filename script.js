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

// Speed-related variables
const initialGameSpeed = 100; // ms delay, 10 FPS
let currentGameSpeed = initialGameSpeed;
const speedIncreaseInterval = 5; // Increase speed every 5 food items eaten
const speedIncreaseFactor = 10;   // Decrease delay by 10ms
const minGameSpeed = 50;          // Max speed: 50ms delay (20 FPS)

// Scoring-related variables
let timeOfLastFoodEaten;
const maxPointsPerFood = 100; // Max points for quick collection
const timeDecayFactor = 5;   // Points lost per 100ms (e.g., 0.5 points per 100ms would be `0.5`) - Let's try 5 for a start, meaning 5 points lost per 100ms.

// 3. Game Initialization Function
function initializeGame() {
    snake = [ { x: 10, y: 10 } ];
    velocityX = 1; // Start moving right
    velocityY = 0;
    placeFood();
    score = 0;
    timeOfLastFoodEaten = Date.now(); // Initialize time for scoring
    currentGameSpeed = initialGameSpeed; // Reset speed
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
        // New scoring logic
        const timeToCollect = Date.now() - timeOfLastFoodEaten;
        timeOfLastFoodEaten = Date.now(); // Reset for next food

        let pointsEarned = Math.max(0, maxPointsPerFood - (timeToCollect / 100) * timeDecayFactor);
        pointsEarned = Math.round(pointsEarned);
        score += (pointsEarned + 10); // Add time-based points + base 10 points

        console.log(`Time to collect: ${timeToCollect}ms, Points earned: ${pointsEarned} (Total for food: ${pointsEarned + 10})`);

        placeFood();
        // Speed increase logic
        // (snake.length - 1) is the number of segments grown *after* the initial one
        if ((snake.length - 1) > 0 && (snake.length - 1) % speedIncreaseInterval === 0) {
            currentGameSpeed = Math.max(minGameSpeed, currentGameSpeed - speedIncreaseFactor);
            console.log("Speed increased. New delay:", currentGameSpeed);
        }
    } else {
        snake.pop(); // Remove tail if no food eaten
    }

    // Check for Wall Collision (and wrap around)
    if (head.x < 0) {
        head.x = tileCount - 1;
    } else if (head.x >= tileCount) {
        head.x = 0;
    }
    if (head.y < 0) {
        head.y = tileCount - 1;
    } else if (head.y >= tileCount) {
        head.y = 0;
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
    setTimeout(gameLoop, currentGameSpeed); 
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
