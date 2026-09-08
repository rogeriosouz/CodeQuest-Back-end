import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "../repositories/user.repository";

interface UpdateUserUseCaseRequest {
   userId: string;
   name?: string | undefined;
   displayName?: string | undefined;
   bio?: string | undefined;
}

export class UpdateUserUseCase {
   constructor(private UserRepository: UserRepository) {}

   async execute({ userId, name, displayName, bio }: UpdateUserUseCaseRequest) {
      const isUser = await this.UserRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const user = await this.UserRepository.update({
         userId,
         name,
         displayName,
         bio,
      });

      return {
         user,
      };
   }
}
