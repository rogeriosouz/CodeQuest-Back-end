import { AppError } from "@/errors/app.errors";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import { hasDuelExpired } from "@/shared/utils/has-duel-expired";
import type { DuelsRepository } from "../repositories/duels.repository";

interface ListOneDuelUseCaseRequest {
   duelsId: string;
   userId: string;
}

export class ListOneDuelUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId }: ListOneDuelUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isDuel = await this.duelsRepository.findOneDuel({
         duelsId,
         userId,
      });

      if (!isDuel) {
         throw new ResourceNotFoundError();
      }

      if (
         (isDuel?.expiredAt as Date) &&
         (isDuel?.expiredAt as Date) < new Date()
      ) {
         throw new ResourceNotFoundError();
      }

      if (isDuel.status === "FORFEITED") {
         throw new AppError(
            "Partida encerrada! O seu adversário abandonou o duelo, garantindo a sua vitória por W.O.",
            400,
         );
      }

      const isDuelExpired = hasDuelExpired({
         startAt: isDuel.startAt as Date,
         totalTime: isDuel.totalTime as number,
      });

      if (isDuel.status === "FINISHED" && isDuelExpired) {
         throw new AppError(
            "Este duelo já foi finalizado e não aceita mais jogadas.",
            400,
         );
      }

      if (isDuel.status === "ACTIVE" && isDuelExpired) {
         const winnerId =
            Number(isDuel.totalChallengesCompletedSenderId) >
            Number(isDuel.totalChallengesCompletedReceiverId)
               ? isDuel.senderId
               : Number(isDuel.totalChallengesCompletedSenderId) ===
                   Number(isDuel.totalChallengesCompletedReceiverId)
                 ? null
                 : isDuel.receiverId;

         await this.duelsRepository.duelExpired({
            duelsId,
            winnerId,
         });
      }

      return isDuel;
   }
}
