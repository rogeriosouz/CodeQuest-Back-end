import { FriendRequestAlreadyExistsError } from "@/errors/FriendRequestAlreadySentError";
import { FriendshipAlreadyExistsError } from "@/errors/FriendshipAlreadyExistsError";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { FriendsRepository } from "../repositories/friends.repository";

interface AddRequestFriendUseCaseRequest {
   userId: string;
   friendId: string;
}

export class AddRequestFriendUseCase {
   constructor(
      private friendsRepository: FriendsRepository,
      private userRepository: UserRepository,
   ) {}

   async execute({ friendId, userId }: AddRequestFriendUseCaseRequest) {
      if (userId === friendId) {
         throw new InvalidCredentialsError();
      }

      const isUser = await this.userRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isFriendUser = await this.userRepository.findById(friendId);

      if (!isFriendUser) {
         throw new UserNotFoundError();
      }

      const isMyFriend = await this.friendsRepository.listOneFriend({
         friendId,
         userId,
      });

      if (isMyFriend) {
         throw new FriendshipAlreadyExistsError();
      }

      const isRequestFriend =
         await this.friendsRepository.listOneRequestFriends({
            friendId,
            userId,
         });

      if (isRequestFriend) {
         throw new FriendRequestAlreadyExistsError();
      }

      await this.friendsRepository.requestFriend({
         receiverId: friendId,
         senderId: userId,
      });
   }
}
