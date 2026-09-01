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
if(log) {
log.innerHTML += `<p>${text}</p>`;
log.scrollTop = log.scrollHeight;
}
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
myOnlineRef.onDisconnect().remove();
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
else if (data.color === 'чёрный') catIcon = '🐱';
else if (data.color === 'белый') catIcon = '🐱';
else if (data.color === 'черепаховый') catIcon = '🐈';
else if (data.color === 'полосатый') catIcon = '🐱';
const isMe = id === getPlayerId();
const nameDisplay = isMe ? `${data.name} (вы)` : data.name;
playerDiv.innerHTML = `<span class="online-icon">${catIcon}</span><span class="online-name">${escapeHtml(nameDisplay)}</span><span class="online-location">${escapeHtml(data.location)}</span><span class="online-status ${isMe ? 'me' : ''}"></span>`;
onlineContainer.appendChild(playerDiv);
});
const counter = document.getElementById('online-count');
if (counter) {
counter.textContent = `Игроков онлайн: ${playerEntries.length}`;
}
});
}
// Получение картинки кота по цвету
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
const catsPerRow = 4;
const catWidth = 320;
const catHeight = 350;
otherPlayers.forEach((player, index) => {
const row = Math.floor(index / catsPerRow);
const col = index % catsPerRow;
const playerDiv = document.createElement('div');
playerDiv.className = 'other-player';
playerDiv.style.position = 'absolute';
playerDiv.style.top = (40 + row * catHeight) + 'px';
playerDiv.style.left = (100 + col * catWidth) + 'px';
playerDiv.innerHTML = `
<img src="${getCatImage(player.data.color)}" style="width:300px;">
<div style="color:white;font-size:22px;text-shadow:2px 2px 4px rgb(100,95,95);margin-top:-10px;">${escapeHtml(player.data.name)}</div>
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
const LOCATION_BY_CODE = {
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
displayOnlinePlayers();
connectToOnline();
setTimeout(() => {
displayPlayersInLocation();
}, 1000);
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
agility: 12
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
