import { DuelAlreadyInProgressError } from "@/errors/DuelAlreadyInProgressError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { io } from "@/lib/socket";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface CreateDuelsUseCaseRequest {
   userId: string;
   friendId: string;
   difficulty: "easy" | "medium" | "hard";
   language: string;
   totalChallenges: number;
}

export class CreateDuelsUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({
      userId,
      friendId,
      difficulty,
      language,
      totalChallenges,
   }: CreateDuelsUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isFriend = await this.usersRepository.findById(friendId);

      if (!isFriend) {
         throw new UserNotFoundError();
      }

      const isDuelCreated =
         await this.duelsRepository.findByDuelIsCreatedByFriendId({
            userId,
            friendId,
         });

      if (isDuelCreated) {
         if (isDuelCreated.status === "ACTIVE") {
            throw new DuelAlreadyInProgressError();
         }

         await this.duelsRepository.deleteDuels({
            duelsId: isDuelCreated.id,
         });
      }

      const duel = await this.duelsRepository.createDuel({
         difficulty,
         friendId,
         language,
         totalChallenges,
         userId,
         receiverName: isFriend.name,
         senderName: isUser.name,
      });

      io.to(`user:${friendId}`).emit("duel:new", {
         duelsId: duel.id,
         senderName: duel.senderName,
         message: "duel success sent",
      });

      return {
         duelsId: duel.id,
      };
   }
}
