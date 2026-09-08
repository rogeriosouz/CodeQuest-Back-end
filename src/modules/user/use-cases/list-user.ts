import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "../repositories/user.repository";

interface ListUserUseCaseRequest {
   displayName: string;
}

export class ListUserUseCase {
   constructor(private UserRepository: UserRepository) {}

   async execute({ displayName }: ListUserUseCaseRequest) {
      const isUser = await this.UserRepository.findByDisplayName(displayName);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      return {
         user: isUser,
      };
   }
}
