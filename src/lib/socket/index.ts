/** biome-ignore-all lint/suspicious/noExplicitAny: <explanation> */

import { verify } from "jsonwebtoken";
import { Server } from "socket.io";
import { env } from "@/env";

export let io: Server;

export function setupSocket(server: any) {
   io = new Server(server, {
      cors: {
         origin: "http://localhost:3000",
         credentials: true,
      },
   });

   // Middleware do Socket.IO
   io.use((socket, next) => {
      try {
         const accessToken = socket.handshake.headers.cookie
            ?.split("; ")
            .find((cookie) => cookie.startsWith("auth:accessToken="))
            ?.split("=")[1];

         if (!accessToken) {
            return next(new Error("Não autenticado"));
         }

         const payload = verify(accessToken, env.SECRETE_AUTH) as unknown as {
            sub: {
               id: string;
            };
         };

         socket.data.userId = payload.sub.id;

         next();
      } catch {
         next(new Error("Token inválido"));
      }
   });

   io.on("connection", (socket) => {
      const userId = socket.data.userId;
      socket.join(`user:${userId}`);

      socket.on("duel:join", async ({ duelId }) => {
         // 3. Entrar na room

         const room = `duel:${duelId}`;

         await socket.join(room);

         // 4. Verificar quem está na room
         const sockets = await io.in(room).fetchSockets();

         const players = new Set(sockets.map((socket) => socket.data.userId));

         // 5. Informar o estado atual
         io.to(room).emit("duel:presence", {
            players: Array.from(players),
            count: players.size,
            complete: players.size === 2,
         });
      });
   });

   return io;
}
