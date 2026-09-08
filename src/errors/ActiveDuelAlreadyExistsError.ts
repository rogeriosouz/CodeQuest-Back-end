export class ActiveDuelAlreadyExistsError extends Error {
   constructor() {
      super("An active duel with this user already exists.");
   }
}
