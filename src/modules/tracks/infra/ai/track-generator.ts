import { env } from "@/env";
import type { CreateTrackInput } from "../../repositories/tracks.repository";

export class OpenAITrackGenerator {
   async generate(prompt: string): Promise<CreateTrackInput> {
      if (!env.AI_API_KEY) throw new Error("AI_API_KEY is not configured");

      const response = await fetch(env.AI_API_URL, {
         method: "POST",
         headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.AI_API_KEY}`,
         },
         body: JSON.stringify({
            model: env.AI_MODEL,
            temperature: 0.2,
            response_format: { type: "json_object" },
            messages: [
               {
                  role: "system",
                  content:
                     "Crie uma track educacional para CodeQuest. Responda somente JSON válido com name, slug, description, difficulty, language, isActive e challenges. Cada challenge deve conter name, slug, points, difficulty, type, isCode, tips, alternatives, isActive e, se isCode=true, codeChallenge com languageCode, functionName, testCases, starterCode, timeLimitMs e memoryLimitMb.",
               },
               { role: "user", content: prompt },
            ],
         }),
      });

      if (!response.ok)
         throw new Error(`AI provider returned ${response.status}`);
      const data = (await response.json()) as {
         choices?: { message?: { content?: string } }[];
      };
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("AI provider returned an empty track");
      return JSON.parse(content) as CreateTrackInput;
   }
}
