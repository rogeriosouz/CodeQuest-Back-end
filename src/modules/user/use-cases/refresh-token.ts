import { InvalidCredentialsError } from "@/errors/InvalidCredentialsError";
import type { RefreshTokenRepository } from "../repositories/refresh.token.repository";

interface RefreshTokenUseCaseRequest {
   refreshToken: string;
}

export class RefreshTokenUseCase {
   constructor(private RefreshTokenRepository: RefreshTokenRepository) {}

   async execute({ refreshToken }: RefreshTokenUseCaseRequest) {
      const isRefreshToken =
         await this.RefreshTokenRepository.findToken(refreshToken);

      if (!isRefreshToken) {
         throw new InvalidCredentialsError();
      }

      if (isRefreshToken.expiresAt < new Date()) {
         throw new InvalidCredentialsError();
      }

      return {
         user: isRefreshToken.user,
      };
   }
}
