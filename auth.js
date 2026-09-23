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
localStorage.setItem('catData', JSON.stringify(data.catData));
localStorage.setItem('playerId', data.playerId);
localStorage.setItem('numericId', data.numericId || data.catData.numericId || '00');
localStorage.setItem('currentLogin', login);
window.location.href = 'forest.html';
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
color: document.getElementById('catColor').value,
role: document.getElementById('catRole').value,
numericId: numericId,
login: login,
createdAt: Date.now(),
thirst: 500,
health: 500,
hunger: 500,
energy: 1000,
level: 1,
strength: 10,
agility: 12,
inventory: [],
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
window.location.href = 'forest.html';
}).catch((err) => {
errorEl.textContent = 'Ошибка регистрации: ' + err.message;
});
});
});
}

// ===== АВТОСОХРАНЕНИЕ В FIREBASE =====
function saveAccount() {
const login = localStorage.getItem('currentLogin');
if (!login) return;
if ((player.health || 0) <= 0) return; // не сохраняем мёртвого
accountsRef.child(login).update({
catData: player
});

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
}
window.location.href = 'forest.html';
});
} else if (save) {
window.location.href = 'forest.html';
} else {
alert('Сохранение не найдено!');
}
}

// ===== ВЫХОД =====
function logoutAccount() {
if (confirm('Выйти из аккаунта?')) {
if (typeof myOnlineRef !== 'undefined' && myOnlineRef) myOnlineRef.remove();
localStorage.removeItem('currentLogin');
localStorage.removeItem('catData');
localStorage.removeItem('playerId');
localStorage.removeItem('numericId');
window.location.href = 'index.html';
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