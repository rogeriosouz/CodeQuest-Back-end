import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { hashToken } from "@/shared/utils/hash-token";
import { refreshToken } from "../../../../../drizzle/schema/refresh-token";
import { users } from "../../../../../drizzle/schema/users";
import type { RefreshTokenRepository } from "../../repositories/refresh.token.repository";

export class RefreshTokenDrizzleRepository implements RefreshTokenRepository {
   async findToken(tokenHash: string): Promise<{
      user: { id: string; name: string; email: string };
      expiresAt: Date;
   } | null> {
      const hash = hashToken(tokenHash);

      const token = await db
         .select()
         .from(refreshToken)
         .innerJoin(users, eq(users.id, refreshToken.userId))
         .where(eq(refreshToken.tokenHash, hash));

      if (!token[0]) {
         return null;
      }

      return {
         user: {
            id: token[0].users.id,
            name: token[0].users.name,
            email: token[0].users.email,
         },
         expiresAt: token[0].refresh_token.expiresAt,
      };
   }

   async findByTokenHash({
      tokenHash,
      userId,
   }: {
      tokenHash: string;
      userId: string;
   }): Promise<boolean> {
      const hash = hashToken(tokenHash);
      const token = await db
         .select()
         .from(refreshToken)
         .where(
            and(
               eq(refreshToken.tokenHash, hash),
               eq(refreshToken.userId, userId),
            ),
         );

      if (!token[0]) {
         return false;
      }

      return true;
   }
   async create({
      tokenHash,
      userId,
      expiresAt,
   }: {
      tokenHash: string;
      userId: string;
      expiresAt?: Date;
   }) {
      const expiresA7day = new Date();
      expiresA7day.setDate(expiresA7day.getDate() + 7);

      const hash = hashToken(tokenHash);

      await db.insert(refreshToken).values({
         expiresAt: expiresAt ? expiresAt : expiresA7day,
         userId,
         tokenHash: hash,
      });
   }

   async invalidateToken({
      tokenHash,
      userId,
   }: {
      tokenHash: string;
      userId: string;
   }): Promise<void> {
      const hash = hashToken(tokenHash);
      await db
         .delete(refreshToken)
         .where(
            and(
               eq(refreshToken.tokenHash, hash),
               eq(refreshToken.userId, userId),
            ),
         );
   }
}
