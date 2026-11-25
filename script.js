const firebaseConfig = {
apiKey: "AIzaSyCOIaXVfnKNfezr6U6KN4E83nBld8pxg9U",
authDomain: "warriorcatsbeta-1116c.firebaseapp.com",
databaseURL: "https://warriorcatsbeta-1116c-default-rtdb.europe-west1.firebasedatabase.app",
projectId: "warriorcatsbeta-1116c",
storageBucket: "warriorcatsbeta-1116c.firebasestorage.app",
messagingSenderId: "723252509632",
appId: "1:723252509632:web:b61c98fb1da547b201a625",
measurementId: "G-GXRZNQJBTR"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const itemsRef = db.ref('items');
const onlineRef = db.ref('online');
const chatRef = db.ref('chat');

const DISEASES = {
fever: { name: 'Жар', icon: '', temp: 1.5, thought: 'Меня знобит и бросает в жар...' },
chills: { name: 'Озноб', icon: '', temp: -0.8, thought: 'Меня трясёт от холода...' },
cough: { name: 'Кашель', icon: '', oxygen: -5, thought: 'Я кашляю, дышать тяжело...' },
suffocation: { name: 'Удушье', icon: '', oxygen: -10, thought: 'Мне не хватает воздуха...' },
infection: { name: 'Инфекция', icon: '', infection: 30, thought: 'Внутри всё горит...' },
poisoning: { name: 'Отравление', icon: '', poison: 40, pain: 5, thought: 'Меня тошнит, всё кружится...' },
headache: { name: 'Головная боль', icon: '', pain: 3, thought: 'Голова раскалывается...' },
weakness: { name: 'Слабость', icon: '', energy: -20, thought: 'Лапы ватные, я еле стою...' }
};
const GAME_ICONS = {
bandage: 'images/item-medical-bandage.png',
splint: 'images/tire-bark.png',
bark: 'images/material-tree-bark.png',
spiderweb: 'images/material-spiderweb.png',
paw: 'images/icon-paw.png',
health: 'images/stat-health.png',
hunger: 'images/stat-hunger.png',
energy: 'images/stat-energy.png',
thirst: 'images/stat-thirst.png',
oxygen: 'images/stat-oxygen.png',
blood: 'images/stat-blood.png',
pulse: 'images/stat-pulse.png',
pressure: 'images/stat-pressure.png',
consciousness: 'images/stat-consciousness.png',
temperature: 'images/stat-temperature.png',
infection: 'images/stat-infection.png',
pain: 'images/stat-pain.png',
disease: 'images/stat-disease.png',
moon: 'images/stat-moon.png',
warning: 'images/icon-warning.png',
herb: 'images/icon-herb.png',
box: 'images/item-misc.png',
mouse: 'images/prey-mouse.png',
sparkle: 'images/effect-sparkle.png'
};

function getItemIcon(item) {
const icon = item && item.icon;
if (typeof icon === 'string' && /^images\/[a-z0-9._/-]+$/i.test(icon)) return icon;
if (!item) return GAME_ICONS.box;
if (item.craftKey === 'medicalBandage' || item.name === 'Лечебная повязка') return GAME_ICONS.bandage;
if (item.craftKey === 'looseSplint' || item.name === 'Незакреплённая шина') return GAME_ICONS.splint;
if (item.materialKey === 'bark' || item.name === 'Кора дерева') return GAME_ICONS.bark;
if (item.materialKey === 'spiderweb' || item.name === 'Паутина') return GAME_ICONS.spiderweb;
return GAME_ICONS.box;
}

// Данные игрока 
let player = {};
let myOnlineRef = null;
// Загрузка данных игрока
function loadPlayerData() {
const save = localStorage.getItem("catData");
if(save) {
player = JSON.parse(save);
}
if (player.posX === undefined) player.posX = 300;
if (player.posY === undefined) player.posY = 400;
if (!player.role) player.role = 'котёнок';
if (player.thirst === undefined) player.thirst = 50;
if (player.createdAt === undefined) player.createdAt = Date.now();
if (!player.numericId) {
const saved = localStorage.getItem("numericId");
if (saved) player.numericId = saved;
}
if (!player.condition) player.condition = {};
if (player.condition.blood === undefined) player.condition.blood = 5.0;
if (player.condition.pulse === undefined) player.condition.pulse = 140;
if (player.condition.pressureSys === undefined) player.condition.pressureSys = 120;
if (player.condition.pressureDia === undefined) player.condition.pressureDia = 80;
if (player.condition.conscious === undefined) player.condition.conscious = true;
if (!player.condition.bodyParts) player.condition.bodyParts = defaultBodyParts();
Object.values(player.condition.bodyParts).forEach((part) => {
if (hasActiveBleeding(part)) part.bleedNextAt = Date.now() + BLEED_TICK_MS;
else delete part.bleedNextAt;
if (part.fractureType === 'open' && !part.bandaged) part.infectionNextAt = Date.now() + BLEED_TICK_MS;
else delete part.infectionNextAt;
});
const here = getCurrentLocation();
if (here !== 'Неизвестно') player.location = here;
localStorage.setItem("catData", JSON.stringify(player));
}

// Обновление информации на экране
function updatePlayerDisplay() {
const display = document.getElementById("cat-display");
if(display && player.name) {
const star = player.role === 'предводитель' ? ' ★' : '';
const idText = player.numericId ? `#${player.numericId} ` : '';
display.innerHTML = `${idText}${escapeHtml(player.name)} | ${escapeHtml(player.role || 'котёнок')}${star}`;
}
}
function updateStatsDisplay() {
const healthDisplay = document.getElementById("health");
const hungerDisplay = document.getElementById("hunger");
const thirstDisplay = document.getElementById("thirst");
const energyDisplay = document.getElementById("energy");
const levelDisplay = document.getElementById("level");
const strengthDisplay = document.getElementById("strength");
const agilityDisplay = document.getElementById("agility");
const moonsDisplay = document.getElementById("moons");

if (healthDisplay) healthDisplay.textContent = player.health !== undefined ? player.health : 100;
if (hungerDisplay) hungerDisplay.textContent = player.hunger !== undefined ? player.hunger : 50;
if (thirstDisplay) thirstDisplay.textContent = player.thirst !== undefined ? player.thirst : 50;
if (energyDisplay) energyDisplay.textContent = player.energy !== undefined ? player.energy : 80;
if (levelDisplay) levelDisplay.textContent = player.level !== undefined ? player.level : 1;
if (strengthDisplay) strengthDisplay.textContent = player.strength !== undefined ? player.strength : 10;
if (agilityDisplay) agilityDisplay.textContent = player.agility !== undefined ? player.agility : 12;
if (moonsDisplay) moonsDisplay.textContent = getMoons();
}
// Переход между локациями
function goTo(location) {
window.location.href = location;
}
// Лог сообщений
function addLog(text, iconPath) {
const log = document.getElementById("log");
if(!log) return;
const p = document.createElement("p");
if (iconPath) {
const icon = document.createElement('img');
icon.src = iconPath;
icon.alt = '';
icon.className = 'log-icon';
icon.style.cssText = 'width:20px;height:20px;object-fit:contain;vertical-align:middle;margin-right:5px;';
p.appendChild(icon);
}
const message = document.createElement('span');
message.textContent = text;
p.appendChild(message);
log.appendChild(p);
log.scrollTop = log.scrollHeight;
setTimeout(() => {
if (p.parentNode) p.parentNode.removeChild(p);
}, 5000);
}
function hunt() {
if (isUnconscious()) { addLog('Ты без сознания...'); return; }
tryGetInjured(0.12, 'На охоте ты поранился');
if (typeof startHuntGame === 'function') {
startHuntGame();
} else {
addLog("Ты отправился на охоту.");
tryGetSick(0.08);
}
}
function explore() {
if (isUnconscious()) { addLog('Ты без сознания...'); return; }
tryGetInjured(0.08, 'Ты оступился');
addLog("Ты осматриваешь лес.");
tryGetSick(0.10);
}
function rest() {
if (isUnconscious()) { addLog('Ты без сознания...'); return; }
addLog("Ты отдыхаешь.");
tryGetSick(0.03);
}
// ===== СИСТЕМА ОНЛАЙН ИГРОКОВ =====
function escapeHtml(str) {
return String(str).replace(/[&<>"']/g, (m) => ({
"&": "&amp;",
"<": "&lt;",
">": "&gt;",
"\"": "&quot;",
"'": "&#039;"
}[m]));
}
// Функция для генерации уникального ID игрока
function getPlayerId() {
let playerId = localStorage.getItem("playerId");
if (!playerId) {
playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
localStorage.setItem("playerId", playerId);
}
return playerId;
}
// Имя локации по файлу страницы. Совпадает с тем, что сохраняется в catData.location.
const LOCATION_PAGES = {
'star-wastes.html': 'Бескрайние звёздные пустоши',
'forest2.html': 'Лес-04',
'forest.html': 'Лес-01',
'river.html': 'Река-02',
'path.html': 'тропа',
'moonstone.html': '???',
'centre.html': 'центр',
'driedlog.html': 'бревно',
'elderden.html': 'старейшины',
'healden.html': 'целитель',
'kitden.html': 'детская',
'lawn.html': 'лужайка',
'litlecawe.html': 'пещерка',
'mossmink.html': 'мховаяямка',
'sharprock.html': 'скала',
'studentden.html': 'ученики',
'suncaves.html': 'пещеры',
'warriorden.html': 'воины',
'leaderden.html': 'лидерская',
'herb-cave.html': 'пещера трав-08',
'camp.html': 'Лагерь'
};

function locationFromPath(path) {
const page = String(path || '').split('/').pop().split('?')[0];
return LOCATION_PAGES[page] || 'Неизвестно';
}

function getCurrentLocation() {
return locationFromPath(window.location.pathname);
}

function canEnterStarWastes() {
return player.role === 'целитель' || player.role === 'предводитель';
}

function touchMoonstone() {
if (!canEnterStarWastes()) {
addLog('К Лунному камню могут прикоснуться только целитель и предводитель.');
return;
}
if (isUnconscious()) {
addLog('Ты без сознания и не можешь прикоснуться к камню...');
return;
}
player.location = 'Бескрайние звёздные пустоши';
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) {
myOnlineRef.update({ location: player.location }).catch((error) => {
console.error('Не удалось обновить локацию игрока:', error);
});
}
goTo('locations/star-wastes.html');
}
const LOCATION_KEYS = {
'Лес-01': 'forest', 'Лес-04': 'forest2', 'Река-02': 'river', 'тропа': 'path', 'центр': 'centere',
'Бескрайние звёздные пустоши': 'star-wastes',
'лужайка': 'lawn', 'целитель': 'healden', 'лидерская': 'leaderden', 'старейшины': 'elderden',
'ученики': 'studentden', 'бревно': 'driedlog', 'детская': 'kitden', 'пещерка': 'litlecawe',
'мховаяямка': 'mossmink', 'скала': 'sharprock', 'пещеры': 'suncaves', 'воины': 'warriorden',
'???': 'moonstone', 'пещера трав-08': 'herbcave', 'Лагерь': 'camp'
};
function getLocationKey() {
return LOCATION_KEYS[getCurrentLocation()] || 'camp';
}
// Подключение игрока к системе онлайн
function connectToOnline() {
if (!player.name) {
loadPlayerData();
if (!player.name) return;
}
const playerId = getPlayerId();
const location = player.location || getCurrentLocation();
// Удаляем все предыдущие сессии этого игрока
onlineRef.orderByChild('name').equalTo(player.name).once('value', (snapshot) => {
snapshot.forEach((child) => {
if (child.key !== playerId) {
onlineRef.child(child.key).remove();
}
});
});
myOnlineRef = onlineRef.child(playerId);
const onlineData = {
    posX: player.posX || 300,
posY: player.posY || 400,
name: player.name,
login: player.login || localStorage.getItem('currentLogin') || null,
color: player.color || 'полосатый',
eyes: player.eyes || 'янтарные',
pattern: player.pattern || 'однотонный',
role: player.role || 'котёнок',
size: player.size || null,
numericId: player.numericId || '00',
health: player.health !== undefined ? player.health : 100,
hunger: player.hunger !== undefined ? player.hunger : 50,
energy: player.energy !== undefined ? player.energy : 80,
thirst: player.thirst !== undefined ? player.thirst : 50,
condition: player.condition || null,
location: location,
lastSeen: firebase.database.ServerValue.TIMESTAMP
};
if (player.skin) onlineData.skin = player.skin;
myOnlineRef.update(onlineData).then(() => {
listenTreatments();
}).catch((error) => {
console.error('Не удалось подключиться к онлайн-состоянию игрока:', error);
});

}
// Отображение списка онлайн игроков
function displayOnlinePlayers() {
const onlineContainer = document.getElementById('online-players');
if (!onlineContainer) return;
onlineRef.on('value', (snapshot) => {
const players = snapshot.val();
onlineContainer.innerHTML = '';
if (!players) {
onlineContainer.innerHTML = '<div class="online-empty">Никого нет онлайн</div>';
return;
}
const playerEntries = Object.entries(players);
playerEntries.forEach(([id, data]) => {
const playerDiv = document.createElement('div');
playerDiv.className = 'online-player';
const catIcon = data.skin || getCatImage(data.color);
const isMe = id === getPlayerId();
const star = data.role === 'предводитель' ? ' ★' : '';
const idText = data.numericId ? `#${data.numericId} ` : '';
const nameDisplay = isMe ? `${idText}${data.name} | ${data.role || 'котёнок'}${star} (вы)` : `${idText}${data.name} | ${data.role || 'котёнок'}${star}`;
const isOnline = data.lastSeen && (Date.now() - data.lastSeen < 60000);
const nameClass = isOnline ? 'online-name online-active' : 'online-name';
playerDiv.innerHTML = `<img class="online-icon" src="${escapeHtml(catIcon)}" alt="" style="width:32px;height:32px;object-fit:contain;flex:0 0 32px;margin-right:10px;"><span class="${nameClass}">${escapeHtml(nameDisplay)}</span><span class="online-location">${escapeHtml(data.location)}</span><span class="online-status ${isMe ? 'me' : ''}"></span>`;
if (player.name === 'версек') {
const changeRoleBtn = document.createElement('button');
changeRoleBtn.textContent = 'Роль';
changeRoleBtn.style.marginLeft = '5px';
changeRoleBtn.style.padding = '4px 8px';
changeRoleBtn.style.fontSize = '11px';
changeRoleBtn.onclick = () => changePlayerRole(id);
playerDiv.appendChild(changeRoleBtn);
}
onlineContainer.appendChild(playerDiv);
});
const counter = document.getElementById('online-count');
if (counter) {
counter.textContent = `Игроков онлайн: ${playerEntries.length}`;
}
});
}
// ===== СИСТЕМА ДВИЖЕНИЯ =====
const MOVE_SPEED = 250; // пикселей в секунду
let keys = {};
let targetX = null;
let targetY = null;
let lastMoveTime = performance.now();
let lastPosSend = 0;
let joystickVector = { x: 0, y: 0 };
let activeJoystickPointer = null;

const gamePage = Boolean(document.getElementById('cat-container'));
const useMobileJoystick = gamePage && (
    window.matchMedia('(pointer: coarse)').matches ||
    window.matchMedia('(hover: none)').matches ||
    navigator.maxTouchPoints > 0
);

function initializeMobileJoystick() {
    if (!useMobileJoystick) return;

    let viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
        viewport = document.createElement('meta');
        viewport.name = 'viewport';
        document.head.appendChild(viewport);
    }
    viewport.content = 'width=device-width, initial-scale=1, viewport-fit=cover';
    document.body.classList.add('has-mobile-joystick');

    const playerPanel = document.querySelector('.left-panel');
    const locationLabel = document.querySelector('.location-info');
    if (playerPanel && locationLabel) playerPanel.appendChild(locationLabel);

    const joystick = document.createElement('div');
    joystick.id = 'mobile-joystick';
    joystick.className = 'mobile-joystick';
    joystick.setAttribute('role', 'group');
    joystick.setAttribute('aria-label', 'Джойстик управления котом');
    joystick.innerHTML = '<div class="mobile-joystick-knob"></div>';
    document.body.appendChild(joystick);

    const knob = joystick.querySelector('.mobile-joystick-knob');
    const updateJoystick = (event) => {
        const bounds = joystick.getBoundingClientRect();
        const centerX = bounds.left + bounds.width / 2;
        const centerY = bounds.top + bounds.height / 2;
        const maxDistance = (bounds.width - knob.offsetWidth) / 2;
        let x = event.clientX - centerX;
        let y = event.clientY - centerY;
        const distance = Math.hypot(x, y);

        if (distance > maxDistance) {
            x = x / distance * maxDistance;
            y = y / distance * maxDistance;
        }

        const magnitude = Math.hypot(x, y) / maxDistance;
        joystickVector = magnitude < 0.12
            ? { x: 0, y: 0 }
            : { x: x / maxDistance, y: y / maxDistance };

        knob.style.transform = `translate(${x}px, ${y}px)`;
    };
    const releaseJoystick = (event) => {
        if (event.pointerId !== activeJoystickPointer) return;
        activeJoystickPointer = null;
        joystickVector = { x: 0, y: 0 };
        knob.style.transform = 'translate(0, 0)';
        if (joystick.hasPointerCapture(event.pointerId)) {
            joystick.releasePointerCapture(event.pointerId);
        }
    };

    joystick.addEventListener('pointerdown', (event) => {
        if (activeJoystickPointer !== null) return;
        event.preventDefault();
        activeJoystickPointer = event.pointerId;
        joystick.setPointerCapture(event.pointerId);
        updateJoystick(event);
    });
    joystick.addEventListener('pointermove', (event) => {
        if (event.pointerId === activeJoystickPointer) updateJoystick(event);
    });
    joystick.addEventListener('pointerup', releaseJoystick);
    joystick.addEventListener('pointercancel', releaseJoystick);
    window.addEventListener('blur', () => {
        activeJoystickPointer = null;
        joystickVector = { x: 0, y: 0 };
        knob.style.transform = 'translate(0, 0)';
    });
}

initializeMobileJoystick();

function isGameModalOpen() {
    return Array.from(document.querySelectorAll(
        '.inventory-modal, .players-modal, .condition-modal, .splint-game-modal, .hunt-modal'
    )).some((modal) => getComputedStyle(modal).display !== 'none');
}

// Клавиатура
document.addEventListener('keydown', (e) => {
    if (isGameModalOpen()) {
        keys = {};
        targetX = null;
        targetY = null;
        e.preventDefault();
        return;
    }

    const tag = (e.target.tagName || '').toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

    if (inInput) {
        e.stopImmediatePropagation();
        return;
    }

    const k = e.key.toLowerCase();
    if (['w','a','s','d','ц','ф','ы','в','arrowup','arrowdown','arrowleft','arrowright'].includes(k)) {
        keys[k] = true;
        targetX = null;
        targetY = null;
        e.preventDefault();
    }
}, true);
document.addEventListener('keyup', (e) => {
    const tag = (e.target.tagName || '').toLowerCase();
    const inInput = tag === 'input' || tag === 'textarea' || tag === 'select' || e.target.isContentEditable;

    if (inInput) {
        e.stopImmediatePropagation();
        return;
    }

    const k = e.key.toLowerCase();
    keys[k] = false;
}, true);
// Тап/клик по экрану (мобилка)
document.addEventListener('click', (e) => {
    if (useMobileJoystick) return;
    if (isGameModalOpen()) return;
    // Игнорируем клики по интерфейсу
    if (e.target.closest('.left-panel, .panel-container, button, .condition-modal, .inventory-modal, .players-modal, .ground-item, .other-player, #cave-icon, #water-icon, #nest-container')) return;
    targetX = e.clientX;
    targetY = e.clientY;
});

// Основной цикл движения
function moveLoop(now) {
    const dt = (now - lastMoveTime) / 1000;
    lastMoveTime = now;
    if (isGameModalOpen()) {
        keys = {};
        targetX = null;
        targetY = null;
        joystickVector = { x: 0, y: 0 };
        requestAnimationFrame(moveLoop);
        return;
    }

    if (player.condition && player.condition.conscious === false) {
requestAnimationFrame(moveLoop);
return;
}

    if (!player.name || !player.posX === undefined) {
        requestAnimationFrame(moveLoop);
        return;
    }

    let dx = 0, dy = 0;

    // WASD
    if (keys['w'] || keys['ц'] || keys['arrowup']) dy -= 1;
    if (keys['s'] || keys['ы'] || keys['arrowdown']) dy += 1;
    if (keys['a'] || keys['ф'] || keys['arrowleft']) dx -= 1;
    if (keys['d'] || keys['в'] || keys['arrowright']) dx += 1;

    dx += joystickVector.x;
    dy += joystickVector.y;
    const directionLength = Math.hypot(dx, dy);
    if (directionLength > 1) {
        dx /= directionLength;
        dy /= directionLength;
    }
 // Движение к цели
    if (dx === 0 && dy === 0 && targetX !== null && targetY !== null) {
        const curX = player.posX || 300;
        const curY = player.posY || 400;
        const diffX = targetX - curX;
        const diffY = targetY - curY;
        const dist = Math.sqrt(diffX * diffX + diffY * diffY);
        if (dist < 10) {
            targetX = null;
            targetY = null;
        } else {
            dx = diffX / dist;
            dy = diffY / dist;
        }
    }

    if (dx !== 0 || dy !== 0) {
        let newX = (player.posX || 300) + dx * getMoveSpeed() * dt;
        let newY = (player.posY || 400) + dy * getMoveSpeed() * dt;

        // Границы — не выходим за пределы экрана
        const maxX = window.innerWidth - 140;
        const maxY = window.innerHeight - 140;
        newX = Math.max(20, Math.min(maxX, newX));
        newY = Math.max(20, Math.min(maxY, newY));

        player.posX = Math.round(newX);
        player.posY = Math.round(newY);

        // Двигаем свой спрайт
        const catContainer = document.getElementById('cat-container');
        if (catContainer) {
            catContainer.style.left = player.posX + 'px';
            catContainer.style.top = player.posY + 'px';
        }

        // Отправка в Firebase раз в 100мс
        if (now - lastPosSend > 100) {
            if (myOnlineRef) {
                myOnlineRef.update({
                    posX: player.posX,
                    posY: player.posY
                });
            }
            lastPosSend = now;
        }

        // Сохранение в localStorage раз в 1 сек
        if (now - (window.lastSavePos || 0) > 1000) {
            localStorage.setItem("catData", JSON.stringify(player));
            window.lastSavePos = now;
        }
    }
    const catContainer = document.getElementById('cat-container');
if (catContainer) {
catContainer.style.left = player.posX + 'px';
catContainer.style.top = player.posY + 'px';
}

    requestAnimationFrame(moveLoop);
}

// Старт цикла
requestAnimationFrame(moveLoop);

// Поставить своего кота на стартовую позицию
function positionMyCat() {
    const catContainer = document.getElementById('cat-container');
    if (!catContainer) return;
    catContainer.style.left = (player.posX || 300) + 'px';
    catContainer.style.top = (player.posY || 400) + 'px';
}
// Отображение других игроков в локации
function displayPlayersInLocation() {
const container = document.getElementById('other-players');
if (!container) return;
const currentLocation = getCurrentLocation();
const myId = getPlayerId();
onlineRef.on('value', (snapshot) => {
const players = snapshot.val();
if (!players) return;
container.innerHTML = '';
let otherPlayers = [];
Object.entries(players).forEach(([id, data]) => {
if (id !== myId && data.location === currentLocation) {
otherPlayers.push({id, data});
}
});
otherPlayers.forEach((otherPlayer) => {
const id = otherPlayer.id;
let playerDiv = document.getElementById('other-' + id);

// Создаём, если нет
if (!playerDiv) {
playerDiv = document.createElement('div');
playerDiv.className = 'other-player';
playerDiv.id = 'other-' + id;
playerDiv.style.position = 'absolute';
playerDiv.style.zIndex = '40';
playerDiv.style.transition = 'none';

// Начальная позиция
const startX = otherPlayer.data.posX || 300;
const startY = otherPlayer.data.posY || 400;
playerDiv.style.left = startX + 'px';
playerDiv.style.top = startY + 'px';
playerDiv.dataset.targetX = startX;
playerDiv.dataset.targetY = startY;
playerDiv.dataset.curX = startX;
playerDiv.dataset.curY = startY;

const isOnline = otherPlayer.data.lastSeen && (Date.now() - otherPlayer.data.lastSeen < 60000);
const nameColor = isOnline ? '#4fc3f7' : 'white';
const nameShadow = isOnline ? '0 0 8px rgba(79,195,247,0.8)' : '2px 2px 4px rgba(0,0,0,0.7)';
const star = otherPlayer.data.role === 'предводитель' ? ' ★' : '';

const patternImage = getPatternImage(otherPlayer.data.pattern || 'однотонный');
const eyesImage = EYE_COLORS[otherPlayer.data.eyes || 'янтарные'];

playerDiv.innerHTML = `
<div class="other-player-cat" style="position:relative;width:100%;max-width:200px;margin:0 auto;">
<img class="other-player-base" src="${escapeHtml(otherPlayer.data.skin || getCatImage(otherPlayer.data.color))}" style="position:relative;width:100%;height:auto;z-index:1;">
${patternImage ? `<img class="other-player-pattern" src="${patternImage}" style="position:absolute;top:0;left:0;width:100%;height:auto;pointer-events:none;z-index:2;">` : ''}
${eyesImage ? `<img class="other-player-eyes" src="${eyesImage}" style="position:absolute;top:0;left:0;width:100%;height:auto;pointer-events:none;z-index:3;">` : ''}
</div>
<div style="color:${nameColor};text-shadow:${nameShadow};text-align:center;font-size:14px;">${escapeHtml(otherPlayer.data.name)} | ${escapeHtml(otherPlayer.data.role || 'котёнок')}${star}</div>
`;

if (player.role === 'целитель') {
const inspectBtn = document.createElement('button');
inspectBtn.textContent = '▼';
inspectBtn.className = 'inspect-btn';
inspectBtn.onclick = (e) => {
e.stopPropagation();
inspectPlayer(id);
};
playerDiv.appendChild(inspectBtn);
}
container.appendChild(playerDiv);
}

// Обновляем цель
playerDiv.dataset.targetX = otherPlayer.data.posX || 300;
playerDiv.dataset.targetY = otherPlayer.data.posY || 400;
});

// Удаляем тех, кто ушёл из локации
const activeIds = otherPlayers.map(p => 'other-' + p.id);
container.querySelectorAll('.other-player').forEach(el => {
if (!activeIds.includes(el.id)) el.remove();
});
});
}
function getCatImage(color) {
const images = {
'рыжий': 'images/cat-red.png',
'серый': 'images/cat-gray.png',
'чёрный': 'images/cat-black.png',
'белый': 'images/cat-white.png',
'черепаховый': 'images/cat-tortoiseshell.png',
'полосатый': 'images/cat-tabby.png'
};
return images[color] || 'images/cat-tabby.png';
}
// ===== ЧАТ =====
function loadChat() {
const chatMessages = document.getElementById('chat-messages');
if (!chatMessages) return;
chatMessages.innerHTML = '';
chatRef.off();
chatRef.limitToLast(200).on('child_added', (snap) => {
const data = snap.val();
if (!data) return;
const text = data.text || '';
const sender = data.sender || 'Неизвестный';
const color = data.color || '';
const p = document.createElement('p');
if (color) {
p.innerHTML = `<span class="chat-sender" style="color:${getColorHex(color)}">${escapeHtml(sender)}:</span> <span class="chat-text">${escapeHtml(text)}</span>`;
} else {
p.innerHTML = `<span class="chat-sender">${escapeHtml(sender)}:</span> <span class="chat-text">${escapeHtml(text)}</span>`;
}
chatMessages.appendChild(p);
chatMessages.scrollTop = chatMessages.scrollHeight;
});
}
// Отправка сообщения
function sendChatMessage() {
const input = document.getElementById("chat-input");
if (!input) return;
const text = input.value.trim();
if (!text) return;
if (!player || !player.name) {
loadPlayerData();
if (!player.name) return;
}
db.ref("chat").push({
text: text,
sender: player.name,
color: player.color || '',
timestamp: firebase.database.ServerValue.TIMESTAMP
});
input.value = "";
}
// Получение цвета для отображения в чате
function getColorHex(color) {
const colors = {
'рыжий': '#e67e22',
'серый': '#95a5a6',
'чёрный': '#2c3e50',
'белый': '#ecf0f1',
'черепаховый': '#d35400',
'полосатый': '#7f8c8d'
};
return colors[color] || '#ffffff';
}
function updateCatName() {
const catName = document.getElementById("cat-name");
if(catName && player.name) {
const star = player.role === 'предводитель' ? ' ★' : '';
const idText = player.numericId ? `#${player.numericId} ` : '';
catName.innerHTML = `${idText}${escapeHtml(player.name)} | ${escapeHtml(player.role || 'котёнок')}${star}`;
}
}
// Навигация
var LOCATION_BY_CODE = {
6020: "locations/river.html",
6014: "locations/camp.html",
1001: "locations/forest.html",
1002: "locations/forest2.html",
1003: "locations/path.html",
1004: "locations/moonstone.html",
1005: "locations/centre.html",
1006: "locations/lawn.html",
1007: "locations/litlecawe.html",
1008: "locations/healden.html",
1009: "locations/sharprock.html",
1010: "locations/leaderden.html",
1011: "locations/kitden.html",
1012: "locations/elderden.html",
1013: "locations/driedlog.html",
1014: "locations/mossmink.html",
1015: "locations/studentden.html",
1016: "locations/suncaves.html",
1017: "locations/warriorden.html",
1018: "locations/herb-cave.html"
};
function moving(code, theme) {
const url = LOCATION_BY_CODE[code];
if (!url) return;
if (isUnconscious()) { addLog('Ты без сознания и не можешь идти...'); return; }

const dest = locationFromPath(url);
if (dest !== 'Неизвестно') player.location = dest;

if (player.hunger !== undefined) {
player.hunger = Math.max(0, player.hunger - 1);
}
if (player.energy !== undefined) {
player.energy = Math.max(0, player.energy - 2);
}

if (player.thirst !== undefined) {
player.thirst = Math.max(0, player.thirst - 2);
}

// Урон от голода
if (player.hunger === 0) {
player.health = Math.max(0, numOr(player.health, 100) - 25);
addLog('Голод изнуряет тебя. -25 здоровья.', GAME_ICONS.warning);
}
// Урон от жажды
if (player.thirst === 0) {
player.health = Math.max(0, numOr(player.health, 100) - 25);
addLog('Жажда мучает тебя. -25 здоровья.', GAME_ICONS.warning);
}

localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();

const hungerDisplay = document.getElementById("hunger");
const energyDisplay = document.getElementById("energy");
const healthDisplay = document.getElementById("health");
const thirstDisplay = document.getElementById("thirst");

if (hungerDisplay) hungerDisplay.textContent = player.hunger;
if (energyDisplay) energyDisplay.textContent = player.energy;
if (healthDisplay) healthDisplay.textContent = player.health;
if (thirstDisplay) thirstDisplay.textContent = player.thirst;

if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
hunger: player.hunger,
energy: player.energy,
thirst: player.thirst
});
}

addLog("Ты перемещаешься.");

if (checkDeath()) return;
goTo(url);
}
// ===== ИНИЦИАЛИЗАЦИЯ =====
window.onload = function () {
loadPlayerData();
if (gamePage) {
setInterval(() => {
if (typeof saveAccount === 'function') saveAccount().catch(() => {});
}, 5000);
const saveOnExit = () => {
if (typeof saveAccount === 'function') saveAccount().catch(() => {});
};
window.addEventListener('pagehide', saveOnExit);
document.addEventListener('visibilitychange', () => {
if (document.visibilityState === 'hidden') saveOnExit();
});
}
if (getCurrentLocation() === 'Бескрайние звёздные пустоши' && !canEnterStarWastes()) {
player.location = '???';
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
window.location.replace('moonstone.html');
return;
}
updatePlayerDisplay();
updateStatsDisplay();
updateCatName();
updateCatAppearance();
loadChat();
connectToOnline();
startBleedingTicker();
displayItemsInLocation();
positionMyCat();
const chatInput = document.getElementById('chat-input');
if (chatInput) {
chatInput.addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
sendChatMessage();
}
});
}
const myId = getPlayerId();
onlineRef.child(myId).once('value', (s) => {
const data = s.val();
if (data && data.skin) {
player.skin = data.skin;
localStorage.setItem("catData", JSON.stringify(player));
const catImg = document.getElementById('cat');
if (catImg) catImg.src = data.skin;
}
});
const locKey = getLocationKey();
startHerbSpawner(locKey);
startCraftingMaterialSpawner(locKey);
setTimeout(() => {
displayPlayersInLocation();
}, 1000);
setInterval(() => {
if (myOnlineRef) {
myOnlineRef.update({
lastSeen: firebase.database.ServerValue.TIMESTAMP,
health: player.health !== undefined ? player.health : 100,
hunger: player.hunger !== undefined ? player.hunger : 50,
energy: player.energy !== undefined ? player.energy : 80,
condition: player.condition || null
});
}
}, 10000);
};
// Для страницы создания персонажа
function createCharacter() {
document.getElementById("start-screen").style.display = "none";
document.getElementById("character-creation").style.display = "block";
}
function sleep() {
if (player && player.energy !== undefined) {
player.energy = 100;
if (player.health !== undefined) {
player.health = Math.min(100, player.health + 5);
}
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
updateStatsDisplay();
if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
hunger: player.hunger,
energy: player.energy,
thirst: player.thirst
});
}
}
addLog("Ты поспал. Энергия восстановлена, здоровье +5.");
if (checkDeath()) return;
}
function openInventory() {
const modal = document.getElementById('inventory-modal');
if (!modal) return;
modal.style.display = 'flex';
modal.parentElement?.classList.add('inventory-overlay');
loadInventory();
}
function closeInventory() {
const modal = document.getElementById('inventory-modal');
if (modal) modal.style.display = 'none';
modal?.parentElement?.classList.remove('inventory-overlay');
}

function getSplintMaterials() {
const inventory = player.inventory || [];
return {
bark: inventory.some(item => item.materialKey === 'bark' && (item.count || 1) > 0),
herb: inventory.some(item => item.type === 'herb' && !item.raw && (item.count || 1) > 0)
};
}

function getBandageMaterials() {
const inventory = player.inventory || [];
return {
web: inventory.some(item => item.materialKey === 'spiderweb' && (item.count || 1) > 0),
herb: inventory.some(item => item.type === 'herb' && !item.raw && (item.count || 1) > 0)
};
}

function consumeInventoryItem(item) {
const index = player.inventory.indexOf(item);
if (index === -1) return false;
item.count = (item.count || 1) - 1;
if (item.count <= 0) player.inventory.splice(index, 1);
return true;
}

function craftMedicalBandage() {
if (player.role !== 'целитель') {
addLog('Лечебную повязку может собрать только целитель.');
return;
}
const materials = getBandageMaterials();
if (!materials.web || !materials.herb) {
addLog('Для повязки нужны паутина и обработанная трава.');
return;
}
const web = player.inventory.find(item => item.materialKey === 'spiderweb' && (item.count || 1) > 0);
const herb = player.inventory.find(item => item.type === 'herb' && !item.raw && (item.count || 1) > 0);
if (!web || !herb) return;
consumeInventoryItem(web);
consumeInventoryItem(herb);
player.inventory.push({
name: 'Лечебная повязка',
icon: GAME_ICONS.bandage,
count: 1,
craftKey: 'medicalBandage'
});
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog('Ты собрал лечебную повязку.');
loadInventory();
}

function craftLooseSplint() {
if (player.role !== 'целитель') {
addLog('Собирать лечебную шину может только целитель.');
return;
}
const materials = getSplintMaterials();
if (!materials.bark || !materials.herb) {
addLog('Нужны кора дерева и обработанная трава.');
return;
}

const bark = player.inventory.find(item => item.materialKey === 'bark' && (item.count || 1) > 0);
const herb = player.inventory.find(item => item.type === 'herb' && !item.raw && (item.count || 1) > 0);
if (!bark || !herb) return;

consumeInventoryItem(bark);
consumeInventoryItem(herb);
player.inventory.push({
name: 'Незакреплённая шина',
icon: GAME_ICONS.splint,
count: 1,
craftKey: 'looseSplint'
});
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog('Ты собрал незакреплённую шину. Для фиксации понадобится паутина.');
loadInventory();
}

function processHerb(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
if (item.type !== 'herb') return;
if (!item.raw) {
addLog('Эта трава уже обработана.');
return;
}
if (player.role !== 'целитель') {
addLog('Только целитель может обрабатывать травы.');
return;
}

const herb = HERBS[item.herbKey];
if (!herb) return;

// Превращаем в обработанную
item.raw = false;
item.name = herb.name + ' (обработанная)';
item.icon = herb.icon;
item.cures = herb.cures;
item.heals = herb.heals;

localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog(`Ты обработал: ${herb.name}`);
loadInventory();
}

function loadInventory() {
const container = document.getElementById('inventory-items');
if (!container) return;
const inventory = player.inventory || [];
container.classList.add('inventory-layout');
container.innerHTML = '<div class="inventory-grid"></div><aside class="inventory-crafting-actions"></aside>';
const inventoryGrid = container.querySelector('.inventory-grid');
const craftingActions = container.querySelector('.inventory-crafting-actions');
if (inventory.length === 0) {
inventoryGrid.innerHTML = '<p class="inventory-empty">Инвентарь пуст</p>';
}

inventory.forEach((item, index) => {
const itemDiv = document.createElement('div');
itemDiv.className = 'inventory-item';

const iconHtml = `<img src="${escapeHtml(getItemIcon(item))}" class="item-img" alt="">`;

itemDiv.innerHTML = `
${iconHtml}
<span class="item-name">${escapeHtml(item.name)}</span>
<span class="item-count">x${item.count || 1}</span>
`;

// Кнопка "Обработать" — только для целителя и только для сырой травы
if (item.type === 'herb' && item.raw && player.role === 'целитель') {
const craftBtn = document.createElement('button');
craftBtn.textContent = 'Обработать';
craftBtn.style.marginTop = '4px';
craftBtn.style.padding = '6px 12px';
craftBtn.style.fontSize = '12px';
craftBtn.onclick = () => processHerb(index);
itemDiv.appendChild(craftBtn);
}

// Кнопка "Использовать"
const useBtn = document.createElement('button');
if (item.craftKey === 'medicalBandage' || item.craftKey === 'looseSplint') {
useBtn.textContent = 'Применяется при осмотре';
useBtn.disabled = true;
} else {
useBtn.textContent = 'Использовать';
useBtn.onclick = () => useItem(index);
}
useBtn.style.marginTop = '4px';
useBtn.style.padding = '6px 12px';
useBtn.style.fontSize = '12px';
itemDiv.appendChild(useBtn);

// Кнопка "Выложить"
const dropBtn = document.createElement('button');
dropBtn.textContent = 'Выложить';
dropBtn.style.marginTop = '4px';
dropBtn.style.padding = '6px 12px';
dropBtn.style.fontSize = '12px';
dropBtn.onclick = () => dropItem(index);
itemDiv.appendChild(dropBtn);

inventoryGrid.appendChild(itemDiv);
});

if (player.role === 'целитель') {
const materials = getSplintMaterials();
if (materials.bark && materials.herb) {
const craftButton = document.createElement('button');
craftButton.className = 'craft-splint-btn';
craftButton.textContent = 'Собрать незакреплённую шину';
craftButton.onclick = craftLooseSplint;
craftingActions.appendChild(craftButton);
}

const bandageMaterials = getBandageMaterials();
if (bandageMaterials.web && bandageMaterials.herb) {
const bandageButton = document.createElement('button');
bandageButton.className = 'craft-splint-btn';
bandageButton.textContent = 'Собрать лечебную повязку';
bandageButton.onclick = craftMedicalBandage;
craftingActions.appendChild(bandageButton);
}
if (craftingActions.children.length > 0) {
craftingActions.insertAdjacentHTML('afterbegin', '<h3>Изготовить</h3>');
}
}
}
function drinkWater() {
if ((player.thirst || 0) >= 100) {
addLog('Ты не хочешь пить.');
return;
}
player.thirst = Math.min(100, (player.thirst || 0) + 30);
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) {
myOnlineRef.update({ thirst: player.thirst });
}
updateStatsDisplay();
addLog('Ты попил воды. +30 жажды.');
}
//ОТОБРОЖЕНИЕ ПРЕДМЕТА НА ЛОКАЦИИ
function displayItemsInLocation() {
const container = document.getElementById('items-on-ground');
if (!container) return;
const locationKey = getLocationKey();

itemsRef.child(locationKey).on('value', (snapshot) => {
const items = snapshot.val();
container.innerHTML = '';
if (!items) return;

// Группируем травы по herbKey + raw, обычные предметы по name + icon
const groups = {};
Object.entries(items).forEach(([id, item]) => {
let key;
if (item.type === 'herb') {
key = 'herb_' + item.herbKey + '_' + (item.raw ? 'raw' : 'cooked');
} else {
key = 'item_' + (item.name || '') + '_' + (item.icon || '');
}
if (!groups[key]) {
groups[key] = {
item: item,
ids: [],
count: 0
};
}
groups[key].ids.push(id);
groups[key].count++;
});

const isMobile = window.innerWidth <= 768;
const itemSize = isMobile ? 100 : 120;
const gap = 10;
let index = 0;

Object.entries(groups).forEach(([key, group]) => {
const item = group.item;
const itemDiv = document.createElement('div');
itemDiv.className = 'ground-item';
itemDiv.style.position = 'absolute';
itemDiv.style.left = (30 + index * (itemSize + gap)) + 'px';
itemDiv.style.top = '480px';
itemDiv.style.zIndex = '45';
itemDiv.style.cursor = 'pointer';
itemDiv.style.width = itemSize + 'px';
itemDiv.style.height = itemSize + 'px';

// Картинка или встроенный значок предмета
const iconHtml = `<img src="${escapeHtml(getItemIcon(item))}" class="ground-item-image" alt="" style="width:${itemSize}px;height:${itemSize}px;display:block;object-fit:contain;">`;
let html = iconHtml;

// Счётчик стака — снизу справа
if (group.count > 1) {
html += `<div class="stack-count">x${group.count}</div>`;
}

itemDiv.innerHTML = html;

// При клике поднимаем ОДИН предмет из группы
itemDiv.onclick = () => pickUpOne(locationKey, group.ids[0]);

container.appendChild(itemDiv);
index++;
});
});
}

// Поднять один предмет
function pickUpOne(locationKey, itemId) {
itemsRef.child(locationKey).child(itemId).once('value', (snap) => {
const item = snap.val();
if (!item) return;
// Повторно используем pickUpItem
pickUpItem(locationKey, itemId, item);
});
}
//ВЗЯТЬ ПРЕДМЕТ
function pickUpItem(locationKey, itemId, item) {
if (!player.inventory) player.inventory = [];

const existing = player.inventory.find(i =>
i.name === item.name &&
(i.raw === item.raw || (i.raw === undefined && item.raw === undefined))
);

if (existing) {
existing.count = (existing.count || 1) + 1;
} else {
const invItem = {
name: item.name || 'Предмет',
icon: getItemIcon(item),
count: 1
};
if (item.food !== undefined) invItem.food = item.food;
if (item.energy !== undefined) invItem.energy = item.energy;
if (item.water !== undefined) invItem.water = item.water;
if (item.type !== undefined) invItem.type = item.type;
if (item.herbKey !== undefined) invItem.herbKey = item.herbKey;
if (item.materialKey !== undefined) invItem.materialKey = item.materialKey;
if (item.craftKey !== undefined) invItem.craftKey = item.craftKey;
if (item.raw !== undefined) invItem.raw = item.raw;
if (item.cures !== undefined) invItem.cures = item.cures;
if (item.heals !== undefined) invItem.heals = item.heals;
player.inventory.push(invItem);
}

localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
itemsRef.child(locationKey).child(itemId).remove();
addLog(`Ты подобрал: ${item.name}`);
}
//ФУНКЦИЯ ВЫБРОСИТЬ ПРЕДМЕТ
function dropItem(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
const locationKey = getLocationKey();

const x = 500 + Math.random() * 400;
const y = 400 + Math.random() * 200;

const dropData = {
name: item.name || 'Предмет',
icon: getItemIcon(item),
x: Math.round(x),
y: Math.round(y)
};

// Копируем ВСЕ свойства
if (item.food !== undefined) dropData.food = item.food;
if (item.energy !== undefined) dropData.energy = item.energy;
if (item.water !== undefined) dropData.water = item.water;
if (item.type !== undefined) dropData.type = item.type;
if (item.herbKey !== undefined) dropData.herbKey = item.herbKey;
if (item.materialKey !== undefined) dropData.materialKey = item.materialKey;
if (item.craftKey !== undefined) dropData.craftKey = item.craftKey;
if (item.raw !== undefined) dropData.raw = item.raw;
if (item.cures !== undefined) dropData.cures = item.cures;
if (item.heals !== undefined) dropData.heals = item.heals;

itemsRef.child(locationKey).push(dropData);
item.count = (item.count || 1) - 1;
if (item.count <= 0) {
player.inventory.splice(index, 1);
}
localStorage.setItem("catData", JSON.stringify(player));
addLog(`Ты выложил: ${item.name}`);
closeInventory();
if (typeof saveAccount === 'function') saveAccount();
}
function dropAllItems() {
if (!player.inventory || player.inventory.length === 0) return;
if (!confirm('Выложить все предметы из инвентаря?')) return;

const locationKey = getLocationKey();

const itemsToDrop = [...player.inventory];
itemsToDrop.forEach(item => {
const count = item.count || 1;
for (let i = 0; i < count; i++) {
const dropData = {
name: item.name || 'Предмет',
icon: getItemIcon(item),
x: Math.round(500 + Math.random() * 400),
y: Math.round(400 + Math.random() * 200)
};
if (item.food !== undefined) dropData.food = item.food;
if (item.energy !== undefined) dropData.energy = item.energy;
if (item.water !== undefined) dropData.water = item.water;
if (item.type !== undefined) dropData.type = item.type;
if (item.herbKey !== undefined) dropData.herbKey = item.herbKey;
if (item.materialKey !== undefined) dropData.materialKey = item.materialKey;
if (item.craftKey !== undefined) dropData.craftKey = item.craftKey;
if (item.raw !== undefined) dropData.raw = item.raw;
if (item.cures !== undefined) dropData.cures = item.cures;
if (item.heals !== undefined) dropData.heals = item.heals;
itemsRef.child(locationKey).push(dropData);
}
});

player.inventory = [];
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog('Ты выложил всё из инвентаря.');
closeInventory();
}
//ИСПОЛЬЗОВАТЬ ПРЕДМЕТ
function useItem(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
let used = false;

if (item.energy) {
player.energy = Math.min(100, (player.energy || 0) + item.energy);
addLog(`Ты использовал ${item.name}. +${item.energy} энергии.`);
used = true;
}
if (item.food) {
player.hunger = Math.min(100, (player.hunger || 0) + item.food);
addLog(`Ты съел ${item.name}. +${item.food} голода.`);
used = true;
}
if (item.water) {
player.thirst = Math.min(100, (player.thirst || 0) + item.water);
addLog(`Ты выпил ${item.name}. +${item.water} жажды.`);
used = true;
}

// Сырая трава — ВСЕГДА отравление, независимо от болезней
if (item.type === 'herb' && item.raw) {
player.health = Math.max(0, numOr(player.health, 100) - 25);
if (!player.condition) player.condition = {};
player.condition.poison = Math.min(100, (player.condition.poison || 0) + 40);
player.condition.pain = Math.min(10, (player.condition.pain || 0) + 3);
addLog('Ты съел необработанную траву. -25 здоровья, отравление!', GAME_ICONS.warning);
item.count = (item.count || 1) - 1;
if (item.count <= 0) {
player.inventory.splice(index, 1);
}
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
condition: player.condition
});
}
closeInventory();
updateStatsDisplay();
if (checkDeath()) return;
return;
}

// Обработанная трава — лечит
if (item.type === 'herb' && !item.raw) {
let healed = item.cures ? cureDisease(item.cures) : false;
if (item.heals) {
player.health = Math.min(100, numOr(player.health, 100) + item.heals);
addLog(`Ты вылечился. +${item.heals} здоровья.`);
healed = true;
}
if (!healed) {
addLog('Эта трава тебе не помогает.');
}
item.count = (item.count || 1) - 1;
if (item.count <= 0) {
player.inventory.splice(index, 1);
}
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
condition: player.condition
});
}
closeInventory();
updateStatsDisplay();
return;
}

// Обычный предмет — не трава
if (!used) {
addLog("Этот предмет нельзя использовать.");
return;
}

item.count = (item.count || 1) - 1;
if (item.count <= 0) {
player.inventory.splice(index, 1);
}

localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
hunger: player.hunger,
energy: player.energy,
thirst: player.thirst
});
}
closeInventory();
updateStatsDisplay();
}
//МЕНЮ ИГРОКОВ
function openPlayers() {
const modal = document.getElementById('players-modal');
if (!modal) return;
modal.style.display = 'flex';
displayOnlinePlayers();
}
function closePlayers() {
const modal = document.getElementById('players-modal');
if (modal) modal.style.display = 'none';
}
function toggleActions() {
const panel = document.getElementById('actions-panel');
if (panel) panel.classList.toggle('open');
}
function changePlayerRole(targetId) {
if (player.name !== 'версек') {
alert('Только предводитель может менять роли');
return;
}
const roles = ['котёнок', 'ученик', 'воин', 'целитель', 'старейшина', 'глашатай', 'предводитель'];
const currentRole = prompt('Введите роль: ' + roles.join(', '), 'воин');
if (!currentRole) return;
if (!roles.includes(currentRole)) {
alert('Неизвестная роль. Доступно: ' + roles.join(', '));
return;
}
onlineRef.child(targetId).update({ role: currentRole });
addLog(`Роль изменена на: ${currentRole}`);
}
function getNumericId(callback) {
let numericId = localStorage.getItem("numericId");
if (numericId) {
callback(numericId);
return;
}
const counterRef = db.ref('counter');
counterRef.transaction((current) => {
return (current || 0) + 1;
}, (error, committed, snapshot) => {
if (committed) {
const newId = String(snapshot.val()).padStart(2, '0');
localStorage.setItem("numericId", newId);
callback(newId);
}
});
}

//ЦЕЛИТЕЛЬСТВО
const PART_NAMES = {
head: 'Голова', torso: 'Туловище', frontLegL: 'Передняя левая лапа',
frontLegR: 'Передняя правая лапа', backLegL: 'Задняя левая лапа',
backLegR: 'Задняя правая лапа', tail: 'Хвост'
};
const PART_SHORT = { head: 'Голова', torso: 'Туловище', frontLegL: 'П.Левая', frontLegR: 'П.Правая', backLegL: 'З.Левая', backLegR: 'З.Правая', tail: 'Хвост' };
const PARTS_ORDER = ['head', 'frontLegL', 'torso', 'frontLegR', 'backLegL', 'tail', 'backLegR'];
const LEG_PARTS = ['frontLegL', 'frontLegR', 'backLegL', 'backLegR'];
const PART_STATUS = {
normal: { name: 'в норме', cls: '' },
wounded: { name: 'рана', cls: 'warn' },
bleeding: { name: 'кровотечение', cls: 'danger' },
broken: { name: 'перелом', cls: 'broken' },
splinted: { name: 'шина', cls: 'treated' }
};
const FRACTURE_TYPES = {
internal: { name: 'внутренний перелом', pain: 2, speed: 0.75, pulse: 4 },
displaced: { name: 'перелом со смещением', pain: 3, speed: 0.55, pulse: 8 },
open: { name: 'открытый перелом', pain: 3, speed: 0.45, pulse: 8 }
};
const BLEEDING_TYPES = {
capillary: { name: 'капиллярное', loss: 0.1, pulse: 4 },
venous: { name: 'венозное', loss: 0.25, pulse: 8 },
arterial: { name: 'артериальное', loss: 0.5, pulse: 12 }
};
const BLEED_TICK_MS = 5 * 60 * 1000;

function getPartName(key) {
return PART_NAMES[key] || key;
}

function hasActiveBleeding(part) {
return part && (part.status === 'bleeding' || part.bleedingActive === true);
}

function getBleedingType(part) {
return BLEEDING_TYPES[part && part.bleedType] ? part.bleedType : 'capillary';
}

function getRandomBleedingType() {
const roll = Math.random();
return roll < 0.55 ? 'capillary' : roll < 0.85 ? 'venous' : 'arterial';
}

function defaultBodyParts() {
const parts = {};
Object.keys(PART_NAMES).forEach(k => { parts[k] = { hp: 100, status: 'normal' }; });
return parts;
}

function numOr(v, def) {
return (typeof v === 'number' && !isNaN(v)) ? v : def;
}

function round1(n) {
return Math.round(n * 10) / 10;
}

function isUnconscious() {
return !!(player.condition && (player.condition.conscious === false || numOr(player.condition.blood, 5) <= 2));
}

// Боль от повреждённых частей тела
function getPartsPain(parts) {
let pain = 0;
Object.values(parts || {}).forEach(p => {
pain += (100 - numOr(p.hp, 100)) / 40;
if (hasActiveBleeding(p)) pain += 1;
const fracture = FRACTURE_TYPES[p.fractureType];
if (fracture) pain += fracture.pain;
else if (p.status === 'broken') pain += 2;
});
return pain;
}

// Единый расчёт показателей — для «Состояния» и «Осмотра»
function getVitals(data) {
const c = data.condition || {};
const parts = c.bodyParts || defaultBodyParts();
let activeBleedingRate = 0;
let bleedingPulse = 0;
let fracturePulse = 0;
Object.values(parts).forEach((part) => {
if (hasActiveBleeding(part)) {
const bleeding = BLEEDING_TYPES[getBleedingType(part)];
activeBleedingRate += bleeding.loss;
bleedingPulse += bleeding.pulse;
}
if (part.status === 'broken' || part.status === 'splinted') {
const fracture = FRACTURE_TYPES[part.fractureType];
if (fracture) fracturePulse += fracture.pulse;
}
});
const blood = Math.max(0, Math.min(5, numOr(c.blood, 5.0)));
const bloodLoss = 5 - blood;
const pulse = Math.min(240, Math.round(numOr(c.pulse, 140) + bloodLoss * 12 + bleedingPulse + fracturePulse));
const sys = Math.max(50, Math.round(numOr(c.pressureSys, 120) - bloodLoss * 12 - activeBleedingRate * 15));
const dia = Math.max(30, Math.round(numOr(c.pressureDia, 80) - bloodLoss * 6 - activeBleedingRate * 8));
return {
hp: Math.round(numOr(data.health, 100)),
hunger: Math.round(numOr(data.hunger, 50)),
energy: Math.round(numOr(data.energy, 80)),
thirst: Math.round(numOr(data.thirst, 50)),
temp: round1(numOr(c.temperature, 38.5)),
blood: blood,
oxygen: Math.round(numOr(c.oxygen, 98)),
infection: Math.round(numOr(c.infection, 0)),
poison: Math.round(numOr(c.poison, 0)),
pain: round1(Math.min(10, numOr(c.pain, 0) + getPartsPain(parts))),
pulse: pulse,
sys: sys,
dia: dia,
conscious: c.conscious !== false && blood > 2,
parts: parts,
diseases: c.diseases || []
};
}

function getThoughts(v) {
const t = [];
if (!v.conscious) return ["...Темнота..."];
if (v.temp > 39.5) t.push("Мне жарко и плохо...");
if (v.temp < 37.5) t.push("Меня знобит...");
if (v.pain > 5) t.push("Всё болит...");
if (v.infection > 0) t.push("Рана ноет и пульсирует...");
if (v.poison > 0) t.push("Меня тошнит, голова кружится...");
if (LEG_PARTS.some(k => v.parts[k] && v.parts[k].status === 'broken')) t.push("Лапа не двигается, это ужасно...");
const bleedingParts = Object.values(v.parts).filter(hasActiveBleeding);
if (bleedingParts.some(p => getBleedingType(p) === 'arterial')) t.push("Кровь бьёт сильной струёй...");
else if (bleedingParts.some(p => getBleedingType(p) === 'venous')) t.push("Кровь течёт непрерывно...");
else if (bleedingParts.length > 0) t.push("Из раны сочится кровь...");
if (Object.values(v.parts).some(p => p.status === 'wounded' || p.status === 'splinted')) t.push("Раны ноют, но заживают...");
if (v.parts.head && v.parts.head.hp < 50) t.push("Голова гудит, всё плывёт...");
if (v.hunger === 0 && v.thirst === 0) t.push("Я умираю от голода и жажды...");
else if (v.hunger === 0) t.push("Я умираю от голода...");
else if (v.thirst === 0) t.push("Я умираю от жажды...");
else if (v.hunger < 20) t.push("Я очень голоден...");
if (v.energy < 20) t.push("Я еле стою на лапах...");
if (v.hp < 30) t.push("Мне очень плохо...");
if (v.oxygen < 90) t.push("Мне тяжело дышать...");
if (v.pulse > 180) t.push("Сердце колотится как пойманная птица...");
if (v.pulse < 100) t.push("Сердце бьётся еле-еле...");
if (v.blood < 3.5) t.push("Я чувствую, как слабею... Лапы холодные...");
v.diseases.forEach(key => {
const d = DISEASES[key];
if (d && d.thought) t.push(d.thought);
});
if (t.length === 0) t.push("Мне хорошо, я здоров.");
return t;
}

function vitRow(icon, label, value, cls, barPct) {
const barHtml = barPct === undefined ? '' :
`<div class="vit-bar"><div class="vit-bar-fill ${barPct < 25 ? 'danger' : (barPct < 50 ? 'warn' : '')}" style="width:${Math.max(0, Math.min(100, barPct))}%"></div></div>`;
const iconHtml = icon.startsWith('images/')
? `<img class="vit-icon" src="${escapeHtml(icon)}" alt="" style="width:24px;height:24px;object-fit:contain;">`
: `<span class="vit-icon">${icon}</span>`;
return `<div class="vit-row ${cls || ''}"><div class="vit-left">${iconHtml}<span class="vit-label">${label}</span></div>${barHtml}<span class="vit-value">${value}</span></div>`;
}

function renderVitals(v) {
let html = '';
html += vitRow(GAME_ICONS.health, 'Здоровье', v.hp, v.hp < 30 ? 'danger' : '', v.hp);
html += vitRow(GAME_ICONS.hunger, 'Голод', v.hunger, v.hunger < 20 ? 'danger' : '', v.hunger);
html += vitRow(GAME_ICONS.energy, 'Энергия', v.energy, v.energy < 20 ? 'danger' : '', v.energy);
html += vitRow(GAME_ICONS.thirst, 'Жажда', v.thirst, v.thirst < 20 ? 'danger' : '', v.thirst);
html += `<hr>`;
html += vitRow(GAME_ICONS.blood, 'Кровь', `${v.blood.toFixed(2)} л`, v.blood < 3.5 ? 'danger' : (v.blood < 4.5 ? 'warn' : ''));
html += vitRow(GAME_ICONS.pulse, 'Пульс', `${v.pulse} уд/мин`, (v.pulse > 180 || v.pulse < 90) ? 'danger' : '');
html += vitRow(GAME_ICONS.pressure, 'Давление', `${v.sys}/${v.dia}`, v.sys < 90 ? 'danger' : '');
html += vitRow(GAME_ICONS.consciousness, 'Сознание', v.conscious ? 'В сознании' : 'Без сознания', v.conscious ? '' : 'danger');
html += `<hr>`;
html += vitRow(GAME_ICONS.temperature, 'Темп.', `${v.temp.toFixed(1)}°C`, (v.temp > 39.5 || v.temp < 37.5) ? 'danger' : '');
html += vitRow(GAME_ICONS.oxygen, 'Кислород', `${v.oxygen}%`, v.oxygen < 90 ? 'danger' : '', v.oxygen);
html += vitRow(GAME_ICONS.infection, 'Инфекция', v.infection > 0 ? v.infection + '%' : 'нет', v.infection > 0 ? 'danger' : '');
html += vitRow(GAME_ICONS.pain, 'Боль', v.pain > 0 ? `${v.pain}/10` : 'нет', v.pain > 5 ? 'danger' : (v.pain > 2 ? 'warn' : ''));
if (v.diseases.length > 0) {
const names = v.diseases.map(k => DISEASES[k] ? DISEASES[k].name : k).join(', ');
html += vitRow(GAME_ICONS.disease, 'Болезни', names, 'danger');
}
return html;
}
let selectedPart = null;

function renderBodyScheme(parts, clickable) {
let html = `<div class="body-scheme">`;
PARTS_ORDER.forEach(key => {
const p = parts[key] || { hp: 100, status: 'normal' };
const st = PART_STATUS[p.status] || PART_STATUS.normal;
const conditionLabel = p.fractureType && FRACTURE_TYPES[p.fractureType]
? `${FRACTURE_TYPES[p.fractureType].name}${p.status === 'splinted' ? ' · шина' : ''}${hasActiveBleeding(p) ? ` · ${BLEEDING_TYPES[getBleedingType(p)].name} кровь` : ''}${p.bandaged ? ' · повязка' : ''}`
: p.status === 'bleeding'
? `${BLEEDING_TYPES[getBleedingType(p)].name} кровотечение`
: st.name;
const low = p.hp < 50 && p.status === 'normal' ? 'warn' : '';
const sel = clickable && selectedPart === key ? 'selected' : '';
const click = clickable ? `onclick="selectBodyPart('${key}')"` : '';
html += `<div class="body-part ${key} ${st.cls} ${low} ${sel} ${clickable ? 'clickable' : ''}" ${click} data-testid="body-part-${key}">`;
html += `<span class="bp-name">${PART_SHORT[key]}</span>`;
html += `<span class="bp-hp">${Math.round(p.hp)}%</span>`;
html += `<div class="bp-bar"><div style="width:${Math.max(0, p.hp)}%"></div></div>`;
if (p.status !== 'normal') html += `<span class="bp-status">${conditionLabel}</span>`;
html += `</div>`;
});
html += `</div>`;
html += `<div class="body-legend"><div class="body-legend-title">Обозначения состояния:</div><div class="body-legend-items"><span class="lg ok">Норма</span><span class="lg warn">Рана</span><span class="lg danger">Кровотечение</span><span class="lg broken">Перелом</span><span class="lg treated">Шина — перелом зафиксирован</span></div></div>`;
return html;
}

// Панель лечения для выбранной части тела
function renderTreatPanel(targetId, v) {
if (!selectedPart || player.role !== 'целитель') {
return player.role === 'целитель' ? `<div class="treat-hint">Нажми на часть тела, чтобы лечить</div>` : '';
}
const p = v.parts[selectedPart] || { hp: 100, status: 'normal' };
const herbs = (player.inventory || []).map((it, i) => ({ it, i })).filter(x => x.it.type === 'herb' && !x.it.raw);
const bandage = (player.inventory || []).map((it, i) => ({ it, i }))
.find(x => x.it.craftKey === 'medicalBandage' && (x.it.count || 1) > 0);
const bleeding = hasActiveBleeding(p);
const openFracture = p.fractureType === 'open';
let html = `<div class="treat-panel" data-testid="treat-panel">`;
const statusName = p.fractureType && FRACTURE_TYPES[p.fractureType]
? `${FRACTURE_TYPES[p.fractureType].name}${p.status === 'splinted' ? ' · шина' : ''}${p.bandaged ? ' · обработан' : ''}`
: p.status === 'bleeding' ? `${BLEEDING_TYPES[getBleedingType(p)].name} кровотечение`
: (PART_STATUS[p.status] || PART_STATUS.normal).name;
html += `<div class="treat-title">${getPartName(selectedPart)} — ${Math.round(p.hp)}% (${statusName})</div>`;
html += `<div class="treat-actions">`;
if (bleeding) html += `<button onclick="treatPart('${targetId}','stopBleeding')" data-testid="treat-stop-bleeding-btn">Остановить кровь (${BLEEDING_TYPES[getBleedingType(p)].name})</button>`;
if (openFracture && !p.bandaged) {
if (bleeding) {
html += `<div class="treat-hint">Сначала останови кровотечение, затем наложи лечебную повязку.</div>`;
} else if (bandage) {
html += `<button onclick="treatPart('${targetId}','bandage',${bandage.i})" data-testid="treat-bandage-btn">Обработать открытый перелом повязкой</button>`;
} else {
html += `<div class="treat-hint">Для открытого перелома нужна лечебная повязка (паутина и обработанная трава).</div>`;
}
}
if (p.status === 'broken') {
const hasSplint = (player.inventory || []).some(item => item.craftKey === 'looseSplint' && (item.count || 1) > 0);
const hasWeb = (player.inventory || []).some(item => item.materialKey === 'spiderweb' && (item.count || 1) > 0);
if (openFracture && bleeding) {
html += `<div class="treat-hint">Сначала останови кровотечение.</div>`;
} else if (openFracture && !p.bandaged) {
html += `<div class="treat-hint">Сначала обработай открытый перелом лечебной повязкой.</div>`;
} else if (hasSplint && hasWeb) {
html += `<button onclick="startSplintMinigame('${targetId}','${selectedPart}')" data-testid="treat-splint-btn">Наложить шину — мини-игра</button>`;
} else {
const missing = [];
if (!hasSplint) missing.push('незакреплённая шина');
if (!hasWeb) missing.push('паутина');
html += `<div class="treat-hint">Нужно: ${missing.join(' и ')}</div>`;
}
}
if (p.status === 'normal' && p.hp >= 100) html += `<span class="treat-ok">Эта часть тела здорова</span>`;
html += `</div>`;
if (p.hp < 100 && !bleeding) {
if (herbs.length === 0) {
html += `<div class="treat-hint">Нужна обработанная трава, чтобы залечить рану</div>`;
} else {
html += `<div class="treat-actions">`;
herbs.forEach(x => {
html += `<button onclick="treatPart('${targetId}','herbPart',${x.i})" data-testid="treat-herb-${x.i}">Приложить: ${escapeHtml(x.it.name.replace(' (обработанная)', ''))}</button>`;
});
html += `</div>`;
}
}
html += `</div>`;
return html;
}

let splintGame = null;

function startSplintMinigame(targetId, partKey) {
if (player.role !== 'целитель' || isUnconscious()) return;
if (!LEG_PARTS.includes(partKey)) return;
const target = targetId === getPlayerId()
? player
: (inspectTargetId === targetId ? inspectData : null);
const part = target && getVitals(target).parts[partKey];
if (!part || part.status !== 'broken') {
addLog('На этой лапе сейчас нет перелома.');
return;
}
if (hasActiveBleeding(part)) {
addLog('Сначала останови кровотечение.');
return;
}
if (part.fractureType === 'open' && !part.bandaged) {
addLog('Сначала обработай открытый перелом лечебной повязкой.');
return;
}
const hasSplint = (player.inventory || []).some(item => item.craftKey === 'looseSplint' && (item.count || 1) > 0);
const hasWeb = (player.inventory || []).some(item => item.materialKey === 'spiderweb' && (item.count || 1) > 0);
if (!hasSplint || !hasWeb) {
addLog('Нужны незакреплённая шина и паутина.');
refreshMedicalViews();
return;
}

splintGame = { targetId, partKey, stage: 1 };
let modal = document.getElementById('splint-minigame-modal');
if (!modal) {
modal = document.createElement('div');
modal.id = 'splint-minigame-modal';
modal.className = 'splint-game-modal';
document.body.appendChild(modal);
}
renderSplintMinigame();
}

function renderSplintMinigame() {
const modal = document.getElementById('splint-minigame-modal');
if (!modal || !splintGame) return;
const partName = getPartName(splintGame.partKey).toLowerCase();
const wrapping = splintGame.stage === 2;
modal.innerHTML = `
<div class="splint-game-box">
<h2>${wrapping ? 'Закрепи шину паутиной' : 'Наложи шину'}</h2>
<p>${wrapping ? 'Перетащи паутину на лапу, чтобы зафиксировать шину.' : `Перетащи незакреплённую шину на ${partName}.`}</p>
<div class="splint-game-board">
<div class="splint-game-item ${wrapping ? 'web-item' : ''}" data-drag-item="${wrapping ? 'web' : 'splint'}" role="button" tabindex="0">
<img class="splint-game-icon" src="${wrapping ? GAME_ICONS.spiderweb : GAME_ICONS.splint}" alt="" style="width:64px;height:64px;object-fit:contain;">
<span>${wrapping ? 'Паутина' : 'Незакреплённая шина'}</span>
</div>
<div class="splint-limb-target" data-drop-target="limb">
<img class="splint-limb-icon" src="${wrapping ? GAME_ICONS.bandage : GAME_ICONS.paw}" alt="" style="width:64px;height:64px;object-fit:contain;">
<span>${escapeHtml(getPartName(splintGame.partKey))}</span>
<span class="splint-drop-hint">${wrapping ? 'Перетащи сюда для фиксации' : 'Положи шину сюда'}</span>
</div>
</div>
<div class="splint-game-status">${wrapping ? 'Шина на месте — теперь закрепи её.' : 'Шаг 1 из 2: установка шины'}</div>
<button type="button" class="splint-game-cancel" onclick="closeSplintMinigame()">Отмена</button>
</div>`;

const dragItem = modal.querySelector('[data-drag-item]');
if (dragItem) {
dragItem.addEventListener('pointerdown', beginSplintDrag);
dragItem.addEventListener('keydown', (event) => {
if ((event.key === 'Enter' || event.key === ' ') && splintGame) {
event.preventDefault();
if (splintGame.stage === 1) {
placeSplintOnTarget();
} else {
finishSplintWrapping();
}
}
});
}
}

function beginSplintDrag(event) {
if (!splintGame || event.button !== 0) return;
event.preventDefault();
const item = event.currentTarget;
const ghost = item.cloneNode(true);
ghost.classList.add('splint-drag-ghost');
ghost.style.left = `${event.clientX}px`;
ghost.style.top = `${event.clientY}px`;
document.body.appendChild(ghost);
item.classList.add('is-dragging');

const move = (moveEvent) => {
ghost.style.left = `${moveEvent.clientX}px`;
ghost.style.top = `${moveEvent.clientY}px`;
};
const finish = (upEvent) => {
document.removeEventListener('pointermove', move);
document.removeEventListener('pointerup', finish);
ghost.remove();
item.classList.remove('is-dragging');
const target = document.elementFromPoint(upEvent.clientX, upEvent.clientY);
if (!target || !target.closest('[data-drop-target="limb"]')) return;
if (splintGame && splintGame.stage === 1) placeSplintOnTarget();
else if (splintGame && splintGame.stage === 2) finishSplintWrapping();
};

document.addEventListener('pointermove', move);
document.addEventListener('pointerup', finish);
}

function placeSplintOnTarget() {
if (!splintGame || splintGame.stage !== 1) return;
splintGame.stage = 2;
renderSplintMinigame();
}

function finishSplintWrapping() {
if (!splintGame || splintGame.stage !== 2) return;
const targetId = splintGame.targetId;
const partKey = splintGame.partKey;
const splint = (player.inventory || []).find(item => item.craftKey === 'looseSplint' && (item.count || 1) > 0);
const web = (player.inventory || []).find(item => item.materialKey === 'spiderweb' && (item.count || 1) > 0);
if (!splint || !web) {
addLog('Для фиксации нужны шина и паутина.');
closeSplintMinigame();
refreshMedicalViews();
return;
}

const target = targetId === getPlayerId()
? player
: (inspectTargetId === targetId ? inspectData : null);
const part = target && getVitals(target).parts[partKey];
if (!part || part.status !== 'broken' || hasActiveBleeding(part) ||
(part.fractureType === 'open' && !part.bandaged)) {
addLog('Перелом уже вылечен или пациент ушёл.');
closeSplintMinigame();
refreshMedicalViews();
return;
}

const treatment = { type: 'splint', part: partKey, by: player.name };
closeSplintMinigame();

if (targetId === getPlayerId()) {
consumeInventoryItem(splint);
consumeInventoryItem(web);
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
applyTreatment(treatment);
} else {
applyRemoteSplint(targetId, partKey, treatment).then(() => {
consumeInventoryItem(splint);
consumeInventoryItem(web);
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog(`Ты закрепил шину на ${getPartName(partKey).toLowerCase()}.`);
loadInventory();
refreshMedicalViews();
}).catch((error) => {
console.error('Не удалось сохранить шину для пациента:', error);
addLog('Не удалось сохранить лечение. Материалы не потрачены; попробуй ещё раз.');
refreshMedicalViews();
});
}
loadInventory();
}

async function applyRemoteSplint(targetId, partKey, treatment) {
let login;
const onlineSnapshot = await onlineRef.child(targetId).once('value');
login = onlineSnapshot.val() && onlineSnapshot.val().login;

if (!login) {
const accountSnapshot = await accountsRef.orderByChild('playerId').equalTo(targetId).once('value');
if (accountSnapshot.exists()) login = Object.keys(accountSnapshot.val())[0];
}
if (!login) throw new Error(`Не найден аккаунт для игрока ${targetId}`);

const accountRef = accountsRef.child(login).child('catData');
const onlineCondition = onlineSnapshot.val() && onlineSnapshot.val().condition;
const accountSnapshot = await accountRef.once('value');
const savedCat = accountSnapshot.val();
if (!savedCat) throw new Error(`Не найдено сохранение игрока ${targetId}`);
const condition = savedCat.condition || {};
const bodyParts = Object.assign(
defaultBodyParts(),
onlineCondition && onlineCondition.bodyParts,
condition.bodyParts
);
const onlinePart = onlineCondition && onlineCondition.bodyParts && onlineCondition.bodyParts[partKey];
if (bodyParts[partKey].status !== 'broken' && onlinePart && onlinePart.status === 'broken') {
bodyParts[partKey] = onlinePart;
}
if (bodyParts[partKey].status !== 'broken') {
throw new Error(`Перелом ${partKey} больше не требует шины`);
}
if (hasActiveBleeding(bodyParts[partKey])) {
throw new Error('Сначала нужно остановить кровотечение');
}
if (bodyParts[partKey].fractureType === 'open' && !bodyParts[partKey].bandaged) {
throw new Error('Открытый перелом нужно обработать лечебной повязкой');
}
bodyParts[partKey] = Object.assign({}, bodyParts[partKey], { status: 'splinted' });
const brokenBones = Object.keys(bodyParts)
.filter((key) => bodyParts[key].status === 'broken')
.map(getPartName);
await accountRef.child('condition').update({ bodyParts, brokenBones });
savedCat.condition = Object.assign({}, condition, { bodyParts, brokenBones });

try {
await onlineRef.child(targetId).update({ condition: savedCat.condition });
const treatmentsRef = onlineRef.child(targetId).child('treatments');
const pendingSnapshot = await treatmentsRef.once('value');
let alreadyPending = false;
pendingSnapshot.forEach((snapshot) => {
const pending = snapshot.val();
if (pending && pending.type === treatment.type && pending.part === treatment.part) {
alreadyPending = true;
}
});
if (!alreadyPending) await treatmentsRef.push(treatment);
} catch (error) {
console.error('Лечение сохранено в аккаунте, но не удалось синхронизировать онлайн-сессию:', error);
}
}

function closeSplintMinigame() {
const modal = document.getElementById('splint-minigame-modal');
if (modal) modal.remove();
splintGame = null;
}

// Дать траву от болезни (целитель другому игроку)
function renderCurePanel(targetId, v) {
if (player.role !== 'целитель' || v.diseases.length === 0) return '';
const herbs = (player.inventory || []).map((it, i) => ({ it, i }))
.filter(x => x.it.type === 'herb' && !x.it.raw && v.diseases.includes(x.it.cures));
if (herbs.length === 0) return `<div class="treat-hint">Нет подходящих трав от болезней пациента</div>`;
let html = `<div class="treat-actions">`;
herbs.forEach(x => {
const d = DISEASES[x.it.cures];
html += `<button onclick="treatPart('${targetId}','cure',${x.i})" data-testid="cure-herb-${x.i}">Дать ${escapeHtml(x.it.name.replace(' (обработанная)', ''))} от «${d ? d.name : x.it.cures}»</button>`;
});
html += `</div>`;
return html;
}

function selectBodyPart(key) {
selectedPart = selectedPart === key ? null : key;
refreshMedicalViews();
}

// Целитель лечит: себя — сразу, другого — через Firebase
function treatPart(targetId, type, herbIndex) {
if (player.role !== 'целитель') return;
if (isUnconscious()) { addLog('Ты без сознания...'); return; }
if (type === 'splint') {
addLog('Чтобы наложить шину, пройди мини-игру.');
return;
}
if (type === 'bandage') {
const item = player.inventory && player.inventory[herbIndex];
if (!item || item.craftKey !== 'medicalBandage') {
addLog('Нужна лечебная повязка.');
return;
}
const target = targetId === getPlayerId()
? player
: (inspectTargetId === targetId ? inspectData : null);
const part = target && target.condition && target.condition.bodyParts &&
target.condition.bodyParts[selectedPart];
if (!part || part.fractureType !== 'open' || hasActiveBleeding(part) || part.bandaged) {
addLog('Открытый перелом нужно сначала освободить от кровотечения.');
return;
}
const treatment = { type: 'bandage', part: selectedPart, by: player.name };
if (targetId === getPlayerId()) {
consumeInventoryItem(item);
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
applyTreatment(treatment);
loadInventory();
return;
}
onlineRef.child(targetId).child('treatments').push(treatment).then(() => {
consumeInventoryItem(item);
localStorage.setItem('catData', JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
addLog('Ты обработал открытый перелом лечебной повязкой.');
loadInventory();
refreshMedicalViews();
}).catch((error) => {
console.error('Не удалось отправить лечение открытого перелома:', error);
addLog('Не удалось отправить лечение. Повязка не потрачена.');
});
return;
}
const t = { type: type, part: type === 'cure' ? null : selectedPart, by: player.name };
if (herbIndex !== undefined) {
const item = player.inventory && player.inventory[herbIndex];
if (!item || item.type !== 'herb' || item.raw) return;
t.heals = item.heals || 10;
t.cures = item.cures || null;
item.count = (item.count || 1) - 1;
if (item.count <= 0) player.inventory.splice(herbIndex, 1);
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
}
if (targetId === getPlayerId()) {
applyTreatment(t);
} else {
onlineRef.child(targetId).child('treatments').push(t);
addLog('Ты оказываешь помощь...');
}
}

function cureDisease(key) {
const c = player.condition;
if (!c || !c.diseases) return false;
const idx = c.diseases.indexOf(key);
if (idx === -1) return false;
c.diseases.splice(idx, 1);
const d = DISEASES[key];
if (d) {
if (d.temp) c.temperature = 38.5;
if (d.oxygen) c.oxygen = 98;
if (d.infection) c.infection = 0;
if (d.poison) c.poison = 0;
if (d.pain) c.pain = 0;
}
addLog(`Ты вылечил: ${d ? d.name : key}`);
return true;
}

function applyTreatment(t) {
const c = player.condition;
if (!c) return;
if (!c.bodyParts) c.bodyParts = defaultBodyParts();
const part = t.part ? c.bodyParts[t.part] : null;
const who = t.by && t.by !== player.name ? `${t.by}: ` : '';
if (t.type === 'stopBleeding' && hasActiveBleeding(part)) {
if (part.status === 'bleeding') part.status = 'wounded';
part.bleedingActive = false;
delete part.bleedNextAt;
addLog(`${who}кровь остановлена (${getPartName(t.part)})`, GAME_ICONS.bandage);
} else if (t.type === 'bandage' && part && part.fractureType === 'open' &&
!hasActiveBleeding(part) && !part.bandaged) {
part.bandaged = true;
delete part.infectionNextAt;
addLog(`${who}открытый перелом обработан повязкой (${getPartName(t.part)})`, GAME_ICONS.bandage);
} else if (t.type === 'splint' && part && part.status === 'broken' &&
!hasActiveBleeding(part) && (part.fractureType !== 'open' || part.bandaged)) {
part.status = 'splinted';
addLog(`${who}наложена шина (${getPartName(t.part)})`, GAME_ICONS.splint);
} else if (t.type === 'herbPart' && part) {
part.hp = Math.min(100, part.hp + (t.heals || 10) * 2);
if (part.status === 'wounded' && part.hp >= 80) part.status = 'normal';
c.pain = Math.max(0, numOr(c.pain, 0) - 2);
if (part.fractureType === 'open' && part.bandaged) {
c.infection = Math.max(0, numOr(c.infection, 0) - 10);
}
addLog(`${who}рана обработана (${getPartName(t.part)}) — ${Math.round(part.hp)}%`, GAME_ICONS.herb);
} else if (t.type === 'cure') {
if (cureDisease(t.cures)) player.health = Math.min(100, numOr(player.health, 100) + (t.heals || 0));
else addLog('Эта трава не помогла.');
}
syncBodyState();
saveCondition();
}

// Список сломанных частей (для старого поля brokenBones)
function syncBodyState() {
const c = player.condition;
c.brokenBones = Object.keys(c.bodyParts).filter(k => c.bodyParts[k].status === 'broken').map(getPartName);
}

function saveCondition() {
localStorage.setItem("catData", JSON.stringify(player));
if (typeof saveAccount === 'function') saveAccount();
if (myOnlineRef) myOnlineRef.update({ health: player.health, energy: player.energy, condition: player.condition });
updateStatsDisplay();
refreshMedicalViews();
}

let bleedingTicker = null;
function startBleedingTicker() {
if (bleedingTicker) clearInterval(bleedingTicker);
bleedingTicker = setInterval(() => {
if (!myOnlineRef) return;
processBleedingTick(Date.now());
}, 15000);
}

function processBleedingTick(now) {
if (!player.condition || !player.condition.bodyParts) return 0;
let bloodLoss = 0;
let infectionIncrease = 0;
Object.values(player.condition.bodyParts).forEach((part) => {
if (hasActiveBleeding(part)) {
if (!part.bleedNextAt) part.bleedNextAt = now + BLEED_TICK_MS;
if (now >= part.bleedNextAt) {
const ticks = Math.floor((now - part.bleedNextAt) / BLEED_TICK_MS) + 1;
bloodLoss += BLEEDING_TYPES[getBleedingType(part)].loss * ticks;
part.bleedNextAt += ticks * BLEED_TICK_MS;
}
} else {
delete part.bleedNextAt;
}
if (part.fractureType === 'open' && !part.bandaged) {
if (!part.infectionNextAt) part.infectionNextAt = now + BLEED_TICK_MS;
if (now >= part.infectionNextAt) {
const ticks = Math.floor((now - part.infectionNextAt) / BLEED_TICK_MS) + 1;
infectionIncrease += 5 * ticks;
part.infectionNextAt += ticks * BLEED_TICK_MS;
}
} else {
delete part.infectionNextAt;
}
});
if (bloodLoss <= 0 && infectionIncrease <= 0) return 0;
const c = player.condition;
if (bloodLoss > 0) {
c.blood = Math.max(0, Math.round((numOr(c.blood, 5) - bloodLoss) * 100) / 100);
player.health = Math.max(0, numOr(player.health, 100) - bloodLoss * 20);
addLog(`Кровотечение: потеряно ${bloodLoss.toFixed(2)} л крови.`, GAME_ICONS.blood);
}
if (infectionIncrease > 0) {
c.infection = Math.min(100, numOr(c.infection, 0) + infectionIncrease);
addLog('Открытая рана не обработана: растёт риск инфекции.', GAME_ICONS.warning);
}
saveCondition();
checkDeath();
return bloodLoss;
}

// Травма части тела
function tryGetInjured(chance, cause) {
if (Math.random() > chance) return null;
const c = player.condition;
if (!c.bodyParts) c.bodyParts = defaultBodyParts();
const keys = Object.keys(c.bodyParts);
const key = keys[Math.floor(Math.random() * keys.length)];
const part = c.bodyParts[key];
const dmg = 10 + Math.floor(Math.random() * 26);
part.hp = Math.max(0, part.hp - dmg);
const r = Math.random();
if (LEG_PARTS.includes(key) && dmg > 25 && r < 0.5) {
const fractureRoll = Math.random();
part.status = 'broken';
part.fractureType = fractureRoll < 0.15 ? 'open' : fractureRoll < 0.55 ? 'displaced' : 'internal';
part.bandaged = false;
part.bleedingActive = part.fractureType === 'open';
if (part.bleedingActive) {
part.bleedType = getRandomBleedingType();
part.bleedNextAt = Date.now() + BLEED_TICK_MS;
} else {
delete part.bleedNextAt;
}
if (part.fractureType === 'open') part.infectionNextAt = Date.now() + BLEED_TICK_MS;
} else if (r < 0.45 && part.status !== 'broken') {
part.status = 'bleeding';
part.bleedType = getRandomBleedingType();
part.bleedingActive = true;
part.bleedNextAt = Date.now() + BLEED_TICK_MS;
} else if (part.status === 'normal') part.status = 'wounded';
player.health = Math.max(0, numOr(player.health, 100) - Math.round(dmg / 4));
const st = FRACTURE_TYPES[part.fractureType]
? FRACTURE_TYPES[part.fractureType].name
: part.status === 'bleeding'
? `${BLEEDING_TYPES[getBleedingType(part)].name} кровотечение`
: PART_STATUS[part.status].name;
addLog(`${cause}: ${getPartName(key)} — ${st} (-${dmg}%)`, GAME_ICONS.warning);
syncBodyState();
saveCondition();
checkDeath();
return key;
}

// Скорость с учётом сломанных лап
function getMoveSpeed() {
const parts = (player.condition && player.condition.bodyParts) || {};
const injuryPenalty = LEG_PARTS.reduce((total, key) => {
const part = parts[key];
if (!part || (part.status !== 'broken' && part.status !== 'splinted')) return total;
const fracture = FRACTURE_TYPES[part.fractureType];
return total + (fracture ? 1 - fracture.speed : 0.25);
}, 0);
return MOVE_SPEED * Math.max(0.3, 1 - injuryPenalty);
}

// Входящие процедуры от целителей
function listenTreatments() {
if (!myOnlineRef) return;
myOnlineRef.child('treatments').on('child_added', (snap) => {
const t = snap.val();
snap.ref.remove();
if (t) applyTreatment(t);
});
}

function openCondition() {
const modal = document.getElementById('condition-modal');
if (!modal) return;
modal.style.display = 'flex';
selectedPart = null;
loadCondition();
}

function closeCondition() {
const modal = document.getElementById('condition-modal');
if (modal) modal.style.display = 'none';
selectedPart = null;
}

function loadCondition() {
const container = document.getElementById('condition-content');
if (!container) return;
const v = getVitals(player);
const isHealer = player.role === 'целитель';
let html = `<div class="cond-header">`;
html += `<img src="${player.skin || getCatImage(player.color)}" class="cond-cat-img">`;
html += `<div class="cond-moons"><img class="condition-moon-icon" src="${GAME_ICONS.moon}" alt="" style="width:20px;height:20px;object-fit:contain;vertical-align:middle;"> Лун: ${getMoons()}</div></div>`;
html += `<div class="cond-layout"><div class="cond-stats">`;
if (isHealer) {
html += renderVitals(v);
} else {
html += vitRow(GAME_ICONS.health, 'Здоровье', v.hp, v.hp < 30 ? 'danger' : '', v.hp);
html += vitRow(GAME_ICONS.hunger, 'Голод', v.hunger, v.hunger < 20 ? 'danger' : '', v.hunger);
html += vitRow(GAME_ICONS.energy, 'Энергия', v.energy, v.energy < 20 ? 'danger' : '', v.energy);
html += vitRow(GAME_ICONS.thirst, 'Жажда', v.thirst, v.thirst < 20 ? 'danger' : '', v.thirst);
if (v.diseases.length > 0) {
html += vitRow(GAME_ICONS.disease, 'Болезни', v.diseases.map(k => DISEASES[k] ? DISEASES[k].name : k).join(', '), 'danger');
}
}
html += `</div><div class="cond-body">`;
html += renderBodyScheme(v.parts, isHealer);
html += renderTreatPanel(getPlayerId(), v);
html += `</div></div>`;
html += '<div class="inspect-thoughts">';
getThoughts(v).forEach(t => { html += `<div>«${t}»</div>`; });
html += '</div>';
container.innerHTML = html;
}

let inspectRef = null;
let inspectTargetId = null;
let inspectData = null;
let inspectSig = null;
let heartbeatPulse = null;
let heartbeatAnimationFrame = null;

function stopHeartbeat() {
if (heartbeatAnimationFrame !== null) {
cancelAnimationFrame(heartbeatAnimationFrame);
heartbeatAnimationFrame = null;
}
}

function startHeartbeat(pulse) {
const canvas = document.getElementById('heartbeat-canvas');
const context = canvas && canvas.getContext('2d');
if (!canvas || !context) return;

stopHeartbeat();
const safePulse = Math.max(30, Math.min(240, numOr(pulse, 140)));
const startedAt = performance.now();

function drawHeartbeat(now) {
const modal = document.getElementById('inspect-modal');
if (!modal || modal.style.display !== 'flex') {
stopHeartbeat();
return;
}

const rect = canvas.getBoundingClientRect();
if (!rect.width || !rect.height) {
heartbeatAnimationFrame = requestAnimationFrame(drawHeartbeat);
return;
}

const pixelRatio = window.devicePixelRatio || 1;
const width = Math.round(rect.width * pixelRatio);
const height = Math.round(rect.height * pixelRatio);
if (canvas.width !== width || canvas.height !== height) {
canvas.width = width;
canvas.height = height;
}
context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

const viewWidth = rect.width;
const viewHeight = rect.height;
const centerY = viewHeight / 2;
const elapsed = (now - startedAt) / 1000;
const beatDuration = 60 / safePulse;
const visibleDuration = 5;

context.fillStyle = '#000';
context.fillRect(0, 0, viewWidth, viewHeight);

context.strokeStyle = 'rgba(0, 255, 65, 0.12)';
context.lineWidth = 1;
context.beginPath();
for (let x = 20; x < viewWidth; x += 20) {
context.moveTo(x, 0);
context.lineTo(x, viewHeight);
}
for (let y = 20; y < viewHeight; y += 20) {
context.moveTo(0, y);
context.lineTo(viewWidth, y);
}
context.stroke();

context.beginPath();
context.strokeStyle = '#00ff41';
context.lineWidth = 2;
context.shadowColor = '#00ff41';
context.shadowBlur = 7;

const samples = Math.ceil(viewWidth);
for (let i = 0; i <= samples; i++) {
const x = (i / samples) * viewWidth;
const time = elapsed - ((viewWidth - x) / viewWidth) * visibleDuration;
const phase = ((time % beatDuration) + beatDuration) % beatDuration / beatDuration;
let amplitude = 0;

if (phase >= 0.12 && phase < 0.2) {
amplitude = Math.sin(((phase - 0.12) / 0.08) * Math.PI) * 0.12;
} else if (phase >= 0.285 && phase < 0.31) {
amplitude = -0.18 * (1 - (phase - 0.285) / 0.025);
} else if (phase >= 0.31 && phase < 0.34) {
amplitude = 1 - Math.abs((phase - 0.325) / 0.015);
} else if (phase >= 0.34 && phase < 0.38) {
amplitude = -0.25 * (1 - (phase - 0.34) / 0.04);
} else if (phase >= 0.48 && phase < 0.65) {
amplitude = Math.sin(((phase - 0.48) / 0.17) * Math.PI) * 0.28;
}

const y = centerY - amplitude * (viewHeight * 0.38);
if (i === 0) context.moveTo(x, y);
else context.lineTo(x, y);
}
context.stroke();
context.shadowBlur = 0;
heartbeatAnimationFrame = requestAnimationFrame(drawHeartbeat);
}

heartbeatAnimationFrame = requestAnimationFrame(drawHeartbeat);
}

function closeInspect() {
const modal = document.getElementById('inspect-modal');
if (modal) modal.style.display = 'none';
if (inspectRef) inspectRef.off();
inspectRef = null;
inspectTargetId = null;
inspectData = null;
inspectSig = null;
heartbeatPulse = null;
stopHeartbeat();
selectedPart = null;
}

function inspectPlayer(targetId) {
const modal = document.getElementById('inspect-modal');
if (!modal) return;
modal.style.display = 'flex';
if (inspectRef) inspectRef.off();
selectedPart = null;
heartbeatPulse = null;
inspectSig = null;
inspectTargetId = targetId;
inspectRef = onlineRef.child(targetId);
inspectRef.on('value', (snap) => {
const data = snap.val();
if (!data) {
addLog('Пациент ушёл.');
closeInspect();
return;
}
// Перерисовываем только при смене состояния, а не координат
const sig = JSON.stringify(Object.assign({}, data, { posX: 0, posY: 0, lastSeen: 0 }));
if (sig === inspectSig) return;
inspectSig = sig;
inspectData = data;
renderInspect();
});
}

function renderInspect() {
const box = document.getElementById('inspect-content');
if (!box || !inspectData) return;
const v = getVitals(inspectData);
let html = `<div class="inspect-name">${escapeHtml(inspectData.name)} | ${escapeHtml(inspectData.role || 'котёнок')}</div>`;
html += `<div class="inspect-layout">`;
html += `<div class="inspect-stats">${renderVitals(v)}</div>`;
html += `<div class="inspect-body">${renderBodyScheme(v.parts, true)}${renderTreatPanel(inspectTargetId, v)}${renderCurePanel(inspectTargetId, v)}</div>`;
html += `</div>`;
html += '<div class="inspect-thoughts">';
getThoughts(v).forEach(t => { html += `<div>«${t}»</div>`; });
html += '</div>';
box.innerHTML = html;
// ЭКГ перезапускаем только при смене пульса
if (v.pulse !== heartbeatPulse) {
heartbeatPulse = v.pulse;
startHeartbeat(v.pulse);
}
}

function refreshMedicalViews() {
const cm = document.getElementById('condition-modal');
if (cm && cm.style.display === 'flex') loadCondition();
const im = document.getElementById('inspect-modal');
if (im && im.style.display === 'flex') renderInspect();
}
function getMoons() {
if (!player.createdAt) return 0;
const days = Math.floor((Date.now() - player.createdAt) / (1000 * 60 * 60 * 24));
return days;
}

function checkDeath() {
if ((player.health || 0) <= 0) {
if (typeof myOnlineRef !== 'undefined' && myOnlineRef) myOnlineRef.remove();
const login = localStorage.getItem('currentLogin');
if (login && typeof accountsRef !== 'undefined') {
accountsRef.child(login).remove();
}
localStorage.removeItem('catData');
localStorage.removeItem('playerId');
localStorage.removeItem('numericId');
localStorage.removeItem('currentLogin');
alert('Ваш персонаж умер. Вы можете создать нового кота.');
window.location.href = 'index.html';
return true;
}
return false;
}
const HERBS = {
marigold: { name: "Календула", icon: "images/herb-marigold.png", rawIcon: "images/herb-marigold-raw.png", cures: "infection", heals: 15 },
feverfew: { name: "Пижма", icon: "images/herb-feverfew.png", rawIcon: "images/herb-feverfew-raw.png", cures: "fever", heals: 10 },
poppy: { name: "Мак", icon: "images/herb-poppy.png", rawIcon: "images/herb-poppy-raw.png", cures: "headache", heals: 10 },
yarrow: { name: "Тысячелистник", icon: "images/herb-yarrow.png", rawIcon: "images/herb-yarrow-raw.png", cures: "poisoning", heals: 12 },
coltsfoot: { name: "Мать-и-мачеха", icon: "images/herb-coltsfoot.png", rawIcon: "images/herb-coltsfoot-raw.png", cures: "cough", heals: 8 },
chamomile: { name: "Ромашка", icon: "images/herb-chamomile.png", rawIcon: "images/herb-chamomile-raw.png", cures: "chills", heals: 10 },
nettle: { name: "Крапива", icon: "images/herb-nettle.png", rawIcon: "images/herb-nettle-raw.png", cures: "weakness", heals: 10 },
juniper: { name: "Можжевельник", icon: "images/herb-juniper.png", rawIcon: "images/herb-juniper-raw.png", cures: "suffocation", heals: 12 },
borage: { name: "Бурачник", icon: "images/herb-borage-raw.png", rawIcon: "images/herb-borage.png", cures: "weakness", heals: 15 },
garlic: { name: "чеснок", icon: "images/herb-garlic-raw.png", rawIcon: "images/herb-garlic.png", cures: "chills", heals: 10 }
};

function spawnHerbsInLocation(locationKey) {
if (!itemsRef) return;
const herbsRef = itemsRef.child(locationKey);
herbsRef.once('value', (snap) => {
const items = snap.val() || {};
const herbsOnGround = Object.values(items).filter(i => i.type === 'herb');
if (herbsOnGround.length >= 3) return; // максимум 3 травы одного вида

// Один вид травы на локацию
const herbsForLocation = {
'path': 'garlic',
'forest': 'feverfew',
'forest2': 'borage',
'sharprock': 'juniper'
};
const herbKey = herbsForLocation[locationKey];
if (!herbKey) return; // в этой локации трав нет

const herb = HERBS[herbKey];
if (!herb) return;

const toSpawn = 3 - herbsOnGround.length;
for (let i = 0; i < toSpawn; i++) {
const x = 100 + Math.random() * 500;
const y = 400 + Math.random() * 200;
herbsRef.push({
type: 'herb',
herbKey: herbKey,
name: herb.name + ' (необработанная)',
icon: herb.rawIcon,
x: Math.round(x),
y: Math.round(y),
raw: true
});
}
});
}
// Автоспавн каждые 60 секунд
function startHerbSpawner(locationKey) {
spawnHerbsInLocation(locationKey);
setInterval(() => spawnHerbsInLocation(locationKey), 60000);
}
function spawnCraftingMaterials(locationKey) {
const materialsByLocation = {
forest: [
{ key: 'bark', name: 'Кора дерева', icon: GAME_ICONS.bark }
],
forest2: [
{ key: 'bark', name: 'Кора дерева', icon: GAME_ICONS.bark }
],
herbcave: [
{ key: 'spiderweb', name: 'Паутина', icon: GAME_ICONS.spiderweb }
]
};
const materials = materialsByLocation[locationKey];
if (!materials) return;

itemsRef.child(locationKey).once('value', (snapshot) => {
const items = snapshot.val() || {};
materials.forEach((material) => {
const existingCount = Object.values(items).filter(item => item.materialKey === material.key).length;
const amountToSpawn = Math.max(0, 3 - existingCount);
for (let i = 0; i < amountToSpawn; i++) {
itemsRef.child(locationKey).push({
name: material.name,
icon: material.icon,
materialKey: material.key,
x: Math.round(100 + Math.random() * 500),
y: Math.round(400 + Math.random() * 200)
});
}
});
});
}
function startCraftingMaterialSpawner(locationKey) {
spawnCraftingMaterials(locationKey);
setInterval(() => spawnCraftingMaterials(locationKey), 60000);
}
// Плавное движение чужих котов
function smoothOtherPlayers() {
document.querySelectorAll('.other-player').forEach(el => {
const curX = parseFloat(el.dataset.curX) || 0;
const curY = parseFloat(el.dataset.curY) || 0;
const targetX = parseFloat(el.dataset.targetX) || 0;
const targetY = parseFloat(el.dataset.targetY) || 0;

// Интерполяция: движемся к цели на 8% от расстояния за кадр
const newX = curX + (targetX - curX) * 0.15;
const newY = curY + (targetY - curY) * 0.15;

el.dataset.curX = newX;
el.dataset.curY = newY;

el.style.left = newX + 'px';
el.style.top = newY + 'px';
});
requestAnimationFrame(smoothOtherPlayers);
}

// Запуск
requestAnimationFrame(smoothOtherPlayers);
function updateCatAppearance() {
const catImg = document.getElementById("cat");
const patternImg = document.getElementById("cat-pattern");
if (!catImg) return;

if (player.size) {
catImg.style.width = player.size + 'px';
catImg.parentNode.style.width = player.size + 'px';
if (patternImg) patternImg.style.width = player.size + 'px';
}

const colorKey = {
'рыжий': 'red',
'серый': 'gray',
'чёрный': 'black',
'белый': 'white',
'черепаховый': 'tortoiseshell',
'полосатый': 'tabby'
}[player.color] || 'tabby';
catImg.src = player.skin || `images/cat-${colorKey}.png`;

if (patternImg) {
const patternSrc = getPatternImage(player.pattern || 'однотонный');
if (patternSrc) {
patternImg.src = patternSrc;
patternImg.style.display = 'block';
} else {
patternImg.style.display = 'none';
}
}

let eyesImg = document.getElementById('cat-eyes');
if (!eyesImg) {
eyesImg = document.createElement('img');
eyesImg.id = 'cat-eyes';
eyesImg.style.position = 'absolute';
eyesImg.style.top = '0';
eyesImg.style.left = '0';
eyesImg.style.width = '100%';
eyesImg.style.pointerEvents = 'none';
eyesImg.style.zIndex = '3';
catImg.parentNode.appendChild(eyesImg);
}
eyesImg.style.width = player.size ? player.size + 'px' : '100%';
const eyesSrc = EYE_COLORS[player.eyes || 'янтарные'];
if (eyesSrc) {
eyesImg.src = eyesSrc;
eyesImg.style.display = 'block';
} else {
eyesImg.style.display = 'none';
}
}
function buildPatternOptions() {
const container = document.getElementById('pattern-options');
if (!container) return;
container.innerHTML = '';
PATTERN_TEXT.forEach(pattern => {
const btn = document.createElement('button');
btn.className = 'eye-option-btn' + (pattern === selectedPattern ? ' selected' : '');
btn.textContent = pattern;
btn.onclick = () => selectPattern(pattern);
container.appendChild(btn);
});
}

function selectPattern(pattern) {
selectedPattern = pattern;
buildPatternOptions();
updatePreview();
}