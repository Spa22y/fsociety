// game.js - **This is where you need to write the full game logic**

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the canvas and context
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // 2. Get the level number from the URL (game.html?level=X)
    const urlParams = new URLSearchParams(window.location.search);
    const levelNumber = parseInt(urlParams.get('level')) || 1;
    document.getElementById('level-title').textContent = `Level ${levelNumber}`;

    // 3. Define Game Variables
    let player = {
        x: 50,
        y: canvas.height - 50, // Start just above the floor
        width: 40,
        height: 40,
        color: 'cyan',
        velocity: 0,
        gravity: 0.8,
        jumpPower: -15,
        isJumping: false
    };

    let gameSpeed = 5;
    let isGameOver = false;

    // 4. Define Level Obstacles (This is where the difficulty changes)
    // Format: { x: position_from_start, y: height_of_obstacle, type: 'spike' or 'block' }
    const LEVELS = {
        1: [
            // Easy: Few single spikes
            { x: 300, y: 360, type: 'spike' }, 
            { x: 600, y: 360, type: 'spike' },
            { x: 900, y: 360, type: 'spike' },
        ],
        2: [
            // Medium: Double spikes, small gaps
            { x: 300, y: 360, type: 'spike' }, 
            { x: 340, y: 360, type: 'spike' }, // Double spike
            { x: 700, y: 360, type: 'spike' },
            { x: 1000, y: 360, type: 'spike' },
            { x: 1040, y: 360, type: 'spike' }, // Double spike
        ],
        3: [
            // Hard: Triple spikes, blocks, varied timing
            { x: 300, y: 360, type: 'spike' },
            { x: 340, y: 360, type: 'spike' },
            { x: 380, y: 360, type: 'spike' }, // Triple spike
            { x: 700, y: 320, type: 'block' }, // Block obstacle (y is top edge)
            { x: 1100, y: 360, type: 'spike' },
            { x: 1140, y: 360, type: 'spike' },
            // Add many more challenging obstacles...
        ]
    };
    
    let obstacles = LEVELS[levelNumber] || [];

    // --- GAME FUNCTIONS ---

    // 5. Drawing Functions (How to draw the cube, spikes, and the ground)
    function drawPlayer() {
        // Draw a simple cube
        ctx.fillStyle = player.color;
        ctx.fillRect(player.x, player.y - player.height, player.width, player.height);
    }

    function drawGround() {
        // Draw the ground line
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 10);
        ctx.lineTo(canvas.width, canvas.height - 10);
        ctx.stroke();
    }

    function drawObstacle(obs) {
        ctx.fillStyle = 'red';
        if (obs.type === 'spike') {
            // **Implement Spike drawing logic (triangle shape)**
            ctx.beginPath();
            // This is just a placeholder, the math for spikes is tricky
            ctx.moveTo(obs.x, obs.y); // Bottom left
            ctx.lineTo(obs.x + 40, obs.y); // Bottom right
            ctx.lineTo(obs.x + 20, obs.y - 40); // Top point
            ctx.closePath();
            ctx.fill();
        } else if (obs.type === 'block') {
            // **Implement Block drawing logic (square shape)**
            ctx.fillRect(obs.x, obs.y, 40, canvas.height - obs.y);
        }
    }
    
    // 6. Update/Physics Function
    function updatePlayer() {
        if (isGameOver) return;
        
        // Apply gravity
        player.velocity += player.gravity;
        player.y += player.velocity;

        // Ground collision (Check if player hits the ground)
        const groundLevel = canvas.height - 10;
        if (player.y > groundLevel) {
            player.y = groundLevel; // Set y to ground level
            player.velocity = 0;    // Stop falling
            player.isJumping = false;
        }
    }

    function updateObstacles() {
        // Move obstacles towards the player
        obstacles.forEach(obs => {
            obs.x -= gameSpeed;
        });
        
        // Filter out obstacles that have moved off-screen to the left
        obstacles = obstacles.filter(obs => obs.x > -50);
        
        // **TODO: Implement new obstacle generation for continuous gameplay (Advanced)**
    }
    
    // 7. Collision Detection Function
    function checkCollision() {
        // **This is the hardest part and requires precise math for spike triangles**
        obstacles.forEach(obs => {
            // Simple AABB (Axis-Aligned Bounding Box) for Block collision:
            if (obs.type === 'block' && 
                player.x < obs.x + 40 &&
                player.x + player.width > obs.x &&
                player.y - player.height < obs.y &&
                player.y > obs.y) 
            {
                isGameOver = true;
                // Add explosion/death animation logic
            }
            // **Add complex Polygon collision logic for 'spike' type here**
        });
    }

    // 8. Jump Handler
    function jump() {
        if (!player.isJumping && !isGameOver) {
            player.velocity = player.jumpPower;
            player.isJumping = true;
        }
    }

    // 9. Main Game Loop
    function gameLoop() {
        // 1. Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 2. Update logic
        updatePlayer();
        updateObstacles();
        checkCollision();

        // 3. Draw elements
        drawGround();
        drawPlayer();
        obstacles.forEach(drawObstacle);

        // 4. Check game state
        if (isGameOver) {
            // **TODO: Implement Game Over screen/message**
            ctx.font = '48px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText('GAME OVER! Press R to restart.', canvas.width / 2 - 250, canvas.height / 2);
            return;
        }
        
        // 5. Request next frame
        requestAnimationFrame(gameLoop);
    }

    // 10. Event Listeners for Input
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            jump();
        } else if (e.key === 'r' && isGameOver) {
            // **TODO: Implement a proper restart function**
            window.location.reload(); 
        }
    });

    // Start the game!
    gameLoop();
});