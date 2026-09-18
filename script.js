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
// Данные игрока 
let player = {};
let myOnlineRef = null;
// Загрузка данных игрока
function loadPlayerData() {
const save = localStorage.getItem("catData");
if(save) {
player = JSON.parse(save);
}
}
// Обновление информации на экране
function updatePlayerDisplay() {
const display = document.getElementById("cat-display");
if(display && player.name) {
display.innerHTML = `${player.name} • ${player.color}`;
}
}
function updateStatsDisplay() {
const healthDisplay = document.getElementById("health");
const hungerDisplay = document.getElementById("hunger");
const energyDisplay = document.getElementById("energy");
const levelDisplay = document.getElementById("level");
const strengthDisplay = document.getElementById("strength");
const agilityDisplay = document.getElementById("agility");
if (healthDisplay) healthDisplay.textContent = player.health !== undefined ? player.health : 100;
if (hungerDisplay) hungerDisplay.textContent = player.hunger !== undefined ? player.hunger : 50;
if (energyDisplay) energyDisplay.textContent = player.energy !== undefined ? player.energy : 80;
if (levelDisplay) levelDisplay.textContent = player.level !== undefined ? player.level : 1;
if (strengthDisplay) strengthDisplay.textContent = player.strength !== undefined ? player.strength : 10;
if (agilityDisplay) agilityDisplay.textContent = player.agility !== undefined ? player.agility : 12;
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
// Охота
function hunt() {
addLog("Ты отправился на охоту.");
}
// Осмотреться
function explore() {
addLog("Ты осматриваешь лес.");
}
// Отдых
function rest() {
addLog("Ты отдыхаешь.");
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
if (page.includes('forest')) return 'Лес-01';
if (page.includes('river')) return 'Река-02';
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
location: location,
lastSeen: firebase.database.ServerValue.TIMESTAMP
});
myOnlineRef.onDisconnect().update({
lastSeen: 0
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
const nameDisplay = isMe ? `${data.name} (вы)` : data.name;
const isOnline = data.lastSeen && (Date.now() - data.lastSeen < 60000);
const nameClass = isOnline ? 'online-name online-active' : 'online-name';
playerDiv.innerHTML = `<span class="online-icon">${catIcon}</span><span class="${nameClass}">${escapeHtml(nameDisplay)}</span><span class="online-location">${escapeHtml(data.location)}</span><span class="online-status ${isMe ? 'me' : ''}"></span>`;
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
if (!container) {
console.log('Нет контейнера other-players');
return;
}
const currentLocation = getCurrentLocation();
const myId = getPlayerId();
console.log('Текущая локация:', currentLocation, 'Мой ID:', myId);
onlineRef.on('value', (snapshot) => {
const players = snapshot.val();
console.log('Игроки из Firebase:', players);
if (!players) return;
container.innerHTML = '';
let otherPlayers = [];
Object.entries(players).forEach(([id, data]) => {
if (id !== myId && data.location === currentLocation) {
otherPlayers.push({id, data});
}
});
console.log('Другие игроки в локации:', otherPlayers);
const isMobile = window.innerWidth <= 768;
const catsPerRow = isMobile ? 2 : 4;
const catWidth = isMobile ? 150 : 320;
const catHeight = isMobile ? 200 : 350;
otherPlayers.forEach((player, index) => {
const row = Math.floor(index / catsPerRow);
const col = index % catsPerRow;
const playerDiv = document.createElement('div');
playerDiv.className = 'other-player';
const isOnline = player.data.lastSeen && (Date.now() - player.data.lastSeen < 60000);
const nameColor = isOnline ? '#4fc3f7' : 'white';
const nameShadow = isOnline ? '0 0 8px rgba(79,195,247,0.8)' : '2px 2px 4px rgba(0,0,0,0.7)';
playerDiv.innerHTML = `
<img src="${getCatImage(player.data.color)}">
<div style="color:${nameColor};text-shadow:${nameShadow};">${escapeHtml(player.data.name)}</div>
`;
container.appendChild(playerDiv);
});
});
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
catName.innerText = player.name;
}
}
function updateCatAppearance() {
const catImg = document.getElementById("cat");
if(!catImg || !player.color) return;
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
1001: "forest.html"
};
function moving(code, theme) {
const url = LOCATION_BY_CODE[code];
if (!url) return;
if (player && player.hunger !== undefined) {
player.hunger = Math.max(0, player.hunger - 1);
}
if (player && player.energy !== undefined) {
player.energy = Math.max(0, player.energy - 2);
}
localStorage.setItem("catData", JSON.stringify(player));
const hungerDisplay = document.getElementById("hunger");
const energyDisplay = document.getElementById("energy");
if (hungerDisplay) {
hungerDisplay.textContent = player.hunger;
}
if (energyDisplay) {
energyDisplay.textContent = player.energy;
}
addLog("Ты перемещаешься.");
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
}
setTimeout(() => {
displayPlayersInLocation();
}, 1000);
setInterval(() => {
if (myOnlineRef) {
myOnlineRef.update({
lastSeen: firebase.database.ServerValue.TIMESTAMP
});
}
}, 30000);
};
// Для страницы создания персонажа
function createCharacter() {
document.getElementById("start-screen").style.display = "none";
document.getElementById("character-creation").style.display = "block";
}
function saveCharacter() {
let name = document.getElementById("catName").value;
let gender = document.getElementById("catGender").value;
let color = document.getElementById("catColor").value;
const catData = {
name: name,
gender: gender,
color: color,
health: 100,
hunger: 50,
energy: 80,
level: 1,
strength: 10,
agility: 12,
inventory: []
};
localStorage.setItem("catData", JSON.stringify(catData));
window.location.href = "forest.html";
}
function loadGame() {
const save = localStorage.getItem("catData");
if(save) {
window.location.href = "forest.html";
} else {
alert("Сохранение не найдено!");
}
}
function sleep() {
if (player && player.energy !== undefined) {
player.energy = 100;
localStorage.setItem("catData", JSON.stringify(player));
const energyDisplay = document.getElementById("energy");
if (energyDisplay) {
energyDisplay.textContent = player.energy;
}
}
addLog("Ты поспал. Энергия полностью восстановлена!");
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
if (currentLocation.includes('Лес')) locationKey = 'forest';
if (currentLocation.includes('Река')) locationKey = 'river';
if (currentLocation.includes('Лагерь')) locationKey = 'camp';
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
}
//ФУНКЦИЯ ВЫБРОСИТЬ ПРЕДМЕТ
function dropItem(index) {
if (!player.inventory || !player.inventory[index]) return;
const item = player.inventory[index];
const currentLocation = getCurrentLocation();
let locationKey = 'camp';
if (currentLocation.includes('Лес')) locationKey = 'forest';
if (currentLocation.includes('Река')) locationKey = 'river';
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
