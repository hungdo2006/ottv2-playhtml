import { playhtml } from "https://unpkg.com/playhtml";
import { DEFAULT_ROOM_PREFIX, STATE_VERSION } from "./constants.js";
import { applyMove, validateMove } from "./rules.js";
import {
  createInitialGameState,
  hardReset,
  resetRound,
} from "./state.js";

const PRESENCE_CHANNEL = "ottv2";
const DATA_CHANNEL = "game-state-v1";

function sanitizeName(name) {
  return String(name || "Player").trim().slice(0, 24) || "Player";
}

export async function createMultiplayerController({ roomCode, onState, onPresence }) {
  const roomName = `${DEFAULT_ROOM_PREFIX}-${roomCode.toLowerCase()}`;

  await playhtml.init({
    room: roomName,
    cursors: { enabled: false },
  });
  await playhtml.ready;

  const storedName = localStorage.getItem("ottv2-name") || "Player";
  const displayName = sanitizeName(storedName);
  playhtml.users.me.name = displayName;

  const channel = playhtml.createPageData(
    DATA_CHANNEL,
    createInitialGameState({ online: true })
  );

  // Upgrade/reset an incompatible persisted state from an older schema.
  const current = channel.getData();
  if (!current || current.version !== STATE_VERSION || !Array.isArray(current.board)) {
    channel.setData((draft) => {
      Object.assign(draft, createInitialGameState({ online: true }));
    });
  }

  playhtml.presence.setMyPresence(PRESENCE_CHANNEL, {
    role: "spectator",
    name: displayName,
  });

  function getPresenceSnapshot() {
    return playhtml.presence.getPresences();
  }

  function getMyConnectionId() {
    for (const [connectionId, presence] of getPresenceSnapshot()) {
      if (presence.isMe) return connectionId;
    }
    return null;
  }

  function getMyRole(state = channel.getData()) {
    const connectionId = getMyConnectionId();
    if (!connectionId) return null;
    if (state.players?.P1?.connectionId === connectionId) return "P1";
    if (state.players?.P2?.connectionId === connectionId) return "P2";
    return null;
  }

  function publishMyRole() {
    playhtml.presence.setMyPresence(PRESENCE_CHANNEL, {
      role: getMyRole() || "spectator",
      name: displayName,
    });
  }

  function emitPresence(presences = getPresenceSnapshot()) {
    const values = [...presences.values()].filter((p) => p[PRESENCE_CHANNEL]);
    const spectators = values.filter(
      (p) => (p[PRESENCE_CHANNEL]?.role || "spectator") === "spectator"
    ).length;

    onPresence({
      onlineCount: values.length,
      spectatorCount: spectators,
      myRole: getMyRole(),
    });
  }

  let reconciling = false;
  function reconcileSeats(presences = getPresenceSnapshot()) {
    if (reconciling) return;
    const liveIds = new Set(
      [...presences.entries()]
        .filter(([, p]) => p[PRESENCE_CHANNEL])
        .map(([connectionId]) => connectionId)
    );

    const state = channel.getData();
    const staleP1 = state.players?.P1 && !liveIds.has(state.players.P1.connectionId);
    const staleP2 = state.players?.P2 && !liveIds.has(state.players.P2.connectionId);
    if (!staleP1 && !staleP2) return;

    reconciling = true;
    channel.setData((draft) => {
      if (draft.players?.P1 && !liveIds.has(draft.players.P1.connectionId)) {
        draft.players.P1 = null;
      }
      if (draft.players?.P2 && !liveIds.has(draft.players.P2.connectionId)) {
        draft.players.P2 = null;
      }
    });
    reconciling = false;
  }

  const unsubscribeState = channel.onUpdate((state) => {
    publishMyRole();
    onState(state);
    emitPresence();
  });

  const unsubscribePresence = playhtml.presence.onPresenceChange(
    PRESENCE_CHANNEL,
    (presences) => {
      reconcileSeats(presences);
      emitPresence(presences);
    }
  );

  // Initial render after all channels are ready.
  reconcileSeats();
  publishMyRole();
  onState(channel.getData());
  emitPresence();

  function claimSeat(role) {
    if (role !== "P1" && role !== "P2") return { ok: false, reason: "Invalid seat." };
    const connectionId = getMyConnectionId();
    if (!connectionId) return { ok: false, reason: "Presence is not ready yet." };

    const snapshot = channel.getData();
    if (getMyRole(snapshot)) return { ok: false, reason: "Leave your current seat first." };
    if (snapshot.players?.[role]) return { ok: false, reason: `${role} is already occupied.` };

    channel.setData((draft) => {
      if (!draft.players[role]) {
        draft.players[role] = {
          connectionId,
          name: displayName,
        };
      }
    });

    publishMyRole();
    return { ok: true };
  }

  function leaveSeat() {
    const connectionId = getMyConnectionId();
    if (!connectionId) return;
    channel.setData((draft) => {
      for (const role of ["P1", "P2"]) {
        if (draft.players?.[role]?.connectionId === connectionId) {
          draft.players[role] = null;
        }
      }
    });
    publishMyRole();
  }

  function move(from, to, actor) {
    const snapshot = channel.getData();
    const myRole = getMyRole(snapshot);

    if (!snapshot.players?.P1 || !snapshot.players?.P2) {
      return { ok: false, reason: "Both P1 and P2 must join before the match can start." };
    }
    if (!myRole || actor !== myRole) {
      return { ok: false, reason: "Spectators cannot move pieces." };
    }

    const verdict = validateMove(snapshot, from, to, myRole);
    if (!verdict.ok) return verdict;

    channel.setData((draft) => {
      // Revalidate against the latest shared draft to protect against stale clicks.
      const latestVerdict = validateMove(draft, from, to, myRole);
      if (!latestVerdict.ok) return;
      applyMove(draft, from, to, myRole);
    });

    return { ok: true };
  }

  function newRound() {
    const role = getMyRole();
    if (!role) return { ok: false, reason: "Only seated players can start a new round." };
    channel.setData((draft) => resetRound(draft));
    return { ok: true };
  }

  function resetMatch() {
    const role = getMyRole();
    if (!role) return { ok: false, reason: "Only seated players can reset the match." };
    channel.setData((draft) => hardReset(draft, { keepPlayers: true }));
    return { ok: true };
  }

  function onBeforeUnload() {
    try {
      leaveSeat();
      playhtml.presence.setMyPresence(PRESENCE_CHANNEL, null);
    } catch {
      // Best effort only; other clients reconcile stale seats from presence.
    }
  }

  window.addEventListener("beforeunload", onBeforeUnload);

  return {
    getState: () => channel.getData(),
    getMyRole,
    claimSeat,
    leaveSeat,
    move,
    newRound,
    resetMatch,
    destroy() {
      window.removeEventListener("beforeunload", onBeforeUnload);
      unsubscribeState?.();
      unsubscribePresence?.();
      try {
        playhtml.presence.setMyPresence(PRESENCE_CHANNEL, null);
      } catch {
        // Ignore shutdown races.
      }
      channel.destroy();
    },
  };
}
