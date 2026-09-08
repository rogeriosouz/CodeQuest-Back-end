import { UserAlreadyExistsError } from "@/errors/UserAlreadyExistsError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { User, UserRepository } from "../repositories/user.repository";

interface UpdateUserAdminUseCaseRequest {
   userId: string;
   name?: string | undefined;
   email?: string | undefined;
   displayName?: string | undefined;
   bio?: string | undefined;
   avatarUrl?: string | undefined;
   isPremium?: boolean | undefined;
   isAdmin?: boolean | undefined;
   level?: number | undefined;
   xp?: number | undefined;
   streakDays?: number | undefined;
   rankPoints?: number | undefined;
}

interface UpdateUserAdminUseCaseResponse {
   user: User;
}

export class UpdateUserAdminUseCase {
   constructor(private userRepository: UserRepository) {}

   async execute({
      userId,
      name,
      email,
      displayName,
      bio,
      avatarUrl,
      isPremium,
      isAdmin,
      level,
      xp,
      streakDays,
      rankPoints,
   }: UpdateUserAdminUseCaseRequest): Promise<UpdateUserAdminUseCaseResponse> {
      const user = await this.userRepository.findById(userId);

      if (!user) {
         throw new UserNotFoundError();
      }

      if (email && email !== user.email) {
         const userWithSameEmail = await this.userRepository.findByEmail(email);

         if (userWithSameEmail && userWithSameEmail.id !== userId) {
            throw new UserAlreadyExistsError();
         }
      }

      const updatedUser = await this.userRepository.update({
         userId,
         name,
         email,
         displayName,
         bio,
         avatarUrl,
         isPremium,
         isAdmin,
         level,
         xp,
         streakDays,
         rankPoints,
      });

      return {
         user: updatedUser,
      };
   }
}
