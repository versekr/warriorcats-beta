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

    const messages =
        JSON.parse(localStorage.getItem("chat")) || "[]"
        ;

    const chat =
        document.getElementById("chat-messages");

    if(chat) {

        chat.innerHTML = "";

        messages.forEach(msg => {

            chat.innerHTML += `<p>${msg}</p>`;

        });

    }
}

// Отправка сообщения
function sendChatMessage() {

    const input =
        document.getElementById("chat-input");

    if(!input) return;

    const text = input.value;

    if(text.trim() === "") return;

    const messages =
        JSON.parse(localStorage.getItem("chat"))
        || [];

    messages.push(
        `${player.name}: ${text}`
    );

    localStorage.setItem(
        "chat",
        JSON.stringify(messages)
    );

    input.value = "";

    loadChat();
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

    if(catImg && player.color) {
        catImg.src = getCatImage(player.color);
    }
}
function getCatImage(color) {
    switch(color) {
        case "рыжий":
            return "images/cat-red.png";
        case "серый":
            return "images/cat-gray.png";
        case "чёрный":
            return "images/cat-black.png";
        case "белый":
            return "images/cat-white.png";
        case "черепаховый":
            return "images/cat-tortoiseshell.png";
        case "полосатый":
            return "images/cat-tabby.png";
        default:
            return "images/cat-gray.png";
    }
}