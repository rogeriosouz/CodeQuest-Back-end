export class FriendshipAlreadyExistsError extends Error {
   constructor() {
      super("Users are already friends.");
   }
}
