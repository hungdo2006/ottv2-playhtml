import {
  BEATS,
  BOARD_SIZE,
  GOALS,
  PIECE_TYPES,
  PLAYERS,
  TYPE_NAMES,
} from "./constants.js";

export function inBounds(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isAdjacent(from, to) {
  const dr = Math.abs(to.row - from.row);
  const dc = Math.abs(to.col - from.col);
  return dr <= 1 && dc <= 1 && !(dr === 0 && dc === 0);
}

export function opponentOf(player) {
  return player === PLAYERS.P1 ? PLAYERS.P2 : PLAYERS.P1;
}

export function canCapture(attacker, defender) {
  if (!attacker || !defender) return false;
  if (attacker.owner === defender.owner) return false;
  if (attacker.type === defender.type) return false;
  return BEATS[attacker.type] === defender.type;
}

export function validateMove(state, from, to, actor) {
  if (state.winner) return { ok: false, reason: "The round is already over." };
  if (!inBounds(from.row, from.col) || !inBounds(to.row, to.col)) {
    return { ok: false, reason: "Move is outside the board." };
  }
  if (!isAdjacent(from, to)) {
    return { ok: false, reason: "A piece can move only one square in any of 8 directions." };
  }

  const piece = state.board[from.row][from.col];
  const target = state.board[to.row][to.col];

  if (!piece) return { ok: false, reason: "No piece is selected." };
  if (piece.owner !== actor) return { ok: false, reason: "You can move only your own pieces." };
  if (state.turn !== actor) return { ok: false, reason: "It is not your turn." };

  if (!target) return { ok: true, capture: false };
  if (target.owner === actor) {
    return { ok: false, reason: "Your own piece blocks this square." };
  }
  if (target.type === piece.type) {
    return { ok: false, reason: "Two pieces of the same type cannot capture each other." };
  }
  if (!canCapture(piece, target)) {
    return {
      ok: false,
      reason: `${TYPE_NAMES[piece.type]} cannot capture ${TYPE_NAMES[target.type]}.`,
    };
  }

  return { ok: true, capture: true, captured: target };
}

export function getLegalMoves(state, from, actor) {
  const moves = [];
  for (let dr = -1; dr <= 1; dr += 1) {
    for (let dc = -1; dc <= 1; dc += 1) {
      if (dr === 0 && dc === 0) continue;
      const to = { row: from.row + dr, col: from.col + dc };
      if (!inBounds(to.row, to.col)) continue;
      const verdict = validateMove(state, from, to, actor);
      if (verdict.ok) moves.push({ ...to, capture: verdict.capture });
    }
  }
  return moves;
}

export function countPiecesByType(state, player) {
  const counts = {
    [PIECE_TYPES.ROCK]: 0,
    [PIECE_TYPES.PAPER]: 0,
    [PIECE_TYPES.SCISSORS]: 0,
  };

  for (const row of state.board) {
    for (const piece of row) {
      if (piece && piece.owner === player) counts[piece.type] += 1;
    }
  }
  return counts;
}

export function detectWinner(state, movedPiece, destination) {
  const goal = GOALS[movedPiece.owner];
  if (destination.row === goal.row && destination.col === goal.col) {
    return {
      winner: movedPiece.owner,
      reason: `${movedPiece.owner} reached ${goal.label}.`,
    };
  }

  const opponent = opponentOf(movedPiece.owner);
  const counts = countPiecesByType(state, opponent);
  const eliminatedType = Object.entries(counts).find(([, count]) => count === 0)?.[0];

  if (eliminatedType) {
    return {
      winner: movedPiece.owner,
      reason: `${movedPiece.owner} eliminated all opponent ${TYPE_NAMES[eliminatedType]} pieces.`,
    };
  }

  return null;
}

export function applyMove(state, from, to, actor) {
  const verdict = validateMove(state, from, to, actor);
  if (!verdict.ok) return verdict;

  const movingPiece = state.board[from.row][from.col];
  const capturedPiece = state.board[to.row][to.col];

  state.board[to.row][to.col] = movingPiece;
  state.board[from.row][from.col] = null;
  state.moveNumber += 1;
  state.lastMove = {
    from: { ...from },
    to: { ...to },
    player: actor,
    pieceType: movingPiece.type,
    captured: capturedPiece
      ? { owner: capturedPiece.owner, type: capturedPiece.type }
      : null,
  };

  const result = detectWinner(state, movingPiece, to);
  if (result) {
    state.winner = result.winner;
    state.winReason = result.reason;
    state.scores[result.winner] = (state.scores[result.winner] || 0) + 1;
    return { ok: true, capture: Boolean(capturedPiece), winner: result.winner };
  }

  state.turn = opponentOf(actor);
  return { ok: true, capture: Boolean(capturedPiece), winner: null };
}
