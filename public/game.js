document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    const urlParams = new URLSearchParams(window.location.search);
    const levelNumber = parseInt(urlParams.get('level')) || 1;
    document.getElementById('level-title').textContent = `Level ${levelNumber}`;

    let player = {
        x: 50,
        y: canvas.height - 50,
        width: 40,
        height: 40,
        color: '#00FF66',
        velocity: 0,
        gravity: 0.5,        // Reduced from 0.8 for smoother jump
        jumpPower: -12,      // Reduced from -15 for more realistic jump
        isJumping: false
    };

    let gameSpeed = 3;       // Reduced from 5 - slower gameplay
    let isGameOver = false;
    let distance = 0;
    let levelComplete = false;

    const LEVELS = {
        1: [
            { x: 400, y: 390, type: 'spike' },    // Changed from 360 to 390 (ground level)
            { x: 700, y: 390, type: 'spike' },
            { x: 1000, y: 390, type: 'spike' },
            { x: 1400, y: 390, type: 'spike' },
            { x: 1800, y: 390, type: 'spike' }
        ],
        2: [
            { x: 300, y: 390, type: 'spike' }, 
            { x: 340, y: 390, type: 'spike' },
            { x: 600, y: 390, type: 'spike' },
            { x: 900, y: 350, type: 'block' },    // Blocks stay higher
            { x: 1200, y: 390, type: 'spike' },
            { x: 1240, y: 390, type: 'spike' },
            { x: 1600, y: 390, type: 'spike' },
            { x: 2000, y: 350, type: 'block' }
        ],
        3: [
            { x: 300, y: 390, type: 'spike' },
            { x: 340, y: 390, type: 'spike' },
            { x: 380, y: 390, type: 'spike' },
            { x: 600, y: 350, type: 'block' },
            { x: 800, y: 390, type: 'spike' },
            { x: 840, y: 390, type: 'spike' },
            { x: 1000, y: 330, type: 'block' },
            { x: 1300, y: 390, type: 'spike' },
            { x: 1340, y: 390, type: 'spike' },
            { x: 1380, y: 390, type: 'spike' },
            { x: 1600, y: 350, type: 'block' },
            { x: 1900, y: 390, type: 'spike' },
            { x: 1940, y: 390, type: 'spike' },
            { x: 2200, y: 330, type: 'block' },
            { x: 2500, y: 390, type: 'spike' },
            { x: 2540, y: 390, type: 'spike' },
            { x: 2580, y: 390, type: 'spike' }
        ]
    };
    
    let obstacles = JSON.parse(JSON.stringify(LEVELS[levelNumber] || []));
    const maxDistance = Math.max(...obstacles.map(o => o.x)) + 500;

    function drawPlayer() {
        ctx.fillStyle = player.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = player.color;
        ctx.fillRect(player.x, player.y - player.height, player.width, player.height);
        ctx.shadowBlur = 0;
    }

    function drawGround() {
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 5;
        ctx.shadowColor = '#00FF66';
        ctx.beginPath();
        ctx.moveTo(0, canvas.height - 10);
        ctx.lineTo(canvas.width, canvas.height - 10);
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function drawObstacle(obs) {
        if (obs.type === 'spike') {
            ctx.fillStyle = '#FF5555';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF5555';
            ctx.beginPath();
            ctx.moveTo(obs.x, obs.y);
            ctx.lineTo(obs.x + 40, obs.y);
            ctx.lineTo(obs.x + 20, obs.y - 40);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (obs.type === 'block') {
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            ctx.fillRect(obs.x, obs.y, 40, canvas.height - obs.y - 10);
            ctx.shadowBlur = 0;
        }
    }
    
    function updatePlayer() {
        if (isGameOver || levelComplete) return;
        
        player.velocity += player.gravity;
        player.y += player.velocity;

        const groundLevel = canvas.height - 10;
        if (player.y > groundLevel) {
            player.y = groundLevel;
            player.velocity = 0;
            player.isJumping = false;
        }
    }

    function updateObstacles() {
        if (isGameOver || levelComplete) return;
        
        obstacles.forEach(obs => {
            obs.x -= gameSpeed;
        });
        
        distance += gameSpeed;
        
        // Check if level is complete
        if (distance > maxDistance) {
            levelComplete = true;
        }
    }
    
    function checkCollision() {
        if (isGameOver || levelComplete) return;
        
        obstacles.forEach(obs => {
            if (obs.type === 'block') {
                if (player.x < obs.x + 40 &&
                    player.x + player.width > obs.x &&
                    player.y - player.height < obs.y + (canvas.height - obs.y - 10) &&
                    player.y > obs.y) 
                {
                    isGameOver = true;
                }
            } else if (obs.type === 'spike') {
                // Triangle collision detection
                const playerLeft = player.x;
                const playerRight = player.x + player.width;
                const playerTop = player.y - player.height;
                const playerBottom = player.y;
                
                const spikeLeft = obs.x;
                const spikeRight = obs.x + 40;
                const spikeTop = obs.y - 40;
                const spikeBottom = obs.y;
                
                // Simple bounding box check for spike
                if (playerRight > spikeLeft && 
                    playerLeft < spikeRight && 
                    playerBottom > spikeTop && 
                    playerTop < spikeBottom) 
                {
                    // More precise triangle collision
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y - player.height / 2;
                    
                    if (pointInTriangle(
                        playerCenterX, playerCenterY,
                        obs.x, obs.y,
                        obs.x + 40, obs.y,
                        obs.x + 20, obs.y - 40
                    )) {
                        isGameOver = true;
                    }
                }
            }
        });
    }

    function pointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
        const area = Math.abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
        const area1 = Math.abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
        const area2 = Math.abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
        const area3 = Math.abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
        return Math.abs(area - (area1 + area2 + area3)) < 1;
    }

    function jump() {
        if (!player.isJumping && !isGameOver && !levelComplete) {
            player.velocity = player.jumpPower;
            player.isJumping = true;
        }
    }

    function restart() {
        isGameOver = false;
        levelComplete = false;
        distance = 0;
        player.y = canvas.height - 10;
        player.velocity = 0;
        player.isJumping = false;
        obstacles = JSON.parse(JSON.stringify(LEVELS[levelNumber] || []));
        gameLoop();
    }

    function nextLevel() {
        const next = levelNumber + 1;
        if (next <= 3) {
            window.location.href = `game.html?level=${next}`;
        } else {
            window.location.href = 'HTML Dash.html';
        }
    }

    function gameLoop() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        updatePlayer();
        updateObstacles();
        checkCollision();

        drawGround();
        obstacles.forEach(drawObstacle);
        drawPlayer();

        // Draw distance counter
        ctx.fillStyle = '#00FF66';
        ctx.font = '24px VT323';
        ctx.fillText(`Distance: ${Math.floor(distance)}m`, 10, 30);

        if (isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '48px VT323';
            ctx.fillStyle = '#FF5555';
            ctx.textAlign = 'center';
            ctx.fillText('GAME OVER!', canvas.width / 2, canvas.height / 2 - 40);
            
            ctx.font = '32px VT323';
            ctx.fillStyle = '#00FF66';
            ctx.fillText('Press R to restart', canvas.width / 2, canvas.height / 2 + 20);
            ctx.textAlign = 'left';
            return;
        }

        if (levelComplete) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '48px VT323';
            ctx.fillStyle = '#00FF66';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL COMPLETE!', canvas.width / 2, canvas.height / 2 - 40);
            
            ctx.font = '32px VT323';
            ctx.fillText('Press N for next level', canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText('Press R to replay', canvas.width / 2, canvas.height / 2 + 60);
            ctx.textAlign = 'left';
            return;
        }
        
        requestAnimationFrame(gameLoop);
    }

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space' || e.key === 'w' || e.key === 'W') {
            e.preventDefault();
            jump();
        } else if ((e.key === 'r' || e.key === 'R') && (isGameOver || levelComplete)) {
            restart();
        } else if ((e.key === 'n' || e.key === 'N') && levelComplete) {
            nextLevel();
        }
    });

    canvas.addEventListener('click', jump);

    gameLoop();
});
