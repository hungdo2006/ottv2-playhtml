export const BOARD_SIZE = 9;
export const FILES = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

export const PLAYERS = {
  P1: "P1",
  P2: "P2",
};

export const PIECE_TYPES = {
  ROCK: "rock",
  PAPER: "paper",
  SCISSORS: "scissors",
};

export const PIECE_LABELS = {
  rock: "R",
  paper: "P",
  scissors: "S",
};

export const TYPE_NAMES = {
  rock: "Rock",
  paper: "Paper",
  scissors: "Scissors",
};

export const BEATS = {
  rock: "scissors",
  scissors: "paper",
  paper: "rock",
};

// Internal row 0 is rank 1. Internal row 8 is rank 9.
export const GOALS = {
  P1: { row: 8, col: 8, label: "i9" },
  P2: { row: 0, col: 0, label: "a1" },
};

export const DEFAULT_ROOM_PREFIX = "ottv2";
export const STATE_VERSION = 1;
