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