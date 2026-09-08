import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type { TracksRepository } from "@/modules/tracks/repositories/tracks.repository";
import type { ChallengeRepository } from "../repositories/challenge.repository";

interface ListChallengesUseCaseRequest {
   tracksSlug: string;
   userId: string;
}

export class ListChallengesUseCase {
   constructor(
      private ChallengeRepository: ChallengeRepository,
      private TracksRepository: TracksRepository,
   ) {}

   async execute({ tracksSlug, userId }: ListChallengesUseCaseRequest) {
      const isTrack = await this.TracksRepository.findBySlug({
         slug: tracksSlug,
         userId,
      });

      if (!isTrack) {
         throw new ResourceNotFoundError();
      }

      const challenges = await this.ChallengeRepository.findAll({
         tracksId: isTrack.id,
         userId,
      });

      return {
         challenges,
         track: {
            name: isTrack.name,
            icon: isTrack.icon,
            description: isTrack.description,
            progress: isTrack.progress,
            isActive: isTrack.isActive,
            difficulty: isTrack.difficulty,
            language: isTrack.language,
         },
      };
   }
}
