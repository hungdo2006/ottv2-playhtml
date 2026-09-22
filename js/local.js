import { applyMove } from "./rules.js";
import { createInitialGameState, hardReset, resetRound } from "./state.js";

export function createLocalController(onChange) {
  let state = createInitialGameState({ online: false });

  const emit = () => onChange(structuredClone(state));
  emit();

  return {
    getState() {
      return state;
    },
    getMyRole() {
      return null;
    },
    move(from, to, actor) {
      const result = applyMove(state, from, to, actor);
      if (result.ok) emit();
      return result;
    },
    newRound() {
      resetRound(state);
      emit();
    },
    resetMatch() {
      hardReset(state, { keepPlayers: true });
      emit();
    },
    destroy() {},
  };
}
