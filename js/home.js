const nameInput = document.querySelector("#player-name");
const roomInput = document.querySelector("#room-input");
const joinForm = document.querySelector("#join-form");
const createButton = document.querySelector("#create-online");
const localButton = document.querySelector("#play-local");
const errorBox = document.querySelector("#home-error");

nameInput.value = localStorage.getItem("ottv2-name") || "";

function saveName() {
  const name = nameInput.value.trim().slice(0, 24) || "Player";
  localStorage.setItem("ottv2-name", name);
  return name;
}

function normalizeRoom(value) {
  return value
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 16);
}

function randomRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return [...bytes].map((value) => alphabet[value % alphabet.length]).join("");
}

function goToOnline(roomCode) {
  saveName();
  window.location.href = `./game.html?room=${encodeURIComponent(roomCode)}`;
}

localButton.addEventListener("click", () => {
  saveName();
  window.location.href = "./game.html?mode=local";
});

createButton.addEventListener("click", () => {
  goToOnline(randomRoomCode());
});

roomInput.addEventListener("input", () => {
  roomInput.value = normalizeRoom(roomInput.value);
  errorBox.textContent = "";
});

joinForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const room = normalizeRoom(roomInput.value);
  if (!room) {
    errorBox.textContent = "Enter a room code first.";
    roomInput.focus();
    return;
  }
  goToOnline(room);
});
