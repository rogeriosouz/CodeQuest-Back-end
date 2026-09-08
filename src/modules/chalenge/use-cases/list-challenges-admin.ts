import type {
   AdminChallenge,
   ChallengeRepository,
} from "../repositories/challenge.repository";

interface ListChallengesAdminUseCaseRequest {
   tracksId?: string | undefined;
   search?: string | undefined;
}

export class ListChallengesAdminUseCase {
   constructor(private challengeRepository: ChallengeRepository) {}

   async execute(
      filter: ListChallengesAdminUseCaseRequest = {},
   ): Promise<AdminChallenge[]> {
      const challenges = await this.challengeRepository.findAllAdmin(filter);

      return challenges;
   }
}
