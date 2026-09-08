import { ChallengeIsCompletedError } from "@/errors/ChallengeIsCompletedError";
import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type { TracksRepository } from "@/modules/tracks/repositories/tracks.repository";
import { ExecuteCodeService } from "@/shared/code/code.service";
import type { ChallengeRepository } from "../repositories/challenge.repository";

interface CompleteChallengeCodeUseCaseRequest {
   slug: string;
   userId: string;
   code: string;
}

export class CompleteChallengeCodeUseCase {
   constructor(
      private ChallengeRepository: ChallengeRepository,
      private TracksRepository: TracksRepository,
   ) {}

   async execute({ slug, userId, code }: CompleteChallengeCodeUseCaseRequest) {
      const isChallenge = await this.ChallengeRepository.findBySlug({
         slug,
         userId,
      });

      if (!isChallenge) {
         throw new ResourceNotFoundError();
      }

      const isTrack = await this.TracksRepository.findById(
         isChallenge.tracksId,
      );

      if (!isTrack) {
         throw new ResourceNotFoundError();
      }

      const listProgressUserByTrackSlug =
         await this.TracksRepository.findBySlug({ slug: isTrack.slug, userId });

      if (!listProgressUserByTrackSlug) {
         throw new ResourceNotFoundError();
      }

      const challengeCode = await this.ChallengeRepository.findByIdCode(
         isChallenge.id,
      );

      if (!challengeCode) {
         throw new ResourceNotFoundError();
      }

      const challengeIsCompleted =
         listProgressUserByTrackSlug.progress?.challengesCompleted?.find(
            (challenge) => challenge.challengeId === isChallenge.id,
         );

      if (challengeIsCompleted) {
         throw new ChallengeIsCompletedError();
      }

      const executeCode = new ExecuteCodeService();
      await executeCode.sendExecuteCode({
         code,
         functionName: isChallenge.challengeCode?.functionName ?? "fn",
         language: isChallenge.language ?? "javascript",
         testCases: isChallenge.challengeCode?.testCases ?? [],
         userId,
         challengeId: isChallenge.id,
         tracksId: isTrack.id,
      });
   }
}
