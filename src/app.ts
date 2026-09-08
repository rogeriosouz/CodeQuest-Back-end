import "dotenv/config";
import fastifyCookies from "@fastify/cookie";
import fastifyCors from "@fastify/cors";
import Fastify, { type FastifyError } from "fastify";
import { ZodError } from "zod";
import { env } from "./env";
import { AppError } from "./errors/app.errors";
import { usersRouters } from "./modules/user/http/routes/users-router";

import "@/shared/mail/mail.job";
import "@/shared/code/code.job";

const app = Fastify();

import { challengesRoutes } from "./modules/chalenge/http/routes/challenges-routes";
import { duelsRoutes } from "./modules/duels/http/routes/duels-routes";
import { friendsRoutes } from "./modules/friends/http/routes/friends-routes";
import { tracksRoutes } from "./modules/tracks/http/routes/tracks-routes";

app.register(fastifyCors, {
   origin: ["http://localhost:3000", "http://localhost:3444"],
   methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
   credentials: true,
});

app.register(fastifyCookies, {
   secret: env.SECRET_REFRESH_TOKEN,
   parseOptions: {},
});

app.setErrorHandler((error: FastifyError, _, reply) => {
   if (error.message.includes("Rate limit")) {
      return reply.status(429).send({
         statusCode: 429,
         message: error.message,
      });
   }

   if (error instanceof ZodError) {
      return reply.status(400).send({
         statusCode: 400,
         message: "Error validation",
         error: error.flatten().fieldErrors,
      });
   }

   if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
         statusCode: error.statusCode,
         message: error.message,
      });
   }

   if (env.NODE_ENV !== "production") {
      console.error(error);
   }

   return reply.status(500).send({
      statusCode: 500,
      error: "Internal server error!",
      message: "Internal server error!",
   });
});

app.register(usersRouters);
app.register(friendsRoutes);
app.register(duelsRoutes);
app.register(tracksRoutes);
app.register(challengesRoutes);

export { app };
