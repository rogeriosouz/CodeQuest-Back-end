export interface RefreshTokenRepository {
   findToken(tokenHash: string): Promise<{
      user: { id: string; name: string; email: string };
      expiresAt: Date;
   } | null>;
   findByTokenHash({
      tokenHash,
      userId,
   }: {
      tokenHash: string;
      userId: string;
   }): Promise<boolean>;

   create({
      tokenHash,
      userId,
      expiresAt,
   }: {
      tokenHash: string;
      userId: string;
      expiresAt?: Date;
   }): Promise<void>;

   invalidateToken({
      tokenHash,
      userId,
   }: {
      tokenHash: string;
      userId: string;
   }): Promise<void>;
}
