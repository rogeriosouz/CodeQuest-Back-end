export class DuelAlreadyInProgressError extends Error {
   constructor() {
      super("The duel is already in progress.");
   }
}
