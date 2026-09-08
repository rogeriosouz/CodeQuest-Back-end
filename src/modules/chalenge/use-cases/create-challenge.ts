import type {
   ChallengeRepository,
   CreateChallengeInput,
   CreatedChallenge,
} from "../repositories/challenge.repository";

export class CreateChallengeUseCase {
   constructor(private challengeRepository: ChallengeRepository) {}

   async execute(
      input: CreateChallengeInput | CreateChallengeInput[],
   ): Promise<CreatedChallenge[]> {
      const challenges = await this.challengeRepository.create(input);

      return challenges;
   }
}
