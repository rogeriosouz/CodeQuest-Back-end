import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type { ChallengeRepository } from "../repositories/challenge.repository";

interface ListOneChallengeRequest {
   slug: string;
   userId: string;
}

export class ListOneChallengeUseCase {
   constructor(private ChallengeRepository: ChallengeRepository) {}

   async execute({ slug, userId }: ListOneChallengeRequest) {
      const isChallenge = await this.ChallengeRepository.findBySlug({
         slug,
         userId,
      });

      if (!isChallenge) {
         throw new ResourceNotFoundError();
      }

      return isChallenge;
   }
}
