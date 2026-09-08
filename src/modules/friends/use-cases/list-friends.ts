import type { FriendsRepository } from "../repositories/friends.repository";

interface ListFriendsUseCaseRequest {
   userId: string;
}

export class ListFriendsUseCase {
   constructor(private friendsRepository: FriendsRepository) {}

   async execute({ userId }: ListFriendsUseCaseRequest) {
      const friends = await this.friendsRepository.findAll({ userId });

      return friends;
   }
}
