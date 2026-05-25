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
        color: color
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
// Данные игрока
let player = {};

// Загрузка данных игрока
function loadPlayerData() {

    const save = localStorage.getItem("catData");

    if(save) {

        player = JSON.parse(save);

    }
}

// Обновление информации на экране
function updatePlayerDisplay() {

    const display =
        document.getElementById("cat-display");

    if(display) {

        display.innerHTML =
            `${player.name} • ${player.color}`;

    }
}
// Переход между локациями
function goTo(location) {

    window.location.href = location;
}

// Лог сообщений
function addLog(text) {

    const log =
        document.getElementById("log");

    if(log) {

        log.innerHTML += `<p>${text}</p>`;

        log.scrollTop = log.scrollHeight;
    }
}

// Охота
function hunt() {

    addLog(" Ты отправился на охоту.");

}

// Осмотреться
function explore() {

    addLog(" Ты осматриваешь лес.");

}

// Отдых
function rest() {

    addLog(" Ты отдыхаешь.");

}

// ===== ЧАТ =====

// Загрузка чата
function loadChat() {
    const chat = document.getElementById("chat-messages");

    db.ref("chat").on("value", (snapshot) => {
        chat.innerHTML = "";

        snapshot.forEach(msg => {
            chat.innerHTML += `<p>${msg.val().text}</p>`;
        });
    });
}

// Отправка сообщения
function sendChatMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value;

    if (!text.trim()) return;

    db.ref("chat").push({
        text: `${player.name}: ${text}`
    });

    input.value = "";
}
function updateCatName() {

    const catName =
        document.getElementById("cat-name");

    if(catName) {

        catName.innerText =
            player.name;
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
