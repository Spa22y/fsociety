document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Language system
    const lang = localStorage.getItem('language') || 'en';
    const translations = {
        en: {
            pressKey: 'Press SPACE or W to start',
            gameOver: 'GAME OVER!',
            restart: 'Press R to restart',
            levelComplete: 'LEVEL COMPLETE!',
            nextLevel: 'Press N for next level',
            replay: 'Press R to replay'
        },
        de: {
            pressKey: 'Drücke LEERTASTE oder W zum Starten',
            gameOver: 'SPIEL VORBEI!',
            restart: 'Drücke R zum Neustarten',
            levelComplete: 'LEVEL ABGESCHLOSSEN!',
            nextLevel: 'Drücke N für nächstes Level',
            replay: 'Drücke R zum Wiederholen'
        }
    };
    const t = translations[lang];
    
    const urlParams = new URLSearchParams(window.location.search);
    const levelNumber = parseInt(urlParams.get('level')) || 1;
    document.getElementById('level-title').textContent = `Level ${levelNumber}`;

    let countdown = 3;
    let countdownActive = true;

    let player = {
        x: 100,
        y: canvas.height - 50,
        width: 40,
        height: 40,
        color: '#00FF66',
        velocity: 0,
        gravity: 0.4,
        jumpPower: -10,
        isJumping: false,
        onPlatform: false
    };

    let cameraOffset = 0;
    let gameSpeed = 2.5;
    let isGameOver = false;
    let distance = 0;
    let levelComplete = false;
    let bgOffset = 0;

    const LEVELS = {
        1: {
            obstacles: [
                { x: 400, y: 390, type: 'spike' },
                {x: 660, y: 390, type: 'spike' },
                { x: 700, y: 340, type: 'platform', width: 150 },
                { x: 860, y: 390, type: 'spike' },
                { x: 900, y: 390, type: 'spike' },
                { x: 950, y: 340, type: 'platform', width: 150 },
                { x: 1100, y: 390, type: 'spike' },
                { x: 1300, y: 320, type: 'platform', width: 100 },
                { x: 1600, y: 390, type: 'spike' },
                { x: 1640, y: 390, type: 'spike' },
                { x: 1980, y: 390, type: 'spike' },
                { x: 2020, y: 390, type: 'spike' },
                { x: 2060, y: 390, type: 'spike' },
                { x: 1900, y: 300, type: 'platform', width: 120 },
                { x: 2300, y: 390, type: 'spike' },
                { x: 2600, y: 320, type: 'platform', width: 80 },
                { x: 2640, y: 320, type: 'spike' },
                { x: 2900, y: 390, type: 'spike' },
                { x: 2940, y: 390, type: 'spike' }
            ]
        },
        2: {
            obstacles: [
                { x: 300, y: 390, type: 'spike' },
                { x: 340, y: 390, type: 'spike' },
                { x: 600, y: 330, type: 'platform', width: 100 },
                { x: 900, y: 390, type: 'spike' },
                { x: 1200, y: 300, type: 'platform', width: 80 },
                { x: 1500, y: 390, type: 'spike' },
                { x: 1540, y: 390, type: 'spike' },
                { x: 1800, y: 280, type: 'platform', width: 120 },
                { x: 2100, y: 390, type: 'spike' },
                { x: 2400, y: 320, type: 'platform', width: 90 },
                { x: 2700, y: 390, type: 'spike' },
                { x: 2740, y: 390, type: 'spike' },
                { x: 3000, y: 260, type: 'platform', width: 100 },
                { x: 3300, y: 390, type: 'spike' }
            ]
        },
        3: {
            obstacles: [
                { x: 300, y: 390, type: 'spike' },
                { x: 500, y: 340, type: 'platform', width: 80 },
                { x: 700, y: 390, type: 'spike' },
                { x: 740, y: 390, type: 'spike' },
                { x: 1000, y: 300, type: 'platform', width: 100 },
                { x: 1300, y: 390, type: 'spike' },
                { x: 1600, y: 280, type: 'platform', width: 80 },
                { x: 1900, y: 390, type: 'spike' },
                { x: 1940, y: 390, type: 'spike' },
                { x: 2200, y: 320, type: 'platform', width: 120 },
                { x: 2500, y: 390, type: 'spike' },
                { x: 2800, y: 260, type: 'platform', width: 90 },
                { x: 3100, y: 390, type: 'spike' },
                { x: 3140, y: 390, type: 'spike' },
                { x: 3400, y: 300, type: 'platform', width: 100 },
                { x: 3700, y: 390, type: 'spike' }
            ]
        },
        4: [
            // Similar pattern for other levels...
        ],
        5: [],
        6: [],
        7: [],
        8: [],
        9: [],
        10: []
    };

    // Generate remaining levels programmatically
    for (let i = 4; i <= 10; i++) {
        LEVELS[i] = { obstacles: [] };
        let x = 300;
        const spikeGap = Math.max(250, 350 - i * 10);
        
        for (let j = 0; j < 15 + i * 2; j++) {
            if (Math.random() > 0.4) {
                LEVELS[i].obstacles.push({ x, y: 390, type: 'spike' });
                if (Math.random() > 0.6) {
                    LEVELS[i].obstacles.push({ x: x + 40, y: 390, type: 'spike' });
                }
            }
            
            if (Math.random() > 0.5) {
                const platformY = 250 + Math.random() * 100;
                const platformWidth = 80 + Math.random() * 60;
                LEVELS[i].obstacles.push({ x: x + 150, y: platformY, type: 'platform', width: platformWidth });
            }
            
            x += spikeGap + Math.random() * 100;
        }
    }

    let obstacles = JSON.parse(JSON.stringify(LEVELS[levelNumber]?.obstacles || []));
    const maxDistance = Math.max(...obstacles.map(o => o.x)) + 500;

    function drawBackground() {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#1a0033');
        gradient.addColorStop(1, '#0A0F0A');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Parallax stars
        ctx.fillStyle = 'rgba(0, 255, 102, 0.3)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 157 - bgOffset * 0.3) % canvas.width;
            const y = (i * 89) % canvas.height;
            ctx.fillRect(x, y, 2, 2);
        }
    }

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
        const screenX = obs.x - cameraOffset;
        
        if (obs.type === 'spike') {
            ctx.fillStyle = '#FF5555';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FF5555';
            ctx.beginPath();
            ctx.moveTo(screenX, obs.y);
            ctx.lineTo(screenX + 40, obs.y);
            ctx.lineTo(screenX + 20, obs.y - 40);
            ctx.closePath();
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (obs.type === 'platform') {
            const width = obs.width || 80;
            ctx.fillStyle = '#FFD700';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#FFD700';
            ctx.fillRect(screenX, obs.y, width, 20);
            ctx.shadowBlur = 0;
        }
    }
    
    function updatePlayer() {
        if (isGameOver || levelComplete) return;
        
        player.velocity += player.gravity;
        player.y += player.velocity;

        const groundLevel = canvas.height - 10;
        
        // Check platform landings
        player.onPlatform = false;
        obstacles.forEach(obs => {
            if (obs.type === 'platform') {
                const screenX = obs.x - cameraOffset;
                const width = obs.width || 80;
                
                if (player.x + player.width > screenX &&
                    player.x < screenX + width &&
                    player.y >= obs.y &&
                    player.y <= obs.y + 25 &&
                    player.velocity >= 0) {
                    player.y = obs.y;
                    player.velocity = 0;
                    player.isJumping = false;
                    player.onPlatform = true;
                }
            }
        });

        // Ground collision
        if (player.y > groundLevel) {
            player.y = groundLevel;
            player.velocity = 0;
            player.isJumping = false;
        }
    }

    function updateCamera() {
        if (isGameOver || levelComplete || countdownActive) return;
        cameraOffset += gameSpeed;
        distance = cameraOffset;
        bgOffset += gameSpeed;
        
        if (distance > maxDistance) {
            levelComplete = true;
        }
    }
    
    function checkCollision() {
        if (isGameOver || levelComplete) return;
        
        obstacles.forEach(obs => {
            const screenX = obs.x - cameraOffset;
            
            if (obs.type === 'platform') {
                const width = obs.width || 80;
                const playerLeft = player.x;
                const playerRight = player.x + player.width;
                const playerTop = player.y - player.height;
                const playerBottom = player.y;
                
                const platLeft = screenX;
                const platRight = screenX + width;
                const platTop = obs.y;
                const platBottom = obs.y + 20;
                
                // Check if player is colliding with platform from the side
                if (playerRight > platLeft + 5 &&
                    playerLeft < platRight - 5 &&
                    playerBottom > platTop + 5 &&
                    playerTop < platBottom - 5) {
                    
                    // Check if hitting from side (not landing on top)
                    const comingFromTop = playerBottom - 5 <= platTop;
                    
                    if (!comingFromTop) {
                        isGameOver = true;
                    }
                }
            } else if (obs.type === 'spike') {
                const playerLeft = player.x;
                const playerRight = player.x + player.width;
                const playerTop = player.y - player.height;
                const playerBottom = player.y;
                
                const spikeLeft = screenX;
                const spikeRight = screenX + 40;
                const spikeTop = obs.y - 40;
                const spikeBottom = obs.y;
                
                if (playerRight > spikeLeft && 
                    playerLeft < spikeRight && 
                    playerBottom > spikeTop && 
                    playerTop < spikeBottom) {
                    const playerCenterX = player.x + player.width / 2;
                    const playerCenterY = player.y - player.height / 2;
                    
                    if (pointInTriangle(
                        playerCenterX, playerCenterY,
                        screenX, obs.y,
                        screenX + 40, obs.y,
                        screenX + 20, obs.y - 40
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
        if (countdownActive) {
            if (countdown === 3) {
                startCountdown();
            }
            return;
        }
        
        if (!player.isJumping && !isGameOver && !levelComplete) {
            player.velocity = player.jumpPower;
            player.isJumping = true;
        }
    }

    function startCountdown() {
        const countdownInterval = setInterval(() => {
            countdown--;
            if (countdown === 0) {
                clearInterval(countdownInterval);
                countdownActive = false;
            }
        }, 1000);
    }

    function restart() {
        isGameOver = false;
        levelComplete = false;
        distance = 0;
        cameraOffset = 0;
        bgOffset = 0;
        countdown = 3;
        countdownActive = true;
        player.y = canvas.height - 10;
        player.velocity = 0;
        player.isJumping = false;
        obstacles = JSON.parse(JSON.stringify(LEVELS[levelNumber]?.obstacles || []));
        gameLoop();
    }

    function nextLevel() {
        const next = levelNumber + 1;
        if (next <= 10) {
            window.location.href = `HTML Dash.html?level=${next}`;
        } else {
            window.location.href = 'HTML Dash Levels.html';
        }
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.body.requestFullscreen().catch(err => {
                console.log('Fullscreen error:', err);
            });
        } else {
            document.exitFullscreen();
        }
    }

    function gameLoop() {
        drawBackground();
        
        updatePlayer();
        updateCamera();
        checkCollision();

        drawGround();
        obstacles.forEach(drawObstacle);
        drawPlayer();

        // Draw progress bar
        const barWidth = 300;
        const barHeight = 30;
        const barX = (canvas.width - barWidth) / 2;
        const barY = 10;
        const progress = Math.min((distance / maxDistance) * 100, 100);

        ctx.fillStyle = '#000';
        ctx.fillRect(barX, barY, barWidth, barHeight);
        ctx.strokeStyle = '#00FF66';
        ctx.lineWidth = 2;
        ctx.strokeRect(barX, barY, barWidth, barHeight);

        ctx.fillStyle = '#00FF66';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00FF66';
        ctx.fillRect(barX + 2, barY + 2, (barWidth - 4) * (progress / 100), barHeight - 4);
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px VT323';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.floor(progress)}%`, canvas.width / 2, barY + 21);
        ctx.textAlign = 'left';

        // Draw countdown
        if (countdownActive && countdown > 0) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '96px VT323';
            ctx.fillStyle = '#FFD700';
            ctx.textAlign = 'center';
            ctx.fillText(countdown, canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        } else if (countdownActive && countdown === 0) {
            ctx.font = '48px VT323';
            ctx.fillStyle = '#00FF66';
            ctx.textAlign = 'center';
            ctx.fillText(t.pressKey, canvas.width / 2, canvas.height / 2);
            ctx.textAlign = 'left';
        }

        if (isGameOver) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '48px VT323';
            ctx.fillStyle = '#FF5555';
            ctx.textAlign = 'center';
            ctx.fillText(t.gameOver, canvas.width / 2, canvas.height / 2 - 40);
            
            ctx.font = '32px VT323';
            ctx.fillStyle = '#00FF66';
            ctx.fillText(t.restart, canvas.width / 2, canvas.height / 2 + 20);
            ctx.textAlign = 'left';
            return;
        }

        if (levelComplete) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.font = '48px VT323';
            ctx.fillStyle = '#00FF66';
            ctx.textAlign = 'center';
            ctx.fillText(t.levelComplete, canvas.width / 2, canvas.height / 2 - 40);
            
            ctx.font = '32px VT323';
            ctx.fillText(t.nextLevel, canvas.width / 2, canvas.height / 2 + 20);
            ctx.fillText(t.replay, canvas.width / 2, canvas.height / 2 + 60);
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
        } else if (e.key === 'f' || e.key === 'F') {
            toggleFullscreen();
        }
    });

    canvas.addEventListener('click', jump);
    
    document.getElementById('fullscreenBtn')?.addEventListener('click', toggleFullscreen);

    gameLoop();
});