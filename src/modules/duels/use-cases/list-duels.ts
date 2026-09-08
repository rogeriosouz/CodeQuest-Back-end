import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface ListDuelsUseCaseRequest {
   userId: string;
}

export class ListDuelsUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId }: ListDuelsUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const duels = await this.duelsRepository.findByUserId({
         userId,
      });

      if (!duels) {
         throw new ResourceNotFoundError();
      }

      return duels;
   }
}
