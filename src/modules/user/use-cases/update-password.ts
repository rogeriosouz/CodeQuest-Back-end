import { compare, hash } from "bcryptjs";
import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "../repositories/user.repository";

interface UpdatePasswordUseCaseRequest {
   userId: string;
   currentPassword: string;
   newPassword: string;
}

export class UpdatePasswordUseCase {
   constructor(private UserRepository: UserRepository) {}

   async execute({
      userId,
      currentPassword,
      newPassword,
   }: UpdatePasswordUseCaseRequest) {
      const user = await this.UserRepository.findById(userId);

      if (!user) {
         throw new UserNotFoundError();
      }

      const isCurrentPasswordValid = await compare(
         currentPassword,
         user.passwordHash,
      );

      if (!isCurrentPasswordValid) {
         throw new InvalidCredentialsError();
      }

      const passwordHash = await hash(newPassword, 6);

      await this.UserRepository.updatePassword({
         userId,
         passwordHash,
      });
   }
}
