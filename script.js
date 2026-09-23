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
// Данные игрока 
let player = {};
let myOnlineRef = null;
// Загрузка данных игрока
function loadPlayerData() {
const save = localStorage.getItem("catData");
if(save) {
player = JSON.parse(save);
}
if (!player.role) player.role = 'котёнок';
if (player.thirst === undefined) player.thirst = 50;
if (player.createdAt === undefined) player.createdAt = Date.now();
if (!player.numericId) {
const saved = localStorage.getItem("numericId");
if (saved) player.numericId = saved;
}
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
function addLog(text) {
const log = document.getElementById("log");
if(!log) return;
const p = document.createElement("p");
p.textContent = text;
log.appendChild(p);
log.scrollTop = log.scrollHeight;
setTimeout(() => {
if (p.parentNode) p.parentNode.removeChild(p);
}, 5000);
}
function hunt() {
addLog("Ты отправился на охоту.");
tryGetSick(0.08);
}
function explore() {
addLog("Ты осматриваешь лес.");
tryGetSick(0.10);
}
function rest() {
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
// Функция для определения текущей локации
function getCurrentLocation() {
const path = window.location.pathname;
const page = path.split('/').pop();
if (page.includes('forest2')) return 'Лес-04';
if (page.includes('forest')) return 'Лес-01';
if (page.includes('river')) return 'Река-02';
if (page.includes('path')) return 'тропа';
if (page.includes('???')) return '???';
if (page.includes('centre')) return 'центр';
if (page.includes('driedlog')) return 'бревно';
if (page.includes('elderden')) return 'старейшины';
if (page.includes('healden')) return 'целитель';
if (page.includes('kitden')) return 'детская';
if (page.includes('lawn')) return 'лужайка';
if (page.includes('litlecawe')) return 'пещерка';
if (page.includes('mossmink')) return 'мховаяяма';
if (page.includes('sharprock')) return 'скала';
if (page.includes('studentden')) return 'ученики';
if (page.includes('suncaves')) return 'пещеры';
if (page.includes('warriorden')) return 'воины';
if (page.includes('leaderden')) return 'лидерская';
if (page.includes('camp')) return 'Лагерь';
return 'Неизвестно';
}
// Подключение игрока к системе онлайн
function connectToOnline() {
if (!player.name) {
loadPlayerData();
if (!player.name) return;
}
const playerId = getPlayerId();
const location = getCurrentLocation();
// Удаляем все предыдущие сессии этого игрока
onlineRef.orderByChild('name').equalTo(player.name).once('value', (snapshot) => {
snapshot.forEach((child) => {
if (child.key !== playerId) {
onlineRef.child(child.key).remove();
}
});
});
myOnlineRef = onlineRef.child(playerId);
myOnlineRef.set({
name: player.name,
color: player.color || 'полосатый',
role: player.role || 'котёнок',
skin: player.skin || null,
location: location,
lastSeen: firebase.database.ServerValue.TIMESTAMP
});
myOnlineRef.onDisconnect().update({
lastSeen: 0
});
myOnlineRef.set({
name: player.name,
color: player.color || 'полосатый',
role: player.role || 'котёнок',
skin: player.skin || null,
size: player.size || null,
numericId: player.numericId || '00',
health: player.health !== undefined ? player.health : 100,
hunger: player.hunger !== undefined ? player.hunger : 50,
energy: player.energy !== undefined ? player.energy : 80,
condition: player.condition || null,
location: location,
lastSeen: firebase.database.ServerValue.TIMESTAMP
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
let catIcon = '🐱';
if (data.color === 'рыжий') catIcon = '🐱';
else if (data.color === 'серый') catIcon = '🐈';
else if (data.color === 'чёрный') catIcon = '🐈‍⬛';
else if (data.color === 'белый') catIcon = '🐱';
else if (data.color === 'черепаховый') catIcon = '🐈';
else if (data.color === 'полосатый') catIcon = '🐱';
const isMe = id === getPlayerId();
const star = data.role === 'предводитель' ? ' ★' : '';
const idText = data.numericId ? `#${data.numericId} ` : '';
const nameDisplay = isMe ? `${idText}${data.name} | ${data.role || 'котёнок'}${star} (вы)` : `${idText}${data.name} | ${data.role || 'котёнок'}${star}`;
const isOnline = data.lastSeen && (Date.now() - data.lastSeen < 60000);
const nameClass = isOnline ? 'online-name online-active' : 'online-name';
playerDiv.innerHTML = `<span class="online-icon">${catIcon}</span><span class="${nameClass}">${escapeHtml(nameDisplay)}</span><span class="online-location">${escapeHtml(data.location)}</span><span class="online-status ${isMe ? 'me' : ''}"></span>`;
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
const isMobile = window.innerWidth <= 1024;
const catsPerRow = isMobile ? 2 : 4;
const catWidth = isMobile ? 300 : 320;
const catHeight = isMobile ? 200 : 350;
const gap = isMobile ? 20 : 60;
otherPlayers.forEach((otherPlayer, index) => {
const playerDiv = document.createElement('div');
playerDiv.className = 'other-player';

const isOnline = otherPlayer.data.lastSeen && (Date.now() - otherPlayer.data.lastSeen < 60000);
const nameColor = isOnline ? '#4fc3f7' : 'white';
const nameShadow = isOnline ? '0 0 8px rgba(79,195,247,0.8)' : '2px 2px 4px rgba(0,0,0,0.7)';
const star = otherPlayer.data.role === 'предводитель' ? ' ★' : '';

playerDiv.innerHTML = `
<img src="${otherPlayer.data.skin || getCatImage(otherPlayer.data.color)}">
<div style="color:${nameColor};text-shadow:${nameShadow};">${escapeHtml(otherPlayer.data.name)} | ${escapeHtml(otherPlayer.data.role || 'котёнок')}${star}</div>
`;

if (player.role === 'целитель') {
const inspectBtn = document.createElement('button');
inspectBtn.textContent = '▼';
inspectBtn.className = 'inspect-btn';
inspectBtn.onclick = (e) => {
e.stopPropagation();
inspectPlayer(otherPlayer.data);
};
playerDiv.appendChild(inspectBtn);
}
container.appendChild(playerDiv);
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
function updateCatAppearance() {
const catImg = document.getElementById("cat");
if(!catImg) return;
if (player.size) {
catImg.style.width = player.size + 'px';
}
if (player.skin) {
catImg.src = player.skin;
return;
}
if(!player.color) return;
if(player.color === "рыжий") {
catImg.src = "images/cat-red.png";
}
else if(player.color === "серый") {
catImg.src = "images/cat-gray.png";
}
else if(player.color === "чёрный") {
catImg.src = "images/cat-black.png";
}
else if(player.color === "белый") {
catImg.src = "images/cat-white.png";
}
else if(player.color === "черепаховый") {
catImg.src = "images/cat-tortoiseshell.png";
}
else if(player.color === "полосатый") {
catImg.src = "images/cat-tabby.png";
}
}
// Навигация
var LOCATION_BY_CODE = {
6020: "river.html",
6014: "camp.html",
1001: "forest.html",
1002: "forest2.html",
1003: "path.html",
1004: "moonstone.html",
1005: "centre.html",
1006: "lawn.html",
1007: "litlecawe.html",
1008: "healden.html",
1009: "sharprock.html",
1010: "leaderden.html",
1011: "kitden.html",
1012: "elderden.html",
1013: "driedlog.html",
1014: "mossmink.html",
1015: "studentden.html",
1016: "suncaves.html",
1017: "warriorden.html"
};
function moving(code, theme) {
const url = LOCATION_BY_CODE[code];
if (!url) return;

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
player.health = Math.max(0, (player.health || 100) - 25);
addLog('⚠️ Голод изнуряет тебя. -25 здоровья.');
}
// Урон от жажды
if (player.thirst === 0) {
player.health = Math.max(0, (player.health || 100) - 25);
addLog('⚠️ Жажда мучает тебя. -25 здоровья.');
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
updatePlayerDisplay();
updateStatsDisplay();
updateCatName();
updateCatAppearance();
loadChat();
connectToOnline();
displayItemsInLocation();
const chatInput = document.getElementById('chat-input');
if (chatInput) {
chatInput.addEventListener('keydown', (e) => {
if (e.key === 'Enter') {
e.preventDefault();
sendChatMessage();
}
});
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
}
setInterval(tickDiseases, 15000);
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
document.querySelector('script[src="script.js"]')
function openInventory() {
const modal = document.getElementById('inventory-modal');
if (!modal) return;
modal.style.display = 'flex';
loadInventory();
}
function closeInventory() {
const modal = document.getElementById('inventory-modal');
if (modal) modal.style.display = 'none';
}
function loadInventory() {
const container = document.getElementById('inventory-items');
if (!container) return;
const inventory = player.inventory || [];
if (inventory.length === 0) {
container.innerHTML = '<p class="inventory-empty">Инвентарь пуст</p>';
return;
}
container.innerHTML = '';
inventory.forEach((item, index) => {
const itemDiv = document.createElement('div');
itemDiv.className = 'inventory-item';
let iconHtml = '';
if (item.icon && item.icon.startsWith('images/')) {
iconHtml = `<img src="${item.icon}" class="item-img">`;
} else {
iconHtml = `<span class="item-icon">${item.icon || '📦'}</span>`;
}
itemDiv.innerHTML = `
${iconHtml}
<span class="item-name">${escapeHtml(item.name)}</span>
<span class="item-count">x${item.count || 1}</span>
`;
const useBtn = document.createElement('button');
useBtn.textContent = 'Использовать';
useBtn.style.marginLeft = '10px';
useBtn.style.padding = '6px 12px';
useBtn.style.fontSize = '12px';
useBtn.onclick = () => useItem(index);
const dropBtn = document.createElement('button');
dropBtn.textContent = 'Выложить';
dropBtn.style.marginLeft = '5px';
dropBtn.style.padding = '6px 12px';
dropBtn.style.fontSize = '12px';
dropBtn.onclick = () => dropItem(index);
itemDiv.appendChild(useBtn);
itemDiv.appendChild(dropBtn);
container.appendChild(itemDiv);
});
}
//ОТОБРОЖЕНИЕ ПРЕДМЕТА НА ЛОКАЦИИ
function displayItemsInLocation() {
const container = document.getElementById('items-on-ground');
if (!container) return;
const currentLocation = getCurrentLocation();
let locationKey = 'camp';
if (currentLocation === 'Лес-01') locationKey = 'forest';
if (currentLocation === 'Лес-04') locationKey = 'forest2';
if (currentLocation === 'Река-02') locationKey = 'river';
if (currentLocation === 'тропа') locationKey = 'path';
if (currentLocation === 'центр') locationKey = 'centere';
if (currentLocation === 'лужайка') locationKey = 'lawn';
if (currentLocation === 'целитель') locationKey = 'healden';
if (currentLocation === 'лидерская') locationKey = 'leaderden';
if (currentLocation === 'старейшины') locationKey = 'elderden';
if (currentLocation === 'ученики') locationKey = 'studentden';
if (currentLocation === 'бревно') locationKey = 'driedlog';
if (currentLocation === 'детская') locationKey = 'kitden';
if (currentLocation === 'пещерка') locationKey = 'litlecawe';
if (currentLocation === 'мховаяямка') locationKey = 'mossmink';
if (currentLocation === 'скала') locationKey = 'sharprock';
if (currentLocation === 'пещеры') locationKey = 'suncaves';
if (currentLocation === 'воины') locationKey = 'warriorden';
if (currentLocation === '???') locationKey = 'moonstone';
if (currentLocation === 'Лагерь') locationKey = 'camp';
itemsRef.child(locationKey).on('value', (snapshot) => {
const items = snapshot.val();
container.innerHTML = '';
if (!items) return;
const isMobile = window.innerWidth <= 768;
const itemSize = isMobile ? 200 : 200;
const startX = 30;
const startY = isMobile ? 500 : 480;
const gap = 10;
Object.entries(items).forEach(([id, item], index) => {
const itemDiv = document.createElement('div');
itemDiv.className = 'ground-item';
itemDiv.style.position = 'absolute';
itemDiv.style.left = (startX + index * (itemSize + gap)) + 'px';
itemDiv.style.top = startY + 'px';
itemDiv.style.zIndex = '45';
itemDiv.style.cursor = 'pointer';
itemDiv.innerHTML = `<img src="${item.icon || 'images/mouse.jpg'}" style="width:${itemSize}px;height:${itemSize}px;">`;
itemDiv.onclick = () => pickUpItem(locationKey, id, item);
container.appendChild(itemDiv);
});
});
}
//ВЗЯТЬ ПРЕДМЕТ
function pickUpItem(locationKey, itemId, item) {
if (!player.inventory) player.inventory = [];
const existing = player.inventory.find(i => i.name === item.name);
if (existing) {
existing.count = (existing.count || 1) + 1;
} else {
const invItem = {
name: item.name || 'Предмет',
icon: item.icon || '📦',
count: 1
};
if (item.food !== undefined) invItem.food = item.food;
if (item.energy !== undefined) invItem.energy = item.energy;
player.inventory.push(invItem);
}
localStorage.setItem("catData", JSON.stringify(player));
itemsRef.child(locationKey).child(itemId).remove();
addLog(`Ты подобрал: ${item.name}`);
if (typeof saveAccount === 'function') saveAccount();
}
//ФУНКЦИЯ ВЫБРОСИТЬ ПРЕДМЕТ
function dropItem(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
const currentLocation = getCurrentLocation();
let locationKey = 'camp';
if (currentLocation.includes('Лес-01')) locationKey = 'forest';
if (currentLocation.includes('Лес-04')) locationKey = 'forest2';
if (currentLocation.includes('Река')) locationKey = 'river';
if (currentLocation.includes('тропа')) locationKey = 'path';
if (currentLocation.includes('центр')) locationKey = 'centere';
if (currentLocation.includes('лужайка')) locationKey = 'lawn';
if (currentLocation.includes('целитель')) locationKey = 'healden';
if (currentLocation.includes('лидерская')) locationKey = 'leaderden';
if (currentLocation.includes('старейшины')) locationKey = 'elderden';
if (currentLocation.includes('ученики')) locationKey = 'studentden';
if (currentLocation.includes('бревно')) locationKey = 'driedlog';
if (currentLocation.includes('детская')) locationKey = 'kitden';
if (currentLocation.includes('пещерка')) locationKey = 'litlecawe';
if (currentLocation.includes('мховая')) locationKey = 'mossmink';
if (currentLocation.includes('скала')) locationKey = 'sharprock';
if (currentLocation.includes('пещеры')) locationKey = 'suncaves';
if (currentLocation.includes('воины')) locationKey = 'warriorden';
if (currentLocation.includes('???')) locationKey = 'moonstone';
if (currentLocation.includes('Лагерь')) locationKey = 'camp';
const x = 500 + Math.random() * 400;
const y = 400 + Math.random() * 200;
const dropData = {
name: item.name || 'Предмет',
icon: item.icon || '📦',
x: Math.round(x),
y: Math.round(y)
};
if (item.food) dropData.food = item.food;
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
//ИСПОЛЬЗОВАТЬ ПРЕДМЕТ
function useItem(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
let used = false;
if (item.energy) {
player.energy = Math.min(100, (player.energy || 0) + item.energy);
const energyDisplay = document.getElementById("energy");
if (energyDisplay) energyDisplay.textContent = player.energy;
addLog(`Ты использовал ${item.name}. +${item.energy} энергии.`);
used = true;
}
if (item.food) {
player.hunger = Math.min(100, (player.hunger || 0) + item.food);
const hungerDisplay = document.getElementById("hunger");
if (hungerDisplay) hungerDisplay.textContent = player.hunger;
addLog(`Ты съел ${item.name}. +${item.food} голода.`);
used = true;
}
if (item.water) {
player.thirst = Math.min(100, (player.thirst || 0) + item.water);
const thirstDisplay = document.getElementById("thirst");
if (thirstDisplay) thirstDisplay.textContent = player.thirst;
addLog(`Ты выпил ${item.name}. +${item.water} жажды.`);
used = true;
}
if (item.cures && player.condition && player.condition.diseases) {
const idx = player.condition.diseases.indexOf(item.cures);
if (idx !== -1) {
player.condition.diseases.splice(idx, 1);
const d = DISEASES[item.cures];
if (d) {
if (d.temp) player.condition.temperature = 38.5;
if (d.oxygen) player.condition.oxygen = 98;
if (d.infection) player.condition.infection = 0;
if (d.poison) player.condition.poison = 0;
if (d.pain) player.condition.pain = 0;
}
addLog(`Ты вылечил: ${d ? d.name : item.cures}`);
used = true;
}
}
if (!used) {
addLog("Этот предмет нельзя использовать.");
return;
}
item.count = (item.count || 1) - 1;
if (item.count <= 0) {
player.inventory.splice(index, 1);
}
localStorage.setItem("catData", JSON.stringify(player));
closeInventory();
if (myOnlineRef) {
myOnlineRef.update({
health: player.health,
hunger: player.hunger,
energy: player.energy
});
}
if (typeof saveAccount === 'function') saveAccount();
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
function openCondition() {
const modal = document.getElementById('condition-modal');
if (!modal) return;
modal.style.display = 'flex';
loadCondition();
}

function closeCondition() {
const modal = document.getElementById('condition-modal');
if (modal) modal.style.display = 'none';
}

function loadCondition() {
const container = document.getElementById('condition-content');
if (!container) return;
const role = player.role || 'котёнок';
const isHealer = role === 'целитель';
const cond = player.condition || {};
const temp = cond.temperature || 38.5;
const blood = cond.blood || 5.0;
const oxygen = cond.oxygen || 98;
const pain = cond.pain || 0;
const infection = cond.infection || 0;

let pulse = 140;
let pressureSys = 120;
let pressureDia = 80;
if (temp > 39.5) { pulse += 30; pressureSys += 10; pressureDia += 10; }
if (temp < 37.5) { pulse -= 20; pressureSys -= 10; pressureDia -= 10; }
if (blood < 4.5) { pulse -= 30; pressureSys -= 20; pressureDia -= 10; }
if (blood < 3.5) { pulse -= 30; pressureSys -= 20; pressureDia -= 10; }
if (pain > 5) { pulse += 20; pressureSys += 15; pressureDia += 10; }
if (infection > 0) { pulse += 15; pressureSys += 10; pressureDia += 5; }
if (oxygen < 90) { pulse += 20; pressureSys += 10; }
if ((player.health || 100) < 50) { pulse += 20; pressureSys += 10; }
pulse = Math.max(50, Math.min(220, pulse));
pressureSys = Math.max(60, Math.min(180, pressureSys));
pressureDia = Math.max(40, Math.min(120, pressureDia));

let html = '';
html += `<img src="${player.skin || getCatImage(player.color)}" style="width:150px;">`;
html += `<div style="margin-top:15px;text-align:left;display:inline-block;">`;
const hp = player.health !== undefined ? player.health : 100;
const hun = player.hunger !== undefined ? player.hunger : 50;
const en = player.energy !== undefined ? player.energy : 80;
html += `<div>❤️ Здоровье: <span style="color:#ecd88a;">${hp}/100</span></div>`;
html += `<div>🍖 Голод: <span style="color:#ecd88a;">${hun}/100</span></div>`;
html += `<div>⚡ Энергия: <span style="color:#ecd88a;">${en}/100</span></div>`;
html += `<div>💧 Жажда: <span style="color:#ecd88a;">${(player.thirst !== undefined ? player.thirst : 50)}/100</span></div>`;
html += `<div>🌙 Лун: <span style="color:#ecd88a;">${getMoons()}</span></div>`;
if (isHealer) {
html += `<hr style="margin:10px 0;border-color:#8b7355;">`;
html += `<div>🌡 Температура: <span style="color:#ecd88a;">${temp.toFixed(1)}°C</span></div>`;
html += `<div>💓 Пульс: <span style="color:#ecd88a;">${pulse} уд/мин</span></div>`;
html += `<div>🩸 Давление: <span style="color:#ecd88a;">${pressureSys}/${pressureDia} мм рт.ст.</span></div>`;
html += `<div>💉 Кровь: <span style="color:#ecd88a;">${blood.toFixed(1)} л</span></div>`;
html += `<div>🫁 Кислород: <span style="color:#ecd88a;">${oxygen}%</span></div>`;
html += `<div>🦴 Переломы: <span style="color:#ecd88a;">${cond.brokenBones && cond.brokenBones.length ? cond.brokenBones.join(', ') : 'нет'}</span></div>`;
html += `<div>💊 Инфекция: <span style="color:#ecd88a;">${infection > 0 ? infection + '%' : 'нет'}</span></div>`;
html += `<div>😖 Боль: <span style="color:#ecd88a;">${pain > 0 ? pain + '/10' : 'нет'}</span></div>`;
}
if (cond.diseases && cond.diseases.length > 0) {
html += `<hr style="margin:10px 0;border-color:#8b7355;">`;
html += `<div style="color:#ff6b6b;font-weight:bold;">Заболевания:</div>`;
cond.diseases.forEach(key => {
const d = DISEASES[key];
if (d) html += `<div>${d.icon} ${d.name}</div>`;
});
}
html += '</div>';

const thoughts = [];
if (temp > 39.5) thoughts.push("Мне жарко и плохо...");
if (temp < 37.5) thoughts.push("Меня знобит...");
if (pain > 5) thoughts.push("Всё болит...");
if (infection > 0) thoughts.push("Рана ноет и пульсирует...");
if (cond.poison > 0) thoughts.push("Меня тошнит, голова кружится...");
if (cond.brokenBones && cond.brokenBones.length > 0) thoughts.push("Лапа не двигается, это ужасно...");
if (hun < 20) thoughts.push("Я умираю от голода...");
if (en < 20) thoughts.push("Я еле стою на лапах...");
if (hp < 30) thoughts.push("Мне очень плохо...");
if (blood < 4.0) thoughts.push("Я чувствую слабость...");
if (oxygen < 90) thoughts.push("Мне тяжело дышать...");
if (thoughts.length === 0) thoughts.push("Мне хорошо, я здоров.");
if (player.hunger === 0 && player.thirst === 0) thoughts.push("Я умираю от голода и жажды...");
else if (player.hunger === 0) thoughts.push("Я умираю от голода...");
else if (player.thirst === 0) thoughts.push("Я умираю от жажды...");
if (cond.diseases && cond.diseases.length > 0) {
cond.diseases.forEach(key => {
const d = DISEASES[key];
if (d && d.thought) thoughts.push(d.thought);
});
}

html += '<div style="margin-top:15px;font-style:italic;color:#e0c878;">';
thoughts.forEach(t => { html += `<div>"${t}"</div>`; });
html += '</div>';

container.innerHTML = html;
}

function inspectPlayer(data) {
const modal = document.getElementById('inspect-modal');
if (!modal) return;
modal.style.display = 'flex';

const cond = data.condition || {};
const temp = cond.temperature !== undefined ? cond.temperature : 38.5;
const blood = cond.blood !== undefined ? cond.blood : 5.0;
const oxygen = cond.oxygen !== undefined ? cond.oxygen : 98;
const pain = cond.pain !== undefined ? cond.pain : 0;
const infection = cond.infection !== undefined ? cond.infection : 0;
const hp = data.health !== undefined ? data.health : 100;
const hun = data.hunger !== undefined ? data.hunger : 50;
const en = data.energy !== undefined ? data.energy : 80;

let pulse = 140;
let pressureSys = 120;
let pressureDia = 80;
if (temp > 39.5) { pulse += 30; pressureSys += 10; pressureDia += 10; }
if (temp < 37.5) { pulse -= 20; pressureSys -= 10; pressureDia -= 10; }
if (blood < 4.5) { pulse -= 30; pressureSys -= 20; pressureDia -= 10; }
if (blood < 3.5) { pulse -= 30; pressureSys -= 20; pressureDia -= 10; }
if (pain > 5) { pulse += 20; pressureSys += 15; pressureDia += 10; }
if (infection > 0) { pulse += 15; pressureSys += 10; pressureDia += 5; }
if (oxygen < 90) { pulse += 20; pressureSys += 10; }
if (hp < 50) { pulse += 20; pressureSys += 10; }
pulse = Math.max(50, Math.min(220, pulse));
pressureSys = Math.max(60, Math.min(180, pressureSys));
pressureDia = Math.max(40, Math.min(120, pressureDia));

function bar(value, max, inverted) {
let pct = Math.max(0, Math.min(100, (value / max) * 100));
if (inverted) pct = 100 - pct;
let cls = 'vit-bar-fill';
if (pct < 25) cls += ' danger';
else if (pct < 50) cls += ' warn';
return `<div class="vit-bar"><div class="${cls}" style="width:${pct}%"></div></div>`;
}

let html = '';
html += `<img src="${data.skin || getCatImage(data.color)}" class="inspect-cat-img">`;
html += `<div class="inspect-name">${escapeHtml(data.name)} | ${escapeHtml(data.role || 'котёнок')}</div>`;

// Здоровье
html += `<div class="vit-row ${hp < 30 ? 'danger' : (hp < 60 ? 'warn' : '')}">`;
html += `<span class="vit-icon">❤</span>`;
html += `<span class="vit-label">Здоровье</span>`;
html += bar(hp, 100, false);
html += `<span class="vit-value">${hp}/100</span></div>`;

// Голод
html += `<div class="vit-row ${hun < 20 ? 'danger' : (hun < 40 ? 'warn' : '')}">`;
html += `<span class="vit-icon">🍖</span>`;
html += `<span class="vit-label">Голод</span>`;
html += bar(hun, 100, false);
html += `<span class="vit-value">${hun}/100</span></div>`;

// Энергия
html += `<div class="vit-row ${en < 20 ? 'danger' : (en < 40 ? 'warn' : '')}">`;
html += `<span class="vit-icon">⚡</span>`;
html += `<span class="vit-label">Энергия</span>`;
html += bar(en, 100, false);
html += `<span class="vit-value">${en}/100</span></div>`;
const th = data.thirst !== undefined ? data.thirst : 50;
html += `<div>💧 Жажда: <span style="color:#ecd88a;">${th}/100</span></div>`;
html += `<hr>`;

// Температура
const tempCls = (temp > 39.5 || temp < 37.5) ? 'danger' : '';
html += `<div class="vit-row ${tempCls}">`;
html += `<span class="vit-icon">🌡</span>`;
html += `<span class="vit-label">Температура</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${temp.toFixed(1)}°C</span></div>`;

// Пульс
const pulseCls = (pulse > 180 || pulse < 80) ? 'danger' : (pulse > 160 ? 'warn' : '');
html += `<div class="vit-row ${pulseCls}">`;
html += `<span class="vit-icon">♥</span>`;
html += `<span class="vit-label">Пульс</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${pulse} уд/мин</span></div>`;

// Давление
html += `<div class="vit-row">`;
html += `<span class="vit-icon">◐</span>`;
html += `<span class="vit-label">Давление</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${pressureSys}/${pressureDia} мм рт.ст.</span></div>`;

// Кровь
const bloodCls = blood < 4.0 ? 'danger' : (blood < 4.5 ? 'warn' : '');
html += `<div class="vit-row ${bloodCls}">`;
html += `<span class="vit-icon">💧</span>`;
html += `<span class="vit-label">Кровь</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${blood.toFixed(1)} л</span></div>`;

// Кислород
html += `<div class="vit-row ${oxygen < 90 ? 'danger' : (oxygen < 95 ? 'warn' : '')}">`;
html += `<span class="vit-icon">O₂</span>`;
html += `<span class="vit-label">Кислород</span>`;
html += bar(oxygen, 100, false);
html += `<span class="vit-value">${oxygen}%</span></div>`;

html += `<hr>`;

// Переломы
const bones = cond.brokenBones && cond.brokenBones.length ? cond.brokenBones.join(', ') : 'нет';
html += `<div class="vit-row ${cond.brokenBones && cond.brokenBones.length ? 'danger' : ''}">`;
html += `<span class="vit-icon">🦴</span>`;
html += `<span class="vit-label">Переломы</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${bones}</span></div>`;

// Инфекция
html += `<div class="vit-row ${infection > 0 ? 'warn' : ''}">`;
html += `<span class="vit-icon">☣</span>`;
html += `<span class="vit-label">Инфекция</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${infection > 0 ? infection + '%' : 'нет'}</span></div>`;

// Боль
html += `<div class="vit-row ${pain > 5 ? 'danger' : (pain > 2 ? 'warn' : '')}">`;
html += `<span class="vit-icon">✚</span>`;
html += `<span class="vit-label">Боль</span>`;
html += `<span class="vit-value" style="width:auto;flex:1;">${pain > 0 ? pain + '/10' : 'нет'}</span></div>`;

if (cond.diseases && cond.diseases.length > 0) {
html += `<hr>`;
html += `<div class="vit-row danger"><span class="vit-icon">⚠</span><span class="vit-label">Заболевания</span><span class="vit-value" style="width:auto;flex:1;">`;
cond.diseases.forEach(key => {
const d = DISEASES[key];
if (d) html += `${d.icon} ${d.name} `;
});
html += `</span></div>`;
}

// Мысли
const thoughts = [];
if (temp > 39.5) thoughts.push("Мне жарко и плохо...");
if (temp < 37.5) thoughts.push("Меня знобит...");
if (pain > 5) thoughts.push("Всё болит...");
if (infection > 0) thoughts.push("Рана ноет и пульсирует...");
if (cond.poison > 0) thoughts.push("Меня тошнит, голова кружится...");
if (cond.brokenBones && cond.brokenBones.length > 0) thoughts.push("Лапа не двигается, это ужасно...");
if (hun < 20) thoughts.push("Я умираю от голода...");
if (en < 20) thoughts.push("Я еле стою на лапах...");
if (hp < 30) thoughts.push("Мне очень плохо...");
if (blood < 4.0) thoughts.push("Я чувствую слабость...");
if (oxygen < 90) thoughts.push("Мне тяжело дышать...");
if (thoughts.length === 0) thoughts.push("Мне хорошо, я здоров.");
if (player.hunger === 0 && player.thirst === 0) thoughts.push("Я умираю от голода и жажды...");
else if (player.hunger === 0) thoughts.push("Я умираю от голода...");
else if (player.thirst === 0) thoughts.push("Я умираю от жажды...");
if (cond.diseases && cond.diseases.length > 0) {
cond.diseases.forEach(key => {
const d = DISEASES[key];
if (d && d.thought) thoughts.push(d.thought);
});
}
const moons = data.createdAt ? Math.floor((Date.now() - data.createdAt) / (1000 * 60 * 60 * 24)) : 0;
html += `<div>🌙 Лун: <span style="color:#ecd88a;">${moons}</span></div>`;

html += '<div class="inspect-thoughts">';
thoughts.forEach(t => { html += `<div>"${t}"</div>`; });
html += '</div>';

document.getElementById('inspect-content').innerHTML = html;
startHeartbeat(pulse);
}

let heartbeatPoints = [];
let heartbeatStartTime = 0;



let heartbeatAnimation = null;

function startHeartbeat(pulseRate) {
stopHeartbeat();

const canvas = document.getElementById('heartbeat-canvas');
if (!canvas) return;
const ctx = canvas.getContext('2d');

const width = canvas.width;
const height = canvas.height;
const baseY = height / 2;

// Очищаем canvas полностью
ctx.clearRect(0, 0, width, height);

const speed = pulseRate * 1.2;
const beatInterval = 60000 / pulseRate;

let penX = 0;
let penY = baseY;
let lastTimestamp = performance.now();
let lastBeatTime = 0;
let firstPoint = true;

function draw(now) {
const dt = (now - lastTimestamp) / 1000;
lastTimestamp = now;

const timeSinceLastBeat = now - lastBeatTime;
if (timeSinceLastBeat >= beatInterval) {
lastBeatTime = now;
}

const phase = (now - lastBeatTime) / beatInterval;
let yOffset = 0;

if (phase < 0.10) yOffset = 0;
else if (phase < 0.15) yOffset = -10;
else if (phase < 0.20) yOffset = 0;
else if (phase < 0.23) yOffset = 15;
else if (phase < 0.27) yOffset = -70;
else if (phase < 0.30) yOffset = 30;
else if (phase < 0.40) yOffset = 0;
else if (phase < 0.50) yOffset = -20;
else yOffset = 0;

const newX = penX + speed * dt;
const newY = baseY + yOffset;

let strokeColor = '#00ff41';
if (pulseRate > 180) strokeColor = '#ff2a2a';
else if (pulseRate < 80) strokeColor = '#ffaa00';

// Затухание — уменьшает alpha у старых пикселей, не рисуя чёрный
ctx.save();
ctx.globalCompositeOperation = 'destination-out';
ctx.fillStyle = 'rgba(0, 0, 0, 0.025)';
ctx.fillRect(0, 0, width, height);
ctx.restore();

// Рисуем новую линию
if (!firstPoint && newX < width) {
ctx.strokeStyle = strokeColor;
ctx.lineWidth = 2.5;
ctx.shadowColor = strokeColor;
ctx.shadowBlur = 15;
ctx.beginPath();
ctx.moveTo(penX, penY);
ctx.lineTo(newX, newY);
ctx.stroke();
}

penX = newX;
penY = newY;

if (penX >= width) {
penX = 0;
penY = baseY;
firstPoint = true;
} else {
firstPoint = false;
}

heartbeatAnimation = requestAnimationFrame(draw);
}

heartbeatAnimation = requestAnimationFrame(draw);
}

function stopHeartbeat() {
if (heartbeatAnimation) {
cancelAnimationFrame(heartbeatAnimation);
heartbeatAnimation = null;
}
}
function closeInspect() {
    const modal = document.getElementById('inspect-modal');
    if (modal) modal.style.display = 'none';
    stopHeartbeat();
}
function tryGetSick(chance) {
if (!player.condition) player.condition = {};
if (!player.condition.diseases) player.condition.diseases = [];
if (player.condition.diseases.length >= 3) return null;
if (Math.random() > chance) return null;
const keys = Object.keys(DISEASES).filter(k => !player.condition.diseases.includes(k));
if (keys.length === 0) return null;
const sickKey = keys[Math.floor(Math.random() * keys.length)];
player.condition.diseases.push(sickKey);
localStorage.setItem("catData", JSON.stringify(player));
addLog(`⚠️ Ты чувствуешь недомогание...`);
if (myOnlineRef) myOnlineRef.update({ condition: player.condition });
return sickKey;
}
function tickDiseases() {
if (!player.condition || !player.condition.diseases) return;
const diseases = player.condition.diseases;
if (diseases.length === 0) return;
let changed = false;
diseases.forEach(key => {
const d = DISEASES[key];
if (!d) return;
if (d.temp) {
player.condition.temperature = Math.max(35, Math.min(42, (player.condition.temperature || 38.5) + d.temp * 0.05));
changed = true;
}
if (d.oxygen) {
player.condition.oxygen = Math.max(50, Math.min(100, (player.condition.oxygen || 98) + d.oxygen * 0.1));
changed = true;
}
if (d.infection) {
player.condition.infection = Math.min(100, (player.condition.infection || 0) + d.infection * 0.1);
changed = true;
}
if (d.poison) {
player.condition.poison = Math.min(100, (player.condition.poison || 0) + d.poison * 0.1);
changed = true;
}
if (d.pain) {
player.condition.pain = Math.min(10, (player.condition.pain || 0) + d.pain * 0.1);
changed = true;
}
if (d.energy) {
player.energy = Math.max(0, (player.energy || 80) + d.energy * 0.05);
changed = true;
}
});
if (changed) {
localStorage.setItem("catData", JSON.stringify(player));
updateStatsDisplay();
if (myOnlineRef) {
myOnlineRef.update({
condition: player.condition,
health: player.health,
hunger: player.hunger,
energy: player.energy
});
}
}
if (typeof saveAccount === 'function') saveAccount();
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
alert('☠ Ваш персонаж умер. Вы можете создать нового кота.');
window.location.href = 'index.html';
return true;
}
return false;
}