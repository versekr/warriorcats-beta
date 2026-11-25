// ==========================================
// СИСТЕМА АККАУНТОВ
// Требует: firebase уже инициализирован в script.js
// ==========================================

const accountsRef = db.ref('accounts');

// ===== ХЕШ ПАРОЛЯ =====
function hashPassword(password) {
let hash = 0;
for (let i = 0; i < password.length; i++) {
const char = password.charCodeAt(i);
hash = ((hash << 5) - hash) + char;
hash = hash & hash;
}
return 'h_' + Math.abs(hash).toString(36) + '_' + password.length;
}

// ===== ЭКРАНЫ =====
function showStart() {
document.getElementById('start-screen').style.display = 'block';
document.getElementById('login-screen').style.display = 'none';
document.getElementById('character-creation').style.display = 'none';
}

function showLogin() {
document.getElementById('start-screen').style.display = 'none';
document.getElementById('login-screen').style.display = 'block';
document.getElementById('character-creation').style.display = 'none';
const err = document.getElementById('login-error');
if (err) err.textContent = '';
}

function showRegister() {
document.getElementById('start-screen').style.display = 'none';
document.getElementById('login-screen').style.display = 'none';
document.getElementById('character-creation').style.display = 'block';
const err = document.getElementById('register-error');
if (err) err.textContent = '';
}

// ===== ВХОД =====
function loginAccount() {
const login = document.getElementById('loginName').value.trim().toLowerCase();
const password = document.getElementById('loginPass').value;
const errorEl = document.getElementById('login-error');

if (!login || !password) {
errorEl.textContent = 'Заполни все поля';
return;
}

const passHash = hashPassword(password);

accountsRef.child(login).once('value', (snap) => {
const data = snap.val();
if (!data) {
errorEl.textContent = 'Аккаунт не найден';
return;
}
if (data.password !== passHash) {
errorEl.textContent = 'Неверный пароль';
return;
}
if ((data.catData.health || 0) <= 0) {
errorEl.textContent = 'Этот персонаж мёртв';
return;
}
// Успешный вход
localStorage.setItem('catData', JSON.stringify(data.catData));
localStorage.setItem('playerId', data.playerId);
localStorage.setItem('numericId', data.numericId || data.catData.numericId || '00');
localStorage.setItem('currentLogin', login);
window.location.href = 'profile.html';
});
}

// ===== РЕГИСТРАЦИЯ =====
function saveCharacter() {
const login = document.getElementById('catLogin').value.trim().toLowerCase();
const password = document.getElementById('catPassword').value;
const errorEl = document.getElementById('register-error');

if (!login || !/^[a-z0-9_]{3,20}$/.test(login)) {
errorEl.textContent = 'Логин: 3-20 символов, латиница, цифры, _';
return;
}
if (!password || password.length < 4) {
errorEl.textContent = 'Пароль: минимум 4 символа';
return;
}
const name = document.getElementById('catName').value.trim();
if (!name || name.length < 2 || name.length > 20) {
errorEl.textContent = 'Имя кота: 2-20 символов';
return;
}

accountsRef.child(login).once('value', (snap) => {
if (snap.exists()) {
errorEl.textContent = 'Такой логин уже занят';
return;
}

getNumericId((numericId) => {
const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
const catData = {
name: name,
gender: document.getElementById('catGender').value,
color: selectedColor,
eyes: selectedEyes,
pattern: selectedPattern,
role: document.getElementById('catRole').value,
numericId: numericId,
login: login,
health: 100,
hunger: 50,
energy: 80,
thirst: 50,
level: 1,
strength: 10,
agility: 12,
inventory: [],
posX: 300,
posY: 400,
createdAt: Date.now(),
condition: {
temperature: 38.5,
pulse: 140,
blood: 5.0,
oxygen: 98,
brokenBones: [],
pain: 0,
infection: 0,
poison: 0,
diseases: []
}
};

const passHash = hashPassword(password);

accountsRef.child(login).set({
password: passHash,
playerId: playerId,
numericId: numericId,
catData: catData
}).then(() => {
localStorage.setItem('catData', JSON.stringify(catData));
localStorage.setItem('playerId', playerId);
localStorage.setItem('numericId', numericId);
localStorage.setItem('currentLogin', login);
window.location.href = 'locations/forest.html';
}).catch((err) => {
errorEl.textContent = 'Ошибка регистрации: ' + err.message;
});
});
});
}
// ===== АВТОСОХРАНЕНИЕ В FIREBASE =====
function saveAccount() {
const login = localStorage.getItem('currentLogin');
if (!login) return Promise.resolve(false);
if ((player.health || 0) <= 0) return Promise.resolve(false);
const currentLocation = typeof getCurrentLocation === 'function' ? getCurrentLocation() : 'Неизвестно';
if (currentLocation !== 'Неизвестно') player.location = currentLocation;
const accountRef = accountsRef.child(login);
return accountRef.once('value').then((snapshot) => {
const account = snapshot.val();
if (!player.skin && account && account.catData && account.catData.skin) {
player.skin = account.catData.skin;
}
localStorage.setItem('catData', JSON.stringify(player));
return accountRef.update({ catData: player });
}).then(() => true).catch((error) => {
console.error('Не удалось сохранить персонажа в аккаунт:', error);
throw error;
});
}

function getSavedGameLocation(catData) {
const locationMap = {
'Лес-01': 'locations/forest.html',
'Лес-04': 'locations/forest2.html',
'Река-02': 'locations/river.html',
'тропа': 'locations/path.html',
'центр': 'locations/centre.html',
'Бескрайние звёздные пустоши': 'locations/star-wastes.html',
'лужайка': 'locations/lawn.html',
'целитель': 'locations/healden.html',
'лидерская': 'locations/leaderden.html',
'старейшины': 'locations/elderden.html',
'ученики': 'locations/studentden.html',
'бревно': 'locations/driedlog.html',
'детская': 'locations/kitden.html',
'пещерка': 'locations/litlecawe.html',
'мховаяямка': 'locations/mossmink.html',
'скала': 'locations/sharprock.html',
'пещеры': 'locations/suncaves.html',
'воины': 'locations/warriorden.html',
'???': 'locations/moonstone.html',
'пещера трав-08': 'locations/herb-cave.html',
'Лагерь': 'locations/camp.html'
};
return locationMap[catData && catData.location] || 'locations/forest.html';
}

// ===== ЗАГРУЗКА СОХРАНЕНИЯ =====
function loadGame() {
const login = localStorage.getItem('currentLogin');
const save = localStorage.getItem('catData');

if (login) {
accountsRef.child(login).once('value', (snap) => {
const data = snap.val();
if (data && data.catData) {
localStorage.setItem('catData', JSON.stringify(data.catData));
window.location.href = getSavedGameLocation(data.catData);
} else if (save) {
window.location.href = getSavedGameLocation(JSON.parse(save));
} else {
alert('Сохранение не найдено!');
}
}).catch((error) => {
console.error('Не удалось загрузить сохранение:', error);
alert('Не удалось загрузить сохранение. Проверь подключение и попробуй снова.');
});
} else if (save) {
window.location.href = getSavedGameLocation(JSON.parse(save));
} else {
alert('Сохранение не найдено!');
}
}

// ===== ВЫХОД =====
function logoutAccount() {
if (confirm('Выйти из аккаунта?')) {
const finishLogout = () => {
if (typeof myOnlineRef !== 'undefined' && myOnlineRef) myOnlineRef.remove();
localStorage.removeItem('currentLogin');
localStorage.removeItem('catData');
localStorage.removeItem('playerId');
localStorage.removeItem('numericId');
window.location.href = 'index.html';
};
if (typeof saveAccount === 'function') {
saveAccount().then(finishLogout).catch(() => {
alert('Не удалось сохранить персонажа. Проверь подключение и попробуй выйти ещё раз.');
});
} else {
finishLogout();
}
}
}

// ===== ПРОВЕРКА АВТОРИЗАЦИИ ДЛЯ ЛОКАЦИЙ =====
function checkAuth() {
const login = localStorage.getItem('currentLogin');
if (!login) {
window.location.href = 'index.html';
}
}
// Автопроверка авторизации при загрузке (только для игровых локаций)
window.addEventListener('load', () => {
const page = window.location.pathname.split('/').pop();
if (page && !page.includes('index') && page !== '') {
checkAuth();
}
});
function loadProfile() {
const save = localStorage.getItem('catData');
if (!save) {
window.location.href = 'index.html';
return;
}
const p = JSON.parse(save);
document.getElementById('profile-name').textContent = p.name || '???';

// Тело кота
const catImg = document.getElementById('profile-cat');
if (catImg) catImg.src = p.skin || getCatImage(p.color || 'полосатый');

// Раскраска в профиле
let profPattern = document.getElementById('profile-pattern');
if (!profPattern) {
profPattern = document.createElement('img');
profPattern.id = 'profile-pattern';
profPattern.style.position = 'absolute';
profPattern.style.top = '0';
profPattern.style.left = '0';
profPattern.style.width = '300px';
profPattern.style.pointerEvents = 'none';
profPattern.style.zIndex = '1.5';
const wrap = document.querySelector('.profile-cat-wrapper');
if (wrap) wrap.appendChild(profPattern);
}
const patternSrc = getPatternImage(p.pattern || 'однотонный');
if (patternSrc) {
profPattern.src = patternSrc;
profPattern.style.display = 'block';
} else {
profPattern.style.display = 'none';
}

// Глаза
const eyesImg = document.getElementById('profile-eyes');
if (eyesImg) {
if (p.eyes && EYE_COLORS[p.eyes]) {
eyesImg.src = EYE_COLORS[p.eyes];
eyesImg.style.display = 'block';
} else {
eyesImg.style.display = 'none';
}
}

const star = p.role === 'предводитель' ? ' ★' : '';
document.getElementById('profile-title').textContent = `#${p.numericId || '00'} | ${p.role || 'котёнок'}${star}`;
document.getElementById('profile-moons').textContent = p.createdAt ? Math.floor((Date.now() - p.createdAt) / (1000 * 60 * 60 * 24)) : 0;
document.getElementById('profile-health').textContent = p.health !== undefined ? p.health : 100;
document.getElementById('profile-hunger').textContent = p.hunger !== undefined ? p.hunger : 50;
document.getElementById('profile-thirst').textContent = p.thirst !== undefined ? p.thirst : 50;
document.getElementById('profile-energy').textContent = p.energy !== undefined ? p.energy : 80;
document.getElementById('profile-level').textContent = p.level !== undefined ? p.level : 1;
document.getElementById('profile-strength').textContent = p.strength !== undefined ? p.strength : 10;
document.getElementById('profile-agility').textContent = p.agility !== undefined ? p.agility : 12;
}

function goToGame() {
const save = localStorage.getItem('catData');
if (save) {
const p = JSON.parse(save);
window.location.href = getSavedGameLocation(p);
} else {
window.location.href = 'locations/forest.html';
}
}

window.addEventListener('load', () => {
if (document.getElementById('profile-name')) {
loadProfile();
}
});
// ===== ПРЕДПРОСМОТР ПЕРСОНАЖА =====
const CAT_COLORS = {
'рыжий': 'images/cat-red.png',
'серый': 'images/cat-gray.png',
'чёрный': 'images/cat-black.png',
'белый': 'images/cat-white.png',
'черепаховый': 'images/cat-tortoiseshell.png',
'полосатый': 'images/cat-tabby.png'
};

const EYE_COLORS = {
'янтарные': 'images/eyes-amber.png',
'зелёные': 'images/eyes-green.png',
'голубые': 'images/eyes-blue.png',
'жёлтые': 'images/eyes-yellow.png',
'синие': 'images/eyes-blue-dark.png',
'серые': 'images/eyes-gray.png',
'карие': 'images/eyes-brown.png'
};
let selectedColor = 'полосатый';
let selectedEyes = 'янтарные';

function buildColorOptions() {
const container = document.getElementById('color-options');
if (!container) return;
container.innerHTML = '';
Object.entries(CAT_COLORS).forEach(([key, path]) => {
const btn = document.createElement('button');
btn.className = 'option-btn' + (key === selectedColor ? ' selected' : '');
btn.onclick = () => selectColor(key);
btn.innerHTML = `<img src="${path}" alt="${key}">`;
container.appendChild(btn);
});
}

const EYE_COLORS_TEXT = ['янтарные', 'зелёные', 'голубые', 'жёлтые', 'синие', 'серые', 'карие'];
const PATTERN_TEXT = ['однотонный', 'полоски', 'розетки', 'пятна', 'мраморный', 'черепаший'];
let selectedPattern = 'однотонный';

// Карта: русское имя раскраски → английский ключ для файла
const PATTERN_KEYS = {
'однотонный': null,
'полоски': 'striped',
'розетки': 'rosette',
'пятна': 'spotted',
'мраморный': 'marble',
'черепаший': 'tortie'
};

// Карта: русский цвет → английский ключ
const COLOR_KEYS = {
'рыжий': 'red',
'серый': 'gray',
'чёрный': 'black',
'белый': 'white',
'черепаховый': 'tortoiseshell',
'полосатый': 'tabby'
};

function getCatImage(color) {
const colorKey = COLOR_KEYS[color] || 'tabby';
return `images/cat-${colorKey}.png`;
}

function getPatternImage(pattern) {
const patternKey = PATTERN_KEYS[pattern];
if (!patternKey) return null;
return `images/pattern-${patternKey}.png`;
}

// Получить путь картинки кота по цвету и раскраске
function getCatPatternImage(color, pattern) {
const colorKey = COLOR_KEYS[color] || 'tabby';
const patternKey = PATTERN_KEYS[pattern];
if (!patternKey) return `images/cat-${colorKey}.png`;
return `images/cat-${colorKey}-${patternKey}.png`;
}
function buildEyesOptions() {
const container = document.getElementById('eyes-options');
if (!container) return;
container.innerHTML = '';
EYE_COLORS_TEXT.forEach(color => {
const btn = document.createElement('button');
btn.className = 'eye-option-btn' + (color === selectedEyes ? ' selected' : '');
btn.textContent = color;
btn.onclick = () => selectEyes(color);
container.appendChild(btn);
});
}

function selectColor(color) {
selectedColor = color;
buildColorOptions();
updatePreview();
}

function selectEyes(eyes) {
selectedEyes = eyes;
buildEyesOptions();
updatePreview();
}

function updatePreview() {
const previewCat = document.getElementById('preview-cat');
const previewPattern = document.getElementById('preview-pattern');
const previewEyes = document.getElementById('preview-eyes');
const previewName = document.getElementById('preview-name');
const previewTitle = document.getElementById('preview-title');

if (previewCat) previewCat.src = getCatImage(selectedColor);
if (previewPattern) {
const patternSrc = getPatternImage(selectedPattern);
if (patternSrc) {
previewPattern.src = patternSrc;
previewPattern.style.display = 'block';
} else {
previewPattern.style.display = 'none';
}
}
if (previewEyes) previewEyes.src = EYE_COLORS[selectedEyes] || EYE_COLORS['янтарные'];

const nameInput = document.getElementById('catName');
const roleInput = document.getElementById('catRole');
if (previewName) previewName.textContent = (nameInput && nameInput.value) || 'Имя кота';
if (previewTitle) previewTitle.textContent =
((roleInput && roleInput.value) || 'котёнок') + ' • ' + selectedPattern;
}
// Живое обновление при вводе имени/роли
document.addEventListener('DOMContentLoaded', () => {
buildColorOptions();
buildEyesOptions();
buildPatternOptions();

const nameInput = document.getElementById('catName');
const roleInput = document.getElementById('catRole');
if (nameInput) nameInput.addEventListener('input', updatePreview);
if (roleInput) roleInput.addEventListener('change', updatePreview);

updatePreview();
});