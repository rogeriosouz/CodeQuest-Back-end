import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import { UserNotFoundError } from "@/errors/UserNotFoundError";
import { io } from "@/lib/socket";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { DuelsRepository } from "../repositories/duels.repository";

interface RefuseDuelsUseCaseRequest {
   userId: string;
   duelsId: string;
}

export class RefuseDuelsUseCase {
   constructor(
      private duelsRepository: DuelsRepository,
      private usersRepository: UserRepository,
   ) {}

   async execute({ userId, duelsId }: RefuseDuelsUseCaseRequest) {
      const isUser = await this.usersRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const isDuels = await this.duelsRepository.findOneDuel({
         duelsId,
         userId,
      });

      if (!isDuels) {
         throw new ResourceNotFoundError();
      }

      if (userId !== isDuels.receiverId) {
         throw new ResourceNotFoundError();
      }

      await this.duelsRepository.refuseDuel({
         duelsId,
         userId,
      });

      io.to(`user:${isDuels.senderId}`).emit("duel:refuse");
   }
}
