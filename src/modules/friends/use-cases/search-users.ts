import type { FriendsRepository } from "../repositories/friends.repository";

interface SearchUsersUseCaseRequest {
   userId: string;
   query: string;
}

export class SearchUsersUseCase {
   constructor(private friendsRepository: FriendsRepository) {}

   async execute({ userId, query }: SearchUsersUseCaseRequest) {
      const users = await this.friendsRepository.searchUsers({ userId, query });

      return users;
   }
}
