// ===== МИНИ-ИГРА "ЗАСАДА" =====
let huntGame = {
    active: false,
    timeLeft: 20,
    score: 0,
    spawnInterval: null,
    timerInterval: null,
    mice: []
};

function startHuntGame() {
    const modal = document.getElementById('hunt-modal');
    if (!modal) return;
    
    // Проверка кулдауна
    const lastHunt = player.lastHuntTime || 0;
    const cooldown = 120000; // 2 минуты
    const now = Date.now();
    if (now - lastHunt < cooldown) {
        const wait = Math.ceil((cooldown - (now - lastHunt)) / 1000);
        addLog(`Охота будет доступна через ${wait} сек.`);
        return;
    }
    
    // Проверка энергии
    if ((player.energy || 0) < 10) {
        addLog('Мало энергии для охоты. Нужно 10.');
        return;
    }
    
    // Списываем энергию
    player.energy = Math.max(0, player.energy - 10);
    player.lastHuntTime = now;
    localStorage.setItem("catData", JSON.stringify(player));
    if (typeof saveAccount === 'function') saveAccount();
    updateStatsDisplay();
    if (myOnlineRef) myOnlineRef.update({ energy: player.energy });
    
    // Открываем модалку
    modal.style.display = 'flex';
    
    // Сброс состояния
    huntGame.active = true;
    huntGame.timeLeft = 20;
    huntGame.score = 0;
    huntGame.mice = [];
    
    // Очищаем поле
    const field = document.getElementById('hunt-field');
    field.innerHTML = '';
    
    // Обновляем HUD
    updateHuntHUD();
    
    // Спавн мышей каждые 800мс
    huntGame.spawnInterval = setInterval(spawnMouse, 800);
    
    // Таймер обратного отсчёта
    huntGame.timerInterval = setInterval(() => {
        huntGame.timeLeft--;
        updateHuntHUD();
        if (huntGame.timeLeft <= 0) {
            endHuntGame();
        }
    }, 1000);
}

function spawnMouse() {
    if (!huntGame.active) return;
    
    const field = document.getElementById('hunt-field');
    if (!field) return;
    
    // Максимум 5 мышей одновременно
    if (field.querySelectorAll('.hunt-mouse').length >= 5) return;
    
    const mouse = document.createElement('div');
    mouse.className = 'hunt-mouse';
    
    // Случайная позиция
    const x = 5 + Math.random() * 85; // 5% - 90% ширины
    const y = 10 + Math.random() * 70; // 10% - 80% высоты
    
    mouse.style.left = x + '%';
    mouse.style.top = y + '%';
    
    // Случайная мышь
    const mice = ['🐭', '🐁', '🐀'];
    mouse.textContent = mice[Math.floor(Math.random() * mice.length)];
    
    // Время жизни — 1.5 сек, потом убегает
    mouse.dataset.spawnTime = Date.now();
    mouse.dataset.lifetime = 1500 + Math.random() * 1000;
    
    // Анимация появления
    mouse.style.transform = 'scale(0)';
    requestAnimationFrame(() => {
        mouse.style.transform = 'scale(1)';
    });
    
    // Клик — поймал
    mouse.onclick = (e) => {
        e.stopPropagation();
        if (!huntGame.active) return;
        
        huntGame.score++;
        updateHuntHUD();
        
        // Визуальный эффект
        mouse.textContent = '✨';
        mouse.style.transform = 'scale(1.5)';
        mouse.style.opacity = '0';
        
        setTimeout(() => mouse.remove(), 200);
    };
    
    // Автоудаление если не поймали
    setTimeout(() => {
        if (mouse.parentNode && huntGame.active) {
            mouse.style.opacity = '0';
            setTimeout(() => mouse.remove(), 200);
        }
    }, parseInt(mouse.dataset.lifetime));
    
    field.appendChild(mouse);
}

function updateHuntHUD() {
    const timeEl = document.getElementById('hunt-time');
    const scoreEl = document.getElementById('hunt-score');
    if (timeEl) timeEl.textContent = huntGame.timeLeft;
    if (scoreEl) scoreEl.textContent = huntGame.score;
}

function endHuntGame() {
    huntGame.active = false;
    clearInterval(huntGame.spawnInterval);
    clearInterval(huntGame.timerInterval);
    
    const score = huntGame.score;
    
    // Награда
let reward = 0;
let rewardName = '';
if (score >= 25) { reward = 3; rewardName = '3 мыши'; }
else if (score >= 15) { reward = 2; rewardName = '2 мыши'; }
else if (score >= 8) { reward = 1; rewardName = '1 мышь'; }
else { reward = 0; rewardName = 'ничего'; }
    // Добавляем в инвентарь
    if (reward > 0) {
        if (!player.inventory) player.inventory = [];
        const existing = player.inventory.find(i => i.name === 'Мышь');
        if (existing) {
            existing.count = (existing.count || 1) + reward;
        } else {
            player.inventory.push({
                name: 'Мышь',
                icon: 'images/mouse.jpg',
                count: reward,
                food: 20
            });
        }
        localStorage.setItem("catData", JSON.stringify(player));
        if (typeof saveAccount === 'function') saveAccount();
    }
    
    // Показываем результат
    const field = document.getElementById('hunt-field');
    if (field) {
        field.innerHTML = `
            <div class="hunt-result">
                <h2>Охота окончена!</h2>
                <p>Поймано: <b>${score}</b></p>
                <p>Добыча: <b>${rewardName}</b></p>
                <button onclick="closeHuntGame()">Забрать</button>
            </div>
        `;
    }
}

function closeHuntGame() {
    const modal = document.getElementById('hunt-modal');
    if (modal) modal.style.display = 'none';
    
    // Очистка на всякий случай
    clearInterval(huntGame.spawnInterval);
    clearInterval(huntGame.timerInterval);
    huntGame.active = false;
    
    addLog(`Охота завершена. Поймано: ${huntGame.score}`);
}