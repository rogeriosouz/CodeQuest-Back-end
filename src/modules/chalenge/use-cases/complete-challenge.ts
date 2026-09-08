import { ChallengeInCorrectError } from "@/errors/ChallengeInCorrectError";
import { ChallengeIsCompletedError } from "@/errors/ChallengeIsCompletedError";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type { TracksRepository } from "@/modules/tracks/repositories/tracks.repository";
import type { ChallengeRepository } from "../repositories/challenge.repository";

interface CompleteChallengeUseCaseRequest {
   userId: string;
   slug: string;
   trackId: string;
   res: string;
}

export class CompleteChallengeUseCase {
   constructor(
      private ChallengeRepository: ChallengeRepository,
      private TracksRepository: TracksRepository,
   ) {}

   async execute({
      res,
      slug,
      trackId,
      userId,
   }: CompleteChallengeUseCaseRequest) {
      const isChallenge = await this.ChallengeRepository.findBySlug({
         slug,
         userId,
      });

      if (!isChallenge) {
         throw new ResourceNotFoundError();
      }

      const isTrack = await this.TracksRepository.findById(trackId);

      if (!isTrack) {
         throw new ResourceNotFoundError();
      }

      const listProgressUserByTrackSlug =
         await this.TracksRepository.findBySlug({ slug: isTrack.slug, userId });

      if (!listProgressUserByTrackSlug) {
         throw new ResourceNotFoundError();
      }

      const challengeIsCompleted =
         listProgressUserByTrackSlug.progress?.challengesCompleted?.find(
            (challenge) => challenge.challengeId === isChallenge.id,
         );

      if (challengeIsCompleted) {
         throw new ChallengeIsCompletedError();
      }

      const isResCorrect = isChallenge.alternatives?.find(
         (alternative) => alternative.text === res,
      );

      if (!isResCorrect) {
         throw new ChallengeInCorrectError();
      }

      if (!isResCorrect.isCorrect) {
         throw new ChallengeInCorrectError();
      }

      await this.TracksRepository.completeChallenge({
         challengeId: isChallenge.id,
         tracksId: isTrack.id,
         userId,
      });
   }
}
