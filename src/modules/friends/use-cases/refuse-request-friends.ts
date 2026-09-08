import { FriendRequestNotFoundError } from "@/errors/FriendRequestNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { FriendsRepository } from "../repositories/friends.repository";

interface RefuseRequestFriendUseCaseRequest {
   userId: string;
   requestFriendId: string;
}

export class RefuseRequestFriendUseCase {
   constructor(
      private friendsRepository: FriendsRepository,
      private userRepository: UserRepository,
   ) {}

   async execute({
      requestFriendId,
      userId,
   }: RefuseRequestFriendUseCaseRequest) {
      const isUser = await this.userRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isRequestFriend =
         await this.friendsRepository.findByIdRequestFriend(requestFriendId);

      if (!isRequestFriend) {
         throw new FriendRequestNotFoundError();
      }

      await this.friendsRepository.refuseRequestFriends({
         requestFriendId,
      });
   }
}
