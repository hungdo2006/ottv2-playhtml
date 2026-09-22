import {
  BOARD_SIZE,
  PIECE_TYPES,
  PLAYERS,
  STATE_VERSION,
} from "./constants.js";

function emptyBoard() {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  );
}

function place(board, row, col, owner, type, index) {
  board[row][col] = {
    id: `${owner.toLowerCase()}-${type}-${index}`,
    owner,
    type,
  };
}

export function createInitialBoard() {
  const board = emptyBoard();

  // Symmetric default setup: 9 pieces per side, 3 of each type.
  // a1 and i9 stay empty so neither goal is occupied at game start.
  const p1 = [
    [0, 1, PIECE_TYPES.ROCK],
    [0, 2, PIECE_TYPES.PAPER],
    [0, 3, PIECE_TYPES.SCISSORS],
    [0, 4, PIECE_TYPES.ROCK],
    [0, 5, PIECE_TYPES.PAPER],
    [0, 6, PIECE_TYPES.SCISSORS],
    [0, 7, PIECE_TYPES.ROCK],
    [1, 3, PIECE_TYPES.PAPER],
    [1, 5, PIECE_TYPES.SCISSORS],
  ];

  const p2 = [
    [8, 1, PIECE_TYPES.SCISSORS],
    [8, 2, PIECE_TYPES.PAPER],
    [8, 3, PIECE_TYPES.ROCK],
    [8, 4, PIECE_TYPES.SCISSORS],
    [8, 5, PIECE_TYPES.PAPER],
    [8, 6, PIECE_TYPES.ROCK],
    [8, 7, PIECE_TYPES.SCISSORS],
    [7, 3, PIECE_TYPES.PAPER],
    [7, 5, PIECE_TYPES.ROCK],
  ];

  p1.forEach(([row, col, type], i) => place(board, row, col, PLAYERS.P1, type, i + 1));
  p2.forEach(([row, col, type], i) => place(board, row, col, PLAYERS.P2, type, i + 1));

  return board;
}

export function createInitialGameState({ online = false } = {}) {
  return {
    version: STATE_VERSION,
    board: createInitialBoard(),
    turn: PLAYERS.P1,
    winner: null,
    winReason: null,
    round: 1,
    moveNumber: 0,
    lastMove: null,
    players: online
      ? { P1: null, P2: null }
      : {
          P1: { name: "Player 1", connectionId: "local-p1" },
          P2: { name: "Player 2", connectionId: "local-p2" },
        },
    scores: { P1: 0, P2: 0 },
  };
}

export function resetRound(state) {
  state.board = createInitialBoard();
  state.turn = PLAYERS.P1;
  state.winner = null;
  state.winReason = null;
  state.moveNumber = 0;
  state.lastMove = null;
  state.round = (state.round || 1) + 1;
}

export function hardReset(state, { keepPlayers = true } = {}) {
  state.board = createInitialBoard();
  state.turn = PLAYERS.P1;
  state.winner = null;
  state.winReason = null;
  state.round = 1;
  state.moveNumber = 0;
  state.lastMove = null;
  state.scores = { P1: 0, P2: 0 };
  if (!keepPlayers) state.players = { P1: null, P2: null };
}
