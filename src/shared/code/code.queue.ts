import { myQueueCode } from "@/config/bullmq";
import type { TestCase } from "./code.job";

export async function queueExecuteCode({
   code,
   functionName,
   language,
   testCases,
   userId,
   challengeId,
   tracksId,
}: {
   code: string;
   language: string;
   functionName: string;
   testCases: TestCase[];
   userId: string;
   challengeId: string;
   tracksId: string;
}) {
   await myQueueCode.add("execute-code", {
      code,
      functionName,
      language,
      testCases,
      userId,
      challengeId,
      tracksId,
   });
}
