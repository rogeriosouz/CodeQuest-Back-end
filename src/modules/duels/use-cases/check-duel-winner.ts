import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import { hasDuelExpired } from "@/shared/utils/has-duel-expired";
import type { DuelsRepository } from "../repositories/duels.repository";

interface CheckDuelWinnerUseCaseRequest {
   userId: string;
   duelsId: string;
}

export class CheckDuelWinnerUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId }: CheckDuelWinnerUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const duel = await this.duelsRepository.findOneDuel({
         duelsId,
         userId,
      });

      if (!duel) {
         throw new ResourceNotFoundError();
      }

      if (duel.status === "FORFEITED") {
         const winnerId =
            duel.forfeitedId === duel.senderId
               ? duel.receiverId
               : duel.senderId;

         const winner = await this.usersRepository.findById(winnerId);

         if (!winner) {
            throw new UserNotFoundError();
         }

         return {
            duelId: duel.id,
            winnerId,
            winnerName: winner.name,
            status: duel.status,
            reason: "forfeit",
         };
      }

      if (duel.status === "FINISHED" && duel.winnerId) {
         const winner = await this.usersRepository.findById(duel.winnerId);

         if (!winner) {
            throw new UserNotFoundError();
         }

         return {
            duelId: duel.id,
            winnerId: duel.winnerId,
            winnerName: winner.name,
            status: duel.status,
            reason: "finished",
         };
      }

      const isDuelExpired = hasDuelExpired({
         startAt: duel.startAt as Date,
         totalTime: duel.totalTime as number,
      });

      if (duel.status === "ACTIVE" && isDuelExpired) {
         const winnerId =
            Number(duel.totalChallengesCompletedSenderId) >
            Number(duel.totalChallengesCompletedReceiverId)
               ? duel.senderId
               : Number(duel.totalChallengesCompletedSenderId) ===
                   Number(duel.totalChallengesCompletedReceiverId)
                 ? null
                 : duel.receiverId;

         await this.duelsRepository.duelExpired({
            duelsId,
            winnerId,
         });

         if (!winnerId) {
            return {
               duelId: duel.id,
               winnerId: null,
               winnerName: null,
               status: "FINISHED",
               reason: "draw",
            };
         }

         const winner = await this.usersRepository.findById(winnerId);

         if (!winner) {
            throw new UserNotFoundError();
         }

         return {
            duelId: duel.id,
            winnerId,
            winnerName: winner.name,
            status: "FINISHED",
            reason: "time_expired",
         };
      }

      return {
         duelId: duel.id,
         winnerId: null,
         winnerName: null,
         status: duel.status,
         reason: "not_finished",
      };
   }
}
