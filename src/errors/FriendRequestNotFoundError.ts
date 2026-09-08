export class FriendRequestNotFoundError extends Error {
   constructor() {
      super("A friend request not existe.");
   }
}
