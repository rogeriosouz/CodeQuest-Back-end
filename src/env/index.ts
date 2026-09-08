import { z } from "zod";

const schemaEnv = z.object({
   PORT: z.coerce.number().default(3333),
   NODE_ENV: z.enum(["dev", "production"]).default("dev"),
   FRONT_END_URL: z.string(),

   DATABASE_URL: z.string(),

   SECRET_REFRESH_TOKEN: z.string(),
   SECRETE_AUTH: z.string(),
   SECRETE_COOKIES: z.string(),
   SECRETE_AUTH_RECOVERY_PASSWORD: z.string(),

   SMTP_HOST: z.string(),
   SMTP_PORT: z.coerce.number(),
   SMTP_USER: z.string(),
   SMTP_PASS: z.string(),

   REDIS_HOST: z.string(),
   REDIS_PASSWORD: z.string(),
   AI_API_KEY: z.string().optional(),
   AI_API_URL: z
      .string()
      .url()
      .default("https://api.openai.com/v1/chat/completions"),
   AI_MODEL: z.string().default("gpt-4o-mini"),
});

const _env = schemaEnv.safeParse(process.env);

if (_env.success === false) {
   console.error("Erros variables not found", _env.error.format());

   throw new Error("Erros variables not found");
}

export const env = _env.data;
