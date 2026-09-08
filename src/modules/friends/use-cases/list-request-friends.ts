import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { FriendsRepository } from "../repositories/friends.repository";

interface ListRequestFriendsUseCaseRequest {
   userId: string;
}

export class ListRequestFriendsUseCase {
   constructor(
      private friendsRepository: FriendsRepository,
      private userRepository: UserRepository,
   ) {}

   async execute({ userId }: ListRequestFriendsUseCaseRequest) {
      const isUser = await this.userRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const requestFriends = await this.friendsRepository.listAllRequestFriends(
         { userId },
      );

      return requestFriends;
   }
}
