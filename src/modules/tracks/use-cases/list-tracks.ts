import { UserNotFoundError } from "@/errors/UserNotFoundError";
import type { UserRepository } from "@/modules/user/repositories/user.repository";
import type { TracksRepository } from "../repositories/tracks.repository";

interface ListTracksUseCaseRequest {
   userId: string;
   search?: string;
}

export class ListTracksUseCase {
   constructor(
      private TracksRepository: TracksRepository,
      private UserRepository: UserRepository,
   ) {}

   async execute({ userId, search }: ListTracksUseCaseRequest) {
      const isUser = await this.UserRepository.findById(userId);

      if (!isUser) {
         throw new UserNotFoundError();
      }

      const tracks = await this.TracksRepository.findAll({ userId, search });

      return tracks;
   }
}
