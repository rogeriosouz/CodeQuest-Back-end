export class FriendRequestAlreadyExistsError extends Error {
   constructor() {
      super("A friend request already exists between these users.");
   }
}
