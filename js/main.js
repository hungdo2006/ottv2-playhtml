import { getLegalMoves } from "./rules.js";
import { createLocalController } from "./local.js";
import { renderUI, setupUI, showToast } from "./ui.js";

const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "local" ? "local" : "online";
const roomCode = (params.get("room") || "DEMO01")
  .toUpperCase()
  .replace(/[^A-Z0-9-]/g, "")
  .slice(0, 16) || "DEMO01";

let controller = null;
let state = null;
let selected = null;
let legalMoves = [];
let presence = { onlineCount: 0, spectatorCount: 0, myRole: null };

function actorForCurrentMode() {
  if (!state) return null;
  return mode === "local" ? state.turn : controller?.getMyRole() || null;
}

function bothSeatsReady() {
  return mode === "local" || Boolean(state?.players?.P1 && state?.players?.P2);
}

function canInteract() {
  if (!state || state.winner) return false;
  if (mode === "local") return true;
  const role = controller?.getMyRole();
  return Boolean(role && bothSeatsReady() && state.turn === role);
}

function rerender(message = "") {
  if (!state) return;
  renderUI({
    state,
    mode,
    roomCode,
    selected,
    legalMoves,
    myRole: mode === "online" ? controller?.getMyRole() : null,
    onlineCount: presence.onlineCount,
    spectatorCount: presence.spectatorCount,
    message,
    canInteract: canInteract(),
  });
}

function clearSelection() {
  selected = null;
  legalMoves = [];
}

function selectPiece(position) {
  const actor = actorForCurrentMode();
  const piece = state.board[position.row][position.col];
  if (!actor || !piece || piece.owner !== actor || state.turn !== actor) return false;

  selected = position;
  legalMoves = getLegalMoves(state, selected, actor);
  rerender();
  return true;
}

function handleCellClick(position) {
  if (!state) return;

  if (state.winner) {
    showToast("This round is over. Start a new round to continue.", "warn");
    return;
  }

  if (mode === "online") {
    const role = controller?.getMyRole();
    if (!role) {
      showToast("You are spectating. Claim P1 or P2 to play.", "warn");
      return;
    }
    if (!bothSeatsReady()) {
      showToast("Waiting for both player seats.", "warn");
      return;
    }
    if (state.turn !== role) {
      showToast(`It is ${state.turn}'s turn.`, "warn");
      return;
    }
  }

  const clickedPiece = state.board[position.row][position.col];
  const actor = actorForCurrentMode();

  if (!selected) {
    if (!selectPiece(position)) {
      showToast("Select one of the current player's pieces.", "warn");
    }
    return;
  }

  if (clickedPiece?.owner === actor) {
    selectPiece(position);
    return;
  }

  const result = controller.move(selected, position, actor);
  if (!result.ok) {
    showToast(result.reason, "warn");
    return;
  }

  clearSelection();
  // Local mode emits synchronously; online mode will rerender on shared-state update.
  if (mode === "online") rerender();
}

async function copyRoomLink() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("room", roomCode);
  try {
    await navigator.clipboard.writeText(url.toString());
    showToast("Room link copied.", "success");
  } catch {
    showToast(`Room code: ${roomCode}`, "info");
  }
}

setupUI({
  onCellClick: handleCellClick,
  onCopyRoom: copyRoomLink,
  onClaimSeat(role) {
    if (!controller?.claimSeat) return;
    const result = controller.claimSeat(role);
    if (!result.ok) showToast(result.reason, "warn");
    else showToast(`Joined as ${role}.`, "success");
    clearSelection();
    rerender();
  },
  onLeaveSeat() {
    controller?.leaveSeat?.();
    clearSelection();
    showToast("You left the player seat.", "info");
    rerender();
  },
  onNewRound() {
    const result = controller?.newRound?.();
    if (result && result.ok === false) showToast(result.reason, "warn");
    clearSelection();
    rerender();
  },
  onResetMatch() {
    const result = controller?.resetMatch?.();
    if (result && result.ok === false) showToast(result.reason, "warn");
    clearSelection();
    rerender();
  },
});

if (mode === "local") {
  controller = createLocalController((nextState) => {
    state = nextState;
    clearSelection();
    rerender();
  });
} else {
  document.body.classList.add("loading");
  const loading = document.querySelector("#loading-overlay");
  loading.hidden = false;

  try {
    const { createMultiplayerController } = await import("./multiplayer.js");
    controller = await createMultiplayerController({
      roomCode,
      onState(nextState) {
        state = nextState;
        if (selected) {
          const actor = actorForCurrentMode();
          const piece = state.board[selected.row]?.[selected.col];
          if (!piece || piece.owner !== actor || state.turn !== actor) clearSelection();
          else legalMoves = getLegalMoves(state, selected, actor);
        }
        rerender();
      },
      onPresence(nextPresence) {
        presence = nextPresence;
        rerender();
      },
    });
  } catch (error) {
    console.error(error);
    loading.innerHTML = '<div class="loading-card"><h2>Could not connect to playhtml</h2><p>Check your internet connection and reload the page.</p><a class="button" href="./index.html">Back home</a></div>';
  } finally {
    document.body.classList.remove("loading");
    if (controller) loading.hidden = true;
  }
}
