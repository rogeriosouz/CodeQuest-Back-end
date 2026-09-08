export class TracksAlreadyExistsError extends Error {
   constructor() {
      super("Tracks already exists");
   }
}
