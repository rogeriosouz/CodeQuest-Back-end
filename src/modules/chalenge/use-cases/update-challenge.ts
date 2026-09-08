import { ResourceNotFoundError } from "@/errors/ResourceNotFoundError";
import type {
   Challenge,
   ChallengeRepository,
   UpdateChallengeInput,
} from "../repositories/challenge.repository";

export class UpdateChallengeUseCase {
   constructor(private challengeRepository: ChallengeRepository) {}

   async execute(input: UpdateChallengeInput): Promise<Challenge> {
      const challenge = await this.challengeRepository.update(input);

      if (!challenge) {
         throw new ResourceNotFoundError();
      }

      return challenge;
   }
}
