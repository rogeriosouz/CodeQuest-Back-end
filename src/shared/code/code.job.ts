import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { Worker } from "bullmq";

import { connection } from "@/config/bullmq";
import { env } from "@/env";
import { io } from "@/lib/socket";
import { TracksDrizzleRepository } from "@/modules/tracks/infra/drizzle/tracks.drizzle.repository";

/**
 * =====================================================
 * TYPES
 * =====================================================
 */

export type TestCase = {
   input: unknown[];
   expectedOutput: unknown;
   isHidden?: boolean;
};

export type TestResult = {
   passed: boolean;
   input: unknown[];
   expected: unknown;
   received: unknown;
   isHidden?: boolean;
   error?: string;
};

export type ExecutionError = {
   type:
      | "SYNTAX_ERROR"
      | "COMPILATION_ERROR"
      | "RUNTIME_ERROR"
      | "FUNCTION_NOT_FOUND"
      | "TIMEOUT"
      | "DOCKER_ERROR"
      | "VALIDATION_ERROR"
      | "UNKNOWN_ERROR";

   message: string;
};

export type ExecutionResult = {
   success: boolean;
   results: TestResult[];
   error?: ExecutionError;
};

/**
 * =====================================================
 * LANGUAGES CONFIG
 * =====================================================
 */

const languagesConfig = {
   javascript: {
      image: "javascript-runner",
      fileName: "code.js",
      command: ["node", "/tmp/code.js"],
   },

   typescript: {
      image: "typescript-runner",
      fileName: "code.ts",
      command: ["npx", "tsx", "/tmp/code.ts"],
   },

   python: {
      image: "python-runner",
      fileName: "code.py",
      command: ["python", "/tmp/code.py"],
   },

   cpp: {
      image: "cpp-runner",
      fileName: "code.cpp",
      command: [
         "sh",
         "-c",
         "g++ -std=c++20 /tmp/code.cpp -o /tmp/program && /tmp/program",
      ],
   },
};

/**
 * =====================================================
 * EMIT RESULT
 * =====================================================
 */

function emitExecutionResult(userId: string, result: ExecutionResult) {
   io.to(`user:${userId}`).emit("code-execution-result", result);

   return result;
}

/**
 * =====================================================
 * EMIT ERROR
 * =====================================================
 */

function emitExecutionError(
   userId: string,
   type: ExecutionError["type"],
   message: string,
): ExecutionResult {
   return emitExecutionResult(userId, {
      success: false,

      results: [],

      error: {
         type,
         message,
      },
   });
}

/**
 * =====================================================
 * C++ HELPERS
 * =====================================================
 */

function cppString(value: string) {
   return JSON.stringify(value);
}

function cppValue(value: unknown): string {
   if (value === null) {
      return "nullptr";
   }

   if (typeof value === "boolean") {
      return value ? "true" : "false";
   }

   if (typeof value === "number") {
      return String(value);
   }

   if (typeof value === "string") {
      return cppString(value);
   }

   if (Array.isArray(value)) {
      return `{${value.map(cppValue).join(", ")}}`;
   }

   throw new Error(`Valor não suportado pelo C++: ${typeof value}`);
}

/**
 * =====================================================
 * PYTHON HELPERS
 * =====================================================
 */

function pythonValue(value: unknown): string {
   return JSON.stringify(value);
}

/**
 * =====================================================
 * DETECT EXECUTION ERROR
 * =====================================================
 */

function detectExecutionError(
   language: keyof typeof languagesConfig,
   stderr: string,
   exitCode: number | null,
): ExecutionError {
   const message =
      stderr.trim() ||
      `Processo terminou com código ${exitCode ?? "desconhecido"}`;

   /**
    * ================================================
    * JAVASCRIPT
    * ================================================
    */

   if (language === "javascript") {
      if (
         message.includes("SyntaxError") ||
         message.includes("Unexpected token") ||
         message.includes("Invalid or unexpected token")
      ) {
         return {
            type: "SYNTAX_ERROR",
            message,
         };
      }

      return {
         type: "RUNTIME_ERROR",
         message,
      };
   }

   /**
    * ================================================
    * TYPESCRIPT
    * ================================================
    */

   if (language === "typescript") {
      if (
         message.includes("SyntaxError") ||
         message.includes("Unexpected token") ||
         message.includes("TS1005") ||
         message.includes("TS1109") ||
         message.includes("TS1128") ||
         message.includes("TS1136") ||
         message.includes("TS1003") ||
         message.includes("TS1010") ||
         message.includes("TS1110")
      ) {
         return {
            type: "SYNTAX_ERROR",
            message,
         };
      }

      return {
         type: "RUNTIME_ERROR",
         message,
      };
   }

   /**
    * ================================================
    * PYTHON
    * ================================================
    */

   if (language === "python") {
      if (
         message.includes("SyntaxError") ||
         message.includes("IndentationError") ||
         message.includes("TabError")
      ) {
         return {
            type: "SYNTAX_ERROR",
            message,
         };
      }

      return {
         type: "RUNTIME_ERROR",
         message,
      };
   }

   /**
    * ================================================
    * C++
    * ================================================
    */

   if (language === "cpp") {
      if (
         message.includes("error:") ||
         message.includes("fatal error") ||
         message.includes("undefined reference") ||
         message.includes("ld returned")
      ) {
         return {
            type: "COMPILATION_ERROR",
            message,
         };
      }

      return {
         type: "RUNTIME_ERROR",
         message,
      };
   }

   /**
    * ================================================
    * UNKNOWN
    * ================================================
    */

   return {
      type: "UNKNOWN_ERROR",
      message,
   };
}

/**
 * =====================================================
 * DOCKER EXECUTION
 * =====================================================
 */

function executeDocker(
   codePath: string,
   config: (typeof languagesConfig)[keyof typeof languagesConfig],
   timeoutMs = 10_000,
) {
   return new Promise<{
      stdout: string;
      stderr: string;
      exitCode: number | null;
      timedOut: boolean;
   }>((resolve) => {
      const docker = spawn("docker", [
         "run",

         "--rm",

         /**
          * Sem internet
          */
         "--network",
         "none",

         /**
          * Memória
          */
         "--memory",
         "128m",

         /**
          * CPU
          */
         "--cpus",
         "0.5",

         /**
          * Processos
          */
         "--pids-limit",
         "50",

         /**
          * Remove capabilities
          */
         "--cap-drop",
         "ALL",

         /**
          * Impede escalada
          */
         "--security-opt",
         "no-new-privileges",

         /**
          * Sistema somente leitura
          */
         "--read-only",

         /**
          * /tmp disponível
          */
         "--tmpfs",
         "/tmp:rw,noexec,nosuid,size=64m",

         /**
          * Código somente leitura
          */
         "-v",
         `${codePath}:/tmp/${config.fileName}:ro`,

         /**
          * Imagem
          */
         config.image,

         /**
          * Comando
          */
         ...config.command,
      ]);

      let stdout = "";
      let stderr = "";

      let finished = false;

      const finish = (result: {
         stdout: string;
         stderr: string;
         exitCode: number | null;
         timedOut: boolean;
      }) => {
         if (finished) {
            return;
         }

         finished = true;

         resolve(result);
      };

      /**
       * ==============================================
       * STDOUT
       * ==============================================
       */

      docker.stdout.on("data", (data) => {
         stdout += data.toString();

         /**
          * Limita saída.
          */
         if (stdout.length > 1_000_000) {
            stderr += "\nSaída do programa excedeu o limite permitido.";

            docker.kill("SIGKILL");
         }
      });

      /**
       * ==============================================
       * STDERR
       * ==============================================
       */

      docker.stderr.on("data", (data) => {
         stderr += data.toString();

         if (stderr.length > 1_000_000) {
            stderr =
               stderr.slice(0, 1_000_000) +
               "\nErro excedeu o limite permitido.";
         }
      });

      /**
       * ==============================================
       * ERRO AO INICIAR DOCKER
       * ==============================================
       */

      docker.on("error", (error) => {
         finish({
            stdout,

            stderr:
               error instanceof Error
                  ? error.message
                  : "Erro ao iniciar Docker.",

            exitCode: 1,

            timedOut: false,
         });
      });

      /**
       * ==============================================
       * TIMEOUT
       * ==============================================
       */

      const timeout = setTimeout(() => {
         if (finished) {
            return;
         }

         stderr = "O tempo máximo de execução foi excedido.";

         docker.kill("SIGKILL");

         finish({
            stdout,

            stderr,

            exitCode: null,

            timedOut: true,
         });
      }, timeoutMs);

      /**
       * ==============================================
       * PROCESSO FINALIZADO
       * ==============================================
       */

      docker.on("close", (exitCode) => {
         clearTimeout(timeout);

         finish({
            stdout,

            stderr,

            exitCode,

            timedOut: false,
         });
      });
   });
}

/**
 * =====================================================
 * WORKER
 * =====================================================
 */

const worker = new Worker(
   "codeExecutionQueue",

   async (job): Promise<ExecutionResult> => {
      const {
         code,
         language,
         functionName,
         testCases,
         userId,
         challengeId,
         tracksId,
      }: {
         code: string;
         language: keyof typeof languagesConfig;
         functionName: string;
         testCases: TestCase[];
         userId: string;
         challengeId: string;
         tracksId: string;
      } = job.data;

      /**
       * =================================================
       * USER ID
       * =================================================
       */

      if (!userId || typeof userId !== "string") {
         throw new Error("userId inválido ou não informado.");
      }

      /**
       * =================================================
       * VALIDAÇÃO
       * =================================================
       */

      if (!code || typeof code !== "string") {
         return emitExecutionError(
            userId,
            "VALIDATION_ERROR",
            "Código inválido ou vazio.",
         );
      }

      if (!functionName || typeof functionName !== "string") {
         return emitExecutionError(
            userId,
            "VALIDATION_ERROR",
            "functionName é obrigatório.",
         );
      }

      if (!Array.isArray(testCases)) {
         return emitExecutionError(
            userId,
            "VALIDATION_ERROR",
            "testCases deve ser um array.",
         );
      }

      if (testCases.length === 0) {
         return emitExecutionError(
            userId,
            "VALIDATION_ERROR",
            "É necessário informar pelo menos um teste.",
         );
      }

      const config = languagesConfig[language];

      if (!config) {
         return emitExecutionError(
            userId,
            "VALIDATION_ERROR",
            `A linguagem "${language}" não é suportada.`,
         );
      }

      /**
       * =================================================
       * TEMP DIRECTORY
       * =================================================
       */

      let tempDir: string | null = null;

      try {
         tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "code-runner-"));

         const codePath = path.join(tempDir, config.fileName);

         /**
          * =================================================
          * JAVASCRIPT
          * =================================================
          */

         if (language === "javascript") {
            const runnerCode = `
${code}

/**
 * =========================================
 * TEST RUNNER
 * =========================================
 */

const __functionName =
   ${JSON.stringify(functionName)};

const __testCases =
   ${JSON.stringify(testCases)};

async function __runTests() {

   const __results = [];

   let __userFunction;

   try {

      __userFunction =
         eval(__functionName);

   } catch (__error) {

      console.log(
         JSON.stringify({
            success: false,
            results: [],
            error: {
               type: "FUNCTION_NOT_FOUND",
               message:
                  __error instanceof Error
                     ? __error.message
                     : "Erro ao localizar função"
            }
         })
      );

      return;
   }

   if (
      typeof __userFunction !== "function"
   ) {

      console.log(
         JSON.stringify({
            success: false,
            results: [],
            error: {
               type: "FUNCTION_NOT_FOUND",
               message:
                  \`Função "\${__functionName}" não encontrada\`
            }
         })
      );

      return;
   }

   for (
      const __testCase of __testCases
   ) {

      try {

         const __received =
            await __userFunction(
               ...__testCase.input
            );

         const __passed =
            JSON.stringify(
               __received
            ) ===
            JSON.stringify(
               __testCase.expectedOutput
            );

         __results.push({

            passed:
               __passed,

            input:
               __testCase.input,

            expected:
               __testCase.expectedOutput,

            received:
               __received,

            isHidden:
               __testCase.isHidden ?? false

         });

      } catch (__error) {

         __results.push({

            passed:
               false,

            input:
               __testCase.input,

            expected:
               __testCase.expectedOutput,

            received:
               null,

            isHidden:
               __testCase.isHidden ?? false,

            error:
               __error instanceof Error
                  ? __error.message
                  : "Erro desconhecido"

         });
      }
   }

   const __success =
      __results.every(
         (__result) =>
            __result.passed
      );

   console.log(
      JSON.stringify({
         success:
            __success,

         results:
            __results
      })
   );
}

__runTests();
`;

            await fs.writeFile(codePath, runnerCode, "utf8");
         }

         /**
          * =================================================
          * TYPESCRIPT
          * =================================================
          */

         if (language === "typescript") {
            const runnerCode = `
${code}

/**
 * =========================================
 * TEST RUNNER
 * =========================================
 */

const __functionName =
   ${JSON.stringify(functionName)};

const __testCases =
   ${JSON.stringify(testCases)};

async function __runTests() {

   const __results: any[] = [];

   let __userFunction;

   try {

      __userFunction =
         eval(__functionName);

   } catch (__error) {

      console.log(
         JSON.stringify({
            success: false,
            results: [],
            error: {
               type: "FUNCTION_NOT_FOUND",
               message:
                  __error instanceof Error
                     ? __error.message
                     : "Erro ao localizar função"
            }
         })
      );

      return;
   }

   if (
      typeof __userFunction !== "function"
   ) {

      console.log(
         JSON.stringify({
            success: false,
            results: [],
            error: {
               type: "FUNCTION_NOT_FOUND",
               message:
                  \`Função "\${__functionName}" não encontrada\`
            }
         })
      );

      return;
   }

   for (
      const __testCase of __testCases
   ) {

      try {

         const __received =
            await __userFunction(
               ...__testCase.input
            );

         const __passed =
            JSON.stringify(
               __received
            ) ===
            JSON.stringify(
               __testCase.expectedOutput
            );

         __results.push({

            passed:
               __passed,

            input:
               __testCase.input,

            expected:
               __testCase.expectedOutput,

            received:
               __received,

            isHidden:
               __testCase.isHidden ?? false

         });

      } catch (__error) {

         __results.push({

            passed:
               false,

            input:
               __testCase.input,

            expected:
               __testCase.expectedOutput,

            received:
               null,

            isHidden:
               __testCase.isHidden ?? false,

            error:
               __error instanceof Error
                  ? __error.message
                  : "Erro desconhecido"

         });
      }
   }

   const __success =
      __results.every(
         (__result) =>
            __result.passed
      );

   console.log(
      JSON.stringify({
         success:
            __success,

         results:
            __results
      })
   );
}

__runTests();
`;

            await fs.writeFile(codePath, runnerCode, "utf8");
         }

         /**
          * =================================================
          * PYTHON
          * =================================================
          */

         if (language === "python") {
            const pythonTests = testCases
               .map((testCase) => {
                  return `{
   "input": ${pythonValue(testCase.input)},
   "expectedOutput": ${pythonValue(testCase.expectedOutput)},
   "isHidden": ${testCase.isHidden ?? false}
}`;
               })
               .join(",\n");

            const runnerCode = `
${code}

import json
import inspect
import asyncio

__function_name = ${JSON.stringify(functionName)}

__test_cases = [
${pythonTests}
]


async def __call_function(
    __function,
    __input
):

    __result = __function(
        *__input
    )

    if inspect.isawaitable(
        __result
    ):
        __result = await __result

    return __result


async def __run_tests():

    __results = []

    __user_function = globals().get(
        __function_name
    )

    if not callable(
        __user_function
    ):

        print(
            json.dumps({
                "success": False,

                "results": [],

                "error": {
                    "type":
                        "FUNCTION_NOT_FOUND",

                    "message":
                        f'Função "{__function_name}" não encontrada'
                }
            })
        )

        return

    for __test_case in __test_cases:

        try:

            __received =
                await __call_function(
                    __user_function,
                    __test_case["input"]
                )

            __passed = (
                __received ==
                __test_case["expectedOutput"]
            )

            __results.append({

                "passed":
                    __passed,

                "input":
                    __test_case["input"],

                "expected":
                    __test_case["expectedOutput"],

                "received":
                    __received,

                "isHidden":
                    __test_case["isHidden"]

            })

        except Exception as __error:

            __results.append({

                "passed":
                    False,

                "input":
                    __test_case["input"],

                "expected":
                    __test_case["expectedOutput"],

                "received":
                    None,

                "isHidden":
                    __test_case["isHidden"],

                "error":
                    str(__error)

            })

    __success = all(
        __result["passed"]
        for __result in __results
    )

    print(
        json.dumps({
            "success":
                __success,

            "results":
                __results
        })
    )


asyncio.run(
    __run_tests()
)
`;

            await fs.writeFile(codePath, runnerCode, "utf8");
         }

         /**
          * =================================================
          * C++
          * =================================================
          */

         if (language === "cpp") {
            const cppTests = testCases
               .map((testCase, index) => {
                  const inputs = testCase.input.map(cppValue).join(", ");

                  const expected = cppValue(testCase.expectedOutput);

                  return `
   // =========================================
   // Teste ${index + 1}
   // =========================================

   try {

      auto __received_${index} =
         ${functionName}(${inputs});

      auto __expected_${index} =
         decltype(__received_${index})(
            ${expected}
         );

      bool __passed_${index} =
         (
            __received_${index} ==
            __expected_${index}
         );

      __results.push_back({

         __passed_${index},

         ${JSON.stringify(JSON.stringify(testCase.input))},

         ${JSON.stringify(JSON.stringify(testCase.expectedOutput))},

         __passed_${index}
            ?
            ${JSON.stringify(JSON.stringify(testCase.expectedOutput))}
            :
            ${JSON.stringify(JSON.stringify("different"))},

         ${testCase.isHidden ?? false},

         ""

      });

   } catch (
      const std::exception& __error
   ) {

      __results.push_back({

         false,

         ${JSON.stringify(JSON.stringify(testCase.input))},

         ${JSON.stringify(JSON.stringify(testCase.expectedOutput))},

         "null",

         ${testCase.isHidden ?? false},

         __error.what()

      });

   }
`;
               })
               .join("\n");

            const runnerCode = `
#include <iostream>
#include <string>
#include <vector>

using namespace std;

${code}

struct TestResult {

   bool passed;

   string input;

   string expected;

   string received;

   bool isHidden;

   string error;
};

int main() {

   vector<TestResult> __results;

${cppTests}

   bool __success = true;

   for (
      const auto& __result :
      __results
   ) {

      if (
         !__result.passed
      ) {

         __success = false;
      }
   }

   cout << "{";

   cout << "\\"success\\":"
        << (
            __success
               ? "true"
               : "false"
        );

   cout << ",\\"results\\":[";

   for (
      size_t i = 0;
      i < __results.size();
      i++
   ) {

      const auto& __result =
         __results[i];

      cout << "{";

      cout << "\\"passed\\":"
           << (
               __result.passed
                  ? "true"
                  : "false"
           );

      cout << ",\\"input\\":"
           << __result.input;

      cout << ",\\"expected\\":"
           << __result.expected;

      cout << ",\\"received\\":"
           << __result.received;

      cout << ",\\"isHidden\\":"
           << (
               __result.isHidden
                  ? "true"
                  : "false"
           );

      if (
         !__result.error.empty()
      ) {

         cout
            << ",\\"error\\":\\""
            << __result.error
            << "\\"";
      }

      cout << "}";

      if (
         i + 1 <
         __results.size()
      ) {

         cout << ",";
      }
   }

   cout << "]}";

   return 0;
}
`;

            await fs.writeFile(codePath, runnerCode, "utf8");
         }

         /**
          * =================================================
          * EXECUTA DOCKER
          * =================================================
          */

         const result = await executeDocker(codePath, config, 10_000);

         /**
          * =================================================
          * TIMEOUT
          * =================================================
          */

         if (result.timedOut) {
            return emitExecutionError(
               userId,
               "TIMEOUT",
               "O código excedeu o tempo máximo de execução de 10 segundos.",
            );
         }

         /**
          * =================================================
          * ERRO DO PROCESSO
          * =================================================
          */

         if (result.exitCode !== 0) {
            const executionError = detectExecutionError(
               language,
               result.stderr,
               result.exitCode,
            );

            return emitExecutionResult(userId, {
               success: false,

               results: [],

               error: executionError,
            });
         }

         /**
          * =================================================
          * STDOUT VAZIO
          * =================================================
          */

         if (!result.stdout.trim()) {
            return emitExecutionError(
               userId,
               "UNKNOWN_ERROR",
               "O runner não retornou nenhum resultado.",
            );
         }

         /**
          *
          * =================================================
          * PARSE JSON
          * =================================================
          */

         let parsed: ExecutionResult;

         try {
            parsed = JSON.parse(result.stdout.trim());
         } catch {
            return emitExecutionError(
               userId,
               "UNKNOWN_ERROR",
               "O runner retornou um JSON inválido.",
            );
         }

         /**
          * =================================================
          * VALIDA RESULTADO
          * =================================================
          */

         if (typeof parsed.success !== "boolean") {
            return emitExecutionError(
               userId,
               "UNKNOWN_ERROR",
               "O resultado do runner é inválido: campo 'success' ausente ou inválido.",
            );
         }

         if (!Array.isArray(parsed.results)) {
            return emitExecutionError(
               userId,
               "UNKNOWN_ERROR",
               "O resultado do runner é inválido: campo 'results' não é um array.",
            );
         }

         /**
          * =================================================
          * RESULTADO FINAL
          * =================================================
          *
          * IMPORTANTE:
          *
          * Não fazemos:
          *
          * error: parsed.error
          *
          * porque parsed.error pode ser undefined
          * com exactOptionalPropertyTypes.
          */

         // SE TODOS OS TESTES PASSARAM
         if (parsed.success) {
            const tracksRepository = new TracksDrizzleRepository();
            await tracksRepository.completeChallenge({
               challengeId,
               tracksId,
               userId,
            });
         }

         const executionResult: ExecutionResult = {
            success: parsed.success,

            results: parsed.results,
         };

         /**
          * Só adiciona error se realmente existir.
          */
         if (parsed.error) {
            executionResult.error = parsed.error;
         }

         /**
          * =================================================
          * ENVIA PARA FRONTEND
          * =================================================
          */

         return emitExecutionResult(userId, executionResult);
      } catch (error) {
         /**
          * =================================================
          * ERRO INESPERADO
          * =================================================
          */

         const message =
            error instanceof Error
               ? error.message
               : "Erro desconhecido durante a execução.";

         return emitExecutionError(userId, "UNKNOWN_ERROR", message);
      } finally {
         /**
          * =================================================
          * LIMPA TEMP
          * =================================================
          */

         if (tempDir) {
            try {
               await fs.rm(tempDir, {
                  recursive: true,
                  force: true,
               });
            } catch (error) {
               if (env.NODE_ENV === "dev") {
                  console.error("Erro ao remover diretório temporário:", error);
               }
            }
         }
      }
   },

   {
      connection,
   },
);

/**
 * =====================================================
 * WORKER COMPLETED
 * =====================================================
 */

worker.on("completed", (job) => {
   if (env.NODE_ENV === "dev") {
      console.log(`Execution ${job.id} completed`);
   }
});

/**
 * =====================================================
 * WORKER FAILED
 * =====================================================
 *
 * Última proteção.
 */

worker.on("failed", (job, err) => {
   if (env.NODE_ENV === "dev") {
      console.log(`Execution ${job?.id} failed: ${err.message}`);
   }

   const userId = job?.data?.userId;

   if (!userId) {
      return;
   }

   io.to(`user:${userId}`).emit("code-execution-result", {
      success: false,

      results: [],

      error: {
         type: "UNKNOWN_ERROR",

         message:
            err.message || "Ocorreu um erro inesperado ao executar o código.",
      },
   });
});
